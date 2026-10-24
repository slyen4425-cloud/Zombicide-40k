"use strict";

/* Phase 10 S0: explicit PvP-only session lifecycle; not composed in production. */
(function publishGensPvpSessionV1(root){
  const VERSION="1.0.0";
  let bindings=null,phase="idle",session=null;

  function copyData(value,seen=new WeakSet()){
    if(value===null||typeof value==="string"||typeof value==="boolean")return value;
    if(typeof value==="number"&&Number.isFinite(value))return value;
    if(!value||typeof value!=="object")throw new TypeError("PvP setup must contain JSON-compatible data");
    if(seen.has(value))throw new TypeError("PvP setup must not be cyclic");
    const tag=Object.prototype.toString.call(value);
    if(tag!=="[object Array]"&&tag!=="[object Object]")throw new TypeError("PvP setup must use plain objects and arrays");
    seen.add(value);
    const output=Array.isArray(value)?[]:{};
    for(const [key,item] of Object.entries(value)){
      if(key==="__proto__"||key==="constructor"||key==="prototype")throw new TypeError("unsafe PvP data key");
      output[key]=copyData(item,seen);
    }
    seen.delete(value);
    return output;
  }

  function deepFreeze(value){
    if(value&&typeof value==="object"){
      Object.values(value).forEach(deepFreeze);
      Object.freeze(value);
    }
    return value;
  }

  function id(value,label){
    if(typeof value!=="string"||!value.trim())throw new TypeError(label+" must be a nonempty string");
    return value;
  }

  function makeSession(input){
    if(!input||typeof input!=="object")throw new TypeError("PvP setup is required");
    const sessionId=id(input.id,"session id");
    if(!Array.isArray(input.sides)||input.sides.length<2)throw new RangeError("PvP requires at least two opposing sides");
    if(!input.rules||Object.prototype.toString.call(input.rules)!=="[object Object]")throw new TypeError("PvP rules must be an explicit object");
    const sideIds=new Set(),participantIds=new Set();
    const sides=input.sides.map((side,i)=>{
      const sideId=id(side?.id,"side "+i);
      if(sideIds.has(sideId))throw new RangeError("duplicate PvP side id");
      sideIds.add(sideId);
      if(!Array.isArray(side?.participants)||!side.participants.length)throw new RangeError("PvP side needs participants");
      const participants=side.participants.map(value=>{
        const participantId=id(value,"participant id");
        if(participantIds.has(participantId))throw new RangeError("participant assigned to multiple PvP sides");
        participantIds.add(participantId);
        return participantId;
      });
      return {id:sideId,participants};
    });
    return deepFreeze({id:sessionId,sides,rules:copyData(input.rules)});
  }

  function install(next){
    if(!next||typeof next.activeModule!=="function")throw new TypeError("PvP requires an injected activeModule binding");
    if(next.onStart!==undefined&&typeof next.onStart!=="function")throw new TypeError("onStart must be a function");
    if(next.onStop!==undefined&&typeof next.onStop!=="function")throw new TypeError("onStop must be a function");
    if(bindings&&bindings!==next)throw new Error("PvP session owner already installed");
    bindings=next;
    return true;
  }

  function prepare(input){
    if(!bindings||phase==="active")return false;
    const next=makeSession(input);
    session=next;phase="prepared";
    return true;
  }

  function start(){
    if(!bindings||phase!=="prepared"||!session||bindings.activeModule()!=="pvp")return false;
    phase="active";
    try{
      if(bindings.onStart?.(session)===false){phase="prepared";return false}
    }catch(e){phase="prepared";throw e}
    return true;
  }

  function stop(){
    if(!bindings||phase==="idle")return false;
    if(phase==="active"&&bindings.onStop?.(session)===false)return false;
    phase="idle";session=null;
    return true;
  }

  function dispose(){
    if(phase!=="idle"&&stop()!==true)return false;
    bindings=null;session=null;phase="idle";
    return true;
  }

  function status(){
    return Object.freeze({installed:!!bindings,phase,sessionId:session?.id||null,sideCount:session?.sides.length||0});
  }

  root.GensPvpSessionV1=Object.freeze({VERSION,install,prepare,start,stop,dispose,status,snapshot:()=>session});
})(typeof window!=="undefined"?window:globalThis);
