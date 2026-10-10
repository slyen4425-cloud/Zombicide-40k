"use strict";

(function installGensCaptureV1(root){
  const VERSION="1.2.0";
  let sessionStartOwner=null;
  let installed=false;

  function isProfile(profile){
    const gameplay=profile?.rpgUniverse?.gameplay;
    if(!gameplay||typeof gameplay!=="object")return false;
    if(gameplay.profile==="creature")return true;
    const modules=gameplay.modules;
    return !!(modules&&modules.capture===true&&modules.controllableCreatures===true);
  }

  async function startModuleSession(){
    const shell=root.GensShellModuleLaunchV1;
    if(!shell||typeof shell.activeModule!=="function")return false;
    if(shell.activeModule()!=="capture")return false;
    if(!sessionStartOwner||typeof sessionStartOwner.start!=="function")return false;
    await sessionStartOwner.start();
    return true;
  }

  function install(owner){
    if(!owner||typeof owner.start!=="function")throw new TypeError("GensCaptureV1.install requires the Capture session-start owner");
    if(installed){
      if(sessionStartOwner!==owner)throw new Error("GensCaptureV1 session-start owner already bound");
      return true;
    }
    const shell=root.GensShellModuleLaunchV1;
    if(!shell||typeof shell.register!=="function")throw new Error("GensCaptureV1 requires GensShellModuleLaunchV1");
    sessionStartOwner=owner;
    shell.register("capture",startModuleSession);
    installed=true;
    return true;
  }

  // Session stop is distinct from destroying a persistent save. The Shell owns
  // root navigation; Capture owns the world state and UI teardown.
  function stop(){
    if(!installed||!sessionStartOwner||typeof sessionStartOwner.stop!=="function")return false;
    if(root.GensShellModuleLaunchV1?.activeModule?.()!=="capture")return false;
    const hub=root.GensCaptureHubEntryV1;
    if(!hub||typeof hub.leaveWorld!=="function"||hub.status?.().inWorld!==true)return false;
    if(root.gensCurrentCaptureBattle && root.gensCurrentCaptureBattle.phase!=="ended")return false;
    if(typeof root.backHomeFromGame!=="function"||typeof root.showGensRootHome!=="function")return false;
    if(sessionStartOwner.stop()!==true)return false;
    if(hub.leaveWorld()!==true)return false;
    root.backHomeFromGame();
    root.showGensRootHome();
    return true;
  }

  function dispose(){
    if(!installed)return true;
    if(root.GensCaptureHubEntryV1?.status?.().inWorld && !stop())return false;
    root.GensCaptureHubEntryV1?.dispose?.();
    root.GensCaptureScreenReturnV1?.dispose?.();
    sessionStartOwner?.dispose?.();
    sessionStartOwner=null;
    installed=false;
    return true;
  }

  function status(){
    return Object.freeze({
      installed,
      sessionStartBound:!!(sessionStartOwner&&typeof sessionStartOwner.start==="function"),
      inWorld:root.GensCaptureHubEntryV1?.status?.().inWorld===true
    });
  }

  root.GensCaptureV1=Object.freeze({VERSION,isProfile,install,startModuleSession,stop,dispose,status});
})(typeof window!=="undefined"?window:globalThis);
