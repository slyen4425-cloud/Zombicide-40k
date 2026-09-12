const clone=value=>structuredClone(value);

export const CAPTURE_UI_VISUAL_CLOCK_ADAPTER_CONTRACT=Object.freeze({
  presentationOnly:true,
  externalSamplesRequired:true,
  monotonicSamplesRequired:true,
  firstSampleAnchorsOnly:true,
  fixedTimeUnit:false,
  ownsRealtimeLoop:false,
  mutatesGameplayState:false,
  isolatedFromRpg:true,
});

export function createCaptureUiVisualClockAdapterState({status='stopped',lastSample=null,samples=0,totalDelta=0}={}){
  const normalized=['running','paused'].includes(String(status))?String(status):'stopped';
  const numericSample=lastSample==null?null:Number(lastSample);
  return {
    status:normalized,
    lastSample:Number.isFinite(numericSample)?numericSample:null,
    samples:Math.max(0,Math.floor(Number(samples)||0)),
    totalDelta:Math.max(0,Number(totalDelta)||0),
  };
}

export function startCaptureUiVisualClockAdapter(adapter){
  const current=createCaptureUiVisualClockAdapterState(adapter||{});
  return {...current,status:'running',lastSample:null};
}

export function pauseCaptureUiVisualClockAdapter(adapter){
  const current=createCaptureUiVisualClockAdapterState(adapter||{});
  return {...current,status:'paused',lastSample:null};
}

export function resumeCaptureUiVisualClockAdapter(adapter){
  const current=createCaptureUiVisualClockAdapterState(adapter||{});
  return {...current,status:'running',lastSample:null};
}

export function stopCaptureUiVisualClockAdapter(adapter){
  const current=createCaptureUiVisualClockAdapterState(adapter||{});
  return {...current,status:'stopped',lastSample:null};
}

export function sampleCaptureUiVisualClock(feed,visualDriver,adapter,{sample,advanceVisualDriver}={}){
  const current=createCaptureUiVisualClockAdapterState(adapter||{});
  if(current.status!=='running'){
    return {
      ok:true,
      reason:current.status==='paused'?'ui-visual-clock-paused':'ui-visual-clock-stopped',
      feed:clone(feed),
      visualDriver:clone(visualDriver),
      adapter:current,
    };
  }
  const numeric=Number(sample);
  if(!Number.isFinite(numeric)){
    return {ok:false,reason:'ui-visual-clock-sample-invalid',feed:clone(feed),visualDriver:clone(visualDriver),adapter:current};
  }
  if(current.lastSample==null){
    return {
      ok:true,
      reason:'ui-visual-clock-anchored',
      feed:clone(feed),
      visualDriver:clone(visualDriver),
      adapter:{...current,lastSample:numeric,samples:current.samples+1},
    };
  }
  if(numeric<current.lastSample){
    return {ok:false,reason:'ui-visual-clock-nonmonotonic',feed:clone(feed),visualDriver:clone(visualDriver),adapter:current};
  }
  if(typeof advanceVisualDriver!=='function'){
    return {ok:false,reason:'ui-visual-clock-advance-missing',feed:clone(feed),visualDriver:clone(visualDriver),adapter:current};
  }
  const delta=numeric-current.lastSample;
  const advanced=advanceVisualDriver(feed,visualDriver,{delta});
  if(!advanced.ok) return {...advanced,adapter:current};
  return {
    ...advanced,
    delta,
    visualDriver:advanced.driver,
    adapter:{
      ...current,
      lastSample:numeric,
      samples:current.samples+1,
      totalDelta:current.totalDelta+delta,
    },
  };
}
