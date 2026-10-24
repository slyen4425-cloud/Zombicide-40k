"use strict";

/* Phase 10 S2: explicit Shell composition, no gameplay and no auto-install. */
(function publishGensPvpShellCompositionV1(root){
  let everComposed=false;

  function owners(){
    const shell=root.GensShellModuleLaunchV1;
    const session=root.GensPvpSessionV1;
    const provider=root.GensPvpModuleLaunchV1;
    if(!shell||typeof shell.register!=="function"||typeof shell.activeModule!=="function"){
      throw new TypeError("PvP composition requires the existing Shell launch contract");
    }
    if(!session||typeof session.install!=="function"||typeof session.status!=="function"){
      throw new TypeError("PvP composition requires the PvP session owner");
    }
    if(!provider||typeof provider.install!=="function"||typeof provider.status!=="function"){
      throw new TypeError("PvP composition requires the PvP module launch provider");
    }
    return {shell,session,provider};
  }

  function connect(){
    if(everComposed)return owners().provider.status().installed===true;
    const {shell,session,provider}=owners();
    if(provider.status().registered)throw new Error("PvP launch is already registered");
    if(provider.install({shell,session})!==true)return false;
    everComposed=true;
    return true;
  }

  function status(){
    const provider=root.GensPvpModuleLaunchV1;
    return Object.freeze({
      everComposed,
      connected:everComposed&&provider?.status().installed===true,
      registered:provider?.status().registered===true
    });
  }

  root.GensPvpShellCompositionV1=Object.freeze({connect,status});
})(typeof window!=="undefined"?window:globalThis);
