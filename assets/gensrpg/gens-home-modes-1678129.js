/* GenSrpG V16.78.129 — home mode routing recovery.
   Restores an explicit Dungeon Builder access and separates Creature Capture
   from the RPG/Adventure family at the HOME UI level without changing gameplay. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis;
const D=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.78.129";
let installed=false,oldOpenFamily=null,oldRenderVisible=null;

function esc(v){
  try{return typeof R.z40kEscHtml==="function"?R.z40kEscHtml(String(v??"")):String(v??"").replace(/[&<>\"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]))}catch(e){return String(v??"")}
}
function attr(v){
  try{return typeof R.z40kEscAttr==="function"?R.z40kEscAttr(String(v??"")):esc(v).replace(/'/g,"&#39;")}catch(e){return String(v??"").replace(/'/g,"&#39;")}
}
function profiles(){try{return (R.loadGameProfiles?.()||[]).filter(p=>p?.gameStyle==="dungeon")}catch(e){return []}}
function isCapture(p){try{return R.gensContentFamilyForProfile?.(p)==="creature"}catch(e){return p?.rpgUniverse?.gameplay?.profile==="creature"}}
function captureProfiles(){return profiles().filter(isCapture)}
function rpgProfilesOnly(){return profiles().filter(p=>!isCapture(p))}

function injectRootCards(){
  if(!D)return false;
  const grid=D.querySelector("#gensRootHome .gensRootModeGrid");
  if(!grid)return false;
  let capture=D.getElementById("gensCaptureRootMode1678129");
  if(!capture){
    capture=D.createElement("button");
    capture.type="button";
    capture.id="gensCaptureRootMode1678129";
    capture.className="gensRootModeCard capture";
    capture.innerHTML="<span>🐲</span><b>MODE CAPTURE</b><small>Créatures, équipes, capture, évolutions et combats de dresseurs.</small>";
    capture.onclick=()=>R.openGensFamily?.("capture");
    const pvp=[...grid.querySelectorAll(".gensRootModeCard")].find(x=>/DUEL|PVP/i.test(x.textContent||""));
    grid.insertBefore(capture,pvp||null);
  }
  return true;
}

function captureCard(p){
  const id=attr(p?.id||"");
  const name=esc(p?.name||"Univers Capture");
  const icon=esc(p?.rpgUniverse?.icon||"🐲");
  const meta=(p?.heroPool?.length||0)+" dresseur(s) · "+(p?.objectPool?.length||0)+" objet(s) · Capture activée";
  const protectedUniverse=!!(p?.builtIn||p?.factory);
  return '<div class="gensFamilyGameCard gensUniverseCard" data-capture-profile="'+id+'">'+
    '<button type="button" class="gensUniverseMainBtn" onclick="openGensBuiltInGame(\''+id+'\',\'adventure\')">'+
      '<span>'+icon+'</span><b>'+name+'</b><small>'+esc(meta)+'</small></button>'+
    '<div class="gensUniverseCardActions">'+
      '<button type="button" onclick="selectRpgUniverseProfile(\''+id+'\');openRpgUniverseEditor()">✏️ MODIFIER</button>'+
      (protectedUniverse?'':'<button type="button" class="creatorDelete" onclick="deleteRpgUniverseProfile(\''+id+'\')">🗑️ SUPPRIMER</button>')+
    '</div></div>';
}
function renderCaptureCards(){
  const list=captureProfiles();
  const cards=list.length?list.map(captureCard).join(""):'<div class="empty">Aucun univers Capture disponible.</div>';
  return cards+'<button type="button" class="gensFamilyGameCard" onclick="GensHomeModes1678129.createCaptureUniverse()"><span>➕</span><b>NOUVEL UNIVERS CAPTURE</b><small>Créer un nouvel univers puis ouvrir directement le profil Capture.</small></button>';
}
function addDungeonBuilderCard(host){
  if(!host||D.getElementById("gensDungeonBuilderCard1678129"))return;
  const b=D.createElement("button");b.type="button";b.id="gensDungeonBuilderCard1678129";b.className="gensFamilyGameCard";
  b.innerHTML="<span>🧱</span><b>DUNGEON BUILDER</b><small>Créer et modifier salles, géométrie, portes, événements, pièges, coffres et boss.</small>";
  b.onclick=()=>R.GensHomeModes1678129?.openDungeonBuilder?.();
  host.appendChild(b);
}
function stripCaptureFromAdventure(host){
  if(!host)return;
  for(const card of [...host.querySelectorAll("[data-rpg-profile]")]){
    const id=card.getAttribute("data-rpg-profile");
    const p=profiles().find(x=>String(x?.id)===String(id));
    if(p&&isCapture(p))card.remove();
  }
  addDungeonBuilderCard(host);
}
function showCaptureFamily(){
  try{R.gensSelectedFamily="capture"}catch(e){}
  try{R.gensHideHomeLevels?.()}catch(e){}
  const page=D?.getElementById("gensFamilyHome");if(page)page.style.display="block";
  const title=D?.getElementById("gensFamilyTitle"),heading=D?.getElementById("gensFamilyHeading"),hint=D?.getElementById("gensFamilyHint"),host=D?.getElementById("gensFamilyGames");
  if(title)title.textContent="🐲 Mode Capture";
  if(heading)heading.textContent="Univers Capture de créatures";
  if(hint)hint.textContent="Mode indépendant : dresseurs, équipes de créatures, captures, évolutions et combats dédiés.";
  if(host)host.innerHTML=renderCaptureCards();
  try{R.scrollTo?.(0,0)}catch(e){}
}
function renderCurrentFamily(){
  const host=D?.getElementById("gensFamilyGames");if(!host)return;
  const fam=R.gensSelectedFamily;
  if(fam==="capture"){host.innerHTML=renderCaptureCards();return}
  if(typeof oldRenderVisible==="function")oldRenderVisible.apply(R,arguments);
  if(fam==="adventure")stripCaptureFromAdventure(host);
}
function createCaptureUniverse(){
  if(typeof R.createNewRpgUniverse!=="function")return false;
  R.createNewRpgUniverse(true);
  setTimeout(()=>{
    try{R.applyRpgGameplayPreset?.("creature")}catch(e){}
    try{R.renderRpgGameplayUi?.()}catch(e){}
  },0);
  return true;
}
function openDungeonBuilder(){
  try{
    const id=R.GAME_PROFILE_DUNGEON_ID||"game_profile_dungeon_demo";
    if(typeof R.selectRpgUniverseProfile==="function")R.selectRpgUniverseProfile(id);
    else{
      const p=profiles().find(x=>String(x?.id)===String(id));
      if(p)R.applyGameProfile?.(p,false);
    }
    if(typeof R.openDungeonAdvancedEditor==="function"){R.openDungeonAdvancedEditor();return true}
  }catch(e){console.warn("GenSrpG Dungeon Builder home route",e)}
  return false;
}
function patchFunctions(){
  if(typeof R.openGensFamily==="function"&&!R.openGensFamily.__ghm1678129){
    oldOpenFamily=R.openGensFamily;
    const wrapped=function(family){if(family==="capture")return showCaptureFamily();const out=oldOpenFamily.apply(this,arguments);if(family==="adventure")setTimeout(()=>stripCaptureFromAdventure(D?.getElementById("gensFamilyGames")),0);return out};
    wrapped.__ghm1678129=true;wrapped.__original=oldOpenFamily;R.openGensFamily=wrapped;
  }
  if(typeof R.renderGensFamilyGamesIfVisible==="function"&&!R.renderGensFamilyGamesIfVisible.__ghm1678129){
    oldRenderVisible=R.renderGensFamilyGamesIfVisible;
    const wrapped=function(){return renderCurrentFamily.apply(this,arguments)};
    wrapped.__ghm1678129=true;wrapped.__original=oldRenderVisible;R.renderGensFamilyGamesIfVisible=wrapped;
  }
  return true;
}
function install(){
  injectRootCards();patchFunctions();
  let tries=0;const retry=()=>{injectRootCards();patchFunctions();if(tries++<20)setTimeout(retry,120)};setTimeout(retry,40);
  installed=true;return true;
}
R.GensHomeModes1678129={VERSION,APP_VERSION,install,injectRootCards,captureProfiles,rpgProfilesOnly,renderCaptureCards,showCaptureFamily,createCaptureUniverse,openDungeonBuilder};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
