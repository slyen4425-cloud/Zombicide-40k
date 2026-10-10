"use strict";

(function installGensCaptureHubEntryV1(root){
  const VERSION="1.0.0";
  const REQUIRED=["closeTurnPopup","renderMenuStatuses","renderCaptureWorldHub"];
  let bindings=null;
  let installed=false;
  const pending=new Set();
  const EXIT_ID="gensCaptureExitButtonV1";
  const MODALS=[
    "captureExploreModal","captureCreatureDetailModal","captureBattleLiveModal",
    "captureMjBattleRuleModal","captureTrainerModal","captureEncounterModal",
    "captureHealModal","captureShopModal","captureMjModal","captureBattleSetupModal",
    "creatureCaptureModal"
  ];
  function addExitControl(){
    const hub=root.document.getElementById("captureGameHub");
    if(!hub||typeof root.document.createElement!=="function"||typeof hub.appendChild!=="function")return false;
    if(root.document.getElementById(EXIT_ID))return true;
    const wrap=typeof hub.querySelector==="function"?(hub.querySelector(".captureWorldQuick")||hub):hub;
    const button=root.document.createElement("button");
    button.id=EXIT_ID;
    button.type="button";
    button.textContent="💾 SAUVEGARDER ET QUITTER";
    button.style.cssText="width:100%;margin-top:8px;background:#2b5241;border:1px solid #77a68c";
    button.onclick=()=>{root.GensCaptureV1?.stop?.()};
    wrap.appendChild(button);
    return true;
  }
  function cancelPendingScrolls(){
    for(const raf of pending){try{root.cancelAnimationFrame?.(raf)}catch(e){}}
    pending.clear();
  }
  function inWorld(){
    const d=root.document,hub=d.getElementById("captureGameHub"),menu=d.getElementById("menu");
    if(!installed||!hub||!menu||typeof root.getComputedStyle!=="function")return false;
    return root.getComputedStyle(hub).display!=="none" &&
      root.getComputedStyle(menu).display!=="none";
  }

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
    addExitControl();
    return true;
  }

  function enterWorld(){
    if(!installed||!bindings)return false;
    addExitControl();
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

  // Keep the single persistent Shell registration, release only session UI
  // and pending effects. No unrelated module navigation or global listeners.
  function leaveWorld(){
    if(!installed)return false;
    cancelPendingScrolls();
    try{bindings?.closeTurnPopup?.()}catch(e){}
    // The historical Capture skin forces display:block!important on the Hub.
    // Release that owner-local skin before applying the terminal hide.
    root.document.body?.classList?.remove?.("gens-pure-capture");
    const hub=root.document.getElementById("captureGameHub");
    if(hub)hub.style.setProperty("display","none","important");
    for(const id of MODALS){
      const modal=root.document.getElementById(id);
      if(modal){modal.classList.remove("open");modal.style.display="none"}
    }
    root.document.body?.style?.removeProperty?.("overflow");
    root.document.documentElement?.style?.removeProperty?.("overflow");
    return true;
  }

  function dispose(){
    if(inWorld())leaveWorld();
    const button=root.document.getElementById(EXIT_ID);
    if(button){button.onclick=null;button.remove()}
    installed=false;
    bindings=null;
    cancelPendingScrolls();
    return true;
  }

  function status(){return Object.freeze({installed,inWorld:inWorld(),pendingScrolls:pending.size})}

  root.GensCaptureHubEntryV1=Object.freeze({VERSION,install,enterWorld,leaveWorld,dispose,status});
})(typeof window!=="undefined"?window:globalThis);
