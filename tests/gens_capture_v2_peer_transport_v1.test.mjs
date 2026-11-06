import test from 'node:test';
import assert from 'node:assert/strict';
import {createCaptureRoomTransportV1} from '../assets/gensrpg/capture-v2/adventure-multiplayer-transport-v1.mjs';

const ids={
 room:'d142e95f-a220-4ae9-9487-5d5ae1c0fd18',
 owner:'93b5ba2f-07b4-4b01-9b94-5fbd0215e02a',
 guest:'b55f72d4-1861-42f7-9804-d5ee774fc539'
};
const nav={
 schema:'gensrpg.exploration.play-navigation.v1',version:1,
 sessionId:'session-host',worldId:'forest-1',
 worldFingerprint:'543:j82w5:e71zm',currentAreaId:'area-2',x:12.4,y:9
};
function mock(){
 const calls=[];
 const channel={events:[],on(type,filter,fn){this.events.push({type,filter,fn});return this;},
  subscribe(fn){this.status=fn;return this;},track:async()=>({}),
  send:async message=>{calls.push({broadcast:message});return 'ok';}
 };
 const client={
  calls,
  auth:{getSession:async()=>({data:{session:{user:{id:ids.owner}}}}),
   signInAnonymously:async()=>({data:{session:{user:{id:ids.owner}}}})},
  rpc:async (name,args)=>{
   calls.push({rpc:name,args});
   if(name==='gensrpg_capture_bind_world')return {data:true};
   if(name==='gensrpg_capture_report_position')return {data:1};
   return {data:null};
  },
  from(table){calls.push({table});
   return {select(columns){calls.push({select:columns});
    return {eq(name,id){
     if(table==='gensrpg_capture_rooms')
      return {maybeSingle:async()=>({data:{id:ids.room,code:'ABCDEFGHJK',
       owner_id:ids.owner,adventure_session_id:'session-host',
       world_id:nav.worldId,world_fingerprint:nav.worldFingerprint,
       max_players:3,join_enabled:true,open:true,revision:1}})};
     if(table==='gensrpg_capture_room_members')
      return {order:async()=>({data:[
       {user_id:ids.owner,display_name:'Host',role:'host'},
       {user_id:ids.guest,display_name:'Guest',role:'guest'}
      ]})};
     if(table==='gensrpg_capture_peer_positions')
      return {order:async()=>({data:[{
       room_id:ids.room,user_id:ids.guest,
       world_id:nav.worldId,world_fingerprint:nav.worldFingerprint,
       area_id:'area-2',x:15,y:11,seq:3,updated_at:'2026-11-06T20:10:00Z'
      }]})};
     throw Error('unexpected table: '+table);
    }};
   }};
  },
  channel(topic,config){calls.push({topic,config});return channel;},
  removeChannel:async()=>null
 };
 return {client,calls,channel};
}
test('host binds the official world exactly once through guarded Capture-only RPC',async()=>{
 const {client,calls}=mock(),transport=createCaptureRoomTransportV1({client});
 const result=await transport.bindWorld({roomId:ids.room,navigation:nav});
 assert.equal(result.roomId,ids.room);
 const x=calls.find(v=>v.rpc==='gensrpg_capture_bind_world');
 assert.deepEqual(x.args,{
  p_room:ids.room,p_world_id:nav.worldId,p_world_fingerprint:nav.worldFingerprint
 });
 assert.equal(calls.filter(v=>v.rpc?.startsWith('z40k_')).length,0);
});
test('position server derives authenticated actor, not an actor ID from client payload',async()=>{
 const {client,calls}=mock(),transport=createCaptureRoomTransportV1({client});
 const seq=await transport.reportPosition({roomId:ids.room,navigation:nav,expectedSeq:0});
 assert.equal(seq,1);
 const x=calls.find(v=>v.rpc==='gensrpg_capture_report_position');
 assert.deepEqual(x.args,{
  p_room:ids.room,p_world_id:'forest-1',p_world_fingerprint:nav.worldFingerprint,
  p_area_id:'area-2',p_x:12.4,p_y:9,p_expected_seq:0
 });
 assert.ok(!('p_user_id' in x.args));
 assert.ok(!('p_session' in x.args));
 assert.ok(!('save' in x.args));
 assert.ok(!('rules' in x.args));
 const spoofed={...nav,inventory:{gold:100000}};
 await assert.rejects(transport.reportPosition({
  roomId:ids.room,navigation:spoofed,expectedSeq:0
 }),/navigation|unexpected|invalid/i);
 assert.equal(calls.filter(v=>v.rpc==='gensrpg_capture_report_position').length,1);
});
test('peer positions are only read via server RLS, projected by owner and do not patch localStorage',async()=>{
 const {client,calls}=mock(),transport=createCaptureRoomTransportV1({client});
 const response=await transport.inspectPositions({
  roomId:ids.room,ownActorId:ids.owner,previousSequences:{}
 });
 assert.deepEqual(response.actors,[{
  actorId:ids.guest,areaId:'area-2',x:15,y:11,seq:3,
  updatedAt:'2026-11-06T20:10:00.000Z'
 }]);
 assert.equal(response.sequences[ids.guest],3);
 assert.ok(calls.some(x=>x.table==='gensrpg_capture_peer_positions'));
 assert.ok(!calls.some(x=>x.table==='z40k_sync_state'));
});
test('private channel is the only peer-changed signal: the server table remains authoritative',async()=>{
 const {client,channel,calls}=mock(),transport=createCaptureRoomTransportV1({client});
 await transport.observe({roomId:ids.room,userId:ids.owner,onChange:()=>{},onStatus:()=>{}});
 await transport.reportPosition({roomId:ids.room,navigation:nav,expectedSeq:0});
 const signal=calls.find(x=>x.broadcast);
 assert.equal(signal.broadcast.type,'broadcast');
 assert.equal(signal.broadcast.event,'capture-peer-position-changed-v1');
 assert.ok(!('position' in signal.broadcast.payload));
 assert.ok(!('actorId' in signal.broadcast.payload));
 const listener=channel.events.find(e=>e.filter.event==='capture-peer-position-changed-v1');
 assert.ok(listener,'the room must react to the scoped notification');
 assert.equal(calls.some(c=>c.topic?.startsWith('z40k')),false);
});
