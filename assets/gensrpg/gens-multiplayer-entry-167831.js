/* GenSrpG V16.78.31 — restore visible multiplayer entry points.
   UI bridge only: reuses the existing z40kOpenOnline / Supabase host-join system. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.78.31";
let installed=false;
function openOnline(){
  if(typeof ROOT.z40kOpenOnline==="function"){ROOT.z40kOpenOnline();return true}
  try{ROOT.showToast?.("Le module multijoueur n’est pas encore chargé.")}catch(e){}
  return false;
}
function ensureStyles(){if(!DOC||DOC.getElementById("gmp167831Styles"))return;const s=DOC.createElement("style");s.id="gmp167831Styles";s.textContent='.gmp167831Entry{margin:12px 0;padding:10px;border:1px solid #315a75;border-radius:13px;background:#101b22}.gmp167831Entry button{width:100%;background:#205f86!important;font-size:17px;padding:12px}.gmp167831Entry small{display:block;margin-top:6px;color:#a9c6d8;text-align:center;font-size:12px}';DOC.head?.appendChild(s)}
function makeEntry(id){const box=DOC.createElement("div");box.id=id;box.className="gmp167831Entry";box.innerHTML='<button type="button">🌐 MULTIJOUEUR — HÉBERGER / REJOINDRE</button><small>Créer une salle, rejoindre par code, partager l’invitation ou le QR code.</small>';const b=box.querySelector?.("button");if(b)b.onclick=openOnline;return box}
function ensureFor(containerId){
  if(!DOC)return false;const host=DOC.getElementById(containerId);if(!host)return false;const id="gmp167831_"+containerId;if(DOC.getElementById(id))return true;
  if(containerId==="gensGameHome"){
    const legacy=host.querySelector?.(".onlineBtn");if(legacy){legacy.style?.removeProperty?.("display");legacy.onclick=openOnline;legacy.textContent="🌐 MULTIJOUEUR — HÉBERGER / REJOINDRE";return true}
  }
  const entry=makeEntry(id),top=host.querySelector?.(".homeTop");if(top?.parentNode===host&&top.nextSibling)host.insertBefore(entry,top.nextSibling);else if(top?.parentNode===host)host.appendChild(entry);else host.insertBefore?.(entry,host.firstChild)||host.appendChild(entry);return true;
}
function ensureAll(){ensureStyles();let n=0;for(const id of ["gensRootHome","gensFamilyHome","gensGameHome"])if(ensureFor(id))n++;return n}
function install(){if(installed)return ensureAll();installed=true;try{ROOT.GENSRPG_VERSION=APP_VERSION}catch(e){}return ensureAll()}
ROOT.GenSrpGMultiplayerEntry167831={VERSION,APP_VERSION,openOnline,ensureFor,ensureAll,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}else install();
})();
