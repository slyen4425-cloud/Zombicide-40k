"use strict";

(function installGensCaptureV1(root){
  const VERSION="1.1.0";
  let legacyStartConfiguredGame=null;
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
    if(typeof legacyStartConfiguredGame!=="function")return false;
    await legacyStartConfiguredGame();
    return true;
  }

  function install(legacyStart){
    if(typeof legacyStart!=="function")throw new TypeError("GensCaptureV1.install requires the Capture139 legacy start function");
    if(installed){
      if(legacyStartConfiguredGame!==legacyStart)throw new Error("GensCaptureV1 legacy start owner already bound");
      return true;
    }
    const shell=root.GensShellModuleLaunchV1;
    if(!shell||typeof shell.register!=="function")throw new Error("GensCaptureV1 requires GensShellModuleLaunchV1");
    legacyStartConfiguredGame=legacyStart;
    shell.register("capture",startModuleSession);
    installed=true;
    return true;
  }

  function status(){
    return Object.freeze({installed,legacyBound:typeof legacyStartConfiguredGame==="function"});
  }

  root.GensCaptureV1=Object.freeze({VERSION,isProfile,install,startModuleSession,status});
})(typeof window!=="undefined"?window:globalThis);
