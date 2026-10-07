from pathlib import Path
import json

OLD_INDEX_BLOB="20381d1df0b10b664d5163f308f909cd7a6e45df"
NEW_INDEX_BLOB="560966d096134cd58ff4dc6ab2be589cee936ba7"

index=Path("index.html")
text=index.read_text(encoding="utf-8")

load_old='<script src="assets/gensrpg/capture/entry-v1.js?v=1"></script>'
load_new=load_old+'\n<script src="assets/gensrpg/capture/session-start-v1.js?v=1"></script>'
assert text.count(load_old)==1, "unexpected Capture entry load seam"
text=text.replace(load_old,load_new,1)

old="""/* Neutralise l'ouverture automatique d'une fiche durant la fenêtre critique de lancement. */
window._captureStarting139=false;

/* Remplace le lancement Capture par un chemin dédié, sans passer par les initialisations Dungeon. */
const start139=window.startConfiguredGame;
window.startConfiguredGame=async function(){
  if(!isCaptureContext138())return await start139.apply(this,arguments);

  const participants=normalizeGameParticipants();
  if(!participants.length){
    alert("Sélectionne au moins un dresseur avant de démarrer.");
    openSessionHeroSetup();return;
  }
  if(typeof gensCaptureParticipantsReady==="function"&&!gensCaptureParticipantsReady()){
    alert("Choisis les créatures de départ avant de démarrer.");
    openSessionHeroSetup();return;
  }

  window._captureStarting139=true;
  try{
    /* participant actif fixé AVANT activation de la session */
    current=String(participants[0]);
    try{state=loadState(current)}catch(e){}
    saveGameParticipants([...participants]);

    try{applyCustomHeroesMulti()}catch(e){}
    try{applyPregameGoldToParticipants(participants)}catch(e){}
    try{markSessionActive(true)}catch(e){}

    /* nouveau monde Capture */
    try{
      const ws=captureWorldState();
      ws.day=1;ws.turnIndex=0;ws.round=1;ws.last=null;
      if(!ws.locationId)ws.locationId="cap_forest";
      if(!ws.locationName)ws.locationName="Forêt sauvage";
      saveCaptureWorldState(ws);
    }catch(e){}

    try{captureEnsureStarterKitsForParticipants()}catch(e){}

    /* Tours : ne démarrent que si explicitement cochés */
    const toggle=document.getElementById("participantTurnOrderToggle");
    const cfg=loadGameCustomization();
    cfg.turnOrder=!!toggle?.checked;
    saveGameCustomization(cfg);
    if(cfg.turnOrder){
      try{startTurnManagerForGame()}catch(e){}
    }else{
      try{saveTurnState(null);closeTurnPopup(false);renderTurnUi()}catch(e){}
    }

    captureEnterWorld139();
  }finally{
    /* garde le verrou un instant pour bloquer les vieux setTimeout openChar */
    setTimeout(()=>{
      window._captureStarting139=false;
      captureEnterWorld139();
    },1200);
  }
};
const gensCaptureStartConfiguredGame139V1=window.startConfiguredGame;
window.GensCaptureV1.install(gensCaptureStartConfiguredGame139V1);"""

new="""/* Le propriétaire Capture initialise la session ; Capture139 ne conserve que le câblage legacy explicite. */
window.GensCaptureSessionStartV1.install({
  normalizeParticipants:()=>normalizeGameParticipants(),
  participantsReady:()=>typeof gensCaptureParticipantsReady!=="function"||gensCaptureParticipantsReady(),
  activateParticipant:id=>{
    current=String(id);
    try{state=loadState(current)}catch(e){}
  },
  saveParticipants:participants=>saveGameParticipants([...participants]),
  applyCustomHeroes:()=>applyCustomHeroesMulti(),
  applyPregameGold:participants=>applyPregameGoldToParticipants(participants),
  markSessionActive:()=>markSessionActive(true),
  loadWorld:()=>captureWorldState(),
  saveWorld:ws=>saveCaptureWorldState(ws),
  ensureStarterKits:()=>captureEnsureStarterKitsForParticipants(),
  readTurnOrderEnabled:()=>!!document.getElementById("participantTurnOrderToggle")?.checked,
  loadCustomization:()=>loadGameCustomization(),
  saveCustomization:cfg=>saveGameCustomization(cfg),
  startTurnManager:()=>startTurnManagerForGame(),
  clearTurnManager:()=>{saveTurnState(null);closeTurnPopup(false);renderTurnUi()},
  enterWorld:()=>captureEnterWorld139(),
  notify:message=>alert(message),
  openParticipantSetup:()=>openSessionHeroSetup()
});
window.GensCaptureV1.install(window.GensCaptureSessionStartV1);"""

