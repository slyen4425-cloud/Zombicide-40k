/* GenSrpG V16.78.21 — Room Creator V2 autosave feedback.
   UI-only patch: interactions are already persisted by V2; this makes that persistence explicit. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="16.78.21";
let lastMessage="✅ Sauvegarde automatique active";
function base(){return ROOT.DungeonRoomCreator100||null}
function v2(){return ROOT.DungeonRoomCreatorV2||null}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function inferRoomId(){const b=base();if(!b)return "";const name=String(DOC?.getElementById("drc100Name")?.value||"").trim();const matches=(b.loadLibrary?.()||[]).filter(r=>String(r.name||"")===name).sort((a,b)=>String(b.updatedAt||"").localeCompare(String(a.updatedAt||"")));return String(matches[0]?.id||"")}
function ensureFeedback(){if(!DOC)return null;const controls=DOC.getElementById("drc200Controls");if(!controls)return null;let box=DOC.getElementById("drc200AutosaveStatus");if(!box){box=DOC.createElement("div");box.id="drc200AutosaveStatus";box.setAttribute("role","status");box.style.cssText="margin:7px 0;padding:8px 10px;border:1px solid #355d42;border-radius:9px;background:#132018;color:#bde5c7;font-size:12px;font-weight:800";const roomStatus=DOC.getElementById("drc200RoomStatus");if(roomStatus?.parentNode)roomStatus.parentNode.insertBefore(box,controls);else controls.parentNode?.insertBefore(box,controls)}return box}
function summaryFor(roomId){const api=v2();if(!api||!roomId)return {puzzles:0,traps:0,caches:0};const meta=api.roomMeta(roomId);return {puzzles:(meta.attachments||[]).filter(a=>a.kind==="puzzle").length,traps:(meta.attachments||[]).filter(a=>a.kind==="trap").length,caches:(meta.cacheLinks||[]).filter(l=>l.targetRoomId).length}}
function updateSummary(message){const box=DOC?.getElementById("drc200AutosaveStatus")||ensureFeedback();if(!box)return;if(message)lastMessage=String(message);const roomId=inferRoomId(),s=summaryFor(roomId);const html=esc(lastMessage)+'<br><span style="font-weight:500;color:#9fc8aa">Interactions enregistrées : '+s.puzzles+' énigme'+(s.puzzles===1?"":"s")+' · '+s.traps+' piège'+(s.traps===1?"":"s")+' · '+s.caches+' cache'+(s.caches===1?"":"s")+' liée'+(s.caches===1?"":"s")+'</span>';if(box.innerHTML!==html)box.innerHTML=html}
function stamp(label){const t=new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"});updateSummary("✅ "+label+" — enregistré automatiquement à "+t)}
function wrap(name,label){const api=v2();if(!api||api["__feedback_"+name])return;const old=api[name];if(typeof old!=="function")return;api[name]=function(){const roomId=inferRoomId();const before=roomId?JSON.stringify(api.roomMeta(roomId)):"";const out=old.apply(this,arguments);const after=roomId?JSON.stringify(api.roomMeta(roomId)):"";if(before!==after)stamp(label);else setTimeout(()=>updateSummary(),0);return out};api["__feedback_"+name]=true}
function install(){if(!DOC||!v2())return;ensureFeedback();wrap("addAttachmentUI","Interaction ajoutée");wrap("removeAttachmentUI","Interaction supprimée");wrap("saveCacheLinkUI","Liaison de cache mise à jour");updateSummary()}
ROOT.DungeonRoomCreatorFeedback167821={VERSION,inferRoomId,summaryFor,updateSummary,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}
})();

/* V16.78.31 — charge la configuration intuitive et réexpose le multijoueur existant. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
let attempts=0;
function neutralizeLegacyLauncher(){if(!DOC)return;let el=DOC.getElementById("dzc167824Launch");if(!el){el=DOC.createElement("span");el.id="dzc167824Launch";el.setAttribute("aria-hidden","true");DOC.body.appendChild(el)}el.style.setProperty("display","none","important");el.remove=function(){this.style.setProperty("display","none","important")}}
function loadMultiplayerEntry(){
  if(!DOC||ROOT.GenSrpGMultiplayerEntry167831||DOC.getElementById("gmp167831Script"))return;
  const m=DOC.createElement("script");m.id="gmp167831Script";m.src="assets/gensrpg/gens-multiplayer-entry-167831.js?v=167831";m.async=false;DOC.body.appendChild(m);
}
function loadIntuitiveUI(){
  if(!DOC||ROOT.DungeonRoomContentUI167831||DOC.getElementById("dui167831Script"))return;
  const u=DOC.createElement("script");u.id="dui167831Script";u.src="assets/dungeon/dungeon-room-content-ui-167831.js?v=167831";u.async=false;DOC.body.appendChild(u);
}
function loadGridCapture(){
  if(!DOC)return;
  if(ROOT.DungeonRoomGridCapture167830){loadIntuitiveUI();return}
  if(DOC.getElementById("drgc167830Script")){setTimeout(loadGridCapture,50);return}
  const g=DOC.createElement("script");g.id="drgc167830Script";g.src="assets/dungeon/dungeon-room-grid-capture-167830.js?v=167831";g.async=false;g.onload=loadIntuitiveUI;DOC.body.appendChild(g);
}
function loadTemplateContent(){
  if(!DOC)return;
  if(ROOT.DungeonRoomTemplateContent167828){loadGridCapture();return}
  if(DOC.getElementById("drt167828Script")){setTimeout(loadTemplateContent,50);return}
  const t=DOC.createElement("script");t.id="drt167828Script";t.src="assets/dungeon/dungeon-room-template-content-167828.js?v=167831";t.async=false;t.onload=loadGridCapture;DOC.body.appendChild(t);
}
function loadHotfix(){
  if(!DOC)return;
  if(ROOT.DungeonRoomVisualHotfix167827){loadTemplateContent();return}
  if(DOC.getElementById("drv167827Script")){setTimeout(loadHotfix,50);return}
  const h=DOC.createElement("script");h.id="drv167827Script";h.src="assets/dungeon/dungeon-room-visual-hotfix-167827.js?v=167831";h.async=false;h.onload=loadTemplateContent;DOC.body.appendChild(h);
}
function loadVisualConfig(){
  if(!DOC)return;
  if(ROOT.DungeonRoomVisualConfig167826){loadHotfix();return}
  if(DOC.getElementById("drv167826Script")){setTimeout(loadVisualConfig,50);return}
  if(!ROOT.DungeonZoneContent167824&&attempts++<80){setTimeout(loadVisualConfig,50);return}
  neutralizeLegacyLauncher();
  const s=DOC.createElement("script");s.id="drv167826Script";s.src="assets/dungeon/dungeon-room-visual-config-167826.js?v=167831";s.async=false;s.onload=loadHotfix;DOC.body.appendChild(s);
}
function boot(){loadMultiplayerEntry();loadVisualConfig()}
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",boot,{once:true});else boot()}
})();
