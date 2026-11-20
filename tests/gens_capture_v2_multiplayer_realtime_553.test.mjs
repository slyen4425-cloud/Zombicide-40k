import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {createCaptureRoomTransportV1}
 from '../assets/gensrpg/capture-v2/adventure-multiplayer-transport-v1.mjs';

const roomId='d142e95f-a220-4ae9-9487-5d5ae1c0fd18';
const host='93b5ba2f-07b4-4b01-9b94-5fbd0215e02a';
const guest='b55f72d4-1861-42f7-9804-d5ee774fc539';
const navigation={schema:'gensrpg.exploration.play-navigation.v1',
 version:1,sessionId:'session-local',worldId:'forest',
 worldFingerprint:'hash:1',currentAreaId:'area-1',x:10,y:20};
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function settle(){for(let i=0;i<10;i++)await tick();}
function harness({broadcastSend=null}={}){
 let seq=0,peerSeq=1;
 const queries=[],rpcCalls=[],listeners=[],authTokens=[];
 const members=[
  {user_id:host,display_name:'Hôte',role:'host',joined_at:'2026-11-20T10:00:00Z'},
  {user_id:guest,display_name:'Invité',role:'guest',joined_at:'2026-11-20T10:01:00Z'}
 ];
 const room={id:roomId,code:'ABCDEFGHJK',owner_id:host,
  adventure_session_id:'session-local',max_players:2,
  guest_permissions:{},host_is_game_master:false,join_enabled:true,
  open:true,revision:3,world_id:'forest',world_fingerprint:'hash:1'};
 const client={
  auth:{getSession:async()=>({data:{session:{user:{id:host},access_token:'test-jwt'}}}),
   signInAnonymously:async()=>({data:{session:{user:{id:host},access_token:'test-jwt'}}})},
  realtime:{setAuth:async token=>{authTokens.push(token);}},
  rpc:async(name)=>{
   rpcCalls.push(name);
   if(name==='gensrpg_capture_report_position')return {data:++seq};
   return {data:null};
  },
  from(table){
   queries.push(table);
   const query={
    eq(){return this;},
    maybeSingle:async()=>({data:table==='gensrpg_capture_rooms'?room:{seq}}),
    order:async()=>({data:table==='gensrpg_capture_room_members'?members:
     [{room_id:roomId,user_id:guest,world_id:'forest',
      world_fingerprint:'hash:1',area_id:'area-1',x:100+peerSeq,y:40,
      seq:peerSeq,updated_at:'2026-11-20T10:00:00Z'}]})
   };
   return {select:()=>query};
  },
  channel(){return {on(type,filter,callback){
    listeners.push({type,event:filter.event,callback});return this;
   },subscribe(){return this;},
   track:async()=>{},send:payload=>broadcastSend?broadcastSend(payload):Promise.resolve('ok')};},
  removeChannel:async()=>{}
 };
 return {transport:createCaptureRoomTransportV1({client}),queries,rpcCalls,listeners,authTokens,
  advance:()=>++peerSeq};
}
test('issue #553: consecutive official poses use server-owned seq without redundant room/membership/own-seq fetches',async()=>{
 const h=harness(),seen=[];
 await h.transport.observe({roomId,userId:host,onChange:()=>{},
  onPositions:s=>seen.push(s)});
 await settle();
 assert.deepEqual(h.authTokens,['test-jwt'],'private channel uses the original Capture JWT');
 await h.transport.reportPosition({roomId,navigation});
 const afterFirst=h.queries.length;
 await h.transport.reportPosition({roomId,navigation:{...navigation,x:12}});
 await h.transport.reportPosition({roomId,navigation:{...navigation,x:16}});
 assert.equal(h.queries.length,afterFirst,
  'each frequent point must not run three redundant requests before its authoritative RPC');
 assert.deepEqual(h.rpcCalls.filter(name=>name==='gensrpg_capture_report_position').length,3);
 assert.equal(seen[0].actors[0].actorId,guest);
 await h.transport.dispose();
});
test('issue #553: peer notification uses one authenticated RLS table read, ignores broadcast coordinates',async()=>{
 const h=harness(),received=[];
 await h.transport.observe({roomId,userId:host,onChange:()=>{},
  onPositions:positions=>received.push(positions)});
 await settle();
 const signal=h.listeners.find(x=>x.event==='capture-peer-position-changed-v1');
 assert.ok(signal);
 const before=h.queries.length;
 h.advance();
 signal.callback({payload:{x:999999,actorId:host}});
 await settle();
 assert.deepEqual(h.queries.slice(before),['gensrpg_capture_peer_positions'],
  'the latest room metadata is already authenticated and cached during observe');
 assert.equal(received.at(-1).actors[0].x,102);
 await h.transport.dispose();
});

test('issue #553: reuse existing private Realtime RLS policies, never create a second authority',()=>{
 // Supabase production already has gensrpg_capture_realtime_read_v1 and
 // gensrpg_capture_realtime_send_v1, installed Nov 14. This test guards
 // against reintroducing a redundant policy migration in the #553 branch.
 assert.equal(existsSync(new URL('../supabase/migrations/20261120162000_gensrpg_capture_realtime_private_room_authorization_v1.sql',
  import.meta.url)),false);
 const transport=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-multiplayer-transport-v1.mjs',
  import.meta.url),'utf8');
 assert.match(transport,/config:\\{private:true,presence:/);
 assert.match(transport,/client\\.realtime\\.setAuth/);
 assert.match(transport,/capture-peer-position-changed-v1/);
 assert.match(transport,/gensrpg_capture_report_position/);
 assert.doesNotMatch(transport,/z40k_sync_state|localStorage\\./);
});

test('issue #553: delayed Broadcast ACK never holds the next authoritative position RPC',async()=>{
 let release;
 const gate=new Promise(resolve=>{release=resolve;});
 const wakes=[];
 const h=harness({broadcastSend:payload=>{
  wakes.push(payload);
  return wakes.length===1?gate:Promise.resolve('ok');
 }});
 await h.transport.observe({roomId,userId:host,onChange:()=>{},onPositions:()=>{}});
 await settle();
 assert.equal(await h.transport.reportPosition({roomId,navigation}),1);
 // The first wake-up remains unacknowledged for an arbitrarily long time.
 assert.equal(wakes.length,1);
 assert.equal(await h.transport.reportPosition({roomId,navigation:{...navigation,x:44}}),2,
  'second server commit may NOT be blocked by the first Broadcast ACK');
 assert.equal(await h.transport.reportPosition({roomId,navigation:{...navigation,x:55}}),3);
 assert.equal(wakes.length,1,'notifications must coalesce while ACK is stalled');
 release('ok');
 await settle();
 assert.equal(wakes.length,2,'latest committed position triggers one more wake-up');
 assert.ok(wakes.every(x=>x.event==='capture-peer-position-changed-v1'));
 assert.ok(wakes.every(x=>Object.keys(x.payload).length===0),
  'no unverified coordinates ever travel in Broadcast payloads');
 await h.transport.dispose();
});
