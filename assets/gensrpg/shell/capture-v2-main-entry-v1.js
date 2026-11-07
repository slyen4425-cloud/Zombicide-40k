'use strict';
// Single MAIN application entry to the already-published official Capture V2.
// Shell navigation only: never owns creatures, Combat, Exploration or saves.
(function(root){
  if(root.GensCaptureMainEntryV1)throw new Error('Duplicate root Capture navigation authority');
  const relative='preview/capture-v2-pr225/index.html?entry=gensrpg-main';
  function destination(){
    const appRoot=new URL('./',root.document.baseURI);
    const target=new URL(relative,appRoot);
    if(target.origin!==root.location.origin||
       !target.pathname.startsWith(appRoot.pathname+'preview/capture-v2-pr225/'))
      throw new Error('Official Capture V2 destination escaped the main application scope');
    return target.href;
  }
  function open(){
    root.location.assign(destination());
    return true;
  }
  root.GensCaptureMainEntryV1=Object.freeze({open,destination});
})(typeof window!=='undefined'?window:globalThis);
