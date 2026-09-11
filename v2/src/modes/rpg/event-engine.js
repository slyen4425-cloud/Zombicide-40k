import { applyEffect } from '../../core/effects.js';
import { resolveDefinedActorCheck } from '../../core/checks.js';

function clone(value){return structuredClone(value);}
function uid(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}

export const EVENT_ACTION_KINDS=['text','audio','effect','spawn','door','reward','flag','transition','choice','check'];

function normalizeActions(actions,eventId,prefix='a'){
  return (actions||[]).map((action,index)=>{
    const id=String(action?.id||`${eventId}:${prefix}${index+1}`);
    const out={...clone(action||{}),id,kind:EVENT_ACTION_KINDS.includes(action?.kind)?action.kind:'text'};
    if(out.kind==='choice'){
      out.choices=(out.choices||[]).map((choice,choiceIndex)=>({
        ...clone(choice),
        id:String(choice?.id||`${id}:c${choiceIndex+1}`),
        label:String(choice?.label||`Choix ${choiceIndex+1}`),
        actions:normalizeActions(choice?.actions||[],eventId,`${prefix}${index+1}c${choiceIndex+1}.`),
      }));
    }
    if(out.kind==='check'){
      out.checkId=out.checkId==null?null:String(out.checkId);
      out.successActions=normalizeActions(out.successActions||[],eventId,`${prefix}${index+1}s.`);
      out.failureActions=normalizeActions(out.failureActions||[],eventId,`${prefix}${index+1}f.`);
    }
    return out;
  });
}

export function createEventDefinition({id:eventId=uid(),name='Nouvel événement',enabled=true,once=false,actions=[]}={}){
  const id=String(eventId);
  return {id,name:String(name||'Événement'),enabled:enabled!==false,once:Boolean(once),actions:normalizeActions(actions,id)};
}

export function createEventState(definition,{runId=uid(),roomId=null}={}){
  const def=createEventDefinition(definition||{});
  return {
    runId:String(runId),eventId:def.id,roomId:roomId?String(roomId):null,status:def.enabled?'running':'disabled',cursor:0,
    queue:clone(def.actions),processedActionIds:[],waitingChoice:null,log:[],sequence:0,
    result:{requestedTransition:null,audioRequests:[]},
  };
}

function appendLog(state,type,payload={}){
  const next=clone(state); next.sequence=(Number(next.sequence)||0)+1; next.log=Array.isArray(next.log)?next.log:[];
  next.log.push({seq:next.sequence,type,...clone(payload)}); return next;
}

function entityExists(room,entityId){return (room?.entities||[]).some(e=>String(e.id)===String(entityId));}

