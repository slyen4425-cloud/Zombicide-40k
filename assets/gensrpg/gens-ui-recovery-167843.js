/* GenSrpG V16.78.43 — UI/PWA recovery guard.
   UI-only recovery remains unchanged. It also bootstraps isolated authored-Dungeon
   runtimes for exact traps and zone links. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="1.0.2",APP_VERSION="16.78.43";
const STYLE_ID="gensUiRecovery167843Styles";
const BUILDER_MODALS=["drc300Modal","drc100Modal"];
const TRAP_SCRIPT_ID="dungeonExactTrapRuntime167845Script";
const ZONE_LINK_SCRIPT_ID="dungeonZoneLinks167846Script";
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
function loadExactTrapRuntime(){
  if(ROOT.DungeonExactTrapRuntime167845)return true;
  if(!DOC||DOC.getElementById(TRAP_SCRIPT_ID)||typeof DOC.createElement!=="function")return false;
  const s=DOC.createElement("script");s.id=TRAP_SCRIPT_ID;s.src="assets/dungeon/dungeon-exact-trap-runtime-167845.js?v=167845";s.async=false;(DOC.body||DOC.documentElement)?.appendChild?.(s);return true;
}
function loadZoneLinksRuntime(){
  if(ROOT.DungeonZoneLinks167846)return true;
  if(!DOC||DOC.getElementById(ZONE_LINK_SCRIPT_ID)||typeof DOC.createElement!=="function")return false;
  const s=DOC.createElement("script");s.id=ZONE_LINK_SCRIPT_ID;s.src="assets/dungeon/dungeon-zone-links-167846.js?v=167846";s.async=false;(DOC.body||DOC.documentElement)?.appendChild?.(s);return true;
}
function install(){
  try{ROOT.GENSRPG_VERSION=APP_VERSION}catch(e){}
  ensureStyle();
  closeUnexpectedBuilderModals();
  loadExactTrapRuntime();
  loadZoneLinksRuntime();
  return true;
}
ROOT.GenSrpGUiRecovery167843={VERSION,APP_VERSION,STYLE_ID,BUILDER_MODALS,TRAP_SCRIPT_ID,ZONE_LINK_SCRIPT_ID,ensureStyle,closeUnexpectedBuilderModals,loadExactTrapRuntime,loadZoneLinksRuntime,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}else install();
})();