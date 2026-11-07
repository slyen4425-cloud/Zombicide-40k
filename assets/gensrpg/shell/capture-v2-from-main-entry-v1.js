'use strict';
// Presentation-only arrival from the GenSRPG main Shell. The immutable V2
// already owns the Capture mode, game, editors, Lab routing and return controls.
(function(root){
  if(new URLSearchParams(root.location.search).get('entry')!=='gensrpg-main')return;
  root.document.addEventListener('DOMContentLoaded',()=>{
    const doc=root.document;
    const mode=doc.querySelector('button.gensRootModeCard.capture');
    if(!mode)throw new Error('Published Capture V2 mode is missing');
    mode.click();
    const header=doc.getElementById('gensCaptureV2Root')?.querySelector('header');
    if(!header)throw new Error('Official Capture V2 module did not mount');
    const back=doc.createElement('a');
    back.href=new URL('../../',root.location.href).href;
    back.className='gensCaptureReturnToMain';
    back.textContent='← Retour à GenSRPG';
    header.append(back);
  },{once:true});
})(typeof window!=='undefined'?window:globalThis);