assert text.count(old)==1, "unexpected Capture139 session-start seam"
text=text.replace(old,new,1)
index.write_text(text,encoding="utf-8",newline="")

Path("assets/gensrpg/capture/session-start-v1.js").write_text("""\
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
""",encoding="utf-8",newline="")

Path("assets/gensrpg/capture/entry-v1.js").write_text("""\
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

  function status(){
    return Object.freeze({installed,sessionStartBound:!!(sessionStartOwner&&typeof sessionStartOwner.start==="function")});
  }

  root.GensCaptureV1=Object.freeze({VERSION,isProfile,install,startModuleSession,status});
})(typeof window!=="undefined"?window:globalThis);
""",encoding="utf-8",newline="")

contract={
  "version":1,
  "phase":3,
  "module":"capture",
  "status":"partial-runtime-loaded",
  "plannedEntry":"assets/gensrpg/capture/entry-v1.js",
  "owns":[
    "Monster Capture public runtime entry",
    "Capture module-launch provider",
    "Capture profile identity classification",
    "Capture session initialization"
  ],
  "consumes":[
    "core public contracts",
    "Shell module-launch public contract",
    "Capture session-start owner public API"
  ],
  "forbidden":[
    "Dungeon private runtime",
    "Survival private runtime",
    "PvP private runtime",
    "Tactical private runtime",
    "Capture gameplay ownership inside the public entry"
  ],
  "lifecycle":{
    "install":"explicit Capture session-start owner binding; registers the Capture public provider exactly once",
    "dispose":"session-start owner exposes explicit dispose; public entry creates no listener observer timer or storage state"
  },
  "invariants":[
    "the active entry exposes only the public GensCaptureV1 namespace",
    "the entry owns the public Capture module-launch provider and delegates session initialization to GensCaptureSessionStartV1",
    "Capture139 no longer owns session initialization and only wires explicit historical dependencies plus its separate screen-return debt",
    "the entry has no DOM storage listener observer timer retry Dungeon Tactical Combat or Exploration dependency",
    "the session-start owner has no DOM storage listener observer timer retry Dungeon Tactical Combat or Exploration dependency",
    "only one Shell register capture provider is active",
    "historical Dungeon compatibility remains unchanged until separately audited",
    "Capture profile identity is owned only by pure GensCaptureV1.isProfile(profile) and does not depend on Dungeon identity"
  ],
  "publicEntries":{
    "moduleScreenReturn":{
      "contract":"assets/gensrpg/shell/module-screen-return-contract-v1.json",
      "operation":"returnToPrimaryView",
      "status":"declared-not-loaded",
      "ownership":"module-owned-primary-view"
    },
    "moduleLaunch":{
      "contract":"assets/gensrpg/shell/module-launch-contract-v1.json",
      "operation":"startModuleSession",
      "status":"loaded-public-provider",
      "ownership":"module-owned-session-start"
    }
  },
  "activatedPhase":9,
  "publicRuntimeApi":"GensCaptureV1"
}
Path("assets/gensrpg/capture/module-contract-v1.json").write_text(
  json.dumps(contract,ensure_ascii=False,indent=2)+"\n",encoding="utf-8",newline=""
)
