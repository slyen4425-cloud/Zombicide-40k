/* GenSrpG V16.78.29 — Room Creator visual context hotfix, responsiveness-safe.
   Keeps context selection and legacy UI cleanup without observing the whole application DOM.
   No combat, movement, timeline or spawn behavior is changed. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="1.1.0",APP_VERSION="16.78.29";
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
  }catch(e){console.warn("GenSrpG V16.78.29 context selection",e)}
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
  retireLegacyUi();
  const api=visualApi();if(!api)return false;
  autoSelectVisibleContext();
  repairButton();repairHint();
  try{api.decorateGrid?.()}catch(e){}
  return true;
}
function install(){
  if(installed){refresh();return true}installed=true;
  try{ROOT.GENSRPG_VERSION=APP_VERSION}catch(e){}
  retireLegacyUi();
  const poll=()=>{
    if(refresh())return;
    timer=setTimeout(poll,50);
  };
  poll();
  return true;
}
ROOT.DungeonRoomVisualHotfix167827={VERSION,APP_VERSION,retireLegacyUi,autoSelectVisibleContext,repairButton,repairHint,refresh,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}else install();
})();
