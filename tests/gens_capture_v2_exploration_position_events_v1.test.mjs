import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {attachCaptureExplorationPositionEventsV1,
 CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1}
 from '../assets/gensrpg/capture-v2/adventure-multiplayer-exploration-events-v1.mjs';

const nav={
 schema:'gensrpg.exploration.play-navigation.v1',version:1,
 sessionId:'session-host',worldId:'forest-1',
 worldFingerprint:'543:j82w5:e71zm',
 currentAreaId:'area-1',x:50,y:30
};
const event=(navigation=nav)=>({
 schema:CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1,version:1,navigation
});
function eventTarget(location=null){
 const listeners=new Map();
 return {
  location,listeners,
  addEventListener(type,fn){const set=listeners.get(type)??new Set();set.add(fn);listeners.set(type,set);},
  removeEventListener(type,fn){listeners.get(type)?.delete(fn);},
  dispatch(type,detail){for(const fn of listeners.get(type)??[])
    fn({type,detail,currentTarget:this});},
  count(type){return listeners.get(type)?.size??0}
 };
}
function harness(origin='https://gens.example'){
 const child=eventTarget({origin});
 const frame=eventTarget();frame.contentWindow=child;
 const calls=[],statuses=[];
 const transport={reportPosition:async input=>{calls.push(input);return calls.length;}};
 const bridge=attachCaptureExplorationPositionEventsV1({
  frame,roomId:'room-1',transport,sessionId:nav.sessionId,
  worldId:nav.worldId,worldFingerprint:nav.worldFingerprint,
  origin:'https://gens.example',onStatus:msg=>statuses.push(msg)
 });
 return {child,frame,calls,statuses,bridge};
}
const nextTick=()=>new Promise(resolve=>setImmediate(resolve));

test('official same-origin, scoped navigation event is delivered exactly once to Capture server transport',async()=>{
 const h=harness();
 h.child.dispatch(CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1,event());
 await nextTick();
 assert.equal(h.calls.length,1);
 assert.equal(h.calls[0].roomId,'room-1');
 assert.strictEqual(h.calls[0].navigation,nav);
 h.child.dispatch(CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1,event());
 await nextTick();
 assert.equal(h.calls.length,1,'identical persisted location must not trigger duplicate updates');
 const moved=Object.freeze({...nav,x:75,y:40});
 h.child.dispatch(CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1,event(moved));
 await nextTick();
 assert.equal(h.calls.length,2);
 assert.strictEqual(h.calls[1].navigation,moved);
 h.bridge.dispose();
 h.child.dispatch(CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1,event({...moved,x:80}));
 await nextTick();
 assert.equal(h.calls.length,2);
 assert.equal(h.child.count(CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1),0);
 assert.equal(h.frame.count('load'),0);
});
test('other session, world, forged inventory, foreign origin and older events are rejected',async()=>{
 const h=harness();
 for(const wrong of [
  Object.freeze({...nav,sessionId:'other-game'}),
  Object.freeze({...nav,worldId:'other-world'}),
  Object.freeze({...nav,worldFingerprint:'other:fingerprint:1'}),
  Object.freeze({...nav,inventory:{money:999}}),
  Object.freeze({...nav,x:NaN})
 ]){
  h.child.dispatch(CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1,event(wrong));
 }
 h.child.dispatch(CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1,{
  schema:'unrelated-survival',version:1,navigation:nav
 });
 await nextTick();
 assert.equal(h.calls.length,0);
 assert.ok(h.statuses.some(s=>/refusé/i.test(s)));
 h.bridge.dispose();
 const outsider=harness('https://untrusted.example');
 assert.equal(outsider.child.count(CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1),0);
 outsider.child.dispatch(CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1,event());
 await nextTick();
 assert.equal(outsider.calls.length,0);
 outsider.bridge.dispose();
});
test('frame navigation reattaches only to current same-origin document and leaves no global heartbeat',async()=>{
 const h=harness();
 const newWindow=eventTarget({origin:'https://gens.example'});
 h.frame.contentWindow=newWindow;
 h.frame.dispatch('load');
 assert.equal(h.child.count(CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1),0);
 assert.equal(newWindow.count(CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1),1);
 newWindow.dispatch(CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1,event());
 await nextTick();
 assert.equal(h.calls.length,1);
 h.bridge.dispose();
 assert.equal(newWindow.count(CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1),0);
 const source=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-multiplayer-exploration-events-v1.mjs',
 import.meta.url),'utf8');
 assert.doesNotMatch(source,/setInterval\(|Storage\.prototype|postMessage\(|z40k/);
 assert.doesNotMatch(source,/\b(?:localStorage|indexedDB)\b/i);
});
