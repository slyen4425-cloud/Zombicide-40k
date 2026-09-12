export const CAPTURE_UI_PRESENTATION_BLOCK_CONTRACT=Object.freeze({
  presentationOnly:true,
  pausesVisualTimeOnly:true,
  doesNotBlockGameplay:true,
  reason:'presentation-block',
  mutatesGameplayState:false,
  isolatedFromRpg:true,
});

export function createCaptureUiPresentationBlockState({blocked=false,kind=null,metadata={}}={}){
  return {
    blocked:blocked===true,
    kind:kind==null?null:String(kind),
    metadata:metadata&&typeof metadata==='object'?structuredClone(metadata):{},
  };
}

export function setCaptureUiPresentationBlocked(state,blocked,{kind=null,metadata={}}={}){
  const current=createCaptureUiPresentationBlockState(state||{});
  const nextBlocked=blocked===true;
  return {
    ok:true,
    changed:current.blocked!==nextBlocked||current.kind!==(kind==null?null:String(kind)),
    state:createCaptureUiPresentationBlockState({
      blocked:nextBlocked,
      kind:nextBlocked?kind:null,
      metadata:nextBlocked?metadata:{},
    }),
    pauseReason:CAPTURE_UI_PRESENTATION_BLOCK_CONTRACT.reason,
    paused:nextBlocked,
  };
}
