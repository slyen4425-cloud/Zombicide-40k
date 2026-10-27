"use strict";
/* A temporary Capture-owned grid view, never a replacement for Exploration or Combat. */
(function(root){
 function mount({host,session,encounterAt,width=9,height=7}){
  if(!host||typeof host.appendChild!=="function"||!root.document)throw new TypeError("Zone host required");
  if(!session||typeof session.move!=="function"||typeof session.state!=="function")throw new TypeError("Zone session required");
  if(typeof encounterAt!=="function")throw new TypeError("Encounter resolver required");
  const doc=root.document,wrap=doc.createElement("section"),status=doc.createElement("p"),grid=doc.createElement("div"),controls=doc.createElement("div");
  wrap.setAttribute("aria-label","Zone provisoire Monster Capture");wrap.className="gens-capture-temporary-zone";
  grid.style.cssText="display:grid;grid-template-columns:repeat("+width+",minmax(0,1fr));gap:2px;max-width:540px;margin:auto";
  controls.style.cssText="display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin:12px auto";
  function paint(){
   const state=session.state(),zone=state.zone;grid.replaceChildren();
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const tile=doc.createElement("div");tile.style.cssText="aspect-ratio:1;display:grid;place-items:center;background:"+((x+y)%2?"#294635":"#34543e")+";border-radius:4px;color:white;font-size:clamp(13px,3vw,22px)";
    tile.textContent=x===zone.x&&y===zone.y?"🧍":encounterAt(x,y)?"🌿":"·";
    grid.appendChild(tile);
   }
   status.textContent=zone.locked?"Rencontre en cours — déplacement suspendu":state.disposed?"Zone fermée":"Déplace-toi dans la zone pour rencontrer une créature";
   for(const button of controls.querySelectorAll("button"))button.disabled=zone.locked||state.disposed;
  }
  function step(dx,dy){const result=session.move(dx,dy);paint();return result;}
  for(const [label,dx,dy] of [["↑",0,-1],["←",-1,0],["↓",0,1],["→",1,0]]){
   const button=doc.createElement("button");button.type="button";button.textContent=label;button.setAttribute("aria-label","Déplacement "+label);button.style.cssText="min-width:54px;min-height:48px";button.addEventListener("click",()=>step(dx,dy));controls.appendChild(button);
  }
  wrap.append(status,grid,controls);host.appendChild(wrap);paint();
  return Object.freeze({refresh:paint,step,dispose(){wrap.remove();}});
 }
 root.GensCaptureTemporaryZoneViewV1=Object.freeze({mount});
})(typeof window!=="undefined"?window:globalThis);
