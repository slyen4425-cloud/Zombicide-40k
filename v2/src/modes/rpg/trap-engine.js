import { applyEffect } from '../../core/effects.js';
import { resolveActorCheck } from '../../core/checks.js';

function clone(value){return structuredClone(value);}
function uid(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}

function buildCheck(spec={},actor={},random=Math.random){
  return resolveActorCheck(spec,actor,{random});
}

export function createTrapDefinition({
  id:trapId=uid(),
  name='Nouveau piège',
  enabled=true,
  reusable=false,
  hidden=true,
  detectionCheck=null,
  disarmCheck=null,
  effectIds=[],
  eventId=null,
  audioId=null,
}={}){
  return {
    id:String(trapId),
    name:String(name||'Piège'),
    enabled:enabled!==false,
    reusable:Boolean(reusable),
    hidden:hidden!==false,
    detectionCheck:detectionCheck?clone(detectionCheck):null,
    disarmCheck:disarmCheck?clone(disarmCheck):null,
    effectIds:[...(effectIds||[])].map(String),
    eventId:eventId?String(eventId):null,
    audioId:audioId?String(audioId):null,
  };
}

export function createTrapState(definition={}){
  const trap=createTrapDefinition(definition);
  return {
    trapId:trap.id,
    revealed:!trap.hidden,
    disarmed:false,
    triggered:false,
    triggerCount:0,
    lastDetection:null,
    lastDisarm:null,
    log:[],
    sequence:0,
  };
}

function appendLog(state,type,payload={}){
  const next=clone(state);
  next.sequence=(Number(next.sequence)||0)+1;
  next.log=Array.isArray(next.log)?next.log:[];
  next.log.push({seq:next.sequence,type,...clone(payload)});
  return next;
}

export function detectTrap(definition,state,actor,{random=Math.random}={}){
  const trap=createTrapDefinition(definition);
  if(!trap.enabled) return {ok:false,reason:'disabled',state};
  if(state?.revealed) return {ok:true,already:true,detected:true,state};
  const check=trap.detectionCheck?buildCheck(trap.detectionCheck,actor,random):{success:true,roll:null,threshold:null};
  let next=clone(state||createTrapState(trap));
  next.lastDetection=clone(check);
  if(check.success) next.revealed=true;
  next=appendLog(next,'trap-detection',{trapId:trap.id,success:Boolean(check.success),check});
  return {ok:true,detected:Boolean(check.success),check,state:next};
}

export function disarmTrap(definition,state,actor,{random=Math.random,definitions={}}={}){
  const trap=createTrapDefinition(definition);
  let next=clone(state||createTrapState(trap));
  if(!trap.enabled) return {ok:false,reason:'disabled',state:next,actor};
  if(next.disarmed) return {ok:true,already:true,disarmed:true,state:next,actor};
  if(next.triggered&&!trap.reusable) return {ok:false,reason:'already-triggered',state:next,actor};
  const check=trap.disarmCheck?buildCheck(trap.disarmCheck,actor,random):{success:true,roll:null,threshold:null};
  next.lastDisarm=clone(check);
  next=appendLog(next,'trap-disarm',{trapId:trap.id,success:Boolean(check.success),check});
  if(check.success){
    next.disarmed=true;
    next.revealed=true;
    return {ok:true,disarmed:true,triggered:false,check,state:next,actor:clone(actor)};
  }
  const triggered=triggerTrap(trap,next,actor,{definitions});
  return {ok:true,disarmed:false,triggered:true,check,...triggered};
}

export function triggerTrap(definition,state,actor,{definitions={},effectContext={}}={}){
  const trap=createTrapDefinition(definition);
  let next=clone(state||createTrapState(trap));
  let target=clone(actor||{});
  if(!trap.enabled) return {ok:false,reason:'disabled',state:next,actor:target,effects:[]};
  if(next.disarmed) return {ok:false,reason:'disarmed',state:next,actor:target,effects:[]};
  if(next.triggered&&!trap.reusable) return {ok:true,already:true,state:next,actor:target,effects:[]};
  const effects=[];
  for(const effectId of trap.effectIds){
    const effect=(definitions.effects||[]).find?.(x=>String(x.id)===String(effectId))||definitions.effects?.[effectId];
    if(!effect){effects.push({effectId,applied:false,reason:'missing-effect'});continue;}
    const out=applyEffect(effect,target,definitions,effectContext);
    if(out.applied) target=out.state;
    effects.push({effectId,applied:out.applied,reason:out.reason||null});
  }
  next.revealed=true;
  next.triggered=true;
  next.triggerCount=(Number(next.triggerCount)||0)+1;
  next=appendLog(next,'trap-triggered',{trapId:trap.id,triggerCount:next.triggerCount,effects,eventId:trap.eventId});
  return {ok:true,state:next,actor:target,effects,eventId:trap.eventId,audioId:trap.audioId};
}
