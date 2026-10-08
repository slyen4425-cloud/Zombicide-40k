"use strict";

(function installGensCaptureScreenReturnV1(root){
  const VERSION="1.0.0";
  const REQUIRED=["hasActiveSession","isCaptureContext","enterWorld"];
  let bindings=null;
  let installed=false;

  function validate(next){
    if(!next||typeof next!=="object")throw new TypeError("GensCaptureScreenReturnV1.install requires bindings");
    for(const name of REQUIRED){
      if(typeof next[name]!=="function")throw new TypeError("GensCaptureScreenReturnV1 missing binding: "+name);
    }
  }

  function returnToPrimaryView(){
    if(!installed||!bindings)return false;
    if(!bindings.hasActiveSession()||!bindings.isCaptureContext())return false;
    bindings.enterWorld();
    return true;
  }

  function install(next){
    validate(next);
    if(installed){
      if(bindings!==next)throw new Error("GensCaptureScreenReturnV1 already installed");
      return true;
    }
    const shell=root.GensShellScreenReturnV1;
    if(!shell||typeof shell.register!=="function")throw new Error("GensCaptureScreenReturnV1 requires GensShellScreenReturnV1");
    bindings=next;
    if(shell.register("capture",returnToPrimaryView)!==true){
      bindings=null;
      throw new Error("GensCaptureScreenReturnV1 registration refused");
    }
    installed=true;
    return true;
  }

  function dispose(){
    installed=false;
    bindings=null;
    return true;
  }

  function status(){
    return Object.freeze({installed});
  }

  root.GensCaptureScreenReturnV1=Object.freeze({VERSION,install,returnToPrimaryView,dispose,status});
})(typeof window!=="undefined"?window:globalThis);
