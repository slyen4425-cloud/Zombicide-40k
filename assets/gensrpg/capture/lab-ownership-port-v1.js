"use strict";
/* Capture-owned routing seam: a lab provider owns battle execution and creature editing,
   while Capture owns encounter context, navigation, persistence and result application.
   No runtime wiring or automatic installation in this preparation lot. */
(function(root){
  const PROTOCOL=1;
  const REQUIRED=["createBattle","startBattle","stopBattle","disposeBattle","openCreatureEditor","closeCreatureEditor"];
  let provider=null,session=null,editor=null;
  function validate(next){
    if(!next||next.protocol!==PROTOCOL)throw new TypeError("Unsupported Capture lab protocol");
    if(typeof next.version!=="string"||!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/.test(next.version))throw new TypeError("Provider semantic version required");
    if(!Array.isArray(next.capabilities)||next.capabilities.some(x=>typeof x!=="string"||!x)||new Set(next.capabilities).size!==next.capabilities.length)throw new TypeError("Provider capabilities must be unique strings");
    for(const method of REQUIRED)if(typeof next[method]!=="function")throw new TypeError("Provider missing "+method);
  }
  function install(next){validate(next);if(provider&&provider!==next)throw new Error("Provider already installed");provider=next;return true;}
  function has(capability){return !!provider&&provider.capabilities.includes(capability);}
  function compatible(requested){return !!provider&&Array.isArray(requested)&&requested.every(capability=>has(capability));}
  function startEncounter(context){
    if(!provider||!has("battle-trigger")||session||editor)return null;
    if(!context||typeof context!=="object"||typeof context.encounterId!=="string"||!context.encounterId)throw new TypeError("Encounter ID required");
    const created=provider.createBattle(context);
    if(!created||typeof created!=="object")throw new TypeError("Invalid battle session");
    session=created;
    try{provider.startBattle(created)}catch(e){session=null;try{provider.disposeBattle(created)}catch(_){}throw e;}
    return created;
  }
  function stopEncounter(){if(!session)return false;const current=session;session=null;try{provider.stopBattle(current)}finally{provider.disposeBattle(current)}return true;}
  function editCreature(context){
    if(!provider||!has("creature-editor")||session||editor)return null;
    if(!context||typeof context!=="object"||typeof context.creatureId!=="string"||!context.creatureId)throw new TypeError("Creature ID required");
    const opened=provider.openCreatureEditor(context);
    if(!opened||typeof opened!=="object")throw new TypeError("Invalid editor session");
    editor=opened;return opened;
  }
  function closeEditor(){if(!editor)return false;const current=editor;editor=null;provider.closeCreatureEditor(current);return true;}
  function uninstall(next){if(next!==provider)throw new Error("Provider mismatch");if(session||editor)throw new Error("Cannot uninstall active provider");provider=null;return true;}
  function status(){return Object.freeze({protocol:PROTOCOL,installed:!!provider,version:provider?.version||null,battleActive:!!session,editorActive:!!editor});}
  root.GensCaptureLabOwnershipPortV1=Object.freeze({install,has,compatible,startEncounter,stopEncounter,editCreature,closeEditor,uninstall,status});
})(typeof window!=="undefined"?window:globalThis);
