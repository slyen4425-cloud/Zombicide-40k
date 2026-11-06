// Monster Capture -> official same-origin Exploration visual-only bridge.
// This never transmits AdventureSave, player inventory or scene geometry.
// The receiving Exploration engine alone draws the peer actor sprites.
export const CAPTURE_PEER_FRAME_SNAPSHOT_V1=
 'gensrpg.exploration.play.peer-snapshot.v1';
export const CAPTURE_PEER_FRAME_READY_V1=
 'gensrpg.exploration.play.peer-receiver-ready.v1';
const ID=/^[a-f0-9]{8}-[a-f0-9]{4}-[1-8][a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i;
const keys=(value,allowed)=>value&&typeof value==='object'&&
 !Array.isArray(value)&&Object.keys(value).every(key=>allowed.includes(key));
const validScope=value=>typeof value==='string'&&value.length>0&&
 value.length<=130&&!/[\u0000-\u001f\u007f]/.test(value);
function position(value,ownActorId){
 if(!keys(value,['actorId','areaId','x','y','seq','updatedAt'])||
  !ID.test(value.actorId)||value.actorId===ownActorId||
  !validScope(value.areaId)||
  !Number.isFinite(value.x)||value.x<0||value.x>1000000||
  !Number.isFinite(value.y)||value.y<0||value.y>1000000||
  !Number.isSafeInteger(value.seq)||value.seq<1)
  throw new TypeError('Une position distante officielle est requise');
 return Object.freeze({actorId:value.actorId,areaId:value.areaId,
  x:value.x,y:value.y,seq:value.seq});
}
export function attachCapturePeerFrameRelayV1({
 frame,origin,sessionId,worldId,worldFingerprint,ownActorId,onReady
}={}){
 if(!frame?.addEventListener||!frame?.removeEventListener||
   !validScope(origin)||!validScope(sessionId)||
   !validScope(worldId)||!validScope(worldFingerprint)||!ID.test(ownActorId))
  throw new TypeError('Un iframe Exploration officiel et sa portée sont requis');
 let viewer=null,ready=false,disposed=false,revision=0,pending=null;
 const validReady=value=>value?.schema===CAPTURE_PEER_FRAME_READY_V1&&
  value?.version===1&&value.sessionId===sessionId&&
  value.worldId===worldId&&value.worldFingerprint===worldFingerprint;
 function emit(){
  if(!ready||disposed||!pending||!viewer)return;
  try{
   if(viewer.location.origin!==origin)return;
   const EventCtor=viewer.CustomEvent;
   if(typeof EventCtor!=='function')return;
   viewer.dispatchEvent(new EventCtor(
    CAPTURE_PEER_FRAME_SNAPSHOT_V1,{detail:pending}
   ));
  }catch{ /* Cross origin or changed frame: fail closed. */ }
 }
 function acceptReady(event){
  if(disposed||!viewer||!validReady(event?.detail))return;
  try{if(viewer.location.origin!==origin)return;}catch{return;}
  if(ready)return;
  ready=true;
  onReady?.();
  emit();
 }
 function bind(){
  if(disposed)return;
  if(viewer)viewer.removeEventListener?.(CAPTURE_PEER_FRAME_READY_V1,acceptReady);
  viewer=null;ready=false;
  try{
   const next=frame.contentWindow;
   if(!next||next.location.origin!==origin)return;
   viewer=next;
   viewer.addEventListener(CAPTURE_PEER_FRAME_READY_V1,acceptReady);
   // Exploration may finish its scoped Play boot before iframe.load.
   if(validReady(viewer.__sculptPeerReceiverReadyV1)){
    acceptReady({detail:viewer.__sculptPeerReceiverReadyV1});
   }
  }catch{ /* Never read or emit to a cross-origin browsing context. */ }
 }
 frame.addEventListener('load',bind);
 bind();
 function publish(actors){
  if(disposed)return false;
  if(!Array.isArray(actors)||actors.length>31)
   throw new TypeError('Au plus 31 positions distantes officielles');
  const seen=new Set(),snapshot=[];
  for(const candidate of actors){
   const actor=position(candidate,ownActorId);
   if(seen.has(actor.actorId))
    throw new TypeError('Acteur distant dupliqué');
   seen.add(actor.actorId);snapshot.push(actor);
  }
  pending=Object.freeze({
   schema:CAPTURE_PEER_FRAME_SNAPSHOT_V1,version:1,
   sessionId,worldId,worldFingerprint,revision:++revision,
   actors:Object.freeze(snapshot)
  });
  emit();
  return true;
 }
 function dispose(){
  if(disposed)return;
  disposed=true;ready=false;pending=null;
  frame.removeEventListener('load',bind);
  viewer?.removeEventListener?.(CAPTURE_PEER_FRAME_READY_V1,acceptReady);
  viewer=null;
 }
 return Object.freeze({publish,dispose});
}