function applyAction(state,action,context){
  let next=clone(state); const world=clone(context.world||{});
  world.actors=world.actors||{}; world.inventory=world.inventory||{}; world.flags=world.flags||{}; world.doors=world.doors||{}; world.rooms=world.rooms||{};
  const actionId=String(action.id);

  if(action.kind==='text'){
    next=appendLog(next,'event-text',{actionId,text:String(action.text||'')}); return {state:next,world};
  }

  if(action.kind==='check'){
    const actorId=String(action.actorId||context.defaultTargetId||'');
    const actor=world.actors[actorId];
    if(!actor){next=appendLog(next,'event-action-skipped',{actionId,kind:'check',reason:'actor-missing'});return {state:next,world};}
    const resolved=resolveDefinedActorCheck({
      checkId:action.checkId,
      fallback:action.check||null,
      definitions:context.definitions||{},
      actor,
      random:context.checkRandom||Math.random,
      roll:action.roll??null,
    });
    if(!resolved.ok){next=appendLog(next,'event-action-skipped',{actionId,kind:'check',reason:resolved.reason||'check-failed-to-resolve',checkId:action.checkId||null});return {state:next,world};}
    const success=Boolean(resolved.check?.success);
    const branch=success?action.successActions:action.failureActions;
    if(branch?.length) next.queue.splice(next.cursor,0,...clone(branch));
    next=appendLog(next,'event-check-resolved',{actionId,actorId,checkId:action.checkId||null,success,check:resolved.check});
    return {state:next,world};
  }

  if(action.kind==='audio'){
    const audioId=String(action.audioId||'');
    const audio=(context.definitions?.audio||[]).find?.(x=>String(x.id)===audioId)||context.definitions?.audio?.[audioId];
    if(!audioId||!audio||audio.enabled===false){
      next=appendLog(next,'event-action-skipped',{actionId,kind:'audio',reason:!audioId?'audio-id-missing':'audio-missing'}); return {state:next,world};
    }
    const request={audioId,channel:String(action.channel||audio.channel||'sfx'),loop:action.loop==null?Boolean(audio.loop):Boolean(action.loop),volume:action.volume==null?Number(audio.volume??1):Number(action.volume),delayMs:action.delayMs==null?Number(audio.delayMs??0):Number(action.delayMs),metadata:clone(action.metadata||{})};
    next.result=next.result||{}; next.result.audioRequests=Array.isArray(next.result.audioRequests)?next.result.audioRequests:[]; next.result.audioRequests.push(request);
    next=appendLog(next,'event-audio-requested',{actionId,...request}); return {state:next,world};
  }

  if(action.kind==='effect'){
    const effect=(context.definitions?.effects||[]).find?.(x=>String(x.id)===String(action.effectId))||context.definitions?.effects?.[action.effectId];
    const targetId=String(action.targetId||context.defaultTargetId||''); const target=world.actors[targetId];
    if(!effect||!target){next=appendLog(next,'event-action-skipped',{actionId,kind:'effect',reason:!effect?'effect-missing':'target-missing'});return {state:next,world};}
    const applied=applyEffect(effect,target,context.definitions||{},context.effectContext||{}); if(applied.applied) world.actors[targetId]=applied.state;
    next=appendLog(next,applied.applied?'event-effect-applied':'event-action-skipped',{actionId,effectId:String(action.effectId),targetId,reason:applied.reason||null}); return {state:next,world};
  }

  if(action.kind==='spawn'){
    const roomId=String(action.roomId||next.roomId||''); const room=world.rooms[roomId]; const entity=clone(action.entity||{});
    if(!room||!entity.id){next=appendLog(next,'event-action-skipped',{actionId,kind:'spawn',reason:!room?'room-missing':'entity-id-missing'});return {state:next,world};}
    room.entities=Array.isArray(room.entities)?room.entities:[]; const existed=entityExists(room,entity.id);
    if(!existed) room.entities.push({...entity,id:String(entity.id),active:entity.active!==false,defeated:Boolean(entity.defeated),removed:Boolean(entity.removed)});
    next=appendLog(next,'event-spawn',{actionId,roomId,entityId:String(entity.id),created:!existed}); return {state:next,world};
  }

  if(action.kind==='door'){
    const doorId=String(action.doorId||''); if(!doorId){next=appendLog(next,'event-action-skipped',{actionId,kind:'door',reason:'door-id-missing'});return {state:next,world};}
    world.doors[doorId]={...(world.doors[doorId]||{id:doorId}),...clone(action.patch||{}),id:doorId}; next=appendLog(next,'event-door-updated',{actionId,doorId,patch:clone(action.patch||{})}); return {state:next,world};
  }

  if(action.kind==='reward'){
    const itemId=String(action.itemId||''); const quantity=Math.max(0,Number(action.quantity??1)||0);
    if(itemId&&quantity>0) world.inventory[itemId]=(Number(world.inventory[itemId])||0)+quantity;
    next=appendLog(next,itemId&&quantity>0?'event-reward':'event-action-skipped',{actionId,itemId,quantity,reason:itemId&&quantity>0?null:'invalid-reward'}); return {state:next,world};
  }

  if(action.kind==='flag'){
    const flagId=String(action.flagId||''); if(flagId) world.flags[flagId]=clone(action.value??true);
    next=appendLog(next,flagId?'event-flag-set':'event-action-skipped',{actionId,flagId,value:clone(action.value??true),reason:flagId?null:'flag-id-missing'}); return {state:next,world};
  }

  if(action.kind==='transition'){
    next.result=next.result||{}; next.result.requestedTransition={linkId:action.linkId?String(action.linkId):null,roomId:action.roomId?String(action.roomId):null};
    next=appendLog(next,'event-transition-requested',{actionId,...clone(next.result.requestedTransition)}); return {state:next,world};
  }

  if(action.kind==='choice'){
    next.waitingChoice={actionId,choices:clone(action.choices||[])}; next.status='waiting-choice';
    next=appendLog(next,'event-choice-requested',{actionId,choices:(action.choices||[]).map(c=>({id:String(c.id),label:String(c.label)}))}); return {state:next,world,paused:true};
  }

  next=appendLog(next,'event-action-skipped',{actionId,kind:String(action.kind),reason:'unsupported-kind'}); return {state:next,world};
}

export function runEvent(state,context={}){
  let next=clone(state); let world=clone(context.world||{});
  if(next.status==='disabled'||next.status==='completed'||next.status==='waiting-choice') return {state:next,world};
  while(next.cursor<next.queue.length){
    const action=next.queue[next.cursor]; next.cursor+=1; if((next.processedActionIds||[]).includes(String(action.id))) continue;
    const applied=applyAction(next,action,{...context,world}); next=applied.state; world=applied.world; next.processedActionIds=Array.isArray(next.processedActionIds)?next.processedActionIds:[];
    if(!next.processedActionIds.includes(String(action.id))) next.processedActionIds.push(String(action.id)); if(applied.paused) return {state:next,world};
  }
  next.status='completed'; next=appendLog(next,'event-completed',{eventId:String(next.eventId)}); return {state:next,world};
}

export function chooseEventOption(state,choiceId,context={}){
  if(state?.status!=='waiting-choice'||!state.waitingChoice) return {ok:false,reason:'not-waiting-choice',state,world:clone(context.world||{})};
  const choice=(state.waitingChoice.choices||[]).find(c=>String(c.id)===String(choiceId)); if(!choice) return {ok:false,reason:'choice-missing',state,world:clone(context.world||{})};
  const next=clone(state); next.queue.splice(next.cursor,0,...clone(choice.actions||[])); next.waitingChoice=null; next.status='running';
  const logged=appendLog(next,'event-choice-selected',{choiceId:String(choice.id),label:String(choice.label||'')}); const resumed=runEvent(logged,context); return {ok:true,...resumed};
}
