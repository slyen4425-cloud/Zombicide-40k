import { dequeueEventRequest, createEventQueueRuntime } from './event-queue-runtime.js';
import { createEventState, runEvent, chooseEventOption } from './event-engine.js';

function clone(value){return structuredClone(value);}
function list(definitions,key){return Array.isArray(definitions?.[key])?definitions[key]:Object.values(definitions?.[key]||{});}
function byId(definitions,key,id){return list(definitions,key).find(item=>String(item?.id)===String(id))||null;}

export function createEventQueueOrchestrator({queue=null}={}){
  return {
    queue:clone(queue||createEventQueueRuntime()),
    active:null,
    completedRequestIds:[],
    completedOnceEventIds:[],
    history:[],
    sequence:0,
  };
}

function normalizeRuntime(runtime){
  const next=clone(runtime||createEventQueueOrchestrator());
  next.queue=clone(next.queue||createEventQueueRuntime());
  next.active=next.active||null;
  next.completedRequestIds=Array.isArray(next.completedRequestIds)?next.completedRequestIds.map(String):[];
  next.completedOnceEventIds=Array.isArray(next.completedOnceEventIds)?next.completedOnceEventIds.map(String):[];
  next.history=Array.isArray(next.history)?next.history:[];
  next.sequence=Number(next.sequence)||0;
  return next;
}

function append(runtime,type,payload={}){
  const next=normalizeRuntime(runtime);
  next.sequence+=1;
  next.history.push({seq:next.sequence,type,...clone(payload)});
  return next;
}

function finish(runtime,request,definition,eventState,{skippedReason=null}={}){
  let next=normalizeRuntime(runtime);
  const requestId=String(request.id);
  if(!next.completedRequestIds.includes(requestId)) next.completedRequestIds.push(requestId);
  if(definition?.once&&definition?.id&&!next.completedOnceEventIds.includes(String(definition.id))) next.completedOnceEventIds.push(String(definition.id));
  next.active=null;
  return append(next,skippedReason?'event-request-skipped':'event-request-completed',{
    requestId,
    eventId:String(request.eventId),
    reason:skippedReason,
    eventStatus:eventState?.status||null,
  });
}

export function startNextQueuedEvent(runtime,definitions={},context={}){
  let next=normalizeRuntime(runtime);
  if(next.active) return {ok:false,reason:'event-active',runtime:next,world:clone(context.world||{}),eventState:clone(next.active.eventState)};

  let dequeued=dequeueEventRequest(next.queue);
  if(!dequeued.ok) return {ok:false,reason:'queue-empty',runtime:next,world:clone(context.world||{}),eventState:null};
  next.queue=dequeued.queue;
  const request=dequeued.request;

  if(next.completedRequestIds.includes(String(request.id))){
    next=finish(next,request,null,null,{skippedReason:'request-already-completed'});
    return {ok:false,reason:'request-already-completed',runtime:next,world:clone(context.world||{}),eventState:null,request};
  }

  const definition=byId(definitions,'events',request.eventId);
  if(!definition){
    next=finish(next,request,null,null,{skippedReason:'event-missing'});
    return {ok:false,reason:'event-missing',runtime:next,world:clone(context.world||{}),eventState:null,request};
  }
  if(definition.enabled===false){
    next=finish(next,request,definition,null,{skippedReason:'event-disabled'});
    return {ok:false,reason:'event-disabled',runtime:next,world:clone(context.world||{}),eventState:null,request};
  }
  if(definition.once&&next.completedOnceEventIds.includes(String(definition.id))){
    next=finish(next,request,null,null,{skippedReason:'once-event-already-completed'});
    return {ok:false,reason:'once-event-already-completed',runtime:next,world:clone(context.world||{}),eventState:null,request};
  }

  const eventState=createEventState(definition,{runId:String(request.id),roomId:context.roomId||null});
  const executed=runEvent(eventState,{...context,definitions});
  next=append(next,'event-request-started',{requestId:String(request.id),eventId:String(request.eventId)});

  if(executed.state.status==='completed'){
    next=finish(next,request,definition,executed.state);
  } else {
    next.active={request:clone(request),definitionId:String(definition.id),eventState:clone(executed.state)};
  }
  return {ok:true,runtime:next,world:executed.world,eventState:executed.state,request};
}

export function resolveActiveEventChoice(runtime,choiceId,definitions={},context={}){
  let next=normalizeRuntime(runtime);
  if(!next.active) return {ok:false,reason:'no-active-event',runtime:next,world:clone(context.world||{}),eventState:null};
  const request=clone(next.active.request);
  const definition=byId(definitions,'events',next.active.definitionId);
  if(!definition) return {ok:false,reason:'event-missing',runtime:next,world:clone(context.world||{}),eventState:clone(next.active.eventState)};

  const resumed=chooseEventOption(next.active.eventState,choiceId,{...context,definitions});
  if(!resumed.ok) return {...resumed,runtime:next,eventState:resumed.state};

  if(resumed.state.status==='completed'){
    next=finish(next,request,definition,resumed.state);
  } else {
    next.active={...next.active,eventState:clone(resumed.state)};
  }
  return {ok:true,runtime:next,world:resumed.world,eventState:resumed.state,request};
}
