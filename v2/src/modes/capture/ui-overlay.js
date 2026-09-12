export const CAPTURE_UI_OVERLAY_CONTRACT=Object.freeze({
  presentationOnly:true,
  nonModal:true,
  presentationBlocking:true,
  mutatesGameplayState:false,
  isolatedFromRpg:true,
});

function text(value,fallback=''){
  const normalized=String(value??'').trim();
  return normalized||fallback;
}

export function createCaptureUiOverlayState({open=false,kind='info',title='',message='',metadata={}}={}){
  return {
    open:Boolean(open),
    kind:text(kind,'info'),
    title:text(title,''),
    message:text(message,''),
    metadata:metadata&&typeof metadata==='object'?structuredClone(metadata):{},
  };
}

export function openCaptureUiOverlay(state,options={}){
  const current=createCaptureUiOverlayState(state||{});
  return {
    ok:true,
    state:createCaptureUiOverlayState({...current,...options,open:true}),
    presentationBlocked:true,
  };
}

export function closeCaptureUiOverlay(state){
  const current=createCaptureUiOverlayState(state||{});
  return {
    ok:true,
    state:{...current,open:false},
    presentationBlocked:false,
  };
}
