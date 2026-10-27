"use strict";
/* Temporary encounter source. Emits the same encounter request shape as future Exploration.
 * Does not own creatures, battle rules, game saves, or combat runtime. */
(function(root){
  function create({trigger,resolveEncounter,onReturn}){
    if(!trigger||typeof trigger.launch!=="function"||typeof trigger.finish!=="function"||typeof trigger.cancel!=="function")throw new TypeError("Capture trigger required");
    if(typeof resolveEncounter!=="function")throw new TypeError("Capture encounter resolver required");
    if(typeof onReturn!=="function")throw new TypeError("Return callback required");
    let pending=null;
    function encounter(key){
      if(pending)throw new Error("Encounter already pending");
      if(typeof key!=="string"||!key.trim())throw new TypeError("Encounter key required");
      const resolved=resolveEncounter(key);
      if(!resolved||typeof resolved.encounterId!=="string"||!resolved.encounterId||!resolved.snapshot)throw new TypeError("Invalid Capture encounter");
      const launched=trigger.launch(resolved.encounterId,resolved.snapshot);
      if(!launched.ready)return launched;
      pending={key,encounterId:resolved.encounterId};
      return Object.freeze({ready:true,session:launched.session});
    }
    function complete(rawResult){
      if(!pending)throw new Error("No pending encounter");
      const completed=trigger.finish(rawResult);
      const previous=pending;pending=null;
      onReturn(Object.freeze({encounterId:previous.encounterId,mode:"temporary-zone",persist:false,result:completed.result}));
      return completed;
    }
    function leave(){
      if(!pending)return false;
      const previous=pending;
      try{trigger.cancel()}finally{pending=null;}
      onReturn(Object.freeze({encounterId:previous.encounterId,mode:"temporary-zone",persist:false,cancelled:true}));
      return true;
    }
    function status(){return Object.freeze({pending:!!pending});}
    return Object.freeze({encounter,complete,leave,status});
  }
  root.GensCaptureTemporaryEncounterSourceV1=Object.freeze({create});
})(typeof window!=="undefined"?window:globalThis);
