const clone=value=>structuredClone(value);

export const CAPTURE_UI_VISUAL_DRIVER_CONTRACT=Object.freeze({
  presentationOnly:true,
  independentFromGameplayDriver:true,
  ownsRealtimeLoop:false,
  fixedRealtimeCadence:false,
  externalVisualClockRequired:true,
  mutatesGameplayState:false,
  isolatedFromRpg:true,
});

export function createCaptureUiVisualDriverState({status='stopped',frames=0,totalVisualDelta=0}={}){
  const normalized=['running','paused'].includes(String(status))?String(status):'stopped';
  return {
    status:normalized,
    frames:Math.max(0,Math.floor(Number(frames)||0)),
    totalVisualDelta:Math.max(0,Number(totalVisualDelta)||0),
  };
}

export function startCaptureUiVisualDriver(driver){
  return {...createCaptureUiVisualDriverState(driver||{}),status:'running'};
}

export function pauseCaptureUiVisualDriver(driver){
  return {...createCaptureUiVisualDriverState(driver||{}),status:'paused'};
}

export function resumeCaptureUiVisualDriver(driver){
  return {...createCaptureUiVisualDriverState(driver||{}),status:'running'};
}

export function stopCaptureUiVisualDriver(driver){
  return {...createCaptureUiVisualDriverState(driver||{}),status:'stopped'};
}

export function pushCaptureUiVisualDelta(feed,driver,{delta=0,advanceVisualTime}={}){
  const current=createCaptureUiVisualDriverState(driver||{});
  if(current.status!=='running'){
    return {
      ok:true,
      reason:current.status==='paused'?'ui-visual-driver-paused':'ui-visual-driver-stopped',
      feed:clone(feed),
      driver:current,
    };
  }
  if(typeof advanceVisualTime!=='function'){
    return {ok:false,reason:'ui-visual-advance-missing',feed:clone(feed),driver:current};
  }
  const incoming=Math.max(0,Number(delta)||0);
  return {
    ok:true,
    feed:advanceVisualTime(feed,incoming),
    driver:{
      status:'running',
      frames:current.frames+1,
      totalVisualDelta:current.totalVisualDelta+incoming,
    },
  };
}
