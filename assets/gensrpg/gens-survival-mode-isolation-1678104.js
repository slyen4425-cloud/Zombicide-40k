/* GenSrpG V16.78.104 — hard isolation between Survival and RPG/Dungeon sessions.
   Survival must never be resumed or rendered through stale Dungeon runtime state. */
(function(root){
"use strict";
const R=root||globalThis;
const VERSION="1.0.0",APP_VERSION="16.78.104";
const FAMILY_KEY="gensrpg_session_family_guard_v1";
const DUNGEON_RT_KEY="gensrpg_dungeon_runtime_v2";
const VALID=new Set(["survival","adventure"]);

function storage(){try{return R.localStorage||null}catch(e){return null}}
function rememberFamily(value){
  const family=value==="dungeon"?"adventure":value;
  if(!VALID.has(family))return false;
  try{storage()?.setItem(FAMILY_KEY,family)}catch(e){}
  return true;
}
function storedFamily(){try{const v=storage()?.getItem(FAMILY_KEY)||"";return VALID.has(v)?v:""}catch(e){return ""}}
function inferFamily(){
  const explicit=storedFamily();if(explicit)return explicit;
  try{const style=R.currentGameStyle?.();if(style)return style==="dungeon"?"adventure":"survival"}catch(e){}
  try{const p=R.getActiveGameProfile?.();if(p?.gameStyle)return p.gameStyle==="dungeon"?"adventure":"survival"}catch(e){}
  try{const style=storage()?.getItem("gens_game_profile_style")||storage()?.getItem("gens_game_mode")||"";if(style)return style==="dungeon"?"adventure":"survival"}catch(e){}
  return "";
}
function isSurvival(){return inferFamily()==="survival"}
function isAdventure(){return inferFamily()==="adventure"}

function wrapFamilySelector(name,index,mapper=v=>v){
  const old=R[name];if(typeof old!=="function"||old.__gensIsolation104)return false;
  const wrapped=function(){try{rememberFamily(mapper(arguments[index]))}catch(e){}return old.apply(this,arguments)};
  wrapped.__gensIsolation104=true;wrapped.__original=old;R[name]=wrapped;return true;
}
function wrapProfileApply(){
  const old=R.applyGameProfile;if(typeof old!=="function"||old.__gensIsolation104)return false;
  const wrapped=function(profile){try{if(profile?.gameStyle)rememberFamily(profile.gameStyle)}catch(e){}return old.apply(this,arguments)};
  wrapped.__gensIsolation104=true;wrapped.__original=old;R.applyGameProfile=wrapped;return true;
}
function wrapDungeonMode(){
  const old=R.isDungeonMode;if(typeof old!=="function"||old.__gensIsolation104)return false;
  const wrapped=function(){const f=storedFamily();if(f==="survival")return false;if(f==="adventure")return true;return old.apply(this,arguments)};
  wrapped.__gensIsolation104=true;wrapped.__original=old;R.isDungeonMode=wrapped;return true;
}
function withoutDungeonRuntime(fn){
  const ls=storage();if(!ls)return fn();
  let raw=null,had=false;
  try{raw=ls.getItem(DUNGEON_RT_KEY);had=raw!==null;if(had)ls.removeItem(DUNGEON_RT_KEY)}catch(e){}
  try{return fn()}finally{try{if(had)ls.setItem(DUNGEON_RT_KEY,raw)}catch(e){}}
}
function wrapResume(){
  const old=R.resumeGame;if(typeof old!=="function"||old.__gensIsolation104)return false;
  const wrapped=function(){
    if(isSurvival())return withoutDungeonRuntime(()=>old.apply(this,arguments));
    return old.apply(this,arguments);
  };
  wrapped.__gensIsolation104=true;wrapped.__original=old;R.resumeGame=wrapped;return true;
}
function guardDungeonShow(){
  const core=R.DungeonCore01,old=core?.show;if(typeof old!=="function"||old.__gensIsolation104)return false;
  const wrapped=function(){if(isSurvival())return false;return old.apply(this,arguments)};
  wrapped.__gensIsolation104=true;wrapped.__original=old;core.show=wrapped;return true;
}
function guardDungeonEntry(name){
  const old=R[name];if(typeof old!=="function"||old.__gensIsolation104)return false;
  const wrapped=function(){if(isSurvival())return false;return old.apply(this,arguments)};
  wrapped.__gensIsolation104=true;wrapped.__original=old;R[name]=wrapped;return true;
}
function closeLeakedDungeonUi(){
  if(!isSurvival()||!R.document)return false;
  for(const id of ["dc01Overlay","dungeonCombatModal","dungeonCombatVictoryModal","dungeonCombatStatsModal"]){
    const el=R.document.getElementById?.(id);if(el){el.classList?.remove?.("open");el.style.display="none"}
  }
  try{R.document.body?.classList?.remove?.("gensDungeonTheme")}catch(e){}
  return true;
}
function install(){
  wrapFamilySelector("openGensFamily",0,v=>String(v||""));
  wrapFamilySelector("openGensBuiltInGame",1,v=>String(v||""));
  wrapFamilySelector("setGameStyle",0,v=>String(v||"")==="dungeon"?"adventure":"survival");
  wrapProfileApply();wrapDungeonMode();wrapResume();guardDungeonShow();
  for(const name of ["openDungeonCombatSetup"])guardDungeonEntry(name);
  closeLeakedDungeonUi();
  return true;
}
R.GensSurvivalModeIsolation1678104={VERSION,APP_VERSION,FAMILY_KEY,DUNGEON_RT_KEY,rememberFamily,storedFamily,inferFamily,isSurvival,isAdventure,withoutDungeonRuntime,install,closeLeakedDungeonUi};
install();
/* Late wrappers sometimes replace resume/show during bootstrap; re-assert only the guards, never game state. */
if(typeof R.setTimeout==="function"){R.setTimeout(install,0);R.setTimeout(install,300);R.setTimeout(install,1300)}
})(typeof window!=="undefined"?window:globalThis);
