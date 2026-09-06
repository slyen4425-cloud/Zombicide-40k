/* GenSrpG Dungeon — authored action refresh 16.78.58.
   Built World Builder only.
   - refreshes Cache/Return actions immediately after tactical movement by forcing one native Dungeon render
   - hides and blocks only the obsolete generic "FOUILLER LE COFFRE" action in authored worlds
   - never changes tactical grid geometry, movement rules, room data or exact chest actions. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="1.1.0",APP_VERSION="16.78.58";
let installed=false,renderPending=false;
function readRt(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function authored(x){return !!(x?.last?.authoredRuntime167839&&x?.last?.worldDungeonId&&x?.last?.worldNodeId)}
function normText(v){return String(v||"").replace(/\s+/g," ").trim().toUpperCase()}
function isLegacyChestControl(el){return !!el&&normText(el.textContent).includes("FOUILLER LE COFFRE")}
function legacyCandidates(){if(!DOC)return[];const sel="button,[role='button'],input[type='button'],input[type='submit'],.btn,.dc01Btn,.dc047Btn";return Array.from(DOC.querySelectorAll?.(sel)||[])}
function syncLegacyChestButton(){if(!DOC)return 0;const isAuthored=authored(readRt());let changed=0;for(const el of legacyCandidates()){if(!isLegacyChestControl(el))continue;if(isAuthored){if(el.dataset.daf167857Hidden!=="1"){el.dataset.daf167857Hidden="1";el.dataset.daf167857Display=el.style?.display||"";changed++}try{el.hidden=true}catch(e){}try{el.setAttribute("aria-hidden","true")}catch(e){}try{el.style?.setProperty?.("display","none","important")}catch(e){}}else if(el.dataset.daf167857Hidden==="1"){try{el.hidden=false;el.removeAttribute("aria-hidden");el.style?.removeProperty?.("display");if(el.dataset.daf167857Display&&el.style)el.style.display=el.dataset.daf167857Display}catch(e){}delete el.dataset.daf167857Hidden;delete el.dataset.daf167857Display;changed++}}return changed}
function syncActions(){const x=readRt();if(!authored(x)){syncLegacyChestButton();return false}try{ROOT.DungeonAuthoredCacheVisual167852?.sync?.()}catch(e){}try{ROOT.DungeonZoneLinks167846?.paintTravelButtons?.()}catch(e){}try{ROOT.DungeonAuthoredRuntime167839?.syncActionButton?.()}catch(e){}syncLegacyChestButton();return true}
function nativeRefresh(){if(renderPending)return;renderPending=true;setTimeout(()=>{renderPending=false;const x=readRt();if(!authored(x)){syncLegacyChestButton();return}try{ROOT.DungeonCore01?.render?.()}catch(e){}try{syncActions()}catch(e){}},60)}
function onGridClick(e){if(!e?.target?.closest?.("#dc047RoomBoard .dc047Grid .dc047Cell"))return;for(const ms of [0,20,80,160])setTimeout(syncActions,ms);nativeRefresh()}
function blockLegacyChestClick(e){if(!authored(readRt()))return;const el=e?.target?.closest?.("button,[role='button'],input[type='button'],input[type='submit'],.btn,.dc01Btn,.dc047Btn");if(!isLegacyChestControl(el))return;e.preventDefault?.();e.stopImmediatePropagation?.();syncLegacyChestButton()}
function wrapCore(){const core=ROOT.DungeonCore01;if(!core)return false;for(const name of ["render","show"]){const old=core[name];if(typeof old!=="function"||old.__daf167857v2)continue;const w=function(){const out=old.apply(this,arguments);try{syncActions()}catch(e){}return out};w.__daf167857v2=true;w.__dafOriginal=old;core[name]=w}return true}
function install(){if(!DOC)return false;wrapCore();if(!installed){DOC.addEventListener("click",blockLegacyChestClick,true);DOC.addEventListener("click",onGridClick,true);installed=true}for(const ms of [0,50,250,750])setTimeout(syncActions,ms);return true}
ROOT.DungeonAuthoredActionFix167857={VERSION,APP_VERSION,readRt,authored,isLegacyChestControl,syncLegacyChestButton,syncActions,nativeRefresh,onGridClick,blockLegacyChestClick,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}
})();
