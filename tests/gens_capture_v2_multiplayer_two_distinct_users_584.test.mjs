import test from 'node:test';
import assert from 'node:assert/strict';
import {createCaptureRoomTransportV1}
 from '../assets/gensrpg/capture-v2/adventure-multiplayer-transport-v1.mjs';

// Hermetic two-client simulator: two AUTHENTICATED user identities, one room,
// one canonical RPC/position ledger, one private realtime channel per client.
// This never creates test accounts, rooms or data in production Supabase.
const roomId='d142e95f-a220-4ae9-9487-5d5ae1c0fd18';
const host='93b5ba2f-07b4-4b01-9b94-5fbd0215e02a';
const guest='b55f72d4-1861-42f7-9804-d5ee774fc539';
const code='ABCDEFGHJK';
const fingerprint='room-fingerprint-584';
const room={id:roomId,code,owner_id:host,adventure_session_id:'host-session',
 max_players:2,join_enabled:true,host_is_game_master:false,
 guest_permissions:{},open:true,revision:3,world_id:'forest',
 world_fingerprint:fingerprint};
const nav=(userId,x,y)=>({
 schema:'gensrpg.exploration.play-navigation.v1',version:1,
 sessionId:userId===host?'host-session':'guest-session',
 worldId:'forest',worldFingerprint:fingerprint,currentAreaId:'area-1',x,y
});
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function settle(){for(let i=0;i<16;i++)await tick();}
function mockServer(){
 const members=[{user_id:host,display_name:'Créateur',role:'host',joined_at:'2026-11-22T10:00:00Z'}];
 const positions=new Map(),channels=[],calls=[];
 const dispatch=(topic,type,event,payload={})=>{
  for(const ch of [...channels])if(ch.topic===topic)
   for(const listener of ch.listeners)
    if(listener.type===type&&listener.event===event)
     queueMicrotask(()=>listener.callback({payload}));
 };
 function client(userId){
  return {
   auth:{getSession:async()=>({data:{session:{user:{id:userId},
    access_token:'jwt-'+userId}}}),signInAnonymously:async()=>{throw Error('unexpected auth mutation');}},
   realtime:{setAuth:async token=>{assert.equal(token,'jwt-'+userId);}},
   rpc:async(name,args)=>{
    calls.push({name,userId});
    if(name==='gensrpg_capture_join_room'){
     assert.equal(args.p_code,code);
     if(!members.some(m=>m.user_id===userId))
      members.push({user_id:userId,display_name:args.p_display_name,
       role:'guest',joined_at:'2026-11-22T10:00:01Z'});
     dispatch('gensrpg-capture-room:'+roomId,'presence','sync');
     return {data:[{room_id:roomId,room_code:code}]};
    }
    if(name==='gensrpg_capture_report_position'){
     assert.equal(args.p_room,roomId);
     assert.equal(args.p_world_id,'forest');
     assert.equal(args.p_world_fingerprint,fingerprint);
     assert.ok(members.some(m=>m.user_id===userId),'only authorized room members can publish');
     const current=positions.get(userId)?.seq??0;
     assert.equal(args.p_expected_seq,current,'server owns monotonic sequence');
     const seq=current+1;
     positions.set(userId,{room_id:roomId,user_id:userId,
      world_id:'forest',world_fingerprint:fingerprint,
      area_id:args.p_area_id,x:args.p_x,y:args.p_y,seq,
      updated_at:'2026-11-22T10:00:02Z'});
     return {data:seq};
    }
    throw Error('unexpected RPC: '+name);
   },
   from(table){
    const filter=new Map();
    const q={
     eq(k,v){filter.set(k,v);return q;},
     maybeSingle:async()=>{
      if(table==='gensrpg_capture_rooms')
       return {data:filter.get('id')===roomId?room:null};
      if(table==='gensrpg_capture_peer_positions')
       return {data:positions.get(filter.get('user_id'))??null};
      throw Error('unexpected maybeSingle: '+table);
     },
     order:async()=>{
      if(table==='gensrpg_capture_room_members')
       return {data:members.slice()};
      if(table==='gensrpg_capture_peer_positions')
       return {data:[...positions.values()]};
      throw Error('unexpected order: '+table);
     }
    };
    return {select:()=>q};
   },
   channel(topic,config){
    assert.equal(topic,'gensrpg-capture-room:'+roomId);
    assert.equal(config.config.private,true);
    assert.equal(config.config.presence.key,userId);
    const ch={topic,listeners:[],
     on(type,filter,callback){ch.listeners.push({type,event:filter.event,callback});return ch;},
     subscribe(callback){queueMicrotask(()=>callback('SUBSCRIBED'));return ch;},
     track:async()=>({}),
     send:async signal=>{
      dispatch(topic,'broadcast',signal.event,signal.payload);
      return 'ok';
     }
    };
    channels.push(ch);
    return ch;
   },
   removeChannel:async ch=>{
    const index=channels.indexOf(ch);
    if(index>=0)channels.splice(index,1);
   }
  };
 }
 return {client,members,positions,calls};
}
test('#584: two distinct authenticated players join ONE room and each receives the OTHER position',async()=>{
 const server=mockServer();
 const h=createCaptureRoomTransportV1({client:server.client(host)});
 const g=createCaptureRoomTransportV1({client:server.client(guest)});
 const hostRosters=[],guestRosters=[],hostSees=[],guestSees=[];
 try{
  await h.observe({roomId,userId:host,
   onChange:r=>hostRosters.push(r),onPositions:r=>hostSees.push(r)});
  await settle();
  assert.equal(hostRosters.at(-1).members.length,1);
  assert.equal(hostSees.length,0,'a lone host must not see a made-up guest');
  const joined=await g.join({code,name:'Invité'});
  assert.equal(joined.userId,guest);
  assert.equal(joined.role,'guest');
  await g.observe({roomId,userId:guest,
   onChange:r=>guestRosters.push(r),onPositions:r=>guestSees.push(r)});
  await settle();
  assert.equal(server.members.length,2,'two different auth.uid() values must be present');
  assert.equal(hostRosters.at(-1).members.length,2,'host roster refreshes after guest join');
  assert.equal(guestRosters.at(-1).members.length,2);
  await h.reportPosition({roomId,navigation:nav(host,38,42)});
  await g.reportPosition({roomId,navigation:nav(guest,53,48)});
  await settle();
  assert.equal(hostSees.at(-1).actors[0].actorId,guest);
  assert.equal(hostSees.at(-1).actors[0].x,53);
  assert.equal(guestSees.at(-1).actors[0].actorId,host);
  assert.equal(guestSees.at(-1).actors[0].x,38);
  assert.ok(hostSees.every(s=>s.actors.every(a=>a.actorId!==host)));
  assert.ok(guestSees.every(s=>s.actors.every(a=>a.actorId!==guest)));
  assert.equal(server.positions.size,2);
  assert.equal(server.calls.filter(c=>c.name==='gensrpg_capture_report_position').length,2);
 }finally{await Promise.all([h.dispose(),g.dispose()]);}
});
