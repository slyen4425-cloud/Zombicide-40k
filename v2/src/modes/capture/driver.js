const clone=value=>structuredClone(value);

export const CAPTURE_DRIVER_CONTRACT=Object.freeze({
  externalClockRequired:true,
  ownsRealtimeLoop:false,
  usesSetInterval:false,
  usesRequestAnimationFrame:false,
  fixedRealtimeCadence:false,
  canonicalSchedulerAdvance:'advanceCaptureScheduler',
  isolatedFromRpg:true,
});

export function createCaptureDriverState({status='stopped',frames=0,totalDelta=0}={}){
  const normalizedStatus=['running','paused'].includes(String(status))?String(status):'stopped';
  return {
    status:normalizedStatus,
    frames:Math.max(0,Math.floor(Number(frames)||0)),
    totalDelta:Math.max(0,Number(totalDelta)||0),
  };
}

export function startCaptureDriver(driver){
  const current=createCaptureDriverState(driver||{});
  return {...current,status:'running'};
}

export function pauseCaptureDriver(driver){
  const current=createCaptureDriverState(driver||{});
  return {...current,status:'paused'};
}

export function resumeCaptureDriver(driver){
  const current=createCaptureDriverState(driver||{});
  return {...current,status:'running'};
}

export function stopCaptureDriver(driver){
  const current=createCaptureDriverState(driver||{});
  return {...current,status:'stopped'};
}

export function pushCaptureDriverDelta(state,scheduler,driver,{delta=0,advanceScheduler,schedulerOptions={}}={}){
  const current=createCaptureDriverState(driver||{});
  if(current.status!=='running'){
    return {
      ok:true,
      reason:current.status==='paused'?'driver-paused':'driver-stopped',
      state,
      scheduler:clone(scheduler),
      driver:current,
      processedSteps:0,
      results:[],
    };
  }
  if(typeof advanceScheduler!=='function'){
    return {ok:false,reason:'capture-scheduler-advance-missing',state,scheduler:clone(scheduler),driver:current,processedSteps:0,results:[]};
  }

  const incoming=Math.max(0,Number(delta)||0);
  const result=advanceScheduler(state,scheduler,{...schedulerOptions,delta:incoming});
  if(!result.ok) return {...result,driver:current};

  return {
    ...result,
    driver:{
      status:current.status,
      frames:current.frames+1,
      totalDelta:current.totalDelta+incoming,
    },
  };
}
