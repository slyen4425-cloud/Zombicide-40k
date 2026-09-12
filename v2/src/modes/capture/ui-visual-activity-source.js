export const CAPTURE_UI_VISUAL_ACTIVITY_SOURCE_CONTRACT=Object.freeze({
  presentationOnly:true,
  sourceInjected:true,
  visibilityDriven:true,
  pausesVisualTimeOnly:true,
  resetsClockAnchorOnResume:true,
  ownsBrowserApi:false,
  mutatesGameplayState:false,
  isolatedFromRpg:true,
});

function normalizeActive(value){
  if(typeof value==='boolean') return value;
  if(value&&typeof value==='object'){
    if(typeof value.active==='boolean') return value.active;
    if(typeof value.visible==='boolean') return value.visible;
  }
  return null;
}

export function attachCaptureUiVisualActivitySource(source,{onInactive,onActive}={}){
  if(!source) return {ok:true,attached:false,detach:()=>{}};
  if(typeof source.subscribe!=='function'){
    return {ok:false,reason:'ui-visual-activity-source-subscribe-missing',attached:false,detach:()=>{}};
  }
  if(typeof onInactive!=='function'||typeof onActive!=='function'){
    return {ok:false,reason:'ui-visual-activity-source-handler-missing',attached:false,detach:()=>{}};
  }

  let lastActive=null;
  const unsubscribe=source.subscribe(value=>{
    const active=normalizeActive(value);
    if(active==null||active===lastActive) return;
    lastActive=active;
    if(active) onActive();
    else onInactive();
  });

  if(typeof unsubscribe!=='function'){
    return {ok:false,reason:'ui-visual-activity-source-unsubscribe-missing',attached:false,detach:()=>{}};
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
