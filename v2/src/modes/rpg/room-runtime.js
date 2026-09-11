import { createWorldSession, traverseRoomLink } from './world-engine.js';
import { inventoryQuantity, removeItem } from './inventory-engine.js';
import { resolveRoomInteractionCheck } from './interaction-engine.js';
import { applyRoomVisitToQuests, applyInteractionResultToQuests } from './room-quest-bridge.js';

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
    attempts:0,
    lastOutcome:null,
    lastCheck:null,
    data:{},
  };
}

function doorState(door){
  return {
    id:String(door.id),
    state:String(door.state||'closed'),
    locked:Boolean(door.locked),
    keyItemId:door.keyItemId==null?null:String(door.keyItemId),
  };
}

function createHeroLocation(heroId,roomId){
  const id=roomKey(roomId);
  return {heroId:String(heroId),roomId:id,visitedRoomIds:id?[id]:[],history:[],sequence:0,x:null,y:null};
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
    doors:Object.fromEntries((layout?.doors||[]).filter(x=>x?.id).map(x=>[String(x.id),doorState(x)])),
    flags:{},
    data:{},
  };
}

export function createDungeonRuntime(worldIndex,{startRoomId=null,layoutProvider=null,questRuntime=null,quests=[],questDefinitions={},questContext={},now=null,heroIds=[],focusedHeroId=null}={}){
  const started=createWorldSession(worldIndex,{startRoomId});
  if(!started.ok) return {ok:false,reason:started.reason,runtime:null};
  const startId=String(started.session.currentRoomId);
  const heroes=[...new Set((heroIds||[]).filter(Boolean).map(String))];
  const focus=focusedHeroId!=null?String(focusedHeroId):(heroes[0]||null);
  let runtime={
    worldSession:started.session,
    currentRoomId:startId,
    focusedHeroId:focus,
    heroLocations:Object.fromEntries(heroes.map(heroId=>[heroId,createHeroLocation(heroId,startId)])),
    rooms:{},
    questRuntime:questRuntime?clone(questRuntime):null,
    sequence:0,
    log:[],
  };
  runtime=ensureRoomInstance(runtime,runtime.currentRoomId,layoutProvider?.(runtime.currentRoomId)||null).runtime;
  runtime=visitRoom(runtime,runtime.currentRoomId,'start',{quests,definitions:questDefinitions,context:questContext,now,heroId:focus});
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

export function visitRoom(runtime,roomId,reason='enter',{quests=[],definitions={},context={},now=null,heroId=null}={}){
  const id=roomKey(roomId);
  if(!id||!runtime?.rooms?.[id]) return runtime;
  let next=clone(runtime);
  next.rooms[id].visits=(Number(next.rooms[id].visits)||0)+1;
  next=appendLog(next,'room-entered',{roomId:id,reason,visits:next.rooms[id].visits,heroId:heroId==null?null:String(heroId)});
  if((quests||[]).length){
    const questOut=applyRoomVisitToQuests(next.questRuntime,quests,id,{definitions,context,now});
    next.questRuntime=questOut.runtime;
  }
  return next;
}

export function visitCurrentRoom(runtime,reason='enter',options={}){
  return visitRoom(runtime,runtime?.currentRoomId,reason,options);
}

export function getHeroRoomLocation(runtime,heroId){
  const location=runtime?.heroLocations?.[String(heroId)];
  return location?clone(location):null;
}

export function heroesInRoom(runtime,roomId){
  const id=roomKey(roomId);
  return Object.values(runtime?.heroLocations||{}).filter(location=>roomKey(location?.roomId)===id).map(location=>String(location.heroId));
}

export function setFocusedDungeonHero(runtime,heroId){
  const id=String(heroId||'');
  const location=runtime?.heroLocations?.[id];
  if(!location) return {ok:false,reason:'hero-location-missing',runtime};
  const next=clone(runtime);
  next.focusedHeroId=id;
  next.currentRoomId=roomKey(location.roomId);
  next.worldSession={
    ...(next.worldSession||{}),
    currentRoomId:next.currentRoomId,
    visitedRoomIds:clone(location.visitedRoomIds||[next.currentRoomId]),
    history:clone(location.history||[]),
    sequence:Number(location.sequence)||0,
  };
  return {ok:true,runtime:appendLog(next,'hero-focus-changed',{heroId:id,roomId:next.currentRoomId})};
}

export function transitionDungeonHeroRoom(worldIndex,runtime,heroId,linkId,{layoutProvider=null,conditionEvaluator=null,inventory=null,quests=[],questDefinitions={},questContext={},now=null}={}){
  const id=String(heroId||'');
  const location=runtime?.heroLocations?.[id];
  if(!location) return {ok:false,reason:'hero-location-missing',runtime};
  const heroSession={
    ...(clone(runtime.worldSession||{})),
    currentRoomId:roomKey(location.roomId),
    visitedRoomIds:clone(location.visitedRoomIds||[location.roomId]),
    history:clone(location.history||[]),
    sequence:Number(location.sequence)||0,
  };
  const moved=traverseRoomLink(worldIndex,heroSession,linkId,{conditionEvaluator,inventory});
  if(!moved.ok) return {ok:false,reason:moved.reason,runtime};

  let next=clone(runtime);
  const fromRoomId=roomKey(location.roomId);
  const toRoomId=roomKey(moved.session.currentRoomId);
  next.heroLocations=next.heroLocations||{};
  next.heroLocations[id]={
    ...clone(location),
    heroId:id,
    roomId:toRoomId,
    visitedRoomIds:clone(moved.session.visitedRoomIds||[]),
    history:clone(moved.session.history||[]),
    sequence:Number(moved.session.sequence)||0,
  };
  const ensured=ensureRoomInstance(next,toRoomId,layoutProvider?.(toRoomId)||null);
  next=ensured.runtime;
  next=visitRoom(next,toRoomId,'hero-link',{quests,definitions:questDefinitions,context:questContext,now,heroId:id});
  if(String(next.focusedHeroId||'')===id){
    next.currentRoomId=toRoomId;
    next.worldSession=clone(moved.session);
  }
  next=appendLog(next,'hero-room-transition',{heroId:id,fromRoomId,toRoomId,linkId:String(linkId),created:ensured.created});
  return {ok:true,runtime:next,room:clone(next.rooms[toRoomId]),created:ensured.created,heroId:id,fromRoomId,toRoomId};
}

export function transitionDungeonRoom(worldIndex,runtime,linkId,{layoutProvider=null,conditionEvaluator=null,inventory=null,quests=[],questDefinitions={},questContext={},now=null}={}){
  const moved=traverseRoomLink(worldIndex,runtime.worldSession,linkId,{conditionEvaluator,inventory});
  if(!moved.ok) return {ok:false,reason:moved.reason,runtime};
  let next=clone(runtime);
  const fromRoomId=String(next.currentRoomId);
  next.worldSession=moved.session;
  next.currentRoomId=String(moved.session.currentRoomId);
  const ensured=ensureRoomInstance(next,next.currentRoomId,layoutProvider?.(next.currentRoomId)||null);
  next=ensured.runtime;
  next=visitCurrentRoom(next,'link',{quests,definitions:questDefinitions,context:questContext,now});
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

export function attemptRoomInteraction(runtime,roomId,interaction,actor,{definitions={},random=Math.random,roll=null,completeOnSuccess=true,quests=[],questDefinitions=definitions,questContext={},now=null}={}){
  const id=roomKey(roomId); const interactionId=String(interaction?.id||'');
  const next=clone(runtime);
  const state=next.rooms?.[id]?.interactions?.[interactionId];
  if(!state) return {ok:false,reason:'interaction-missing',runtime};
  if(state.completed) return {ok:true,alreadyCompleted:true,success:true,outcome:'success',runtime:next,state:clone(state),check:clone(state.lastCheck)};

  const resolved=resolveRoomInteractionCheck(interaction,actor,{definitions,random,roll});
  if(!resolved.ok) return {ok:false,reason:resolved.reason,runtime,state:clone(state),check:resolved.check||null};

  state.triggered=true;
  state.attempts=(Number(state.attempts)||0)+1;
  state.lastOutcome=resolved.outcome;
  state.lastCheck=clone(resolved.check);
  if(resolved.success&&completeOnSuccess) state.completed=true;

  let logged=appendLog(next,'room-interaction-attempted',{
    roomId:id,
    interactionId,
    attempt:state.attempts,
    outcome:state.lastOutcome,
    success:resolved.success,
    check:state.lastCheck,
  });
  if((quests||[]).length){
    const questOut=applyInteractionResultToQuests(logged.questRuntime,quests,interaction,{success:resolved.success,outcome:resolved.outcome},{definitions:questDefinitions,context:questContext,now});
    logged.questRuntime=questOut.runtime;
  }
  return {ok:true,success:resolved.success,outcome:resolved.outcome,runtime:logged,state:clone(logged.rooms[id].interactions[interactionId]),check:clone(resolved.check),definition:resolved.definition||null};
}

export function openRoomDoor(runtime,roomId,doorId,inventory,{consumeKey=false}={}){
  const id=roomKey(roomId); const next=clone(runtime);
  const room=next.rooms?.[id];
  if(!room) return {ok:false,reason:'room-not-instantiated',runtime,inventory};
  const door=room.doors?.[String(doorId)];
  if(!door) return {ok:false,reason:'door-missing',runtime,inventory};
  if(String(door.state)==='open'&&!door.locked) return {ok:true,alreadyOpen:true,runtime:next,inventory:clone(inventory),door:clone(door)};

  let nextInventory=clone(inventory);
  let consumed=false;
  if(door.locked){
    if(!door.keyItemId) return {ok:false,reason:'door-locked',runtime,inventory};
    if(inventoryQuantity(inventory,door.keyItemId)<=0) return {ok:false,reason:'missing-key',runtime,inventory,keyItemId:door.keyItemId};
    if(consumeKey){
      const removed=removeItem(inventory,door.keyItemId,1);
      if(!removed.ok) return {ok:false,reason:removed.reason||'key-consume-failed',runtime,inventory,keyItemId:door.keyItemId};
      nextInventory=removed.inventory;
      consumed=true;
    }
    door.locked=false;
  }
  door.state='open';
  const logged=appendLog(next,'room-door-opened',{roomId:id,doorId:String(doorId),keyItemId:door.keyItemId||null,keyConsumed:consumed});
  return {ok:true,alreadyOpen:false,runtime:logged,inventory:nextInventory,door:clone(logged.rooms[id].doors[String(doorId)])};
}

export function materializeRoomLayout(runtime,roomId,layout){
  if(!layout) return null;
  const next=clone(layout);
  const room=runtime?.rooms?.[roomKey(roomId)];
  if(!room) return next;
  next.doors=(next.doors||[]).map(door=>{
    const state=room.doors?.[String(door.id)];
    return state?{...door,...clone(state),id:String(door.id)}:door;
  });
  return next;
}

export function roomRuntimeSnapshot(runtime,roomId){
  const room=runtime?.rooms?.[roomKey(roomId)];
  return room?clone(room):null;
}
