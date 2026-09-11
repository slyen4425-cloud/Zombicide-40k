import { startAudio } from './audio-engine.js';

function clone(value){return structuredClone(value);}

export function commitAudioIntentsToOutput({
  state,
  queued=[],
  stopped=[],
  output,
}={}){
  let next=clone(state);
  const started=[];
  const stoppedIds=[];
  if(!output) return {ok:false,reason:'output-missing',state:next,started,stopped:stoppedIds};

  for(const item of stopped||[]){
    const requestId=String(item?.requestId||item||'');
    if(!requestId) continue;
    const result=output.stop?.(requestId);
    if(result?.ok) stoppedIds.push(requestId);
  }

  for(const item of queued||[]){
    const request=item?.request||item;
    if(!request?.id) continue;
    const begun=startAudio(next,request);
    if(!begun.ok) continue;
    next=begun.state;
    const played=output.play?.(begun.playback);
    if(played?.ok!==false) started.push({requestId:String(request.id),audioId:String(request.audioId||''),channel:String(request.channel||'')});
  }

  return {ok:true,state:next,started,stopped:stoppedIds};
}

export function commitRoomTransitionAudioToOutput({transitionAudio,output}={}){
  if(!transitionAudio?.state) return {ok:false,reason:'transition-audio-missing',state:transitionAudio?.state||null,started:[],stopped:[]};
  return commitAudioIntentsToOutput({
    state:transitionAudio.state,
    queued:transitionAudio.queued||[],
    stopped:transitionAudio.stoppedAmbience||[],
    output,
  });
}
