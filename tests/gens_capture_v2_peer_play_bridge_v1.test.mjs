import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 preflightCaptureOnlineWorldV1,publishCaptureInitialPositionV1
} from '../assets/gensrpg/capture-v2/adventure-multiplayer-play-bridge-v1.mjs';

const hostId='93b5ba2f-07b4-4b01-9b94-5fbd0215e02a';
const guestId='b55f72d4-1861-42f7-9804-d5ee774fc539';
const id='d142e95f-a220-4ae9-9487-5d5ae1c0fd18';
const nav={schema:'gensrpg.exploration.play-navigation.v1',version:1,
 worldId:'forest-1',worldFingerprint:'543:j82w5:e71zm',
 sessionId:'session-host',currentAreaId:'area-a',x:12,y:7};
const server={open:true,ownerId:hostId,sessionId:'session-host',
 worldId:null,worldFingerprint:null,members:[{id:hostId},{id:guestId}]};
function fake(override={}){
 const calls=[];
 const transport={
  inspectRoom:async()=>({...server,...override}),
  bindWorld:async args=>{calls.push({bind:args});return true;},
  reportPosition:async args=>{calls.push({position:args});return 1;}
 };
 return {transport,calls};
}
const input=(room,transport,sessionId=nav.sessionId)=>({
 room,transport,world:{id:nav.worldId,areas:[{id:'area-a'}]},
 officialFingerprint:()=>nav.worldFingerprint,sessionId
});
test('offline Adventure game entry never requires or creates an online room',async()=>{
 assert.equal(await preflightCaptureOnlineWorldV1({room:null}),null);
 assert.equal(await publishCaptureInitialPositionV1({context:null}),null);
});
test('host binds its one real world, then publishes official checkpoint',async()=>{
 const f=fake(),room={role:'host',roomId:id,userId:hostId};
 const context=await preflightCaptureOnlineWorldV1(input(room,f.transport));
 assert.equal(context.worldId,nav.worldId);
 const seq=await publishCaptureInitialPositionV1({context,transport:f.transport,navigation:nav});
 assert.equal(seq,1);
 assert.equal(f.calls.length,2);
 assert.equal(f.calls[0].bind.roomId,id);
 assert.equal(f.calls[1].position.navigation,nav);
 assert.equal(f.calls[1].position.roomId,id);
 assert.equal('save' in f.calls[1].position,false);
});
test('guest cannot enter unbound, foreign, or overwritten world, even with a local save',async()=>{
 const room={role:'guest',roomId:id,userId:guestId};
 const notBound=fake();
 await assert.rejects(preflightCaptureOnlineWorldV1(
  input(room,notBound.transport,'local-guest-session')),
 /hôte|monde/i);
 for(const bad of [
  {worldId:'other-world',worldFingerprint:nav.worldFingerprint},
  {worldId:nav.worldId,worldFingerprint:'999:wrong:world'}
 ]){
  const fakeServer=fake(bad);
  await assert.rejects(preflightCaptureOnlineWorldV1(
   input(room,fakeServer.transport,'local-guest-session')),/autre carte|monde/i);
 }
 const f=fake({worldId:nav.worldId,worldFingerprint:nav.worldFingerprint});
 const context=await preflightCaptureOnlineWorldV1(
  input(room,f.transport,'local-guest-session'));
 const guestNav={...nav,sessionId:'local-guest-session'};
 await publishCaptureInitialPositionV1({context,transport:f.transport,navigation:guestNav});
 assert.equal(f.calls.length,1,'guests must never run bindWorld');
 assert.equal(f.calls[0].position.navigation.sessionId,'local-guest-session');
});
test('host cannot hijack another authenticated room or another local session',async()=>{
 const f=fake();
 await assert.rejects(preflightCaptureOnlineWorldV1(input(
  {role:'host',roomId:id,userId:guestId},f.transport
 )),/hébergée|salon/i);
 await assert.rejects(preflightCaptureOnlineWorldV1(input(
  {role:'host',roomId:id,userId:hostId},f.transport,'not-the-host-session'
 )),/hébergée|salon/i);
});
test('the real Adventure click path invokes official fingerprint and guarded room preflight BEFORE save writes',()=>{
 const s=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',
  import.meta.url),'utf8');
 assert.match(s,/preflightCaptureOnlineWorldV1/);
 assert.match(s,/officialFingerprint:playWorldFingerprint/);
 assert.match(s,/publishCaptureInitialPositionV1/);
 const begin=s.indexOf('const onlineContext=await preflightCaptureOnlineWorldV1(');
 const start=s.indexOf('const result=startAdventureExplorationV1(');
 const report=s.indexOf('await publishCaptureInitialPositionV1(');
 const frame=s.indexOf('frame.src=url.href;');
 assert.ok(begin>=0 && start>begin && report>start && frame>report);
 assert.doesNotMatch(s,/\bz40k(ApplySnapshot|Subscribe|PushState)\b/);
});
