/* GenSrpG V16.79.00 — inter-mode safety guard.
 * Scope: recover legacy Survival custom heroes safely and route shared libraries by active mode.
 */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis;
const D=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.79.00";

function inCapture(){
  try{
    if(D?.body?.classList?.contains("gens-pure-capture")||D?.body?.classList?.contains("gens-capture-gameplay"))return true;
    const id=String(R.activeGameProfileId?.()||"").toLowerCase();
    const u=String(R.gensCurrentUniverseId?.()||"").toLowerCase();
    return id.includes("capture")||u.includes("capture");
  }catch(e){return false}
}
function inDungeon(){
  try{return !!R.isDungeonMode?.()&&!inCapture()}catch(e){return false}
}
function isBuiltinDungeonHero(h){
  if(!h)return false;
  if(h.dungeonBuiltin)return true;
  try{return Array.isArray(R.DUNGEON_HERO_IDS)&&R.DUNGEON_HERO_IDS.includes(String(h.id||""))}catch(e){return false}
}
function explicitDungeonMarker(h){
  if(!h)return false;
  const fam=String(h.contentFamily||"").toLowerCase();
  const uni=String(h.universeId||"").toLowerCase();
  const dungeonId=String(R.GAME_PROFILE_DUNGEON_ID||"dungeon").toLowerCase();
  return fam==="dungeon"||fam==="rpg"||uni===dungeonId||uni.includes("dungeon");
}
function survivalMarker(h){
  if(!h)return false;
  const fam=String(h.contentFamily||"").toLowerCase();
  const uni=String(h.universeId||"").toLowerCase();
  const baseId=String(R.GAME_PROFILE_BASE_ID||"").toLowerCase();
  return fam==="survival"||fam==="zombicide"||(baseId&&uni===baseId);
}
function shouldRecoverSurvivalHero(h){
  if(!h||isBuiltinDungeonHero(h))return false;
  if(String(h.gameMode||"")!=="dungeon")return false;
  if(explicitDungeonMarker(h))return false;
  return survivalMarker(h)||(!h.contentFamily&&!h.universeId);
}
function recoverSurvivalHeroes(){
  if(typeof R.loadCustomHeroesMulti!=="function"||typeof R.saveCustomHeroesMulti!=="function")return 0;
  let list;
  try{list=R.loadCustomHeroesMulti()}catch(e){return 0}
  if(!Array.isArray(list)||!list.length)return 0;
  let n=0;
  for(const h of list){
    if(!shouldRecoverSurvivalHero(h))continue;
    h.gameMode="zombicide";
    if(!h.contentFamily)h.contentFamily="survival";
    n++;
  }
  if(n){
    try{R.saveCustomHeroesMulti(list);R.applyCustomHeroesMulti?.()}catch(e){console.warn("GenSrpG inter-mode hero recovery",e)}
  }
  return n;
}

let nativeOpenAbilityLibrary=null;
function installAbilityRouting(){
  if(typeof R.openAbilityLibrary!=="function"||R.openAbilityLibrary.__gensIntermode167900)return false;
  nativeOpenAbilityLibrary=R.openAbilityLibrary;
  const wrapped=function(target){
    if(!target&&inCapture()){
      try{R.gensAbilityLibraryTab="creature"}catch(e){}
    }
    return nativeOpenAbilityLibrary.apply(this,arguments);
  };
  wrapped.__gensIntermode167900=true;
  wrapped.__original=nativeOpenAbilityLibrary;
  R.openAbilityLibrary=wrapped;
  return true;
}

function assertIsolationSnapshot(){
  let heroes=[];
  try{heroes=R.loadCustomHeroesMulti?.()||[]}catch(e){}
  return {
    capture:inCapture(),dungeon:inDungeon(),
    survivalCustom:heroes.filter(h=>String(h?.gameMode||"")!=="dungeon"&&!isBuiltinDungeonHero(h)).map(h=>String(h.id||"")),
    dungeonCustom:heroes.filter(h=>String(h?.gameMode||"")==="dungeon").map(h=>String(h.id||"")),
    abilityLibrary:String(R.gensAbilityLibraryTab||"")
  };
}
function install(){
  recoverSurvivalHeroes();
  installAbilityRouting();
  try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}
  return true;
}
R.GensIntermodeSafety167900={VERSION,APP_VERSION,inCapture,inDungeon,explicitDungeonMarker,survivalMarker,shouldRecoverSurvivalHero,recoverSurvivalHeroes,installAbilityRouting,assertIsolationSnapshot,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
