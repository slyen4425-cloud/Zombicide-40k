import { createEventQueueOrchestrator, startNextQueuedEvent, resolveActiveEventChoice } from './event-queue-orchestrator.js';
import { createEventQueueRuntime } from './event-queue-runtime.js';

function clone(value){return structuredClone(value);}

function syncOrchestrator(roomRuntime){
  const room=clone(roomRuntime||{});
  room.eventQueue=clone(room.eventQueue||createEventQueueRuntime());
  const orchestrator=room.eventOrchestrator?clone(room.eventOrchestrator):createEventQueueOrchestrator({queue:room.eventQueue});
  orchestrator.queue=clone(room.eventQueue);
  return {room,orchestrator};
}

function commit(room,orchestrator){
  const next=clone(room||{});
  next.eventOrchestrator=clone(orchestrator);
  next.eventQueue=clone(orchestrator.queue);
  return next;
}

export function drainRoomRuntimeEvents(roomRuntime,definitions={},context={}){
  let {room,orchestrator}=syncOrchestrator(roomRuntime);
  let world=clone(context.world||{});
  let lastEventState=orchestrator.active?.eventState?clone(orchestrator.active.eventState):null;
  const processed=[];

  if(orchestrator.active){
    room=commit(room,orchestrator);
    return {ok:true,reason:'event-active',roomRuntime:room,world,eventState:lastEventState,processed};
  }

  while((orchestrator.queue?.pending||[]).length){
    const out=startNextQueuedEvent(orchestrator,definitions,{...context,roomId:context.roomId??room.currentRoomId??null,world});
    orchestrator=out.runtime;
    world=out.world;
    lastEventState=out.eventState||lastEventState;
    if(out.request) processed.push({requestId:String(out.request.id),eventId:String(out.request.eventId),ok:out.ok,reason:out.reason||null,status:out.eventState?.status||null});
    if(orchestrator.active) break;
  }

  room=commit(room,orchestrator);
  return {ok:true,reason:orchestrator.active?'waiting-choice':'drained',roomRuntime:room,world,eventState:lastEventState,processed};
}

export function resolveRoomRuntimeEventChoice(roomRuntime,choiceId,definitions={},context={}){
  let {room,orchestrator}=syncOrchestrator(roomRuntime);
  let world=clone(context.world||{});
  if(!orchestrator.active){
    room=commit(room,orchestrator);
    return {ok:false,reason:'no-active-event',roomRuntime:room,world,eventState:null,processed:[]};
  }

  const resolved=resolveActiveEventChoice(orchestrator,choiceId,definitions,{...context,roomId:context.roomId??room.currentRoomId??null,world});
  orchestrator=resolved.runtime;
  world=resolved.world;
  room=commit(room,orchestrator);
  if(!resolved.ok) return {...resolved,roomRuntime:room,world,processed:[]};

  if(orchestrator.active) return {...resolved,roomRuntime:room,world,processed:[]};
  const drained=drainRoomRuntimeEvents(room,definitions,{...context,world});
  return {...resolved,roomRuntime:drained.roomRuntime,world:drained.world,eventState:drained.eventState||resolved.eventState,processed:drained.processed};
}
