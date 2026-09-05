/* GenSrpG V16.78.18 — Dungeon generic set editor
   UI/configuration only. Reuses DUNGEON_EQUIPMENT_SETS + the Core 3.16 set engine.
   No movement, combat, timeline or spawn changes. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
if(ROOT.__DUNGEON_SET_EDITOR_167818__)return;
ROOT.__DUNGEON_SET_EDITOR_167818__=true;

const STORAGE_KEY="gensrpg_dungeon_set_overrides_v1";
const VERSION="16.78.18";
const FIELDS=(ROOT.DungeonEquipmentUI?.supportedBonusFields||[
  {key:"armor",label:"Armure"},{key:"defense",label:"Défense"},{key:"force",label:"Force"},
  {key:"agilite",label:"Agilité"},{key:"endurance",label:"Endurance"},{key:"intelligence",label:"Intelligence"},
  {key:"esprit",label:"Esprit"},{key:"initiative",label:"Initiative"},{key:"magicDefense",label:"Défense magique"},
  {key:"crit",label:"Critique %"},{key:"mana",label:"Mana"},{key:"dodge",label:"Esquive %"}
]).map(field=>({key:String(field.key),label:String(field.label)}));

function clone(value){try{return JSON.parse(JSON.stringify(value))}catch(e){return value}}
function esc(value){
  const s=String(value??"");
  try{if(typeof ROOT.z40kEscHtml==="function")return ROOT.z40kEscHtml(s)}catch(e){}
  return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function num(value,fallback=0){const n=Number(value);return Number.isFinite(n)?n:fallback}
function registry(){
  if(!ROOT.DUNGEON_EQUIPMENT_SETS||typeof ROOT.DUNGEON_EQUIPMENT_SETS!=="object")ROOT.DUNGEON_EQUIPMENT_SETS={};
  return ROOT.DUNGEON_EQUIPMENT_SETS;
}
const BASE_SETS=clone(registry());

function normalizeThreshold(raw){
  const pieces=Math.max(1,Math.trunc(num(raw?.pieces,1)));
  const bonuses={};
  for(const field of FIELDS){
    const value=num(raw?.bonuses?.[field.key],0);
    if(value!==0)bonuses[field.key]=value;
  }
  return {pieces,bonuses};
}
function normalizeSet(raw,idHint){
  const id=String(raw?.id||idHint||"").trim();
  if(!id)return null;
  const thresholds=(Array.isArray(raw?.thresholds)?raw.thresholds:Object.entries(raw?.thresholds||{}).map(([pieces,bonuses])=>({pieces,bonuses})))
    .map(normalizeThreshold)
    .sort((a,b)=>a.pieces-b.pieces);
  const dedup=[];
  for(const threshold of thresholds){
    const existing=dedup.findIndex(x=>x.pieces===threshold.pieces);
    if(existing>=0)dedup[existing]=threshold;else dedup.push(threshold);
  }
  const maxThreshold=dedup.reduce((max,t)=>Math.max(max,t.pieces),0);
  const pieceCount=Math.max(1,Math.trunc(num(raw?.pieceCount,Math.max(1,maxThreshold))),maxThreshold);
  return {id,name:String(raw?.name||id).trim()||id,pieceCount,thresholds:dedup};
}
function loadOverrides(){
  try{
    const raw=ROOT.localStorage?.getItem?.(STORAGE_KEY);
    const parsed=raw?JSON.parse(raw):{};
    return parsed&&typeof parsed==="object"?parsed:{};
  }catch(e){return {}}
}
function saveOverrides(overrides){
  try{ROOT.localStorage?.setItem?.(STORAGE_KEY,JSON.stringify(overrides||{}));return true}catch(e){console.warn("Dungeon set editor: save failed",e);return false}
}
function applySavedOverrides(){
  const target=registry();
  const overrides=loadOverrides();
  for(const [id,raw] of Object.entries(overrides)){
    const normalized=normalizeSet(raw,id);
    if(normalized)target[id]=normalized;
  }
  return target;
}
function refreshAll(){
  try{ROOT.DungeonEquipmentUI?.refresh?.()}catch(e){}
  try{ROOT.renderEquipmentLibrary?.()}catch(e){}
  try{ROOT.renderGear?.()}catch(e){}
  try{ROOT.renderDungeonGear?.()}catch(e){}
}
function saveSetDefinition(raw){
  const normalized=normalizeSet(raw,raw?.id);
  if(!normalized)return {ok:false,error:"missing_id"};
  const overrides=loadOverrides();
  overrides[normalized.id]=clone(normalized);
  const persisted=saveOverrides(overrides);
  registry()[normalized.id]=clone(normalized);
  refreshAll();
  syncEditorFromCurrentItem();
  return {ok:true,persisted,set:clone(normalized)};
}
function resetSetDefinition(setId){
  const id=String(setId||"").trim();
  if(!id)return {ok:false};
  const overrides=loadOverrides();
  delete overrides[id];
  const persisted=saveOverrides(overrides);
  if(BASE_SETS[id])registry()[id]=clone(BASE_SETS[id]);else delete registry()[id];
  refreshAll();
  syncEditorFromCurrentItem();
  return {ok:true,persisted,set:registry()[id]?clone(registry()[id]):null};
}
function allDungeonItems(){
  try{if(typeof ROOT.dungeonItems==="function"){const list=ROOT.dungeonItems();if(Array.isArray(list))return list.filter(Boolean)}}catch(e){}
  try{if(Array.isArray(ROOT.ITEMS))return ROOT.ITEMS.filter(Boolean)}catch(e){}
  return [];
}
function findItem(id){
  id=String(id||"");
  try{if(typeof ROOT.itemById==="function"){const item=ROOT.itemById(id);if(item)return item}}catch(e){}
  return allDungeonItems().find(item=>String(item?.id||"")===id)||null;
}
function isBuiltinDungeonItem(item){
  if(item?.dungeonBuiltin)return true;
  const id=String(item?.id||"");
  try{if(Array.isArray(ROOT.DUNGEON_ITEM_DEFINITIONS_316)&&ROOT.DUNGEON_ITEM_DEFINITIONS_316.some(def=>String(def?.id||"")===id))return true}catch(e){}
  return id==="dng_leather";
}
function persistItemMembership(itemId,setId,setPieceId,options={}){
  const id=String(itemId||"").trim();
  const nextSet=String(setId||"").trim();
  const item=findItem(id);
  if(!id||!item)return {ok:false,persisted:false};
  const piece=nextSet?String(setPieceId||item?.setPieceId||item?.rpgSlot||id).trim()||id:"";
  item.setId=nextSet;
  item.setPieceId=piece;
  let persisted=false;

  if(isBuiltinDungeonItem(item)){
    try{
      if(typeof ROOT.loadDungeonItemOverrides==="function"&&typeof ROOT.saveDungeonItemOverrides==="function"){
        const overrides=ROOT.loadDungeonItemOverrides()||{};
        const previous=overrides[id]&&typeof overrides[id]==="object"?overrides[id]:{};
        overrides[id]={...previous,setId:nextSet,setPieceId:piece};
        ROOT.saveDungeonItemOverrides(overrides);
        persisted=true;
        try{ROOT.ensureDungeonItems?.()}catch(e){}
      }
    }catch(e){console.warn("Dungeon set editor: builtin membership save failed",e)}
  }
  if(!persisted){
    try{
      if(typeof ROOT.loadCustomEquipment==="function"&&typeof ROOT.saveCustomEquipment==="function"){
        const list=ROOT.loadCustomEquipment()||[];
        const index=list.findIndex(entry=>String(entry?.id||"")===id);
        if(index>=0){
          list[index]={...list[index],setId:nextSet,setPieceId:piece};
          ROOT.saveCustomEquipment(list);
          try{ROOT.refreshCustomEquipmentIntoItems?.()}catch(e){}
          persisted=true;
        }
      }
    }catch(e){console.warn("Dungeon set editor: custom membership save failed",e)}
  }
  if(!options?.silent)refreshAll();
  return {ok:true,persisted,setId:nextSet,setPieceId:piece};
}

function setOptions(selected){
  const ids=Object.keys(registry()).sort((a,b)=>String(registry()[a]?.name||a).localeCompare(String(registry()[b]?.name||b),"fr"));
  return '<option value="">— Aucun set —</option>'+ids.map(id=>'<option value="'+esc(id)+'"'+(id===selected?' selected':'')+'>'+esc(registry()[id]?.name||id)+'</option>').join("");
}
function summaryBonuses(bonuses){
  return FIELDS.filter(field=>num(bonuses?.[field.key])!==0).map(field=>{
    const n=num(bonuses[field.key]);return (n>0?"+":"")+n+" "+field.label;
  }).join(" · ")||"Aucun bonus";
}
function thresholdRow(threshold,index){
  const bonuses=threshold?.bonuses||{};
  return '<div class="dseThreshold" data-dse-index="'+index+'">'+
    '<div class="dseThresholdHead"><label>Palier <input type="number" min="1" step="1" data-dse-pieces value="'+Math.max(1,Math.trunc(num(threshold?.pieces,1)))+'"> pièces</label><button type="button" data-dse-remove-threshold="'+index+'">✕</button></div>'+
    '<div class="dseBonusGrid">'+FIELDS.map(field=>'<label><span>'+esc(field.label)+'</span><input type="number" step="1" data-dse-stat="'+esc(field.key)+'" value="'+num(bonuses[field.key])+'"></label>').join("")+'</div>'+ 
  '</div>';
}
function memberCandidates(){
  return allDungeonItems().filter(item=>item?.id&&(item?.rpgSlot||item?.setId||item?.type==="Équipement"||item?.type==="Arme"));
}
function membersHtml(setId){
  if(!setId)return '<div class="dseMuted">Enregistre d’abord le nouveau set pour lui associer des objets.</div>';
  const items=memberCandidates();
  if(!items.length)return '<div class="dseMuted">Aucun équipement disponible.</div>';
  return '<div class="dseMembers">'+items.map(item=>{
    const checked=String(item?.setId||"")===setId;
    return '<label><input type="checkbox" data-dse-member="'+esc(item.id)+'"'+(checked?' checked':'')+'> <span>'+esc(item?.name||item.id)+'</span><small>'+esc(item?.rpgSlot||item?.type||"")+'</small></label>';
  }).join("")+'</div>';
}
function setEditorHtml(set,draftId){
  const current=set||{id:draftId||"",name:"Nouveau set",pieceCount:2,thresholds:[{pieces:2,bonuses:{}}]};
  return '<div class="dseSetForm">'+
    '<div class="dseTopGrid"><label>Nom du set<input id="dseSetName" type="text" value="'+esc(current.name||"")+'"></label><label>Nombre de pièces<input id="dsePieceCount" type="number" min="1" step="1" value="'+Math.max(1,Math.trunc(num(current.pieceCount,1)))+'"></label></div>'+ 
    '<div class="dseId">ID : <code id="dseSetId">'+esc(current.id||draftId||"")+'</code></div>'+ 
    '<div class="dseNote">Les paliers sont <strong>cumulatifs</strong> : à 3 pièces, le héros reçoit aussi le bonus du palier 2.</div>'+ 
    '<div id="dseThresholdList">'+(current.thresholds||[]).map(thresholdRow).join("")+'</div>'+ 
    '<button type="button" class="dseSecondary" id="dseAddThreshold">＋ Ajouter un palier</button>'+ 
    '<div class="dseMembersTitle"><strong>Pièces associées</strong><span>Tu peux cocher/décocher les objets qui appartiennent à ce set.</span></div>'+ 
    '<div id="dseMemberList">'+membersHtml(current.id||draftId||"")+'</div>'+ 
    '<div class="dseActions"><button type="button" id="dseSaveSet">💾 Enregistrer le set</button><button type="button" class="dseSecondary" id="dseResetSet">↩ Réinitialiser</button></div>'+ 
  '</div>';
}
function ensureStyles(){
  if(!DOC||DOC.getElementById("dseStyles167818"))return;
  const style=DOC.createElement("style");style.id="dseStyles167818";
  style.textContent=".dseSection{margin-top:10px}.dseItemGrid,.dseTopGrid{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:8px}.dseSection label,.dseSetForm label{display:grid;gap:4px;font-size:12px}.dseSection input,.dseSection select{width:100%;box-sizing:border-box;background:#0d0d0d;color:#fff;border:1px solid #555;border-radius:7px;padding:7px}.dseSetBox{margin-top:10px;padding-top:10px;border-top:1px solid #333}.dseSetBox>summary{font-weight:900;cursor:pointer}.dseId,.dseNote,.dseMuted{font-size:11px;color:#aaa;margin-top:6px}.dseThreshold{margin-top:10px;padding:9px;border:1px solid #3a3a3a;border-radius:9px}.dseThresholdHead{display:flex;align-items:center;justify-content:space-between;gap:8px}.dseThresholdHead label{display:flex;align-items:center;gap:6px;font-weight:800}.dseThresholdHead input{width:70px}.dseThresholdHead button{background:#321;color:#fff;border:1px solid #744;border-radius:7px;padding:5px 8px}.dseBonusGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:8px}.dseBonusGrid label{grid-template-columns:1fr 70px;align-items:center}.dseBonusGrid label span{align-self:center}.dseMembersTitle{display:grid;gap:3px;margin-top:12px}.dseMembersTitle span{font-size:11px;color:#aaa}.dseMembers{display:grid;gap:5px;max-height:240px;overflow:auto;margin-top:7px;padding:7px;border:1px solid #333;border-radius:8px}.dseMembers label{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:7px}.dseMembers input{width:auto}.dseMembers small{color:#888}.dseActions{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}.dseActions button,#dseAddThreshold{border:1px solid #666;border-radius:8px;padding:8px 10px;background:#243b2a;color:#fff;font-weight:800}.dseSecondary{background:#222!important}.dseStatus{font-size:11px;margin-top:7px;color:#a8d5a8}@media(max-width:620px){.dseItemGrid,.dseTopGrid,.dseBonusGrid{grid-template-columns:1fr}}";
  (DOC.head||DOC.documentElement||DOC.body)?.appendChild(style);
}
function ensureSection(){
  if(!DOC)return null;
  let section=DOC.getElementById("dseSection167818");if(section)return section;
  const modal=DOC.getElementById("equipmentEditorModal");
  const card=modal?.querySelector?.(".eqEditorCard");
  if(!card)return null;
  section=DOC.createElement("div");section.id="dseSection167818";section.className="eqSection dseSection";
  section.innerHTML='<strong>🧩 Set de l’équipement</strong><div class="dseItemGrid"><label>Set<select id="dseItemSet"></select></label><label>Identifiant de pièce<input id="dseItemPiece" type="text" placeholder="head, torso, hands…"></label></div><div class="dseNote">Le set et l’identifiant de pièce utilisent directement le moteur <code>setId + setPieceId</code> existant.</div><details class="dseSetBox" id="dseSetDetails" open><summary>⚙️ Modifier les bonus du set</summary><div id="dseSetEditor"></div></details><div id="dseStatus" class="dseStatus"></div>';
  const anchor=DOC.getElementById("eqSoundBox")||DOC.getElementById("eqEvolutionBox");
  if(anchor&&anchor.parentNode===card)card.insertBefore(section,anchor);else card.appendChild(section);
  ensureStyles();
  return section;
}
function currentItemId(){return String(DOC?.getElementById("eqEditId")?.value||"")}
function syncEditorFromCurrentItem(){
  if(!DOC)return false;
  const section=ensureSection();if(!section)return false;
  const item=findItem(currentItemId());
  const setSelect=DOC.getElementById("dseItemSet"),pieceInput=DOC.getElementById("dseItemPiece"),editor=DOC.getElementById("dseSetEditor");
  const selected=String(item?.setId||"");
  if(setSelect)setSelect.innerHTML=setOptions(selected);
  if(pieceInput)pieceInput.value=String(item?.setPieceId||item?.rpgSlot||"");
  const set=registry()[selected]||null;
  if(editor)editor.innerHTML=setEditorHtml(set,selected);
  return true;
}
function renderSelectedSet(setId,draftId){
  if(!DOC)return;
  const editor=DOC.getElementById("dseSetEditor");if(!editor)return;
  const id=String(setId||"");editor.innerHTML=setEditorHtml(registry()[id]||null,draftId||id);
}
function readSetForm(){
  if(!DOC)return null;
  const id=String(DOC.getElementById("dseSetId")?.textContent||"").trim();
  const name=String(DOC.getElementById("dseSetName")?.value||"").trim();
  const pieceCount=Math.max(1,Math.trunc(num(DOC.getElementById("dsePieceCount")?.value,1)));
  const thresholds=[];
  DOC.querySelectorAll?.("#dseThresholdList .dseThreshold")?.forEach(row=>{
    const bonuses={};
    row.querySelectorAll?.("[data-dse-stat]")?.forEach(input=>{const value=num(input.value);if(value!==0)bonuses[String(input.dataset.dseStat)]=value});
    thresholds.push({pieces:Math.max(1,Math.trunc(num(row.querySelector?.("[data-dse-pieces]")?.value,1))),bonuses});
  });
  return normalizeSet({id,name,pieceCount,thresholds},id);
}
function persistMemberCheckboxes(setId){
  if(!DOC||!setId)return;
  DOC.querySelectorAll?.("#dseMemberList [data-dse-member]")?.forEach(box=>{
    const id=String(box.dataset.dseMember||"");const item=findItem(id);if(!item)return;
    const belongs=String(item?.setId||"")===setId;
    if(box.checked&&!belongs)persistItemMembership(id,setId,item?.setPieceId||item?.rpgSlot||id,{silent:true});
    else if(!box.checked&&belongs)persistItemMembership(id,"","",{silent:true});
  });
  refreshAll();
}
function status(message){const box=DOC?.getElementById("dseStatus");if(box)box.textContent=String(message||"")}
function newSetId(){return "custom_set_"+Date.now().toString(36)+"_"+Math.random().toString(36).slice(2,6)}

let bound=false;
function bindEvents(){
  if(!DOC||bound)return;bound=true;
  DOC.addEventListener?.("change",event=>{
    const target=event?.target;
    if(target?.id==="dseItemSet"){
      const item=findItem(currentItemId());
      const selected=String(target.value||"");
      const piece=DOC.getElementById("dseItemPiece");if(piece&&!piece.value)piece.value=String(item?.rpgSlot||item?.setPieceId||item?.id||"");
      renderSelectedSet(selected,"");
    }
  });
  DOC.addEventListener?.("click",event=>{
    const target=event?.target;
    if(!target)return;
    if(target.id==="dseAddThreshold"){
      const current=readSetForm()||{id:String(DOC.getElementById("dseSetId")?.textContent||newSetId()),name:"Nouveau set",pieceCount:2,thresholds:[]};
      const next=Math.max(1,current.thresholds.reduce((max,t)=>Math.max(max,t.pieces),0)+1);
      current.thresholds.push({pieces:next,bonuses:{}});current.pieceCount=Math.max(current.pieceCount,next);renderSelectedSet("",current.id);
      const editor=DOC.getElementById("dseSetEditor");if(editor)editor.innerHTML=setEditorHtml(current,current.id);
      return;
    }
    if(target.dataset?.dseRemoveThreshold!==undefined){
      const current=readSetForm();if(!current)return;
      current.thresholds.splice(Math.max(0,Math.trunc(num(target.dataset.dseRemoveThreshold))),1);
      const editor=DOC.getElementById("dseSetEditor");if(editor)editor.innerHTML=setEditorHtml(current,current.id);return;
    }
    if(target.id==="dseSaveSet"){
      const definition=readSetForm();if(!definition){status("Impossible de lire le set.");return}
      const result=saveSetDefinition(definition);
      if(result.ok){persistMemberCheckboxes(definition.id);status("Set enregistré : "+definition.name);syncEditorFromCurrentItem()}
      return;
    }
    if(target.id==="dseResetSet"){
      const id=String(DOC.getElementById("dseSetId")?.textContent||"");if(!id)return;
      resetSetDefinition(id);status(BASE_SETS[id]?"Set restauré aux valeurs d’origine.":"Set personnalisé supprimé.");syncEditorFromCurrentItem();return;
    }
    if(target.id==="dseNewSet"){
      const id=newSetId();const editor=DOC.getElementById("dseSetEditor");if(editor)editor.innerHTML=setEditorHtml(null,id);return;
    }
  });
}
function addNewButton(){
  if(!DOC)return;
  const details=DOC.getElementById("dseSetDetails");if(!details||DOC.getElementById("dseNewSet"))return;
  const button=DOC.createElement("button");button.type="button";button.id="dseNewSet";button.className="dseSecondary";button.textContent="＋ Nouveau set";button.style.marginTop="8px";details.insertBefore(button,DOC.getElementById("dseSetEditor"));
}

applySavedOverrides();
const baseOpen=ROOT.openEquipmentEditor;
if(typeof baseOpen==="function"&&!baseOpen.__setEditor167818){
  const wrapped=function(){const result=baseOpen.apply(this,arguments);syncEditorFromCurrentItem();addNewButton();return result};
  wrapped.__setEditor167818=true;wrapped.__original=baseOpen;ROOT.openEquipmentEditor=wrapped;
}
const baseSave=ROOT.saveEquipmentEditor;
if(typeof baseSave==="function"&&!baseSave.__setEditor167818){
  const wrapped=function(){
    const result=baseSave.apply(this,arguments);
    const id=currentItemId();
    if(id){const setId=String(DOC?.getElementById("dseItemSet")?.value||"");const piece=String(DOC?.getElementById("dseItemPiece")?.value||"");persistItemMembership(id,setId,piece)}
    syncEditorFromCurrentItem();return result;
  };
  wrapped.__setEditor167818=true;wrapped.__original=baseSave;ROOT.saveEquipmentEditor=wrapped;
}

ensureSection();addNewButton();bindEvents();syncEditorFromCurrentItem();
if(DOC&&typeof ROOT.MutationObserver==="function"){
  try{DOC.addEventListener("click",()=>setTimeout(()=>{ensureSection();addNewButton()},0),true)}catch(e){}
}

ROOT.DungeonSetEditor={VERSION,STORAGE_KEY,FIELDS,BASE_SETS,normalizeSet,loadOverrides,applySavedOverrides,saveSetDefinition,resetSetDefinition,persistItemMembership,summaryBonuses,syncEditorFromCurrentItem,readSetForm};
})();
