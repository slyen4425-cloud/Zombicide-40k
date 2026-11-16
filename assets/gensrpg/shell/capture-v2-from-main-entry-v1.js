'use strict';
// Only staged into the official isolated Capture preview by the existing
// GenSRPG Pages publisher. No game, engine, save or SW mutation.
(function(root){
  const params=new URLSearchParams(root.location.search);
  const fromMain=params.get('entry')==='gensrpg-main';
  // Android may have installed the older, separately scoped Capture preview
  // under the same GenSRPG-looking icon. Open the SINGLE official app root
  // on standalone launch instead of requiring the user to tap a footer link.
  // Explicit Capture visits remain untouched, including from the main app.
  const standalone=(root.matchMedia?.('(display-mode: standalone)')?.matches===true)
    ||root.navigator?.standalone===true;
  if(standalone&&!fromMain&&params.get('launch')!=='capture'){
    try{
      root.location.replace(new URL('../../',root.location.href).href);
      return;
    }catch(error){
      // Browser policy may prohibit cross-scope navigation. Retain the
      // existing visible handoff as a fallback, without deleting local data.
      root.console?.warn?.('GenSRPG main launch handoff unavailable',error);
    }
  }
  root.document.addEventListener('DOMContentLoaded',()=>{
    const doc=root.document;
    if(fromMain){
      const mode=doc.querySelector('button.gensRootModeCard.capture');
      if(!mode)throw new Error('Published Capture V2 mode is missing');
      mode.click();
    }
    const header=fromMain?doc.getElementById('gensCaptureV2Root')?.querySelector('header'):null;
    if(fromMain&&!header)throw new Error('Official Capture V2 module did not mount');
    const host=header||doc.body;
    if(!host)throw new Error('Capture preview navigation host missing');
    const back=doc.createElement('a');
    back.href=new URL('../../',root.location.href).href;
    back.className='gensCaptureReturnToMain';
    back.textContent=fromMain?'← Retour à GenSRPG':'← GenSRPG : accueil / Dungeon';
    if(!fromMain){
      back.className+=' gensCaptureStandaloneBack';
      if(back.style)back.style.cssText='position:fixed;bottom:calc(10px + env(safe-area-inset-bottom));left:12px;z-index:2147483000;display:inline-flex;align-items:center;max-width:calc(100vw - 24px);border-radius:20px;border:1px solid #90a7b5;background:#112333;color:#fff;padding:9px 13px;font:600 13px/1.2 system-ui,sans-serif;text-decoration:none;box-shadow:0 3px 12px #0008;';
    }
    host.append(back);
  },{once:true});
})(typeof window!=='undefined'?window:globalThis);
