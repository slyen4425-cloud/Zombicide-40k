"use strict";
/* Temporary exploration-free trigger: orchestration only; no mock combat or persistence. */
(function(root){
  function create(port,contract){
    if(!port||!contract)throw new TypeError("Battle port and contract required");
    let active=null;
    function launch(encounterId,input){
      if(active)throw new Error("Test encounter already active");
      if(typeof encounterId!=="string"||!encounterId.trim())throw new TypeError("Encounter ID required");
      const snapshot=contract.snapshot(input);
      if(!port.compatible(["battle-trigger"]))return Object.freeze({ready:false,reason:"combat-provider-unavailable"});
      const session=port.startEncounter({encounterId,snapshot,mode:"manual-test",persist:false});
      if(!session)return Object.freeze({ready:false,reason:"combat-session-unavailable"});
      active={encounterId,snapshot,session};
      return Object.freeze({ready:true,session});
    }
    function finish(rawResult){
      if(!active)throw new Error("No active test encounter");
      const validated=contract.result(rawResult,active.snapshot);
      try{port.stopEncounter()}finally{active=null;}
      return Object.freeze({mode:"manual-test",persist:false,result:validated});
    }
    function cancel(){
      if(!active)return false;
      try{port.stopEncounter()}finally{active=null;}
      return true;
    }
    function status(){return Object.freeze({active:!!active,mode:"manual-test",persist:false});}
    return Object.freeze({launch,finish,cancel,status});
  }
  root.GensCaptureManualBattleTriggerV1=Object.freeze({create});
})(typeof window!=="undefined"?window:globalThis);
