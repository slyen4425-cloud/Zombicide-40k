/* GenSrpG V16.78.66 — Room Creator visual polish, responsiveness-safe.
   Paints supported floor themes with their existing six-variant texture sets and uses
   the validated centered stone-block asset for blocked wall cells. No combat, movement,
   timeline, spawn behavior or room geometry is changed. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="1.3.0",APP_VERSION="16.78.66";
const FLOOR_ROOT="assets/dungeon/creatures/";
const WALL_ASSET=FLOOR_ROOT+"dng_wall_block.jpg";
const FLOOR_THEMES=new Set(["stone","cave","forest","ice","lava"]);
let installed=false,timer=0;

function visualApi(){return ROOT.DungeonRoomVisualConfig167826||ROOT.DungeonRoomVisualConfig167825||null}
function retireLegacyUi(){
  if(!DOC)return false;
  let st=DOC.getElementById("drv167827LegacyStyles");
  if(!st){
    st=DOC.createElement("style");st.id="drv167827LegacyStyles";
    st.textContent="#dzc167824Launch,#drr167822Panel{display:none!important;visibility:hidden!important;pointer-events:none!important}";
    DOC.head?.appendChild(st);
  }
  for(const id of ["dzc167824Launch","drr167822Panel"]){
    const el=DOC.getElementById(id);if(el){el.style?.setProperty?.("display","none","important");el.setAttribute?.("aria-hidden","true")}
  }
  return true;
}
function ensureThemeStyles(){
  if(!DOC||DOC.getElementById("drv167827ThemeStyles"))return;
  const st=DOC.createElement("style");st.id="drv167827ThemeStyles";
  st.textContent=".drc100Cell.drv167827Textured{background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important}.drc100Cell.drv167827Textured.obj{font-size:20px;text-shadow:0 1px 3px #000,0 0 5px #000}.drc100Cell.wall{background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important;color:transparent!important;text-shadow:none!important;border-color:#4f4a43!important}";
  DOC.head?.appendChild(st);
}
function theme(){
  const value=String(DOC?.getElementById("drc100Theme")?.value||"stone").toLowerCase();
  return FLOOR_THEMES.has(value)?value:"";
}
function floorAsset(themeName,index){
  if(!FLOOR_THEMES.has(String(themeName||"")))return "";
  const variant=String((Math.max(0,Number(index)||0)%6)+1).padStart(2,"0");
  return FLOOR_ROOT+"dng_floor_"+themeName+"_"+variant+".png";
}
function paintThemeTextures(){
  if(!DOC)return false;ensureThemeStyles();
  const grid=DOC.getElementById("drc100Grid"),themeName=theme();
  if(!grid)return false;
  const cells=Array.from(grid.querySelectorAll?.(".drc100Cell")||[]);
  if(!cells.length)return false;
  for(let i=0;i<cells.length;i++){
    const el=cells[i],wall=el.classList?.contains("wall");
    if(wall){
      el.classList?.remove("drv167827Textured");
      if(el.style)el.style.backgroundImage='url("'+WALL_ASSET+'")';
      continue;
    }
    if(!themeName){
      el.classList?.remove("drv167827Textured");
      if(el.style)el.style.backgroundImage="";
      continue;
    }
    const url=floorAsset(themeName,i);
    if(el.style&&url)el.style.backgroundImage='url("'+url+'")';
    el.classList?.add("drv167827Textured");
  }
  if(grid.dataset)grid.dataset.drv167827Theme=themeName;
  return true;
}
function autoSelectVisibleContext(){
  if(!DOC)return false;
  const panel=DOC.getElementById("drv167826Panel");
  const sel=DOC.getElementById("drv167826Context");
  if(!panel||!sel||!sel.value)return false;
  const key=String(sel.value||"");
  if(panel.dataset?.drv167827Selected===key)return true;
  if(panel.dataset)panel.dataset.drv167827Selected=key;
  try{
    if(typeof sel.onchange==="function")sel.onchange();
    else sel.dispatchEvent?.(new Event("change",{bubbles:true}));
  }catch(e){console.warn("GenSrpG V16.78.66 context selection",e)}
  return true;
}
function repairButton(){
  if(!DOC)return false;
  const btn=DOC.getElementById("drv167826Toggle");
  const sel=DOC.getElementById("drv167826Context");
  if(!btn)return false;
  if(sel?.value){
    btn.disabled=false;
    btn.setAttribute("aria-disabled","false");
    btn.title="Active le mode configuration puis touche directement un élément sur la grille.";
  }else{
    btn.disabled=true;
    btn.setAttribute("aria-disabled","true");
    btn.title="Cette pièce doit d’abord être utilisée dans une zone du World Builder.";
  }
  return true;
}
function repairHint(){
  if(!DOC)return false;
  const panel=DOC.getElementById("drv167826Panel"),sel=DOC.getElementById("drv167826Context");
  const hint=panel?.querySelector?.(".drv167826Hint");
  if(!hint)return false;
  if(!sel?.value){
    const msg="Cette pièce n’est encore liée à aucune zone du World Builder. Ajoute-la au monde, puis reviens ici pour configurer directement ses éléments.";
    if(hint.textContent!==msg)hint.textContent=msg;
  }
  return true;
}
function refresh(){
  retireLegacyUi();ensureThemeStyles();paintThemeTextures();
  const api=visualApi();if(!api)return false;
  autoSelectVisibleContext();
  repairButton();repairHint();
  try{api.decorateGrid?.()}catch(e){}
  paintThemeTextures();
  return true;
}
function relevantEventTarget(target){
  if(!target?.closest)return false;
  return !!target.closest("#drc100Modal,#drc100Launcher,#drv167826Panel,#drt167828Panel");
}
function install(){
  if(installed){refresh();return true}installed=true;
  try{ROOT.GENSRPG_VERSION=APP_VERSION}catch(e){}
  retireLegacyUi();ensureThemeStyles();
  if(DOC){
    DOC.addEventListener("change",e=>{if(relevantEventTarget(e.target))setTimeout(refresh,0)},true);
    DOC.addEventListener("click",e=>{if(relevantEventTarget(e.target)&&!e.target?.closest?.(".drc100Cell"))setTimeout(refresh,0)},true);
  }
  const poll=()=>{
    if(refresh())return;
    timer=setTimeout(poll,50);
  };
  poll();
  return true;
}
ROOT.DungeonRoomVisualHotfix167827={VERSION,APP_VERSION,FLOOR_THEMES,WALL_ASSET,floorAsset,paintThemeTextures,retireLegacyUi,autoSelectVisibleContext,repairButton,repairHint,refresh,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}else install();
})();
