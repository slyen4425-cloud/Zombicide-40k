import {advanceCaptureTime} from './runtime.js';

const clone=value=>structuredClone(value);

export const CAPTURE_SCHEDULER_CONTRACT=Object.freeze({
  externalDriverRequired:true,
  usesSetInterval:false,
  usesRequestAnimationFrame:false,
  fixedRealtimeCadence:false,
  canonicalAdvance:'advanceCaptureTime',
  accumulatesExternalDelta:true,
  isolatedFromRpg:true,
});

export function createCaptureSchedulerState({accumulated=0,steps=0,running=true}={}){
  return {
    accumulated:Math.max(0,Number(accumulated)||0),
    steps:Math.max(0,Math.floor(Number(steps)||0)),
    running:running!==false,
  };
}

export function setCaptureSchedulerRunning(scheduler,running){
  return {...clone(scheduler||createCaptureSchedulerState()),running:!!running};
}

export function pushCaptureSchedulerDelta(state,scheduler,{delta=0,stepSize=1,maxSteps=Infinity,timeOptions={}}={}){
  const current=createCaptureSchedulerState(scheduler||{});
  if(!current.running) return {ok:true,reason:'scheduler-paused',processedSteps:0,state,scheduler:current,results:[]};
  if(!state?.battle) return {ok:false,reason:'battle-missing',processedSteps:0,state,scheduler:current,results:[]};

  const incoming=Math.max(0,Number(delta)||0);
  const quantum=Math.max(Number.EPSILON,Number(stepSize)||1);
  const limit=Number.isFinite(Number(maxSteps))?Math.max(0,Math.floor(Number(maxSteps))):Infinity;
  let accumulated=current.accumulated+incoming;
  let nextState=state;
  let processedSteps=0;
  const results=[];

  while(accumulated>=quantum&&processedSteps<limit&&nextState?.battle){
    const result=advanceCaptureTime(nextState,{...timeOptions,amount:quantum});
    if(!result.ok){
      return {ok:false,reason:result.reason||'capture-time-advance-failed',processedSteps,state:nextState,scheduler:{...current,accumulated,steps:current.steps+processedSteps},results};
    }
    results.push(clone(result));
    nextState=result.state;
    accumulated-=quantum;
    processedSteps+=1;
    if(result.ended) break;
  }

  return {
    ok:true,
    reason:processedSteps?'advanced':'insufficient-delta',
    processedSteps,
    state:nextState,
    scheduler:{
      accumulated,
      steps:current.steps+processedSteps,
      running:current.running,
    },
    results,
  };
}
