/* GenSrpG Dungeon — authored action refresh 16.78.61.
   Built World Builder only.
   - refreshes contextual Cache/Return/exact-chest actions from the real spatial persistence commit
   - no polling, no delayed grid-click guessing, no synthetic ACTUALISER click
   - hides and blocks the obsolete generic "FOUILLER LE COFFRE" control whenever a World Builder dungeon is selected
   - never changes tactical grid geometry, movement rules, room data or exact chest actions. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const PRIMARY_KEY="gensrpg_dungeon_primary_selection_v167833";
const VERSION="1.4.0",APP_VERSION="16.78.61";
let installed=false,postMovePending=false;
function readRt(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function primary(){try{const p=ROOT.DungeonWorldSessionBridge167832?.primary?.();if(p)return p}catch(e){}try{return JSON.parse(localStorage.getItem(PRIMARY_KEY)||"null")}catch(e){return null}}
function builtSelected(){const p=primary();return String(p?.kind||"")==="world"&&!!p?.id}
function authored(x){return !!(x?.last?.authoredRuntime167839&&x?.last?.worldDungeonId&&x?.last?.worldNodeId)}
function contextActive(){return builtSelected()||authored(readRt())}
function activeHero(x){const a=Array.isArray(x?.participants)?x.participants:[],i=Math.max(0,Math.min(Math.max(0,a.length-1),Number(x?.index)||0));return String(a[i]||"")}
function positionKey(x){if(!x)return"";const h=activeHero(x);if(!h)return"";return [h,Number(x.room)||0,Number(x?.positions?.[h])].join("|")}
function normText(v){return String(v||"").replace(/\s+/g," ").trim().toUpperCase()}
function clickableCandidates(){if(!DOC)return[];const sel="button,[role='button'],input[type='button'],input[type='submit'],.btn,.dc01Btn,.dc047Btn";return Array.from(DOC.querySelectorAll?.(sel)||[])}
function isLegacyChestControl(el){const t=normText(el?.textContent||el?.value);if(t.includes("FOUILLER LE COFFRE"))return true;const oc=normText(el?.getAttribute?.("onclick"));return t.includes("FOUILLER")&&oc.includes("SEARCHCHEST")}
function syncLegacyChestButton(){if(!DOC)return 0;const active=contextActive();let changed=0;for(const el of clickableCandidates()){if(!isLegacyChestControl(el))continue;if(active){if(el.dataset.daf167857Hidden!=="1"){el.dataset.daf167857Hidden="1";el.dataset.daf167857Display=el.style?.display||"";changed++}try{el.hidden=true}catch(e){}try{el.setAttribute("aria-hidden","true")}catch(e){}try{el.style?.setProperty?.("display","none","important")}catch(e){}}else if(el.dataset.daf167857Hidden==="1"){try{el.hidden=false;el.removeAttribute("aria-hidden");el.style?.removeProperty?.("display");if(el.dataset.daf167857Display&&el.style)el.style.display=el.dataset.daf167857Display}catch(e){}delete el.dataset.daf167857Hidden;delete el.dataset.daf167857Display;changed++}}return changed}
function syncActions(){if(!contextActive()){syncLegacyChestButton();return false}try{ROOT.DungeonAuthoredCacheVisual167852?.sync?.()}catch(e){}try{ROOT.DungeonZoneLinks167846?.paintTravelButtons?.()}catch(e){}try{ROOT.DungeonAuthoredRuntime167839?.syncActionButton?.()}catch(e){}syncLegacyChestButton();return true}
function renderCommittedActions(){if(postMovePending||!contextActive())return false;postMovePending=true;setTimeout(()=>{postMovePending=false;try{ROOT.DungeonCore01?.render?.()}catch(e){}try{syncActions()}catch(e){}},0);return true}
function wrapSpatialPersist(){const spatial=ROOT.DungeonSpatial313;if(!spatial||typeof spatial.persist!=="function")return false;if(spatial.persist.__daf167861)return true;const old=spatial.persist;const wrapped=function(x){const before=positionKey(readRt()),after=positionKey(x);const out=old.apply(this,arguments);if(contextActive()&&after&&after!==before)renderCommittedActions();return out};wrapped.__daf167861=true;wrapped.__dafOriginal=old;spatial.persist=wrapped;return true}
function blockLegacyChestClick(e){if(!contextActive())return;const el=e?.target?.closest?.("button,[role='button'],input[type='button'],input[type='submit'],.btn,.dc01Btn,.dc047Btn");if(!isLegacyChestControl(el))return;e.preventDefault?.();e.stopImmediatePropagation?.();syncLegacyChestButton()}
function wrapCore(){const core=ROOT.DungeonCore01;if(!core)return false;for(const name of ["render","show"]){const old=core[name];if(typeof old!=="function"||old.__daf167857v5)continue;const w=function(){const out=old.apply(this,arguments);try{syncActions()}catch(e){}return out};w.__daf167857v5=true;w.__dafOriginal=old;core[name]=w}return true}
function install(){if(!DOC)return false;wrapCore();wrapSpatialPersist();if(!installed){DOC.addEventListener("click",blockLegacyChestClick,true);installed=true}for(const ms of [0,50,250,750])setTimeout(()=>{wrapSpatialPersist();syncActions()},ms);return true}
ROOT.DungeonAuthoredActionFix167857={VERSION,APP_VERSION,readRt,primary,builtSelected,authored,contextActive,activeHero,positionKey,isLegacyChestControl,syncLegacyChestButton,syncActions,renderCommittedActions,wrapSpatialPersist,blockLegacyChestClick,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}
})();
