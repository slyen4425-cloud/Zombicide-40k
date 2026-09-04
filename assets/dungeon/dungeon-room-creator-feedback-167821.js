/* GenSrpG V16.78.21 — Room Creator V2 autosave feedback.
   UI-only patch: interactions are already persisted by V2; this makes that persistence explicit. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="16.78.21";

function base(){return ROOT.DungeonRoomCreator100||null}
function v2(){return ROOT.DungeonRoomCreatorV2||null}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function inferRoomId(){
  const b=base();if(!b)return "";
  const name=String(DOC?.getElementById("drc100Name")?.value||"").trim();
  const matches=(b.loadLibrary?.()||[]).filter(r=>String(r.name||"")===name).sort((a,b)=>String(b.updatedAt||"").localeCompare(String(a.updatedAt||"")));
  return String(matches[0]?.id||"");
}
function ensureFeedback(){
  if(!DOC)return null;
  const controls=DOC.getElementById("drc200Controls");if(!controls)return null;
  let box=DOC.getElementById("drc200AutosaveStatus");
  if(!box){
    box=DOC.createElement("div");
    box.id="drc200AutosaveStatus";
    box.setAttribute("role","status");
    box.style.cssText="margin:7px 0;padding:8px 10px;border:1px solid #355d42;border-radius:9px;background:#132018;color:#bde5c7;font-size:12px;font-weight:800";
    const roomStatus=DOC.getElementById("drc200RoomStatus");
    if(roomStatus?.parentNode)roomStatus.parentNode.insertBefore(box,controls);
    else controls.parentNode?.insertBefore(box,controls);
  }
  return box;
}
function summaryFor(roomId){
  const api=v2();if(!api||!roomId)return {puzzles:0,traps:0,caches:0};
  const meta=api.roomMeta(roomId);
  return {
    puzzles:(meta.attachments||[]).filter(a=>a.kind==="puzzle").length,
    traps:(meta.attachments||[]).filter(a=>a.kind==="trap").length,
    caches:(meta.cacheLinks||[]).filter(l=>l.targetRoomId).length
  };
}
function updateSummary(message){
  const box=DOC?.getElementById("drc200AutosaveStatus")||ensureFeedback();
  if(!box)return;
  const roomId=inferRoomId(),s=summaryFor(roomId);
  const prefix=message||"✅ Sauvegarde automatique active";
  const html=esc(prefix)+'<br><span style="font-weight:500;color:#9fc8aa">Interactions enregistrées : '+s.puzzles+' énigme'+(s.puzzles===1?"":"s")+' · '+s.traps+' piège'+(s.traps===1?"":"s")+' · '+s.caches+' cache'+(s.caches===1?"":"s")+' liée'+(s.caches===1?"":"s")+'</span>';
  if(box.innerHTML!==html)box.innerHTML=html;
}
function stamp(label){
  const t=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"});
  updateSummary("✅ "+label+" — enregistré automatiquement à "+t);
}
function wrap(name,label){
  const api=v2();if(!api||api["__feedback_"+name])return;
  const old=api[name];if(typeof old!=="function")return;
  api[name]=function(){
    const roomId=inferRoomId();
    const before=roomId?JSON.stringify(api.roomMeta(roomId)):"";
    const out=old.apply(this,arguments);
    const after=roomId?JSON.stringify(api.roomMeta(roomId)):"";
    if(before!==after)stamp(label);
    else setTimeout(()=>updateSummary(),0);
    return out;
  };
  api["__feedback_"+name]=true;
}
function install(){
  if(!DOC||!v2())return;
  ensureFeedback();
  wrap("addAttachmentUI","Interaction ajoutée");
  wrap("removeAttachmentUI","Interaction supprimée");
  wrap("saveCacheLinkUI","Liaison de cache mise à jour");
  updateSummary();
}
ROOT.DungeonRoomCreatorFeedback167821={VERSION,inferRoomId,summaryFor,updateSummary,install};
if(DOC){
  if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install();
  if(typeof MutationObserver==="function")new MutationObserver(()=>install()).observe(DOC.documentElement,{childList:true,subtree:true});
}
})();
