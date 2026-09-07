/* GenSrpG Dungeon — tactical grid flicker guard V16.78.76.
   Keeps the last fully textured tactical grid visible while DungeonCore01 redraws underneath.
   Visual-only: no movement, combat, spawn, timeline, room or persistence state changes. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="1.0.0",APP_VERSION="16.78.76";
const OVERLAY_CLASS="dgf167876Snapshot";
let retries=0,releaseTimer=0;
function runtime(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function authored(x){return !!(x?.last?.authoredRuntime167839&&x?.last?.worldDungeonId&&x?.last?.worldNodeId)}
function ensureStyle(){if(!DOC||DOC.getElementById("dgf167876Style"))return;const s=DOC.createElement("style");s.id="dgf167876Style";s.textContent='.'+OVERLAY_CLASS+'{position:fixed!important;margin:0!important;pointer-events:none!important;z-index:2147483000!important;transform:none!important;transform-origin:0 0!important;contain:layout paint style!important;overflow:hidden!important}.'+OVERLAY_CLASS+' *{pointer-events:none!important}';DOC.head?.appendChild(s)}
function clearSnapshot(){if(!DOC)return false;for(const el of DOC.querySelectorAll("."+OVERLAY_CLASS))el.remove();if(releaseTimer){clearTimeout(releaseTimer);releaseTimer=0}return true}
function beginSnapshot(){
  if(!DOC)return null;const x=runtime();if(!authored(x))return null;
  const grid=DOC.querySelector("#dc047RoomBoard .dc047Grid");if(!grid)return null;
  clearSnapshot();ensureStyle();
  let rect;try{rect=grid.getBoundingClientRect()}catch(e){return null}
  if(!rect||rect.width<2||rect.height<2)return null;
  const clone=grid.cloneNode(true);
  clone.classList.add(OVERLAY_CLASS);clone.removeAttribute("id");clone.setAttribute("aria-hidden","true");
  for(const el of clone.querySelectorAll("[id]"))el.removeAttribute("id");
  clone.style.setProperty("left",Math.round(rect.left)+"px","important");
  clone.style.setProperty("top",Math.round(rect.top)+"px","important");
  clone.style.setProperty("width",Math.round(rect.width)+"px","important");
  clone.style.setProperty("height",Math.round(rect.height)+"px","important");
  DOC.body.appendChild(clone);
  return clone;
}
function releaseSnapshot(snapshot){
  if(!snapshot)return false;
  const remove=()=>{try{snapshot.remove()}catch(e){};if(releaseTimer){clearTimeout(releaseTimer);releaseTimer=0}};
  if(typeof ROOT.requestAnimationFrame==="function")ROOT.requestAnimationFrame(remove);else setTimeout(remove,0);
  releaseTimer=setTimeout(remove,160);
  return true;
}
function wrap(){
  const core=ROOT.DungeonCore01;if(!core)return false;
  for(const name of ["render","show"]){
    const old=core[name];if(typeof old!=="function"||old.__dgf167876)continue;
    const wrapped=function(){const snapshot=beginSnapshot();let out;try{out=old.apply(this,arguments)}finally{try{ROOT.DungeonAuthoredCacheVisual167852?.sync?.()}catch(e){}releaseSnapshot(snapshot)}return out};
    wrapped.__dgf167876=true;wrapped.__dgfOriginal=old;core[name]=wrapped;
  }
  return true;
}
function install(){ensureStyle();if(wrap())return true;if(retries++<30&&typeof setTimeout==="function")setTimeout(install,100);return false}
ROOT.DungeonGridFlickerGuard167876={VERSION,APP_VERSION,OVERLAY_CLASS,runtime,authored,beginSnapshot,releaseSnapshot,clearSnapshot,wrap,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}
})();
