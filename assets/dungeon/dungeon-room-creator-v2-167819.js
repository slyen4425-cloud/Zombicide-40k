/* GenSrpG Dungeon Room Creator V2 — Phase 1
   Adds puzzle/trap attachments (cell / door / chest) and persistent cache -> sub-room links.
   Reuses Room Creator 1.0 storage/API and does not touch movement/combat/timeline/spawn. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="2.0.0";
const APP_VERSION="16.78.19";
const STORAGE_KEY="gensrpg_dungeon_room_interactions_v2";
const SCHEMA_VERSION=2;
const TARGET_TYPES=["cell","door","chest"];
const KINDS=["puzzle","trap"];
let currentRoomId="";

function now(){return new Date().toISOString()}
function uid(prefix){return String(prefix||"drc2")+"_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,8)}
function esc(v){return String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}
function readStore(){try{const raw=JSON.parse(localStorage.getItem(STORAGE_KEY)||"{}");return raw&&typeof raw==="object"&&!Array.isArray(raw)?raw:{}}catch(e){return {}}}
function writeStore(data){localStorage.setItem(STORAGE_KEY,JSON.stringify(data&&typeof data==="object"?data:{}));return data}
function roomMeta(roomId){const id=String(roomId||"");const all=readStore();const raw=all[id]||{};return normalizeMeta({...raw,roomId:id})}
function saveRoomMeta(meta){const clean=normalizeMeta(meta),all=readStore();all[clean.roomId]=clean;writeStore(all);return JSON.parse(JSON.stringify(clean))}
function removeRoomMeta(roomId){const id=String(roomId||""),all=readStore();delete all[id];writeStore(all)}
function normalizeAttachment(raw){
  if(!raw||typeof raw!=="object")return null;
  const kind=KINDS.includes(String(raw.kind))?String(raw.kind):"puzzle";
  const targetType=TARGET_TYPES.includes(String(raw.targetType))?String(raw.targetType):"cell"; // V1/legacy => cell
  const targetIndex=Math.max(0,Math.trunc(Number(raw.targetIndex)||0));
  return {id:String(raw.id||uid("att")),kind,targetType,targetIndex,refId:String(raw.refId||""),label:String(raw.label||""),createdAt:String(raw.createdAt||now()),updatedAt:String(raw.updatedAt||now())};
}
function normalizeCacheLink(raw){
  if(!raw||typeof raw!=="object")return null;
  return {id:String(raw.id||uid("link")),sourceIndex:Math.max(0,Math.trunc(Number(raw.sourceIndex)||0)),targetRoomId:String(raw.targetRoomId||""),linkType:"subroom",createdAt:String(raw.createdAt||now()),updatedAt:String(raw.updatedAt||now())};
}
function normalizeMeta(raw){
  const roomId=String(raw?.roomId||"");
  return {schema:SCHEMA_VERSION,roomId,attachments:(Array.isArray(raw?.attachments)?raw.attachments:[]).map(normalizeAttachment).filter(Boolean),cacheLinks:(Array.isArray(raw?.cacheLinks)?raw.cacheLinks:[]).map(normalizeCacheLink).filter(Boolean),updatedAt:String(raw?.updatedAt||now())};
}
function base(){return ROOT.DungeonRoomCreator100||null}
function findRoom(roomId){return base()?.findRoom?.(roomId)||null}
function roomTargets(room,targetType){
  const r=room||{};const cells=Array.isArray(r.cells)?r.cells:[];const type=TARGET_TYPES.includes(targetType)?targetType:"cell";const out=[];
  cells.forEach((c,i)=>{
    if(c?.terrain==="wall")return;
    if(type==="cell")out.push({index:i,label:"Case "+(i+1),object:String(c?.object||"")});
    else if(type==="door"&&(c?.object==="entry"||c?.object==="exit"))out.push({index:i,label:(c.object==="entry"?"Porte d’entrée":"Porte de sortie")+" · case "+(i+1),object:c.object});
    else if(type==="chest"&&c?.object==="chest")out.push({index:i,label:"Coffre · case "+(i+1),object:"chest"});
  });
  return out;
}
function attachmentTargetExists(room,att){return roomTargets(room,att.targetType).some(x=>x.index===Number(att.targetIndex))}
function addAttachment(roomId,data){
  const room=findRoom(roomId);if(!room)throw new Error("Pièce introuvable");
  const att=normalizeAttachment({...data,id:data?.id||uid("att")});
  if(!attachmentTargetExists(room,att))throw new Error("Cible invalide pour cette pièce");
  const meta=roomMeta(roomId);
  const duplicate=meta.attachments.some(x=>x.kind===att.kind&&x.targetType===att.targetType&&x.targetIndex===att.targetIndex&&String(x.refId||"")===String(att.refId||""));
  if(duplicate)throw new Error("Cette interaction est déjà attachée à cette cible");
  meta.attachments.push(att);meta.updatedAt=now();saveRoomMeta(meta);return att;
}
function removeAttachment(roomId,attachmentId){const meta=roomMeta(roomId);meta.attachments=meta.attachments.filter(x=>x.id!==String(attachmentId||""));meta.updatedAt=now();return saveRoomMeta(meta)}
function attachmentsForTarget(roomId,targetType,targetIndex,kind){const meta=roomMeta(roomId);return meta.attachments.filter(x=>x.targetType===String(targetType)&&x.targetIndex===Number(targetIndex)&&(!kind||x.kind===String(kind)))}
function reconcileRoom(roomId){
  const room=findRoom(roomId);if(!room)return roomMeta(roomId);
  const meta=roomMeta(roomId);meta.attachments=meta.attachments.filter(att=>attachmentTargetExists(room,att));
  meta.cacheLinks=meta.cacheLinks.filter(link=>room.cells?.[link.sourceIndex]?.object==="cache");meta.updatedAt=now();return saveRoomMeta(meta);
}
function cacheCells(room){const out=[];(room?.cells||[]).forEach((c,i)=>{if(c?.object==="cache")out.push({index:i,label:"Cache · case "+(i+1)})});return out}
function upsertCacheLink(roomId,sourceIndex,targetRoomId){
  const room=findRoom(roomId);if(!room)throw new Error("Pièce source introuvable");
  const idx=Math.max(0,Math.trunc(Number(sourceIndex)||0));if(room.cells?.[idx]?.object!=="cache")throw new Error("La source doit être une cache");
  const target=String(targetRoomId||"");if(target&&target===String(roomId))throw new Error("Une cache ne peut pas pointer vers sa propre pièce");
  if(target&&!findRoom(target))throw new Error("Sous-pièce cible introuvable");
  const meta=roomMeta(roomId);let link=meta.cacheLinks.find(x=>x.sourceIndex===idx);
  if(!link){link=normalizeCacheLink({sourceIndex:idx,targetRoomId:target});meta.cacheLinks.push(link)}else{link.targetRoomId=target;link.updatedAt=now()}
  meta.updatedAt=now();saveRoomMeta(meta);return link;
}
function cacheLinkFor(roomId,sourceIndex){return roomMeta(roomId).cacheLinks.find(x=>x.sourceIndex===Number(sourceIndex))||null}
function roomPackage(roomId){const room=findRoom(roomId);if(!room)return null;return {schema:SCHEMA_VERSION,room,interactions:roomMeta(roomId)}}

function ensureStyles(){if(!DOC||DOC.getElementById("drc200Styles"))return;const s=DOC.createElement("style");s.id="drc200Styles";s.textContent=`#drc200Panel{margin-top:14px;border:1px solid #4b3f31;border-radius:12px;padding:10px;background:#12100d}.drc200Title{font-weight:900;margin-bottom:7px}.drc200Grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}.drc200Grid select,.drc200Grid input{width:100%;background:#0b0b0b;color:#fff;border:1px solid #444;border-radius:8px;padding:8px}.drc200List{display:grid;gap:6px;margin-top:8px}.drc200Row{border:1px solid #343434;border-radius:9px;padding:8px;background:#191919}.drc200Row small{color:#aaa}.drc200Row button{float:right;padding:5px 7px;font-size:11px}.drc200Sub{margin-top:11px;padding-top:9px;border-top:1px solid #39332b}.drc200CacheRow{display:grid;grid-template-columns:1fr 2fr auto;gap:6px;align-items:center;margin-top:6px}.drc200CacheRow select{width:100%;background:#0b0b0b;color:#fff;border:1px solid #444;border-radius:8px;padding:8px}.drc200Hint{font-size:12px;color:#aaa;margin:5px 0}@media(max-width:760px){.drc200Grid{grid-template-columns:1fr 1fr}.drc200CacheRow{grid-template-columns:1fr}.drc200CacheRow button{width:100%}}`;DOC.head.appendChild(s)}
function currentRoom(){return currentRoomId?findRoom(currentRoomId):null}
function inferCurrentRoom(){
  if(currentRoomId&&findRoom(currentRoomId))return currentRoomId;
  const name=String(DOC?.getElementById("drc100Name")?.value||"").trim();const list=base()?.loadLibrary?.()||[];
  const matches=list.filter(r=>String(r.name||"")===name).sort((a,b)=>String(b.updatedAt).localeCompare(String(a.updatedAt)));
  currentRoomId=String(matches[0]?.id||"");return currentRoomId;
}
function targetLabel(att,room){return roomTargets(room,att.targetType).find(x=>x.index===att.targetIndex)?.label||("cible #"+(att.targetIndex+1))}
function renderTargetOptions(){if(!DOC)return;const room=currentRoom(),type=String(DOC.getElementById("drc200TargetType")?.value||"cell"),sel=DOC.getElementById("drc200Target");if(!sel)return;const targets=roomTargets(room,type);sel.innerHTML=targets.length?targets.map(x=>'<option value="'+x.index+'">'+esc(x.label)+'</option>').join(""):'<option value="">Aucune cible disponible</option>'}
function renderPanel(){
  if(!DOC)return;const panel=DOC.getElementById("drc200Panel");if(!panel)return;const room=currentRoom();
  const status=DOC.getElementById("drc200RoomStatus");if(status)status.textContent=room?"Pièce : "+room.name:"Enregistre d’abord la pièce pour configurer ses interactions.";
  const controls=DOC.getElementById("drc200Controls");if(controls)controls.style.display=room?"block":"none";if(!room)return;
  renderTargetOptions();const meta=reconcileRoom(room.id),list=DOC.getElementById("drc200List");
  if(list)list.innerHTML=meta.attachments.length?meta.attachments.map(a=>'<div class="drc200Row"><button type="button" onclick="DungeonRoomCreatorV2.removeAttachmentUI(\''+esc(a.id)+'\')">✕</button><b>'+(a.kind==="puzzle"?'❓ Énigme':'⚠️ Piège')+'</b> → '+esc(targetLabel(a,room))+(a.refId?'<br><small>Référence : '+esc(a.refId)+'</small>':'')+'</div>').join(""):'<div class="drc200Hint">Aucune énigme ou piège attaché.</div>';
  renderCacheLinks(room,meta);
}
function renderCacheLinks(room,meta){
  const box=DOC?.getElementById("drc200Caches");if(!box)return;const caches=cacheCells(room),rooms=(base()?.loadLibrary?.()||[]).filter(r=>r.id!==room.id);
  if(!caches.length){box.innerHTML='<div class="drc200Hint">Aucune cache placée dans cette pièce.</div>';return}
  box.innerHTML=caches.map(c=>{const link=meta.cacheLinks.find(x=>x.sourceIndex===c.index),opts=['<option value="">— sous-pièce non liée —</option>'].concat(rooms.map(r=>'<option value="'+esc(r.id)+'" '+(link?.targetRoomId===r.id?'selected':'')+'>'+esc(r.name)+'</option>')).join("");return '<div class="drc200CacheRow"><b>'+esc(c.label)+'</b><select id="drc200Cache_'+c.index+'">'+opts+'</select><button type="button" onclick="DungeonRoomCreatorV2.saveCacheLinkUI('+c.index+')">🔗 Lier</button></div>'}).join("")}
function ensurePanel(){
  if(!DOC||DOC.getElementById("drc200Panel"))return;const editor=DOC.getElementById("drc100Editor");if(!editor)return;const panel=DOC.createElement("div");panel.id="drc200Panel";panel.innerHTML='<div class="drc200Title">🧩 Interactions V2</div><div id="drc200RoomStatus" class="drc200Hint"></div><div id="drc200Controls" style="display:none"><div class="drc200Grid"><select id="drc200Kind"><option value="puzzle">❓ Énigme</option><option value="trap">⚠️ Piège</option></select><select id="drc200TargetType"><option value="cell">Case</option><option value="door">Porte (entrée/sortie)</option><option value="chest">Coffre</option></select><select id="drc200Target"></select><input id="drc200Ref" placeholder="ID/référence (optionnel)"></div><button type="button" style="margin-top:7px" onclick="DungeonRoomCreatorV2.addAttachmentUI()">➕ ATTACHER À LA CIBLE</button><div id="drc200List" class="drc200List"></div><div class="drc200Sub"><div class="drc200Title">🕳️ Cache → sous-pièce</div><div class="drc200Hint">La liaison est enregistrée dès maintenant. Le déclenchement en jeu sera raccordé en phase 2.</div><div id="drc200Caches"></div></div></div>';editor.appendChild(panel);
  DOC.getElementById("drc200TargetType")?.addEventListener("change",renderTargetOptions);renderPanel();
}
function ensureCacheTool(){
  const b=base();if(!b)return;if(!b.TOOLS.cache)b.TOOLS.cache={label:"Cache / passage secret",icon:"🕳️",kind:"object"};
  if(!DOC)return;const palette=DOC.getElementById("drc100Palette");if(palette&&!palette.querySelector('[data-tool="cache"]')){const btn=DOC.createElement("button");btn.type="button";btn.dataset.tool="cache";btn.textContent="🕳️ Cache / passage secret";btn.onclick=()=>b.setTool("cache");palette.appendChild(btn)}
}
function addAttachmentUI(){const room=currentRoom();if(!room)return;const kind=DOC.getElementById("drc200Kind")?.value||"puzzle",targetType=DOC.getElementById("drc200TargetType")?.value||"cell",targetIndex=Number(DOC.getElementById("drc200Target")?.value),refId=String(DOC.getElementById("drc200Ref")?.value||"").trim();try{addAttachment(room.id,{kind,targetType,targetIndex,refId});DOC.getElementById("drc200Ref").value="";renderPanel()}catch(e){if(typeof alert==="function")alert(e.message)}}
function removeAttachmentUI(id){const room=currentRoom();if(!room)return;removeAttachment(room.id,id);renderPanel()}
function saveCacheLinkUI(index){const room=currentRoom();if(!room)return;const target=String(DOC.getElementById("drc200Cache_"+index)?.value||"");try{upsertCacheLink(room.id,index,target);renderPanel()}catch(e){if(typeof alert==="function")alert(e.message)}}
function installWrappers(){
  const b=base();if(!b||b.__drc2Wrapped)return;b.__drc2Wrapped=true;
  const oldOpen=b.open?.bind(b);if(oldOpen)b.open=function(){const out=oldOpen(...arguments);ensureCacheTool();ensurePanel();renderPanel();return out};
  const oldEdit=b.editRoom?.bind(b);if(oldEdit)b.editRoom=function(id){currentRoomId=String(id||"");const out=oldEdit(id);setTimeout(()=>{ensurePanel();renderPanel()},0);return out};
  const oldNew=b.newRoom?.bind(b);if(oldNew)b.newRoom=function(){currentRoomId="";const out=oldNew(...arguments);setTimeout(()=>{ensurePanel();renderPanel()},0);return out};
  const oldSave=b.saveCurrent?.bind(b);if(oldSave)b.saveCurrent=function(){const out=oldSave(...arguments);inferCurrentRoom();if(currentRoomId)reconcileRoom(currentRoomId);setTimeout(renderPanel,0);return out};
  const oldDelete=b.deleteRoom?.bind(b);if(oldDelete)b.deleteRoom=function(id){removeRoomMeta(id);if(currentRoomId===String(id))currentRoomId="";const out=oldDelete(id);setTimeout(renderPanel,0);return out};
  const oldDeleteCurrent=b.deleteCurrent?.bind(b);if(oldDeleteCurrent)b.deleteCurrent=function(){const id=currentRoomId;const out=oldDeleteCurrent(...arguments);if(id)removeRoomMeta(id);currentRoomId="";setTimeout(renderPanel,0);return out};
}
function install(){const b=base();if(!b)return;try{ROOT.GENSRPG_VERSION=APP_VERSION}catch(e){}try{if(DOC&&/^GenSrpG/i.test(DOC.title||""))DOC.title="GenSrpG V"+APP_VERSION}catch(e){}ensureStyles();ensureCacheTool();ensurePanel();installWrappers();renderPanel()}

ROOT.DungeonRoomCreatorV2={VERSION,APP_VERSION,SCHEMA_VERSION,STORAGE_KEY,TARGET_TYPES,KINDS,normalizeAttachment,normalizeCacheLink,normalizeMeta,roomMeta,saveRoomMeta,removeRoomMeta,roomTargets,addAttachment,removeAttachment,attachmentsForTarget,reconcileRoom,cacheCells,upsertCacheLink,cacheLinkFor,roomPackage,addAttachmentUI,removeAttachmentUI,saveCacheLinkUI,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install();DOC.addEventListener("click",()=>setTimeout(()=>{ensureCacheTool();ensurePanel()},0),true)}else install();
})();
