"use strict";
/* Capture-side integration slot. No laboratory imports or automatic activation. */
(function(root){
  const API_VERSION=1;
  const REQUIRED=["createSession","start","stop","dispose"];
  let provider=null;
  let activeSession=null;
  function validate(candidate){
    if(!candidate||typeof candidate!=="object")throw new TypeError("Provider object required");
    if(candidate.protocol!==API_VERSION)throw new TypeError("Unsupported battle bridge protocol");
    if(typeof candidate.version!=="string"||!candidate.version)throw new TypeError("Provider version required");
    if(!Array.isArray(candidate.capabilities)||candidate.capabilities.some(x=>typeof x!=="string"))throw new TypeError("Capabilities must be string array");
    for(const name of REQUIRED)if(typeof candidate[name]!=="function")throw new TypeError("Provider missing "+name);
    return candidate;
  }
  function register(candidate){
    validate(candidate);
    if(provider&&provider!==candidate)throw new Error("Battle provider already registered");
    provider=candidate;
    return true;
  }
  function compatible(required){
    if(!provider)return false;
    if(!Array.isArray(required)||required.some(x=>typeof x!=="string"))throw new TypeError("Required capabilities must be string array");
    return required.every(x=>provider.capabilities.includes(x));
  }
  function begin(snapshot,required=[]){
    if(activeSession)throw new Error("Battle session already active");
    if(!compatible(required))return null;
    const contract=root.GensCaptureBattleBridgeContractV1;
    if(!contract||typeof contract.snapshot!=="function")throw new Error("Capture battle contract unavailable");
    const safe=contract.snapshot(snapshot);
    const session=provider.createSession(safe);
    if(!session||typeof session!=="object")throw new TypeError("Invalid provider session");
    activeSession={session,provider};
    try{provider.start(session)}catch(error){activeSession=null;try{provider.dispose(session)}catch(_){}throw error;}
    return session;
  }
  function end(){
    if(!activeSession)return false;
    const current=activeSession;
    activeSession=null;
    try{current.provider.stop(current.session)}finally{current.provider.dispose(current.session);}
    return true;
  }
  function unregister(candidate){
    if(!provider)return false;
    if(candidate!==provider)throw new Error("Provider ownership mismatch");
    if(activeSession)throw new Error("Cannot unregister during active battle");
    provider=null;
    return true;
  }
  function status(){return Object.freeze({protocol:API_VERSION,registered:!!provider,version:provider?.version||null,capabilities:provider?[...provider.capabilities]:[],active:!!activeSession});}
  root.GensCaptureBattleProviderSlotV1=Object.freeze({register,compatible,begin,end,unregister,status});
})(typeof window!=="undefined"?window:globalThis);
