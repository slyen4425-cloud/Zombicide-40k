/* GenSrpG V16.78.43 — UI/PWA recovery guard.
   UI-only: prevents Dungeon builder/editor modals from leaking into the home flow.
   No combat, movement, timeline, spawn or Dungeon runtime behavior is changed. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.78.43";
const STYLE_ID="gensUiRecovery167843Styles";
const BUILDER_MODALS=["drc300Modal","drc100Modal"];
function ensureStyle(){
  if(!DOC)return false;
  let style=DOC.getElementById(STYLE_ID);
  if(style)return true;
  style=DOC.createElement("style");
  style.id=STYLE_ID;
  style.textContent="#drc300Modal:not(.open),#drc100Modal:not(.open){display:none!important}#drc300Modal.open,#drc100Modal.open{display:block!important}";
  (DOC.head||DOC.documentElement)?.appendChild(style);
  return true;
}
function closeUnexpectedBuilderModals(){
  if(!DOC)return 0;
  let closed=0;
  for(const id of BUILDER_MODALS){
    const el=DOC.getElementById(id);
    if(!el)continue;
    if(el.classList?.contains("open")){el.classList.remove("open");closed++}
  }
  return closed;
}
function install(){
  try{ROOT.GENSRPG_VERSION=APP_VERSION}catch(e){}
  ensureStyle();
  closeUnexpectedBuilderModals();
  return true;
}
ROOT.GenSrpGUiRecovery167843={VERSION,APP_VERSION,STYLE_ID,BUILDER_MODALS,ensureStyle,closeUnexpectedBuilderModals,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}else install();
})();