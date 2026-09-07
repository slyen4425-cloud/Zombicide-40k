/* GenSrpG Dungeon — UI cleanup 16.78.74.
   Visual-only cleanup for redundant room-summary blocks.
   Keeps chest/enemy gameplay state, interactions, detection and combat logic untouched. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="1.0.1",APP_VERSION="16.78.74";
const HIDDEN_CLASS="dui167874Hidden";
let retries=0;
function norm(s){return String(s||"").replace(/\s+/g," ").trim()}
function isEnemySummaryText(text){return /ennemi\(s\) vivant\(s\)/i.test(norm(text))}
function isGhostChestText(text){const t=norm(text);return /Coffre\s+(?:commun|rare|epic|épique|legendary|légendaire)/i.test(t)&&!/Va sur la case/i.test(t)}
function smallestCard(node,matcher){
  let el=node?.nodeType===1?node:node?.parentElement,candidate=null;
  while(el&&el!==DOC?.body){
    const text=norm(el.textContent);if(!matcher(text))break;
    candidate=el;const parent=el.parentElement;if(!parent)break;
    const ptext=norm(parent.textContent);
    if(!matcher(ptext)||/Salle actuelle/i.test(ptext))break;
    el=parent;
  }
  return candidate;
}
function hideRedundant(root){
  if(!DOC)return 0;const scope=root?.querySelectorAll?root:DOC;let count=0;
  for(const el of scope.querySelectorAll("div,section,article,p,span,strong")){
    if(el.classList?.contains(HIDDEN_CLASS))continue;
    const text=norm(el.textContent);if(!text)continue;
    let card=null;
    if(isEnemySummaryText(text))card=smallestCard(el,isEnemySummaryText);
    else if(isGhostChestText(text))card=smallestCard(el,isGhostChestText);
    if(!card||card.classList?.contains(HIDDEN_CLASS))continue;
    card.classList.add(HIDDEN_CLASS);card.setAttribute("aria-hidden","true");count++;
  }
  return count;
}
function ensureStyle(){if(!DOC||DOC.getElementById("dui167874Style"))return;const s=DOC.createElement("style");s.id="dui167874Style";s.textContent='.'+HIDDEN_CLASS+'{display:none!important}';DOC.head?.appendChild(s)}
function sync(){ensureStyle();return hideRedundant(DOC)}
function wrap(){
  const core=ROOT.DungeonCore01;if(!core)return false;
  for(const name of ["render","show"]){
    const old=core[name];if(typeof old!=="function"||old.__dui167874)continue;
    const w=function(){const out=old.apply(this,arguments);try{sync()}catch(e){}return out};
    w.__dui167874=true;w.__duiOriginal=old;core[name]=w;
  }
  return true;
}
function install(){if(wrap()){for(const ms of [0,50,250,700])setTimeout(sync,ms);return true}if(retries++<30)setTimeout(install,100);return false}
ROOT.DungeonUICleanup167874={VERSION,APP_VERSION,isEnemySummaryText,isGhostChestText,hideRedundant,sync,wrap,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}
})();
