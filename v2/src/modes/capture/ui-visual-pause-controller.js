export const CAPTURE_UI_VISUAL_PAUSE_CONTROLLER_CONTRACT=Object.freeze({
  presentationOnly:true,
  multipleReasons:true,
  resumesOnlyWhenClear:true,
  reasonNamesDataDriven:true,
  mutatesGameplayState:false,
  isolatedFromRpg:true,
});

function normalizeReason(reason){
  const value=String(reason??'').trim();
  return value||null;
}

export function createCaptureUiVisualPauseControllerState({reasons=[]}={}){
  const unique=[];
  for(const raw of reasons||[]){
    const reason=normalizeReason(raw);
    if(reason&&!unique.includes(reason)) unique.push(reason);
  }
  return {reasons:unique};
}

export function isCaptureUiVisualPaused(controller){
  return createCaptureUiVisualPauseControllerState(controller||{}).reasons.length>0;
}

export function setCaptureUiVisualPauseReason(controller,reason,paused=true){
  const current=createCaptureUiVisualPauseControllerState(controller||{});
  const normalized=normalizeReason(reason);
  if(!normalized){
    return {ok:false,reason:'ui-visual-pause-reason-invalid',controller:current,transition:'none'};
  }

  const wasPaused=current.reasons.length>0;
  const has=current.reasons.includes(normalized);
  let reasons=current.reasons;
  if(paused&&!has) reasons=[...reasons,normalized];
  if(!paused&&has) reasons=reasons.filter(entry=>entry!==normalized);
  const next={reasons};
  const nowPaused=reasons.length>0;
  const transition=!wasPaused&&nowPaused?'pause':wasPaused&&!nowPaused?'resume':'none';
  return {ok:true,controller:next,transition,paused:nowPaused};
}

export function clearCaptureUiVisualPauseReasons(controller){
  const current=createCaptureUiVisualPauseControllerState(controller||{});
  return {
    controller:{reasons:[]},
    transition:current.reasons.length?'resume':'none',
    paused:false,
  };
}
