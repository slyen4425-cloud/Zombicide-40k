import test from 'node:test';
import assert from 'node:assert/strict';
import {createCaptureRoomTransportV1} from '../assets/gensrpg/capture-v2/adventure-multiplayer-transport-v1.mjs';

const id='d142e95f-a220-4ae9-9487-5d5ae1c0fd18';
const owner='93b5ba2f-07b4-4b01-9b94-5fbd0215e02a';
const guest='b55f72d4-1861-42f7-9804-d5ee774fc539';
function harness(){
 const listeners=[],calls=[];
 let latestSeq=1,readCount=0;
 const channel={
  on(type,filter,callback){listeners.push({type,event:filter.event,callback});return this;},
  subscribe(callback){this.subscribed=callback;return this;},
  track:async()=>({}),send:async()=>({}),
 };
 const client={
  auth:{getSession:async()=>({data:{session:{user:{id:owner}}}}),
   signInAnonymously:async()=>({data:{session:{user:{id:owner}}}})},
  rpc:async()=>({data:null}),
  channel:(topic,config)=>{calls.push({topic,config});return channel;},
  removeChannel:async value=>{calls.push({removed:value});},
  from(table){
   calls.push({table});
   const records={
    gensrpg_capture_rooms:{
     id,code:'ABCDEFGHJK',owner_id:owner,adventure_session_id:'host-save',
     max_players:2,join_enabled:true,host_is_game_master:false,guest_permissions:{},
     open:true,revision:2,world_id:'forest',world_fingerprint:'fingerprint-1'
    },
    gensrpg_capture_room_members:[
     {user_id:owner,display_name:'Host',role:'host',joined_at:'2026-11-06T20:00:00Z'},
     {user_id:guest,display_name:'Guest',role:'guest',joined_at:'2026-11-06T20:00:01Z'}
    ]
   };
   return {select:()=>({eq:()=>({
    maybeSingle:async()=>({data:records[table]}),
    order:async()=>{
     if(table==='gensrpg_capture_peer_positions'){
      readCount++;
      return {data:[{room_id:id,user_id:guest,world_id:'forest',
       world_fingerprint:'fingerprint-1',area_id:'area-1',
       x:20+latestSeq,y:30,seq:latestSeq,
       updated_at:'2026-11-06T20:10:00Z'}]};
     }
     return {data:records[table]};
    }
   })})};
  }
 };
 return {transport:createCaptureRoomTransportV1({client}),channel,calls,listeners,
  getReads:()=>readCount,advance:()=>++latestSeq};
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
async function settle(){for(let i=0;i<8;i++)await tick();}
test('private peer notification obtains authenticated server positions, not broadcast coordinates',async()=>{
 const h=harness(),seen=[],rooms=[];
 await h.transport.observe({roomId:id,userId:owner,
  onChange:room=>rooms.push(room),onPositions:poses=>seen.push(poses)});
 await settle();
 assert.equal(rooms.length>0,true);
 assert.equal(seen.length>0,true,'initial snapshot must fetch peers already present');
 assert.equal(seen.at(-1).actors[0].actorId,guest);
 assert.equal(seen.at(-1).actors[0].seq,1);
 const notify=h.listeners.find(x=>x.event==='capture-peer-position-changed-v1');
 assert.ok(notify);
 h.advance();
 notify.callback({payload:{user_id:'spoofed-owner',x:999999}});
 await settle();
 assert.equal(seen.at(-1).actors[0].x,22,'untrusted broadcast payload must be ignored');
 assert.ok(h.getReads()>=2);
 assert.equal(h.calls.some(x=>x.table==='z40k_sync_state'),false);
 await h.transport.dispose();
});
test('replayed server revisions are not emitted and leave unsubscribes all consumers',async()=>{
 const h=harness(),seen=[];
 await h.transport.observe({roomId:id,userId:owner,onChange:()=>{},onPositions:positions=>seen.push(positions)});
 await settle();
 const notify=h.listeners.find(x=>x.event==='capture-peer-position-changed-v1');
 const count=seen.length;
 notify.callback({payload:{x:99999}});
 await settle();
 assert.equal(seen.length,count,'same sequence must not reappear as new movement');
 h.advance();
 notify.callback({payload:{x:-123}});
 await settle();
 assert.equal(seen.length,count+1);
 const before=h.getReads();
 await h.transport.dispose();
 notify.callback({payload:{}});
 await settle();
 assert.equal(h.getReads(),before,'disposed listener must not initiate any new DB reads');
 assert.equal(seen.length,count+1);
});
