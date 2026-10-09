"use strict";

(function installGensCaptureHubEntryV1(root){
  const VERSION="1.0.0";
  const REQUIRED=["closeTurnPopup","renderMenuStatuses","renderCaptureWorldHub"];
  let bindings=null;
  let installed=false;
  const pending=new Set();

  function install(next){
    if(!next||typeof next!=="object")throw new TypeError("GensCaptureHubEntryV1.install requires bindings");
    for(const key of REQUIRED){
      if(typeof next[key]!=="function")throw new TypeError("GensCaptureHubEntryV1 missing binding: "+key);
    }
    if(installed){
      if(bindings!==next)throw new Error("GensCaptureHubEntryV1 already installed");
      return true;
    }
    bindings=next;
    installed=true;
    return true;
  }

  function enterWorld(){
    if(!installed||!bindings)return false;
    try{bindings.closeTurnPopup()}catch(e){}
    ["pregameSetup","sessionHeroSetup","sessionObjectSetup","sessionWaveSetup","sessionDungeonSetup","sheet","setup"].forEach(id=>{
      const e=root.document.getElementById(id);if(e)e.style.setProperty("display","none","important");
    });
    const menu=root.document.getElementById("menu");
    if(menu)menu.style.setProperty("display","block","important");
    try{bindings.renderMenuStatuses()}catch(e){}
    try{bindings.renderCaptureWorldHub()}catch(e){}
    const hub=root.document.getElementById("captureGameHub");
    if(hub){
      hub.style.setProperty("display","block","important");
      const raf=root.requestAnimationFrame(()=>{
        pending.delete(raf);
        if(installed)hub.scrollIntoView({block:"start",behavior:"auto"});
      });
      pending.add(raf);
    }
  }

  function dispose(){
    installed=false;
    bindings=null;
    for(const raf of pending){try{root.cancelAnimationFrame?.(raf)}catch(e){}}
    pending.clear();
    return true;
  }

  function status(){return Object.freeze({installed,pendingScrolls:pending.size})}

  root.GensCaptureHubEntryV1=Object.freeze({VERSION,install,enterWorld,dispose,status});
})(typeof window!=="undefined"?window:globalThis);
