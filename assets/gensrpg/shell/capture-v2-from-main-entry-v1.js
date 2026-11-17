'use strict';
// Only staged into the official isolated Capture preview by the existing
// GenSRPG Pages publisher. No game, engine, save or SW mutation.
(function(root){
  const params=new URLSearchParams(root.location.search);
  const fromMain=params.get('entry')==='gensrpg-main';
  // Only the Root Shell's real Capture click sets this marker. A shortcut
  // with a stale entry flag must return to the four-module home.
  const explicitCapture=params.get('launch')==='capture';
  // Android may have installed the older, separately scoped Capture preview
  // under the same GenSRPG-looking icon. Open the SINGLE official app root
  // on standalone launch instead of requiring the user to tap a footer link.
  // Explicit Capture visits remain untouched, including from the main app.
  const standalone=(root.matchMedia?.('(display-mode: standalone)')?.matches===true)
    ||root.navigator?.standalone===true;
  const mainHref=new URL('../../',root.location.href).href;
  const selectedFromMain=fromMain&&(!standalone||explicitCapture);
  // Reuse the same semantic Shell navigation link as the existing footer.
  // The architecture guard forbids any module from replacing global location.
  // A synthetic activation of this existing link contract is the only early
  // handoff for a legacy preview shortcut; voluntary Capture selection stays.
  if(standalone&&!explicitCapture){
    const homeLink=root.document.createElement('a');
    homeLink.href=mainHref;
    homeLink.click();
    // If a host blocks automatic cross-scope navigation, the existing
    // footer link below stays available; no storage or worker is touched.
  }
  root.document.addEventListener('DOMContentLoaded',()=>{
    const doc=root.document;
    if(selectedFromMain){
      const mode=doc.querySelector('button.gensRootModeCard.capture');
      if(!mode)throw new Error('Published Capture V2 mode is missing');
      mode.click();
    }
    const header=selectedFromMain?doc.getElementById('gensCaptureV2Root')?.querySelector('header'):null;
    if(selectedFromMain&&!header)throw new Error('Official Capture V2 module did not mount');
    const host=header||doc.body;
    if(!host)throw new Error('Capture preview navigation host missing');
    const back=doc.createElement('a');
    back.href=mainHref;
    back.className='gensCaptureReturnToMain';
    back.textContent=selectedFromMain?'← Retour à GenSRPG':'← GenSRPG : accueil / Dungeon';
    if(!selectedFromMain){
      back.className+=' gensCaptureStandaloneBack';
      if(back.style)back.style.cssText='position:fixed;bottom:calc(10px + env(safe-area-inset-bottom));left:12px;z-index:2147483000;display:inline-flex;align-items:center;max-width:calc(100vw - 24px);border-radius:20px;border:1px solid #90a7b5;background:#112333;color:#fff;padding:9px 13px;font:600 13px/1.2 system-ui,sans-serif;text-decoration:none;box-shadow:0 3px 12px #0008;';
    }
    host.append(back);
  },{once:true});
})(typeof window!=='undefined'?window:globalThis);
