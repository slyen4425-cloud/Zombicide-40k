/* GenSrpG Dungeon — authored cache UX 16.78.54.
   Built World Builder only.
   - refreshes cache/return actions immediately after tactical movement clicks
   - auto-fits secondary branch rooms with square cells and moderate zoom
   Does not alter movement rules, room data, combat, Random Dungeon, Capture or Survival. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="1.1.0",APP_VERSION="16.78.54";
let installed=false;
function readRt(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function authored(x){return !!(x?.last?.authoredRuntime167839&&x?.last?.worldDungeonId&&x?.last?.worldNodeId)}
function secondaryBranch(x){return authored(x)&&String(x?.last?.worldNodeId||"").startsWith("branch_")}
function mapSize(x){const m=x?.last?.map||{},w=Math.max(1,Math.trunc(Number(m.width||m.size)||1)),h=Math.max(1,Math.trunc(Number(m.height)||Math.ceil((m.cells?.length||w)/w)||1));return {w,h}}
function viewportWidth(){try{return Math.max(280,Number(ROOT.innerWidth)||360)}catch(e){return 360}}
function viewportHeight(){try{return Math.max(480,Number(ROOT.innerHeight)||720)}catch(e){return 720}}
function cellSizePx(w,h,boardWidth){const bw=Math.max(220,Number(boardWidth)||viewportWidth()-32),byWidth=Math.floor((bw-8)/Math.max(1,w)),byHeight=Math.floor((viewportHeight()*0.56)/Math.max(1,h));return Math.max(28,Math.min(68,byWidth,byHeight))}
function syncActions(){if(!authored(readRt()))return false;try{ROOT.DungeonZoneLinks167846?.paintTravelButtons?.()}catch(e){}try{ROOT.DungeonAuthoredRuntime167839?.syncActionButton?.()}catch(e){}return true}
function clearFit(grid,board){if(grid){for(const p of ["width","max-width","margin","grid-template-columns","grid-auto-rows"])grid.style.removeProperty(p);grid.classList?.remove("dacu167853Fitted");for(const c of grid.querySelectorAll?.(":scope > .dc047Cell")||[]){c.style.removeProperty("width");c.style.removeProperty("height");c.style.removeProperty("min-height");c.style.removeProperty("aspect-ratio")}}if(board){board.style.removeProperty("overflow-x");board.style.removeProperty("display");board.style.removeProperty("justify-content")}}
function fitBranchRoom(){if(!DOC)return false;const x=readRt(),grid=DOC.querySelector("#dc047RoomBoard .dc047Grid"),board=DOC.getElementById("dc047RoomBoard");if(!grid)return false;if(!secondaryBranch(x)){clearFit(grid,board);return false}const {w,h}=mapSize(x),boardWidth=Math.max(220,Number(board?.clientWidth)||viewportWidth()-32),cell=cellSizePx(w,h,boardWidth),px=w*cell;grid.style.width=px+"px";grid.style.maxWidth="100%";grid.style.margin="0 auto";grid.style.gridTemplateColumns="repeat("+w+", "+cell+"px)";grid.style.gridAutoRows=cell+"px";grid.classList?.add("dacu167853Fitted");for(const c of grid.querySelectorAll?.(":scope > .dc047Cell")||[]){c.style.width=cell+"px";c.style.height=cell+"px";c.style.minHeight="0";c.style.aspectRatio="1 / 1"}if(board){board.style.overflowX=px>boardWidth?"auto":"hidden";board.style.display="block"}return true}
function sync(){syncActions();fitBranchRoom();return true}
function onGridClick(e){if(!e?.target?.closest?.("#dc047RoomBoard .dc047Grid .dc047Cell"))return;for(const ms of [0,20,80])setTimeout(sync,ms)}
function wrapCore(){const core=ROOT.DungeonCore01;if(!core)return false;for(const name of ["render","show"]){const old=core[name];if(typeof old!=="function"||old.__cacheUx167853)continue;const w=function(){const out=old.apply(this,arguments);try{sync()}catch(e){}return out};w.__cacheUx167853=true;w.__cacheUxOriginal=old;core[name]=w}return true}
function install(){if(!DOC)return false;wrapCore();if(!installed){DOC.addEventListener("click",onGridClick,true);if(ROOT.addEventListener)ROOT.addEventListener("resize",()=>setTimeout(fitBranchRoom,0));installed=true}for(const ms of [0,50,250])setTimeout(sync,ms);return true}
ROOT.DungeonAuthoredCacheUx167853={VERSION,APP_VERSION,secondaryBranch,mapSize,cellSizePx,syncActions,fitBranchRoom,sync,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}
})();
