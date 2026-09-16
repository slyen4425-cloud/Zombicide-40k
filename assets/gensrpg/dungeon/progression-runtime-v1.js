/* GenSrpG progression runtime V1 — first extracted Dungeon progression action seam.
   The monolith still owns progression formulas/state. This module owns only the manual
   hero-sheet XP mutation lifecycle for Dungeon and delegates every calculation to the
   existing canonical progression functions. Non-Dungeon modes keep their legacy handler. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgProgressionRuntimeV1=api;
  if(root&&root.document&&typeof api?.install==="function"){
    try{api.install(root)}catch(e){try{root.console?.error?.("GenSrpG progression runtime install",e)}catch(_){} }
  }
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="1.0.0",APP_VERSION="16.78.114.11-progression-runtime-1";
  let installed=false,legacyChangeXP=null;
  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function isDungeonSheet(rt=R){
    try{return !!rt?.isDungeonHeroSheet?.()}catch(e){return false}
  }
  function applyManualXpDelta(rt=R,delta=0){
    if(!rt?.state||!rt?.current)return false;
    const before=clamp(num(rt.state.xp,0),0,999),step=num(delta,0);
    rt.state.xp=clamp(before+step,0,999);
    if(typeof rt?.dungeonSyncProgressionForState==="function")rt.dungeonSyncProgressionForState(rt.current,rt.state);
    if(rt.state.xp>before&&typeof rt?.dungeonHandleLevelUp071==="function"){
      try{rt.dungeonHandleLevelUp071(rt.current,before,rt.state,80)}catch(e){try{rt.console?.error?.("GenSrpG progression runtime level-up",e)}catch(_){} }
    }
    try{rt?.save?.()}catch(e){try{rt.console?.error?.("GenSrpG progression runtime save",e)}catch(_){} }
    if(rt.state.xp>before)try{rt?.z40kPlayUiSound?.("heal",0.88)}catch(e){}
    try{rt?.render?.()}catch(e){try{rt.console?.error?.("GenSrpG progression runtime render",e)}catch(_){} }
    return true;
  }
  function install(rt=R){
    const old=rt?.changeXP;
    if(typeof old!=="function")return false;
    if(old.__gensRpgProgressionRuntimeV1){installed=true;return true}
    if(!legacyChangeXP)legacyChangeXP=old;
    const wrapped=function(v){
      if(!isDungeonSheet(rt))return legacyChangeXP.apply(this,arguments);
      return applyManualXpDelta(rt,v);
    };
    wrapped.__gensRpgProgressionRuntimeV1=true;
    wrapped.__original=legacyChangeXP;
    rt.changeXP=wrapped;
    installed=true;
    try{rt.GENS_RPG_PROGRESSION_RUNTIME_VERSION=APP_VERSION}catch(e){}
    return true;
  }
  function status(){return {installed,version:APP_VERSION}}
  return {VERSION,APP_VERSION,isDungeonSheet,applyManualXpDelta,install,status};
});
