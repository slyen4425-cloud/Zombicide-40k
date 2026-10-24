"use strict";

/* Phase 10 S1: opt-in PvP Shell module-launch provider, NOT loaded in production. */
(function publishGensPvpModuleLaunchV1(root){
  const VERSION="1.0.0";
  let bindings=null,everRegistered=false;

  function activePvp(){
    return !!bindings&&bindings.shell.activeModule()==="pvp";
  }

  function startModuleSession(){
    if(!activePvp()||bindings.session.status().phase!=="prepared")return false;
    return bindings.session.start()===true;
  }

  function install(next){
    const shell=next?.shell,session=next?.session;
    if(!shell||typeof shell.register!=="function"||typeof shell.activeModule!=="function"){
      throw new TypeError("PvP module launch requires an injected Shell register/activeModule interface");
    }
    if(!session||typeof session.install!=="function"||typeof session.prepare!=="function"||
       typeof session.start!=="function"||typeof session.stop!=="function"||
       typeof session.dispose!=="function"||typeof session.status!=="function"){
      throw new TypeError("PvP module launch requires the PvP session owner");
    }
    if(next.onStart!==undefined&&typeof next.onStart!=="function")throw new TypeError("onStart must be a function");
    if(next.onStop!==undefined&&typeof next.onStop!=="function")throw new TypeError("onStop must be a function");
    if(bindings){
      if(next===bindings)return true;
      throw new Error("PvP module launch is already installed");
    }
    // No confirmed unregister in Shell contract: old callback becomes inert after
    // dispose and the page may not register another PvP provider.
    if(everRegistered)throw new Error("PvP Shell registration is terminal for this page");
    session.install({
      activeModule:()=>shell.activeModule(),
      onStart:data=>next.onStart?.(data),
      onStop:data=>next.onStop?.(data)
    });
    try{
      if(shell.register("pvp",startModuleSession)===false){
        throw new Error("Shell refused PvP module registration");
      }
    }catch(error){
      session.dispose();
      throw error;
    }
    bindings=next;
    everRegistered=true;
    return true;
  }

  function prepare(input){
    return activePvp()&&bindings.session.prepare(input)===true;
  }

  function stop(){
    return !!bindings&&bindings.session.stop()===true;
  }

  function dispose(){
    if(!bindings)return true;
    if(bindings.session.dispose()!==true)return false;
    bindings=null;
    return true;
  }

  function status(){
    return Object.freeze({
      installed:!!bindings,
      registered:everRegistered,
      activeModule:activePvp()?"pvp":null,
      sessionPhase:bindings?.session.status().phase||"unavailable"
    });
  }

  root.GensPvpModuleLaunchV1=Object.freeze({
    VERSION,install,prepare,startModuleSession,stop,dispose,status
  });
})(typeof window!=="undefined"?window:globalThis);
