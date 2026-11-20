import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {attachCaptureExplorationPositionEventsV1,
 CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1
} from '../assets/gensrpg/capture-v2/adventure-multiplayer-exploration-events-v1.mjs';

const navigation=x=>Object.freeze({
 schema:'gensrpg.exploration.play-navigation.v1',version:1,
 sessionId:'session-host',worldId:'forest-1',worldFingerprint:'hash:forest',
 currentAreaId:'area-1',x,y:40
});
function emitter(origin){
 const listeners=new Map();
 return {
  location:{origin},
  addEventListener(type,fn){const set=listeners.get(type)??new Set();
   set.add(fn);listeners.set(type,set);},
  removeEventListener(type,fn){listeners.get(type)?.delete(fn);},
  fire(type,detail){for(const fn of listeners.get(type)??[])
   fn({type,detail,currentTarget:this});}
 };
}
const tick=()=>new Promise(resolve=>setImmediate(resolve));
const event=x=>({
 schema:CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1,version:1,
 navigation:navigation(x)
});
function harness(reportPosition){
 const child=emitter('https://gens.example');
 const frame=emitter('https://gens.example');frame.contentWindow=child;
 const statuses=[];
 const bridge=attachCaptureExplorationPositionEventsV1({
  frame,roomId:'capture-room',sessionId:'session-host',
  worldId:'forest-1',worldFingerprint:'hash:forest',
  origin:'https://gens.example',
  transport:{reportPosition},onStatus:msg=>statuses.push(msg)
 });
 return {child,bridge,statuses,send:x=>
  child.fire(CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1,event(x))};
}
test('#553: failed stationary final position survives and is sent once on canonical room re-subscribe',async()=>{
 const calls=[];let connected=false;
 const h=harness(async ({navigation:nav})=>{
  calls.push(nav.x);
  if(!connected)throw Error('offline');
  return calls.length;
 });
 h.send(12);
 await tick();
 assert.deepEqual(calls,[12]);
 assert.match(h.statuses.at(-1),/non synchronisée/);
 connected=true;
 assert.equal(h.bridge.retryPending(),true);
 await tick();
 assert.deepEqual(calls,[12,12],'the last official coordinate is retained');
 assert.equal(h.bridge.retryPending(),false,'no duplicate after confirmation');
 h.send(12);await tick();
 assert.deepEqual(calls,[12,12],'same confirmed checkpoint is deduplicated');
 h.bridge.dispose();
 assert.equal(h.bridge.retryPending(),false);
 h.send(15);await tick();
 assert.deepEqual(calls,[12,12],'disposed player cannot send stale events');
});
test('#553: during network backpressure only the most recent canonical position remains',async()=>{
 const calls=[];let release;
 let first=true;
 const h=harness(async ({navigation:nav})=>{
  calls.push(nav.x);
  if(first){
   first=false;
   await new Promise(resolve=>{release=resolve;});
  }
  return calls.length;
 });
 h.send(10);await tick();
 h.send(12);h.send(14);h.send(17);
 assert.deepEqual(calls,[10]);
 release();await tick();await tick();
 assert.deepEqual(calls,[10,17],'intermediate position updates are coalesced');
 h.bridge.dispose();
});
test('#553: reconnect hooks the existing Supabase room, not a polling or second transport',()=>{
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',
  import.meta.url),'utf8');
 const sender=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-multiplayer-exploration-events-v1.mjs',
  import.meta.url),'utf8');
 assert.match(app,/message==='Salon connecté'/);
 assert.match(app,/activeCaptureExplorationEvents\?\.retryPending\(\)/);
 assert.doesNotMatch(sender,/setInterval\(|Storage\.prototype|z40k|new WebSocket/);
 assert.doesNotMatch(sender,/\b(?:localStorage|sessionStorage|indexedDB)\b/);
});
