const clone=value=>structuredClone(value);

export const CAPTURE_REACTION_WINDOW_CONTRACT=Object.freeze({
  explicitWindow:true,
  defaultWindow:'open_when_unconfigured',
  fixedIFrames:false,
  fixedRealtimeCadence:false,
  deterministicWithInjectedTime:true,
  isolatedFromRpg:true,
});

export function normalizeCaptureReactionWindow(def={}){
  const opensAt=def.opensAt==null?null:Number(def.opensAt);
  const closesAt=def.closesAt==null?null:Number(def.closesAt);
  return {
    enabled:def.enabled!==false,
    opensAt:Number.isFinite(opensAt)?opensAt:null,
    closesAt:Number.isFinite(closesAt)?closesAt:null,
    unit:String(def.unit||'abstract'),
    metadata:def.metadata==null?null:clone(def.metadata),
  };
}

export function evaluateCaptureReactionWindow(def={},now=null){
  const window=normalizeCaptureReactionWindow(def||{});
  if(!window.enabled) return {ok:true,open:false,reason:'capture-reaction-window-disabled',window};
  if(window.opensAt==null&&window.closesAt==null) return {ok:true,open:true,reason:'capture-reaction-window-unconfigured',window,now:null};
  const moment=Number(now);
  if(!Number.isFinite(moment)) return {ok:false,open:false,reason:'capture-reaction-window-time-required',window};
  if(window.opensAt!=null&&moment<window.opensAt) return {ok:true,open:false,reason:'capture-reaction-window-not-open',window,now:moment};
  if(window.closesAt!=null&&moment>window.closesAt) return {ok:true,open:false,reason:'capture-reaction-window-closed',window,now:moment};
  return {ok:true,open:true,reason:'capture-reaction-window-open',window,now:moment};
}
