import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {attachCapturePeerFrameRelayV1,
 CAPTURE_PEER_FRAME_SNAPSHOT_V1,CAPTURE_PEER_FRAME_READY_V1
} from '../assets/gensrpg/capture-v2/adventure-multiplayer-peer-frame-relay-v1.mjs';

const own='b55f72d4-1861-42f7-9804-d5ee774fc539',
 guest='93b5ba2f-07b4-4b01-9b94-5fbd0215e02a';
const scope={sessionId:'session-local',worldId:'forest',
 worldFingerprint:'fingerprint-forest'};
function target(origin='https://gens.example'){
 const callbacks=new Map(),received=[];
 class CustomEvent {constructor(type,{detail}={}){this.type=type;this.detail=detail;}}
 return {
  CustomEvent,location:{origin},received,callbacks,
  addEventListener(name,fn){const l=callbacks.get(name)??new Set();l.add(fn);callbacks.set(name,l);},
  removeEventListener(name,fn){callbacks.get(name)?.delete(fn);},
  dispatchEvent(event){received.push(event);for(const fn of callbacks.get(event.type)??[])fn(event);return true;},
  dispatch(type,detail){this.dispatchEvent(new CustomEvent(type,{detail}));},
  count(name){return callbacks.get(name)?.size??0}
 };
}
function fixture(origin='https://gens.example'){
 const win=target(origin);
 const frame=target();frame.contentWindow=win;
 const ready=[];
 const relay=attachCapturePeerFrameRelayV1({
  frame,origin:'https://gens.example',...scope,ownActorId:own,
  onReady:()=>ready.push(true)
 });
 return {frame,win,relay,ready};
}
const pose={actorId:guest,areaId:'area-1',x:31,y:19,seq:3,
 updatedAt:'2026-11-06T20:00:00.000Z'};
const readyPayload=()=>({schema:CAPTURE_PEER_FRAME_READY_V1,version:1,...scope});
test('buffers full server projection and flushes after the official native peer reader is ready',()=>{
 const f=fixture();
 assert.equal(f.relay.publish([pose]),true);
 assert.equal(f.win.received.some(x=>x.type===CAPTURE_PEER_FRAME_SNAPSHOT_V1),false);
 f.win.__sculptPeerReceiverReadyV1=Object.freeze(readyPayload());
 f.frame.dispatch('load');
 const outbound=f.win.received.filter(x=>x.type===CAPTURE_PEER_FRAME_SNAPSHOT_V1);
 assert.equal(outbound.length,1);
 assert.deepEqual(outbound[0].detail.actors,[{
  actorId:guest,areaId:'area-1',x:31,y:19,seq:3
 }]);
 assert.equal(outbound[0].detail.sessionId,scope.sessionId);
 assert.equal(outbound[0].detail.worldFingerprint,scope.worldFingerprint);
 assert.equal(outbound[0].detail.revision,1);
 assert.equal('updatedAt' in outbound[0].detail.actors[0],false);
 assert.equal(f.ready.length,1);
 f.relay.dispose();
});
test('fresh server snapshots clear distant actors; old frame and listeners are disposed',()=>{
 const f=fixture();
 f.win.dispatch(CAPTURE_PEER_FRAME_READY_V1,readyPayload());
 f.relay.publish([pose]);
 f.relay.publish([]);
 const outbound=f.win.received.filter(x=>x.type===CAPTURE_PEER_FRAME_SNAPSHOT_V1);
 assert.equal(outbound.length,2);
 assert.deepEqual(outbound.at(-1).detail.actors,[]);
 assert.equal(outbound.at(-1).detail.revision,2);
 f.relay.dispose();
 assert.equal(f.win.count(CAPTURE_PEER_FRAME_READY_V1),0);
 assert.equal(f.frame.count('load'),0);
 assert.equal(f.relay.publish([pose]),false);
});
test('rejects foreign world, foreign iframe, own avatar and forged save/inventory fields',()=>{
 const foreign=fixture('https://outside.example');
 foreign.win.__sculptPeerReceiverReadyV1=Object.freeze(readyPayload());
 foreign.frame.dispatch('load');
 foreign.relay.publish([pose]);
 assert.equal(foreign.win.received.some(x=>x.type===CAPTURE_PEER_FRAME_SNAPSHOT_V1),false);
 foreign.relay.dispose();
 const f=fixture();
 f.win.dispatch(CAPTURE_PEER_FRAME_READY_V1,{...readyPayload(),worldId:'other'});
 f.relay.publish([pose]);
 assert.equal(f.win.received.some(x=>x.type===CAPTURE_PEER_FRAME_SNAPSHOT_V1),false);
 assert.throws(()=>f.relay.publish([{...pose,actorId:own}]));
 assert.throws(()=>f.relay.publish([{...pose,inventory:{gold:999}}]));
 assert.throws(()=>f.relay.publish([{...pose,x:Infinity}]));
 f.relay.dispose();
});
test('Adventure owner wires official iframe relay only during active online play',()=>{
 const s=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',
  import.meta.url),'utf8');
 assert.match(s,/attachCapturePeerFrameRelayV1/);
 assert.match(s,/activeCapturePeerRelay\?\.dispose\(\)/);
 assert.match(s,/activeCapturePeerRelay\?\.publish\(/);
 const create=s.indexOf('activeCapturePeerRelay=onlineContext');
 const navigate=s.indexOf('frame.src=url.href;');
 assert.ok(create>0&&navigate>create,'relay must exist before iframe navigation');
 assert.doesNotMatch(s,/z40kApplySnapshot|z40kPushState|z40kSubscribe/);
});
