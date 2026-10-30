"use strict";
/* Capture-owned routing seam: a lab provider owns battle execution and creature editing,
   while Capture owns encounter context, navigation, persistence and result application.
   No runtime wiring or automatic installation in this preparation lot. */
(function(root){
  const PROTOCOL=1;
  const REQUIRED=["createBattle","startBattle","stopBattle","disposeBattle","openCreatureEditor","closeCreatureEditor"];
  // The single existing ownership port also mediates official Lab authoring.
  // A role is a capability, not a new editor or a second persistence owner.
  const AUTHOR_ROLES=Object.freeze({
    creature:"creature-editor",skill:"skill-editor",
    rules:"combat-rules-editor",bestiary:"bestiary"
  });
  const AUTHOR_V2=["skill-editor","combat-rules-editor","bestiary"];
  let provider=null,session=null,editor=null,editorKind=null,editorViaAuthoring=false;
  function validate(next){
    if(!next||next.protocol!==PROTOCOL)throw new TypeError("Unsupported Capture lab protocol");
    if(typeof next.version!=="string"||!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-[0-9A-Za-z.-]+)?$/.test(next.version))throw new TypeError("Provider semantic version required");
    if(!Array.isArray(next.capabilities)||next.capabilities.some(x=>typeof x!=="string"||!x)||new Set(next.capabilities).size!==next.capabilities.length)throw new TypeError("Provider capabilities must be unique strings");
    for(const method of REQUIRED)if(typeof next[method]!=="function")throw new TypeError("Provider missing "+method);
    // Existing protocol-v1 battle adapters stay valid. A provider declaring
    // any NEW author domain must expose the native author's session pair.
    if(AUTHOR_V2.some(capability=>next.capabilities.includes(capability))){
      for(const method of ["openAuthoring","closeAuthoring"])
        if(typeof next[method]!=="function")throw new TypeError("Provider missing "+method);
    }
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
    editor=opened;editorKind="creature";editorViaAuthoring=false;return opened;
  }
  function openAuthoring(kind,context={}){
    if(!Object.prototype.hasOwnProperty.call(AUTHOR_ROLES,kind))
      throw new RangeError("Unsupported official Lab author domain: "+kind);
    if(!provider||!has(AUTHOR_ROLES[kind])||session||editor)return null;
    if(!context||typeof context!=="object"||Array.isArray(context))
      throw new TypeError("Lab authoring context must be an object");
    if(typeof provider.openAuthoring!=="function")return null;
    const opened=provider.openAuthoring(kind,context);
    if(!opened||typeof opened!=="object")throw new TypeError("Invalid official Lab author session");
    editor=opened;editorKind=kind;editorViaAuthoring=true;
    return opened;
  }
  function closeEditor(){
    if(!editor)return false;
    const current=editor,viaAuthoring=editorViaAuthoring;
    editor=null;editorKind=null;editorViaAuthoring=false;
    if(viaAuthoring)provider.closeAuthoring(current);
    else provider.closeCreatureEditor(current);
    return true;
  }
  function uninstall(next){if(next!==provider)throw new Error("Provider mismatch");if(session||editor)throw new Error("Cannot uninstall active provider");provider=null;return true;}
  function status(){return Object.freeze({protocol:PROTOCOL,installed:!!provider,version:provider?.version||null,battleActive:!!session,editorActive:!!editor,editorKind});}
  root.GensCaptureLabOwnershipPortV1=Object.freeze({install,has,compatible,startEncounter,stopEncounter,editCreature,openAuthoring,closeEditor,uninstall,status});
})(typeof window!=="undefined"?window:globalThis);
