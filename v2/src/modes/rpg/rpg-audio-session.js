import { createAudioState } from './audio-engine.js';
import { commitAudioIntentsToOutput, commitRoomTransitionAudioToOutput } from './audio-output-runtime.js';

function clone(value){return structuredClone(value);}

export function createRpgAudioSession({state=createAudioState(),output}={}){
  let currentState=clone(state);
  let disposed=false;

  function commit({queued=[],stopped=[]}={}){
    if(disposed) return {ok:false,reason:'session-disposed',state:clone(currentState),started:[],stopped:[]};
    const result=commitAudioIntentsToOutput({state:currentState,queued,stopped,output});
    if(result.ok) currentState=clone(result.state);
    return {...result,state:clone(currentState)};
  }

  function commitRoomTransition(transitionAudio){
    if(disposed) return {ok:false,reason:'session-disposed',state:clone(currentState),started:[],stopped:[]};
    const prepared=transitionAudio?.state?{...transitionAudio,state:clone(currentState)}:transitionAudio;
    const result=commitRoomTransitionAudioToOutput({transitionAudio:prepared,output});
    if(result.ok) currentState=clone(result.state);
    return {...result,state:clone(currentState)};
  }

  function snapshot(){return clone(currentState);}

  function dispose(){
    if(disposed) return {ok:true,alreadyDisposed:true,stopped:[]};
    disposed=true;
    const result=output?.dispose?.()||{ok:true,stopped:[]};
    return {ok:result.ok!==false,stopped:[...(result.stopped||[])]};
  }

  return {commit,commitRoomTransition,snapshot,dispose,isDisposed:()=>disposed};
}
