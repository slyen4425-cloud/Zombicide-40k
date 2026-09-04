/* GenSrpG V16.78.30 — Room Creator configuration grid capture.
   Intercepts configuration touches before the historical Room Creator paint listener.
   UI-only: no combat, movement, spawn, timeline or world-runtime behavior is changed. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.78.30";
let boundGrid=null,boundHandler=null,installed=false;
function templateActive(){return !!DOC?.getElementById("drt167828Toggle")?.classList?.contains("on")}
function zoneActive(){return !!DOC?.getElementById("drv167826Toggle")?.classList?.contains("on")}
function stop(ev){ev?.preventDefault?.();ev?.stopPropagation?.();ev?.stopImmediatePropagation?.()}
function roomObject(index){
  const api=ROOT.DungeonRoomTemplateContent167828,base=ROOT.DungeonRoomCreator100;
  const rid=api?.inferRoomId?.();const room=rid?base?.findRoom?.(rid):null;
  return String(room?.cells?.[Number(index)]?.object||"");
}
function capture(ev){
  const el=ev?.target?.closest?.("[data-drc-index]");if(!el)return false;
  const idx=Number(el.dataset.drcIndex);
  if(templateActive()){
    stop(ev);const obj=roomObject(idx);ROOT.DungeonRoomTemplateContent167828?.openEditor?.(idx,obj);return true;
  }
  if(zoneActive()){
    stop(ev);ROOT.DungeonRoomVisualConfig167826?.activateCell?.(idx);return true;
  }
  return false;
}
function bindGrid(){
  if(!DOC)return false;const grid=DOC.getElementById("drc100Grid");if(!grid)return false;
  if(boundGrid===grid&&boundHandler)return true;
  if(boundGrid&&boundHandler)try{boundGrid.removeEventListener("pointerdown",boundHandler,true)}catch(e){}
  boundGrid=grid;boundHandler=capture;grid.addEventListener("pointerdown",boundHandler,true);return true;
}
function wrapRoomOpen(){
  const api=ROOT.DungeonRoomCreator100;if(!api||api.__drgc167830Wrapped||typeof api.open!=="function")return false;
  const old=api.open;api.open=function(){const out=old.apply(this,arguments);setTimeout(bindGrid,0);return out};api.__drgc167830Wrapped=true;return true;
}
function install(){
  if(installed){wrapRoomOpen();bindGrid();return true}installed=true;try{ROOT.GENSRPG_VERSION=APP_VERSION}catch(e){}
  wrapRoomOpen();bindGrid();return true;
}
ROOT.DungeonRoomGridCapture167830={VERSION,APP_VERSION,templateActive,zoneActive,capture,bindGrid,wrapRoomOpen,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}else install();
})();
