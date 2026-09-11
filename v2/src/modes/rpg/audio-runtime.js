import { queueBoundAudio, queueResultAudio } from './audio-bindings.js';

function clone(value){return structuredClone(value);}

export function queueSkillAudio({state,skill,phase='use',definitions={},options={}}={}){
  const cue=phase==='cast'?'cast':phase==='hit'?'hit':phase==='miss'?'miss':'use';
  return queueBoundAudio({state,source:skill,cue,definitions,options});
}

export function queueTrapAudio({state,trap,result=null,phase='trigger',definitions={},options={}}={}){
  if(result?.audioId) return queueResultAudio({state,result,cue:phase,definitions,options});
  const cue=phase==='detect'?'detect':phase==='disarm'?'disarm':'trigger';
  return queueBoundAudio({state,source:trap,cue,definitions,options});
}

export function queueCreatureAudio({state,creature,phase='spawn',definitions={},options={}}={}){
  const cue=['spawn','attack','hit','death','boss'].includes(String(phase))?String(phase):'default';
  return queueBoundAudio({state,source:creature,cue,definitions,options});
}

export function queueHeroFormAudio({state,form,phase='activate',definitions={},options={}}={}){
  const cue=phase==='revert'?'revert':'activate';
  return queueBoundAudio({state,source:form,cue,definitions,options});
}

export function queueRoomAudio({state,room,phase='enter',definitions={},options={}}={}){
  const cue=phase==='leave'?'leave':phase==='ambience'?'ambience':'enter';
  const source=room?.audioId||room?.audioBindings||room?.audio||room?.metadata?.audio?{
    audioId:room?.audioId||null,
    audioBindings:clone(room?.audioBindings||room?.metadata?.audioBindings||{}),
    audio:clone(room?.audio||room?.metadata?.audio||{}),
    data:{audio:clone(room?.data?.audio||{})},
  }:room;
  return queueBoundAudio({state,source,cue,definitions,options});
}

export function queueCombatAudio({state,source,phase='start',definitions={},options={}}={}){
  const cue=['start','turn','victory','defeat','ko'].includes(String(phase))?String(phase):'default';
  return queueBoundAudio({state,source,cue,definitions,options});
}
