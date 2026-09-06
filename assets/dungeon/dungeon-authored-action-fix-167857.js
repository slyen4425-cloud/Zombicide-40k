/* GenSrpG Dungeon — authored action refresh 16.78.57.
   Built World Builder only.
   - refreshes Cache/Return actions from the real persisted hero position after mobile movement
   - hides only the obsolete generic "FOUILLER LE COFFRE" action in authored worlds
   - never changes tactical grid geometry, movement rules, room data or exact chest actions. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="1.0.0",APP_VERSION="16.78.57";
let installed=false,beforeMoveKey="";
function readRt(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function authored(x){return !!(x?.last?.authoredRuntime167839&&x?.last?.worldDungeonId&&x?.last?.worldNodeId)}
function activeHero(x){const a=Array.isArray(x?.participants)?x.participants:[],i=Math.max(0,Math.min(Math.max(0,a.length-1),Number(x?.index)||0));return String(a[i]||"")}
function positionKey(x){if(!authored(x))return "";const h=activeHero(x);return h+"|"+String(Number(x?.room)||0)+"|"+String(Number(x?.positions?.[h]));}
function normText(v){return String(v||"").replace(/\s+/g," ").trim().toUpperCase()}
function syncLegacyChestButton(){if(!DOC)return 0;const x=readRt(),isAuthored=authored(x);let changed=0;for(const b of DOC.querySelectorAll?.("button")||[]){const t=normText(b.textContent);if(!t.includes("FOUILLER LE COFFRE"))continue;if(isAuthored){if(b.dataset.daf167857Hidden!=="1"){b.dataset.daf167857Hidden="1";b.dataset.daf167857Display=b.style?.display||"";if(b.style)b.style.display="none";changed++}}else if(b.dataset.daf167857Hidden==="1"){if(b.style)b.style.display=b.dataset.daf167857Display||"";delete b.dataset.daf167857Hidden;delete b.dataset.daf167857Display;changed++}}return changed}
function syncActions(){const x=readRt();if(!authored(x)){syncLegacyChestButton();return false}try{ROOT.DungeonAuthoredCacheVisual167852?.sync?.()}catch(e){}try{ROOT.DungeonZoneLinks167846?.paintTravelButtons?.()}catch(e){}try{ROOT.DungeonAuthoredRuntime167839?.syncActionButton?.()}catch(e){}syncLegacyChestButton();return true}
function captureBeforeMove(e){if(!e?.target?.closest?.("#dc047RoomBoard .dc047Grid .dc047Cell"))return;beforeMoveKey=positionKey(readRt())}
function watchAfterMove(e){if(!e?.target?.closest?.("#dc047RoomBoard .dc047Grid .dc047Cell"))return;const start=beforeMoveKey||positionKey(readRt());for(const ms of [0,25,60,120,220,350,550,800,1100])setTimeout(()=>{const now=positionKey(readRt());syncActions();if(start&&now&&now!==start)beforeMoveKey=now},ms)}
function wrapCore(){const core=ROOT.DungeonCore01;if(!core)return false;for(const name of ["render","show"]){const old=core[name];if(typeof old!=="function"||old.__daf167857)continue;const w=function(){const out=old.apply(this,arguments);try{syncActions()}catch(e){}return out};w.__daf167857=true;w.__dafOriginal=old;core[name]=w}return true}
function install(){if(!DOC)return false;wrapCore();if(!installed){DOC.addEventListener("pointerdown",captureBeforeMove,true);DOC.addEventListener("touchstart",captureBeforeMove,true);DOC.addEventListener("click",watchAfterMove,true);installed=true}for(const ms of [0,50,250,750])setTimeout(syncActions,ms);return true}
ROOT.DungeonAuthoredActionFix167857={VERSION,APP_VERSION,readRt,authored,activeHero,positionKey,syncLegacyChestButton,syncActions,captureBeforeMove,watchAfterMove,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}
})();
