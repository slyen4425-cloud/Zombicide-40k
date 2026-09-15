/* GenSrpG V16.78.114.14 — UI/PWA recovery + single Dungeon view authority.
   The Dungeon page, character sheet and root home are mutually exclusive views.
   Exploration walls keep a dark native-cell fallback during redraw/zoom: no extra IMG,
   no wall observer, no post-render injection. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="2.0.1",APP_VERSION="16.78.114.14";
const STYLE_ID="gensUiRecovery167843Styles";
const VIEW_ATTR="data-gens-dungeon-view";
const WALL_ASSET="assets/dungeon/creatures/dng_wall_block.jpg";
const BUILDER_MODALS=["drc300Modal","drc100Modal"];
const TRAP_SCRIPT_ID="dungeonExactTrapRuntime167845Script";
const ZONE_LINK_SCRIPT_ID="dungeonZoneLinks167846Script";
let patchedOpenChar=false,patchedDungeonCore=false;
function ensureStyle(){
  if(!DOC)return false;
  let style=DOC.getElementById(STYLE_ID);
  if(!style){style=DOC.createElement("style");style.id=STYLE_ID;(DOC.head||DOC.documentElement)?.appendChild(style)}
  style.textContent=`
    #drc300Modal:not(.open),#drc100Modal:not(.open){display:none!important}
    #drc300Modal.open,#drc100Modal.open{display:block!important}
    body[${VIEW_ATTR}="sheet"] #gensDungeonCore01{display:none!important}
    body[${VIEW_ATTR}="sheet"] #sheet{display:block!important}
    body[${VIEW_ATTR}="home"] #gensDungeonCore01{display:none!important}
    body[${VIEW_ATTR}="home"] #sheet{display:none!important}
    body[${VIEW_ATTR}="home"] #gensRootHome{display:block!important}
    #dc047RoomBoard,#dc047RoomBoard .dc047Grid{background-color:#0f0e0c!important}
    #dc047RoomBoard .dc047Grid>.dc047Cell{background-color:#171512!important}
    #dc047RoomBoard .dc047Grid>.dc047Cell.wall,
    #dc047RoomBoard .dc047Grid>.dc047Cell.dav167870WallCell,
    #dc047RoomBoard .dc047Grid>.dc047Cell.gtv2111WallCell,
    #dc047RoomBoard .dc047Grid>.dc047Cell.gtv2112WallCell,
    #dc047RoomBoard .dc047Grid>.dc047Cell.gtv2113Wall{
      background-color:#171512!important;background-image:url("${WALL_ASSET}")!important;
      background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important
    }
  `;
  return true;
}
function closeUnexpectedBuilderModals(){
  if(!DOC)return 0;let closed=0;
  for(const id of BUILDER_MODALS){const el=DOC.getElementById(id);if(el?.classList?.contains("open")){el.classList.remove("open");closed++}}
  return closed;
}
function setView(mode){
  const value=["dungeon","sheet","home"].includes(String(mode))?String(mode):"dungeon";
  try{DOC?.body?.setAttribute?.(VIEW_ATTR,value)}catch(e){}
  try{ROOT.__gensDungeonViewMode=value}catch(e){}
  return value;
}
function view(){try{return DOC?.body?.getAttribute?.(VIEW_ATTR)||ROOT.__gensDungeonViewMode||"dungeon"}catch(e){return "dungeon"}}
function enforceView(mode=view()){
  if(!DOC)return mode;mode=setView(mode);
  const dungeon=DOC.getElementById("gensDungeonCore01"),sheet=DOC.getElementById("sheet"),home=DOC.getElementById("gensRootHome");
  if(mode==="sheet"){
    if(dungeon)dungeon.style.setProperty("display","none","important");
    if(sheet)sheet.style.setProperty("display","block","important");
  }else if(mode==="home"){
    if(dungeon)dungeon.style.setProperty("display","none","important");
    if(sheet)sheet.style.setProperty("display","none","important");
    if(home)home.style.setProperty("display","block","important");
  }else{
    if(dungeon)dungeon.style.removeProperty("display");
  }
  return mode;
}
function dungeonVisible(){
  const el=DOC?.getElementById?.("gensDungeonCore01");if(!el)return false;
  try{const cs=ROOT.getComputedStyle?.(el);return !cs||cs.display!=="none"}catch(e){return el.style?.display!=="none"}
}
function patchOpenChar(){
  const old=ROOT.openChar;if(typeof old!=="function")return false;
  if(old.__gens11414ViewAuthority){patchedOpenChar=true;return true}
  const wrapped=function(){
    const fromDungeon=dungeonVisible()||view()==="dungeon";
    if(fromDungeon)setView("sheet");
    const out=old.apply(this,arguments);
    if(fromDungeon){enforceView("sheet");if(typeof queueMicrotask==="function")queueMicrotask(()=>enforceView("sheet"));if(typeof setTimeout==="function")setTimeout(()=>enforceView("sheet"),80)}
    return out;
  };
  wrapped.__gens11414ViewAuthority=true;wrapped.__original=old;ROOT.openChar=wrapped;patchedOpenChar=true;return true;
}
function patchDungeonCore(){
  const core=ROOT.DungeonCore01;if(!core)return false;
  if(typeof core.show==="function"&&!core.show.__gens11414ViewAuthority){
    const oldShow=core.show;const show=function(){setView("dungeon");const out=oldShow.apply(this,arguments);enforceView("dungeon");return out};show.__gens11414ViewAuthority=true;show.__original=oldShow;core.show=show;
  }
  if(typeof core.render==="function"&&!core.render.__gens11414ViewAuthority){
    const oldRender=core.render;const render=function(){if(view()!=="dungeon")return false;return oldRender.apply(this,arguments)};render.__gens11414ViewAuthority=true;render.__original=oldRender;core.render=render;
  }
  if(typeof core.quit==="function"&&!core.quit.__gens11414ViewAuthority){
    const oldQuit=core.quit;const quit=function(){const out=oldQuit.apply(this,arguments);if(out!==false){setView("home");enforceView("home");if(typeof queueMicrotask==="function")queueMicrotask(()=>enforceView("home"));if(typeof setTimeout==="function")setTimeout(()=>enforceView("home"),100)}return out};quit.__gens11414ViewAuthority=true;quit.__original=oldQuit;core.quit=quit;
  }
  patchedDungeonCore=true;return true;
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
  ensureStyle();closeUnexpectedBuilderModals();loadExactTrapRuntime();loadZoneLinksRuntime();patchOpenChar();patchDungeonCore();
  return true;
}
function installWithRetries(){install();if(typeof setTimeout==="function")for(const ms of [50,200,700,1800,4000])setTimeout(install,ms);return true}
ROOT.GenSrpGUiRecovery167843={VERSION,APP_VERSION,STYLE_ID,VIEW_ATTR,WALL_ASSET,BUILDER_MODALS,TRAP_SCRIPT_ID,ZONE_LINK_SCRIPT_ID,ensureStyle,closeUnexpectedBuilderModals,setView,view,enforceView,dungeonVisible,patchOpenChar,patchDungeonCore,loadExactTrapRuntime,loadZoneLinksRuntime,install,installWithRetries,status:()=>({view:view(),patchedOpenChar,patchedDungeonCore})};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",installWithRetries,{once:true});else installWithRetries()}else install();
})();