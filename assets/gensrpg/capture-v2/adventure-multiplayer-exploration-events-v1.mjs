// Same-origin browser bridge for the one OFFICIAL Exploration play position
// event (Exploration PR #381). No localStorage watcher, polling, movement math,
// world renderer or remote AdventureSave mutation. Exactly one frame lifecycle.
import {capturePeerPositionFromOfficialNavigationV1} from './adventure-peer-position-v1.mjs';
export const CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1=
 'gensrpg.exploration.play.navigation-committed.v1';

export function attachCaptureExplorationPositionEventsV1({
 frame,roomId,transport,sessionId,worldId,worldFingerprint,origin,
 onStatus=()=>{}
}={}){
 if(typeof frame?.addEventListener!=='function'||
  typeof frame?.removeEventListener!=='function'||
  typeof transport?.reportPosition!=='function'||
  typeof roomId!=='string'||!roomId||
  typeof sessionId!=='string'||!sessionId||
  typeof worldId!=='string'||!worldId||
  typeof worldFingerprint!=='string'||!worldFingerprint||
  typeof origin!=='string'||!/^https?:\/\//.test(origin))
  throw new TypeError('Missing scoped official Exploration frame and online transport');
 let disposed=false,attachedWindow=null,sending=false,pending=null,lastSent=null;
 function validate(event){
  if(event?.type!==CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1||
    event?.detail?.schema!==CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1||
    event?.detail?.version!==1)return null;
  const nav=event.detail.navigation;
  const point=capturePeerPositionFromOfficialNavigationV1({
   navigation:nav,sessionId,worldId,worldFingerprint
  });
  return {nav,signature:[point.areaId,point.x,point.y].join('|')};
 }
 async function flush(){
  if(sending||disposed)return;
  sending=true;
  try{
   while(pending&&!disposed){
    const value=pending;pending=null;
    if(value.signature===lastSent)continue;
    try{
     await transport.reportPosition({roomId,navigation:value.nav});
     if(disposed)return;
     lastSent=value.signature;
     onStatus('Position Exploration synchronisée');
    }catch(error){
     if(!disposed)onStatus('Position non synchronisée : '+error.message);
     break;
    }
   }
  }finally{sending=false;}
 }
 function onCommit(event){
  if(disposed||event?.currentTarget!==attachedWindow)return;
  let value;
  try{value=validate(event);}
  catch(error){onStatus('Checkpoint Exploration refusé : '+error.message);return;}
  if(!value||value.signature===lastSent)return;
  // Keep only the most recent accepted coordinate while network is slower.
  pending=value;
  void flush();
 }
 function attach(){
  if(disposed)return;
  if(attachedWindow){
   try{attachedWindow.removeEventListener(CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1,onCommit);}
   catch{ /* The previous document may have navigated away. */ }
   attachedWindow=null;
  }
  try{
   const candidate=frame.contentWindow;
   if(!candidate?.location||candidate.location.origin!==origin)return;
   if(typeof candidate.addEventListener!=='function')return;
   attachedWindow=candidate;
   candidate.addEventListener(CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1,onCommit);
  }catch{ /* Refuse cross-origin frames; no postMessage wildcard fallback. */ }
 }
 frame.addEventListener('load',attach);
 attach();
 return Object.freeze({dispose(){
  if(disposed)return;
  disposed=true;pending=null;
  frame.removeEventListener('load',attach);
  if(attachedWindow){
   try{attachedWindow.removeEventListener(CAPTURE_EXPLORATION_NAVIGATION_EVENT_V1,onCommit);}
   catch{}
   attachedWindow=null;
  }
 }});
}
