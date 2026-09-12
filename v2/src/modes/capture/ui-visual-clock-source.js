export const CAPTURE_UI_VISUAL_CLOCK_SOURCE_CONTRACT=Object.freeze({
  presentationOnly:true,
  sourceInjected:true,
  subscribeUnsubscribeRequired:true,
  fixedRealtimeCadence:false,
  ownsBrowserApi:false,
  mutatesGameplayState:false,
  isolatedFromRpg:true,
});

export function attachCaptureUiVisualClockSource(source,onSample){
  if(!source) return {ok:true,attached:false,detach:()=>{}};
  if(typeof source.subscribe!=='function'){
    return {ok:false,reason:'ui-visual-clock-source-subscribe-missing',attached:false,detach:()=>{}};
  }
  if(typeof onSample!=='function'){
    return {ok:false,reason:'ui-visual-clock-source-handler-missing',attached:false,detach:()=>{}};
  }
  const unsubscribe=source.subscribe(onSample);
  if(typeof unsubscribe!=='function'){
    return {ok:false,reason:'ui-visual-clock-source-unsubscribe-missing',attached:false,detach:()=>{}};
  }
  let detached=false;
  return {
    ok:true,
    attached:true,
    detach(){
      if(detached) return false;
      detached=true;
      unsubscribe();
      return true;
    },
  };
}
