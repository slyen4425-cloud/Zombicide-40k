/* GenSrpG Tactical Combat V2 — default Dungeon combat bridge.
   Replaces legacy combat entry points only after all V2 modules are loaded.
   Exploration stays legacy; combat execution is fully isolated. */
(function(root,factory){
  const api=factory(root||globalThis);
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgTacticalCombatV2Bridge=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(R){
  "use strict";
  const VERSION="0.3.0",APP_VERSION="16.78.103";
  let installed=false,legacyStart=null,legacySetup=null,opening=false;
  const arr=v=>Array.isArray(v)?v:[];
  const str=v=>String(v??"");
  function eligible(rt=R,options={}){
    try{if(typeof rt?.isDungeonMode==="function"&&!rt.isDungeonMode())return {ok:false,reason:"not-dungeon"}}catch(e){}
    const A=rt?.GensRpgTacticalCombatV2Adapter,U=rt?.GensRpgTacticalCombatV2Ui;
    if(!rt?.GensRpgTacticalCombatV2||!A||!U)return {ok:false,reason:"modules-missing"};
    const heroes=arr(options.heroIds).length?arr(options.heroIds):arr(A.participants?.(rt));
    const wanted=arr(options.enemyIds).map(str),all=arr(A.activeEnemies?.(rt)),enemies=wanted.length?all.filter(e=>wanted.includes(str(e.id))):all;
    if(!heroes.length)return {ok:false,reason:"no-heroes"};if(!enemies.length)return {ok:false,reason:"no-enemies"};
    return {ok:true,heroes:heroes.length,enemies:enemies.length,heroIds:heroes.map(str),enemyIds:enemies.map(e=>str(e.id))};
  }
  function currentBattle(rt=R){try{return rt?.GensRpgTacticalCombatV2Ui?.getBattle?.()||null}catch(e){return null}}
  function finishExploration(rt,battle,summary,reason){
    try{rt.document?.body?.style&&(rt.document.body.style.overflow="")}catch(e){}
    try{rt.updateDungeonExploreButtons?.()}catch(e){}
    try{rt.DungeonCore01?.render?.()}catch(e){try{rt.renderDungeonCore01?.()}catch(_){}}
    try{
      const win=battle?.winner;
      if(win==="hero")rt.showToast?.("🏆 Combat tactique remporté");
      else if(win==="enemy")rt.showToast?.("💀 Groupe vaincu");
      else rt.showToast?.("⚔️ Combat tactique terminé");
    }catch(e){}
    try{rt.dispatchEvent?.(new CustomEvent("gensrpg:tactical-combat-finished",{detail:{winner:battle?.winner||null,summary:summary||null,reason:reason||""}}))}catch(e){}
  }
  function openCurrent(rt=R,options={}){
    if(opening||currentBattle(rt))return {ok:false,reason:"battle-already-open"};
    const e=eligible(rt,options);if(!e.ok)return e;
    opening=true;
    try{
      const merged={...options,heroIds:e.heroIds,enemyIds:e.enemyIds,onFinish:({battle,summary}={})=>finishExploration(rt,battle,summary,options.reason)};
      const battle=rt.GensRpgTacticalCombatV2Ui.openCurrentEncounter(merged);
      try{rt.document?.body?.style&&(rt.document.body.style.overflow="hidden")}catch(_){ }
      return {ok:true,battle};
    }catch(err){console.error("Combat tactique V2",err);return {ok:false,reason:"open-failed",error:err}}
    finally{opening=false}
  }
  function startDefault(rt=R,enemyIds=[],reason="manual"){
    const ids=arr(enemyIds).map(str);const result=openCurrent(rt,{enemyIds:ids,reason});
    if(result.ok)return result;
    console.warn("V2 combat unavailable, fallback legacy",result.reason);
    return typeof legacyStart==="function"?legacyStart.call(rt,enemyIds,reason):result;
  }
  function setupDefault(rt=R){
    const result=openCurrent(rt,{reason:"manual-setup"});
    if(result.ok)return result;
    return typeof legacySetup==="function"?legacySetup.call(rt):result;
  }
  function install(rt=R){
    if(installed)return true;
    if(!rt?.GensRpgTacticalCombatV2||!rt?.GensRpgTacticalCombatV2Adapter||!rt?.GensRpgTacticalCombatV2Ui)return false;
    legacyStart=typeof rt.dc200StartCombat==="function"?rt.dc200StartCombat:null;
    legacySetup=typeof rt.openDungeonCombatSetup==="function"?rt.openDungeonCombatSetup:null;
    const start=function(enemyIds,reason){return startDefault(rt,enemyIds,reason)};start.__gensTacticalV2Default=true;start.__legacy=legacyStart;
    rt.dc200StartCombat=start;
    if(legacySetup){const setup=function(){return setupDefault(rt)};setup.__gensTacticalV2Default=true;setup.__legacy=legacySetup;rt.openDungeonCombatSetup=setup}
    rt.openTacticalCombatV2=(opts={})=>openCurrent(rt,opts);
    rt.GENS_TACTICAL_V2_DEFAULT=true;installed=true;
    try{rt.dispatchEvent?.(new CustomEvent("gensrpg:tactical-combat-ready",{detail:{version:APP_VERSION}}))}catch(e){}
    return true;
  }
  return {VERSION,APP_VERSION,eligible,currentBattle,openCurrent,startDefault,setupDefault,install};
});
