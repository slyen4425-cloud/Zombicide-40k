/* GenSrpG Dungeon — authored cache UX 16.78.55.
   Built World Builder only.
   - refreshes cache/return actions immediately after tactical movement clicks
   - restores the historical tactical grid sizing for secondary branch rooms
   Does not alter movement rules, room data, combat, Random Dungeon, Capture or Survival. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="1.2.0",APP_VERSION="16.78.55";
let installed=false;
function readRt(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function authored(x){return !!(x?.last?.authoredRuntime167839&&x?.last?.worldDungeonId&&x?.last?.worldNodeId)}
function secondaryBranch(x){return authored(x)&&String(x?.last?.worldNodeId||"").startsWith("branch_")}
function syncActions(){if(!authored(readRt()))return false;try{ROOT.DungeonZoneLinks167846?.paintTravelButtons?.()}catch(e){}try{ROOT.DungeonAuthoredRuntime167839?.syncActionButton?.()}catch(e){}return true}
function restoreGrid(){if(!DOC)return false;const grid=DOC.querySelector("#dc047RoomBoard .dc047Grid"),board=DOC.getElementById("dc047RoomBoard");if(!grid)return false;for(const p of ["width","height","max-width","margin","grid-template-columns","grid-auto-rows"])grid.style.removeProperty(p);grid.classList?.remove("dacu167853Fitted");for(const c of grid.querySelectorAll?.(":scope > .dc047Cell")||[]){for(const p of ["width","height","min-height","aspect-ratio"])c.style.removeProperty(p)}if(board){for(const p of ["overflow-x","display","justify-content"])board.style.removeProperty(p)}return true}
function fitBranchRoom(){return restoreGrid()&&false}
function sync(){restoreGrid();syncActions();return true}
function onGridClick(e){if(!e?.target?.closest?.("#dc047RoomBoard .dc047Grid .dc047Cell"))return;for(const ms of [0,20,80])setTimeout(syncActions,ms)}
function wrapCore(){const core=ROOT.DungeonCore01;if(!core)return false;for(const name of ["render","show"]){const old=core[name];if(typeof old!=="function"||old.__cacheUx167853)continue;const w=function(){const out=old.apply(this,arguments);try{sync()}catch(e){}return out};w.__cacheUx167853=true;w.__cacheUxOriginal=old;core[name]=w}return true}
function install(){if(!DOC)return false;wrapCore();if(!installed){DOC.addEventListener("click",onGridClick,true);installed=true}for(const ms of [0,50,250])setTimeout(sync,ms);return true}
ROOT.DungeonAuthoredCacheUx167853={VERSION,APP_VERSION,secondaryBranch,syncActions,restoreGrid,fitBranchRoom,sync,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}
})();
