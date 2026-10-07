"use strict";

(function installGensCaptureSessionStartV1(root){
  const VERSION="1.0.0";
  const REQUIRED=[
    "normalizeParticipants","participantsReady","activateParticipant","saveParticipants",
    "applyCustomHeroes","applyPregameGold","markSessionActive","loadWorld","saveWorld",
    "ensureStarterKits","readTurnOrderEnabled","loadCustomization","saveCustomization",
    "startTurnManager","clearTurnManager","enterWorld","notify","openParticipantSetup"
  ];
  let bindings=null;
  let installed=false;

  function validate(next){
    if(!next||typeof next!=="object")throw new TypeError("GensCaptureSessionStartV1.install requires bindings");
    for(const name of REQUIRED){
      if(typeof next[name]!=="function")throw new TypeError("GensCaptureSessionStartV1 missing binding: "+name);
    }
  }

  function safe(name,...args){
    try{return bindings[name](...args)}catch(e){
      try{root.console?.warn?.("GensCaptureSessionStartV1 "+name,e)}catch(_){}
      return undefined;
    }
  }

  function install(next){
    validate(next);
    if(installed){
      if(bindings!==next)throw new Error("GensCaptureSessionStartV1 already installed");
      return true;
    }
    bindings=next;
    installed=true;
    return true;
  }

  async function start(){
    if(!installed||!bindings)return false;

    const participants=bindings.normalizeParticipants();
    if(!Array.isArray(participants)||!participants.length){
      bindings.notify("Sélectionne au moins un dresseur avant de démarrer.");
      bindings.openParticipantSetup();
      return false;
    }
    if(!bindings.participantsReady()){
      bindings.notify("Choisis les créatures de départ avant de démarrer.");
      bindings.openParticipantSetup();
      return false;
    }

    bindings.activateParticipant(String(participants[0]));
    bindings.saveParticipants([...participants]);

    safe("applyCustomHeroes");
    safe("applyPregameGold",participants);
    safe("markSessionActive");

    try{
      const ws=bindings.loadWorld()||{};
      ws.day=1;
      ws.turnIndex=0;
      ws.round=1;
      ws.last=null;
      if(!ws.locationId)ws.locationId="cap_forest";
      if(!ws.locationName)ws.locationName="Forêt sauvage";
      bindings.saveWorld(ws);
    }catch(e){
      try{root.console?.warn?.("GensCaptureSessionStartV1 world",e)}catch(_){}
    }

    safe("ensureStarterKits");

    const cfg=bindings.loadCustomization()||{};
    cfg.turnOrder=!!bindings.readTurnOrderEnabled();
    bindings.saveCustomization(cfg);
    if(cfg.turnOrder)safe("startTurnManager");
    else safe("clearTurnManager");

    bindings.enterWorld();
    return true;
  }

  function dispose(){
    bindings=null;
    installed=false;
    return true;
  }

  function status(){
    return Object.freeze({installed});
  }

  root.GensCaptureSessionStartV1=Object.freeze({VERSION,install,start,dispose,status});
})(typeof window!=="undefined"?window:globalThis);
