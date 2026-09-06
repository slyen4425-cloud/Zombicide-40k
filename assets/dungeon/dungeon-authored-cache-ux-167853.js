/* GenSrpG Dungeon — authored cache UX 16.78.56.
   Built World Builder only.
   - refreshes cache/return actions immediately after tactical movement clicks
   - NEVER changes tactical grid sizing or cell geometry
   Does not alter movement rules, room data, combat, Random Dungeon, Capture or Survival. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="1.3.0",APP_VERSION="16.78.56";
let installed=false;
function readRt(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function authored(x){return !!(x?.last?.authoredRuntime167839&&x?.last?.worldDungeonId&&x?.last?.worldNodeId)}
function secondaryBranch(x){return authored(x)&&String(x?.last?.worldNodeId||"").startsWith("branch_")}
function syncActions(){if(!authored(readRt()))return false;try{ROOT.DungeonZoneLinks167846?.paintTravelButtons?.()}catch(e){}try{ROOT.DungeonAuthoredRuntime167839?.syncActionButton?.()}catch(e){}return true}
function onGridClick(e){if(!e?.target?.closest?.("#dc047RoomBoard .dc047Grid .dc047Cell"))return;for(const ms of [0,20,80])setTimeout(syncActions,ms)}
function install(){if(!DOC)return false;if(!installed){DOC.addEventListener("click",onGridClick,true);installed=true}for(const ms of [0,50,250])setTimeout(syncActions,ms);return true}
ROOT.DungeonAuthoredCacheUx167853={VERSION,APP_VERSION,secondaryBranch,syncActions,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}
})();
