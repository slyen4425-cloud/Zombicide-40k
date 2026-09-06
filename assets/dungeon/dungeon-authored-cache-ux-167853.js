/* GenSrpG Dungeon — authored cache UX 16.78.53.
   Built World Builder only.
   - refreshes cache/return actions immediately after tactical movement clicks
   - auto-fits secondary branch rooms to a compact phone-friendly width
   Does not alter movement rules, room data, combat, Random Dungeon, Capture or Survival. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="1.0.0",APP_VERSION="16.78.53";
let installed=false;
function readRt(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function authored(x){return !!(x?.last?.authoredRuntime167839&&x?.last?.worldDungeonId&&x?.last?.worldNodeId)}
function secondaryBranch(x){return authored(x)&&String(x?.last?.worldNodeId||"").startsWith("branch_")}
function mapSize(x){const m=x?.last?.map||{},w=Math.max(1,Math.trunc(Number(m.width||m.size)||1)),h=Math.max(1,Math.trunc(Number(m.height)||Math.ceil((m.cells?.length||w)/w)||1));return {w,h}}
function fitWidthPx(w){return Math.max(150,Math.min(560,Math.max(1,Number(w)||1)*64))}
function syncActions(){if(!authored(readRt()))return false;try{ROOT.DungeonZoneLinks167846?.paintTravelButtons?.()}catch(e){}try{ROOT.DungeonAuthoredRuntime167839?.syncActionButton?.()}catch(e){}return true}
function clearFit(grid,board){if(grid){grid.style.removeProperty("width");grid.style.removeProperty("max-width");grid.style.removeProperty("margin");grid.style.removeProperty("grid-template-columns")}if(board){board.style.removeProperty("overflow-x")}}
function fitBranchRoom(){if(!DOC)return false;const x=readRt(),grid=DOC.querySelector("#dc047RoomBoard .dc047Grid"),board=DOC.getElementById("dc047RoomBoard");if(!grid)return false;if(!secondaryBranch(x)){clearFit(grid,board);return false}const {w}=mapSize(x),px=fitWidthPx(w);grid.style.width="min(100%, "+px+"px)";grid.style.maxWidth=px+"px";grid.style.margin="0 auto";grid.style.gridTemplateColumns="repeat("+w+", minmax(0,1fr))";if(board)board.style.overflowX="hidden";return true}
function sync(){syncActions();fitBranchRoom();return true}
function onGridClick(e){if(!e?.target?.closest?.("#dc047RoomBoard .dc047Grid .dc047Cell"))return;for(const ms of [0,20,80])setTimeout(sync,ms)}
function wrapCore(){const core=ROOT.DungeonCore01;if(!core)return false;for(const name of ["render","show"]){const old=core[name];if(typeof old!=="function"||old.__cacheUx167853)continue;const w=function(){const out=old.apply(this,arguments);try{sync()}catch(e){}return out};w.__cacheUx167853=true;w.__cacheUxOriginal=old;core[name]=w}return true}
function install(){if(!DOC)return false;wrapCore();if(!installed){DOC.addEventListener("click",onGridClick,true);installed=true}for(const ms of [0,50,250])setTimeout(sync,ms);return true}
ROOT.DungeonAuthoredCacheUx167853={VERSION,APP_VERSION,secondaryBranch,mapSize,fitWidthPx,syncActions,fitBranchRoom,sync,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}
})();
