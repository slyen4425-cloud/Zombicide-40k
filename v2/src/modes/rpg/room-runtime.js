import { createWorldSession, traverseRoomLink } from './world-engine.js';

function clone(value){return structuredClone(value);}
function roomKey(roomId){return String(roomId||'');}

function defaultEntityState(entity){
  return {
    id:String(entity.id),
    kind:String(entity.kind||'entity'),
    active:entity.active!==false,
    defeated:Boolean(entity.defeated),
    removed:Boolean(entity.removed),
    x:Number.isFinite(Number(entity.x))?Number(entity.x):null,
    y:Number.isFinite(Number(entity.y))?Number(entity.y):null,
    data:clone(entity.data||{}),
  };
}

function interactionState(interaction){
  return {
    id:String(interaction.id),
    enabled:interaction.enabled!==false,
    triggered:false,
    completed:false,
    opened:false,
    data:{},
  };
}

export function createRoomInstance(roomId,layout,{entities=null}={}){
  const sourceEntities=Array.isArray(entities)?entities:(Array.isArray(layout?.entities)?layout.entities:(Array.isArray(layout?.metadata?.entities)?layout.metadata.entities:[]));
  const uniqueEntities=[]; const seen=new Set();
  for(const entity of sourceEntities){
    if(!entity?.id||seen.has(String(entity.id))) continue;
    seen.add(String(entity.id));
    uniqueEntities.push(defaultEntityState(entity));
  }
  return {
    roomId:roomKey(roomId),
    instanceId:`room:${roomKey(roomId)}`,
    initialized:true,
    visits:0,
    layoutId:layout?.id?String(layout.id):null,
    entities:uniqueEntities,
    interactions:Object.fromEntries((layout?.interactions||[]).filter(x=>x?.id).map(x=>[String(x.id),interactionState(x)])),
    flags:{},
    data:{},
  };
}

export function createDungeonRuntime(worldIndex,{startRoomId=null,layoutProvider=null}={}){
  const started=createWorldSession(worldIndex,{startRoomId});
  if(!started.ok) return {ok:false,reason:started.reason,runtime:null};
  let runtime={
    worldSession:started.session,
    currentRoomId:String(started.session.currentRoomId),
    rooms:{},
    sequence:0,
    log:[],
  };
  runtime=ensureRoomInstance(runtime,runtime.currentRoomId,layoutProvider?.(runtime.currentRoomId)||null).runtime;
  runtime=visitCurrentRoom(runtime,'start');
  return {ok:true,runtime};
}

export function ensureRoomInstance(runtime,roomId,layout,{entities=null}={}){
  const id=roomKey(roomId);
  const next=clone(runtime);
  next.rooms=next.rooms||{};
  if(next.rooms[id]) return {created:false,runtime:next,room:clone(next.rooms[id])};
  next.rooms[id]=createRoomInstance(id,layout,{entities});
  return {created:true,runtime:next,room:clone(next.rooms[id])};
}

function appendLog(runtime,type,payload={}){
  const next=clone(runtime);
  next.sequence=(Number(next.sequence)||0)+1;
  next.log=Array.isArray(next.log)?next.log:[];
  next.log.push({seq:next.sequence,type,...clone(payload)});
  return next;
}

export function visitCurrentRoom(runtime,reason='enter'){
  const id=roomKey(runtime?.currentRoomId);
  if(!id||!runtime?.rooms?.[id]) return runtime;
  const next=clone(runtime);
  next.rooms[id].visits=(Number(next.rooms[id].visits)||0)+1;
  return appendLog(next,'room-entered',{roomId:id,reason,visits:next.rooms[id].visits});
}

export function transitionDungeonRoom(worldIndex,runtime,linkId,{layoutProvider=null,conditionEvaluator=null,inventory=null}={}){
  const moved=traverseRoomLink(worldIndex,runtime.worldSession,linkId,{conditionEvaluator,inventory});
  if(!moved.ok) return {ok:false,reason:moved.reason,runtime};
  let next=clone(runtime);
  const fromRoomId=String(next.currentRoomId);
  next.worldSession=moved.session;
  next.currentRoomId=String(moved.session.currentRoomId);
  const ensured=ensureRoomInstance(next,next.currentRoomId,layoutProvider?.(next.currentRoomId)||null);
  next=ensured.runtime;
  next=visitCurrentRoom(next,'link');
  next=appendLog(next,'room-transition',{fromRoomId,toRoomId:next.currentRoomId,linkId:String(linkId),created:ensured.created});
  return {ok:true,runtime:next,room:clone(next.rooms[next.currentRoomId]),created:ensured.created};
}

export function updateRoomEntity(runtime,roomId,entityId,patch={}){
  const id=roomKey(roomId); const next=clone(runtime);
  const room=next.rooms?.[id];
  if(!room) return {ok:false,reason:'room-not-instantiated',runtime};
  const index=(room.entities||[]).findIndex(e=>String(e.id)===String(entityId));
  if(index<0) return {ok:false,reason:'entity-missing',runtime};
  room.entities[index]={...room.entities[index],...clone(patch),id:String(room.entities[index].id)};
  return {ok:true,runtime:appendLog(next,'room-entity-updated',{roomId:id,entityId:String(entityId)})};
}

export function updateRoomInteractionState(runtime,roomId,interactionId,patch={}){
  const id=roomKey(roomId); const next=clone(runtime);
  const state=next.rooms?.[id]?.interactions?.[String(interactionId)];
  if(!state) return {ok:false,reason:'interaction-missing',runtime};
  next.rooms[id].interactions[String(interactionId)]={...state,...clone(patch),id:String(interactionId)};
  return {ok:true,runtime:appendLog(next,'room-interaction-updated',{roomId:id,interactionId:String(interactionId)})};
}

export function roomRuntimeSnapshot(runtime,roomId){
  const room=runtime?.rooms?.[roomKey(roomId)];
  return room?clone(room):null;
}
