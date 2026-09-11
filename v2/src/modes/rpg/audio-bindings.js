import { queueAudio } from './audio-engine.js';

function clone(value){return structuredClone(value);}

function candidateAudioId(source,cue='default'){
  if(!source) return null;
  const named=source.audioBindings?.[cue] ?? source.audio?.[cue] ?? source.data?.audio?.[cue] ?? null;
  if(named) return String(named);
  const fallbackCues=new Set(['default','use','open','trigger','attack','cast','spawn','recruit','dismiss','result']);
  if(fallbackCues.has(String(cue))&&source.audioId) return String(source.audioId);
  return null;
}

export function resolveBoundAudioId(source,cue='default'){
  return candidateAudioId(source,cue);
}

export function queueBoundAudio({state,source,cue='default',definitions={},options={}}={}){
  const audioId=resolveBoundAudioId(source,cue);
  if(!audioId) return {ok:false,reason:'audio-unbound',state,audioId:null};
  const queued=queueAudio(state,audioId,definitions,{...clone(options||{}),metadata:{...(clone(options?.metadata||{})),cue:String(cue)}});
  return {...queued,audioId};
}

export function queueResultAudio({state,result,cue='result',definitions={},options={}}={}){
  const audioId=result?.audioId?String(result.audioId):resolveBoundAudioId(result,cue);
  if(!audioId) return {ok:false,reason:'audio-unbound',state,audioId:null};
  const queued=queueAudio(state,audioId,definitions,{...clone(options||{}),metadata:{...(clone(options?.metadata||{})),cue:String(cue)}});
  return {...queued,audioId};
}

export function audioBindingSnapshot(source={}){
  const cues={};
  const maps=[source.audioBindings,source.audio,source.data?.audio].filter(Boolean);
  for(const map of maps) for(const [cue,id] of Object.entries(map||{})) if(id&&!cues[cue]) cues[String(cue)]=String(id);
  if(source.audioId&&!cues.default) cues.default=String(source.audioId);
  return {defaultAudioId:source.audioId?String(source.audioId):null,cues};
}
