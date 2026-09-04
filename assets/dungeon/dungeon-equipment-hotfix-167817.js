/* GenSrpG V16.78.17 — Dungeon equipment editor + set visibility hotfix
   UI/raccordement uniquement. Aucun changement déplacement/combat/timeline/spawn. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
if(ROOT.__DUNGEON_EQUIPMENT_HOTFIX_167817__)return;
ROOT.__DUNGEON_EQUIPMENT_HOTFIX_167817__=true;

const FIELDS=(ROOT.DungeonEquipmentUI?.supportedBonusFields||[
  {key:"armor",label:"Armure"},{key:"defense",label:"Défense"},{key:"force",label:"Force"},
  {key:"agilite",label:"Agilité"},{key:"endurance",label:"Endurance"},{key:"intelligence",label:"Intelligence"},
  {key:"esprit",label:"Esprit"},{key:"initiative",label:"Initiative"},{key:"magicDefense",label:"Défense magique"},
  {key:"crit",label:"Critique %"},{key:"mana",label:"Mana"},{key:"dodge",label:"Esquive %"}
]).map(field=>({key:String(field.key),label:String(field.label)}));

function esc(value){
  const s=String(value??"");
  try{if(typeof ROOT.z40kEscHtml==="function")return ROOT.z40kEscHtml(s)}catch(e){}
  return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function number(value){
  const n=Number(value);return Number.isFinite(n)?n:0;
}
function findItem(id){
  id=String(id||"");
  try{if(typeof ROOT.itemById==="function"){const item=ROOT.itemById(id);if(item)return item}}catch(e){}
  try{if(typeof ROOT.dungeonItems==="function"){const item=ROOT.dungeonItems().find(x=>String(x?.id)===id);if(item)return item}}catch(e){}
  try{return (ROOT.ITEMS||[]).find(x=>String(x?.id)===id)||null}catch(e){return null}
}
function bonusSummary(item){
  const bonuses=item?.rpgBonuses&&typeof item.rpgBonuses==="object"?item.rpgBonuses:{};
  return FIELDS.filter(field=>number(bonuses[field.key])!==0).map(field=>{
    const n=number(bonuses[field.key]);
    return (n>0?"+":"")+n+" "+field.label;
  }).join(" · ");
}
function thresholds(set){
  if(Array.isArray(set?.thresholds))return [...set.thresholds].sort((a,b)=>number(a?.pieces)-number(b?.pieces));
  return Object.entries(set?.thresholds||{}).map(([pieces,bonuses])=>({pieces:number(pieces),bonuses})).sort((a,b)=>a.pieces-b.pieces);
}
function bonusText(bonuses){
  return Object.entries(bonuses||{}).filter(([,value])=>number(value)!==0).map(([key,value])=>{
    const field=FIELDS.find(x=>x.key===key);
    const n=number(value);
    return (n>0?"+":"")+n+" "+(field?.label||key);
  }).join(" · ")||"Bonus descriptif";
}

/* 1) Le moteur de set ne doit plus dépendre du garde isDungeonHeroSheet().
      Si l'ancien helper renvoie vide, on reconstruit depuis state.rpgGear + mains. */
const baseEquipped=ROOT.dungeonEquippedItems;
if(typeof baseEquipped==="function"&&!baseEquipped.__equipmentHotfix167817){
  const wrapped=function(){
    let list=[];
    try{list=baseEquipped.apply(this,arguments);if(Array.isArray(list)&&list.filter(Boolean).length)return list.filter(Boolean)}catch(e){}
    try{
      if(typeof ROOT.isDungeonMode==="function"&&!ROOT.isDungeonMode())return Array.isArray(list)?list:[];
      const st=ROOT.state;
      if(!st||!Array.isArray(st.inventory))return Array.isArray(list)?list:[];
      const indexes=[st.rightHand,st.leftHand,...Object.values(st.rpgGear||{})].filter(Number.isInteger);
      const seen=new Set(),out=[];
      indexes.forEach(index=>{
        if(seen.has(index))return;seen.add(index);
        const entry=st.inventory[index];
        let item=null;
        try{if(typeof ROOT.getItemFromEntry==="function")item=ROOT.getItemFromEntry(entry)}catch(e){}
        if(!item)item=findItem(entry?.itemId);
        if(item)out.push(item);
      });
      return out;
    }catch(e){return Array.isArray(list)?list:[]}
  };
  wrapped.__equipmentHotfix167817=true;
  wrapped.__original=baseEquipped;
  ROOT.dungeonEquippedItems=wrapped;
}

/* 2) Afficher les stats RPG + set dans la bibliothèque d'équipements. */
const baseSummary=ROOT.equipmentSummary;
if(typeof baseSummary==="function"&&!baseSummary.__equipmentHotfix167817){
  const wrapped=function(item){
    const base=String(baseSummary.apply(this,arguments)||"");
    const extra=[];
    const stats=bonusSummary(item);if(stats)extra.push(stats);
    const set=ROOT.DUNGEON_EQUIPMENT_SETS?.[item?.setId];
    if(set)extra.push("Set : "+String(set.name||item.setId));
    return [base,...extra].filter(Boolean).join(" · ");
  };
  wrapped.__equipmentHotfix167817=true;
  wrapped.__original=baseSummary;
  ROOT.equipmentSummary=wrapped;
}

/* 3) Afficher les stats RPG sur les cartes d'objet standard. */
const baseCardStats=ROOT.equipmentCardStatsHtml;
if(typeof baseCardStats==="function"&&!baseCardStats.__equipmentHotfix167817){
  const wrapped=function(item){
    const base=String(baseCardStats.apply(this,arguments)||"");
    const stats=bonusSummary(item);
    if(!stats)return base;
    return base+'<div class="deuiHotfixStats">🛡️ RPG : '+esc(stats)+'</div>';
  };
  wrapped.__equipmentHotfix167817=true;
  wrapped.__original=baseCardStats;
  ROOT.equipmentCardStatsHtml=wrapped;
}

function isBuiltinDungeonItem(item,id=""){
  if(item?.dungeonBuiltin)return true;
  const wanted=String(id||item?.id||"");
  try{
    if(typeof ROOT.dungeonItems==="function"){
      const found=ROOT.dungeonItems().find(candidate=>String(candidate?.id)===wanted);
      if(found?.dungeonBuiltin)return true;
    }
  }catch(e){}
  try{if(Array.isArray(ROOT.DUNGEON_ITEM_IDS)&&ROOT.DUNGEON_ITEM_IDS.map(String).includes(wanted))return true}catch(e){}
  return false;
}
function isDungeonEditorItem(item){
  try{if(typeof ROOT.isDungeonMode==="function"&&ROOT.isDungeonMode())return true}catch(e){}
  const id=String(item?.id||DOC?.getElementById("eqEditId")?.value||"");
  if(isBuiltinDungeonItem(item,id)||item?.gameMode==="dungeon")return true;
  return false;
}
function setHtml(item){
  const set=ROOT.DUNGEON_EQUIPMENT_SETS?.[item?.setId];
  if(!set)return '<div class="deuiHotfixMuted">Aucun set</div>';
  return '<div class="deuiHotfixSetName">🧩 '+esc(set.name)+'</div>'+ 
    '<div class="deuiHotfixMuted">Pièce : '+esc(item?.setPieceId||item?.id||"—")+' · '+Math.max(1,number(set?.pieceCount))+' pièces</div>'+ 
    '<div class="deuiHotfixThresholds">'+thresholds(set).map(t=>'<div>• '+number(t?.pieces)+' pièces : '+esc(bonusText(t?.bonuses))+'</div>').join("")+'</div>';
}
function ensureEditorSection(){
  if(!DOC)return null;
  let section=DOC.getElementById("deuiEquipmentEditorStats167817");
  if(section)return section;
  const modal=DOC.getElementById("equipmentEditorModal");
  const card=modal?.querySelector?.(".eqEditorCard");
  if(!card)return null;
  section=DOC.createElement("div");
  section.id="deuiEquipmentEditorStats167817";
  section.className="eqSection";
  section.innerHTML=
    '<strong>🛡️ Statistiques RPG de l’équipement</strong>'+ 
    '<div class="small" style="margin-top:4px">Valeurs du système existant <code>rpgBonuses</code>.</div>'+ 
    '<div class="deuiHotfixGrid">'+FIELDS.map(field=>
      '<label><span>'+esc(field.label)+'</span><input id="deuiHotfixBonus_'+esc(field.key)+'" type="number" step="1" value="0"></label>'
    ).join("")+'</div>'+ 
    '<div class="deuiHotfixSetBox"><strong>🧩 Set</strong><div id="deuiHotfixSetInfo"></div></div>';
  const anchor=DOC.getElementById("eqSoundBox")||DOC.getElementById("eqEvolutionBox");
  if(anchor&&anchor.parentNode===card)card.insertBefore(section,anchor);else card.appendChild(section);

  if(!DOC.getElementById("deuiEquipmentHotfixStyles167817")){
    const style=DOC.createElement("style");
    style.id="deuiEquipmentHotfixStyles167817";
    style.textContent=
      ".deuiHotfixGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:9px}"+
      ".deuiHotfixGrid label{display:grid;grid-template-columns:1fr 78px;gap:7px;align-items:center;font-size:12px}"+
      ".deuiHotfixGrid input{width:100%;box-sizing:border-box;background:#0d0d0d;color:#fff;border:1px solid #555;border-radius:7px;padding:7px}"+
      ".deuiHotfixSetBox{margin-top:10px;padding-top:9px;border-top:1px solid #333}.deuiHotfixSetName{font-weight:900;margin-top:6px}"+
      ".deuiHotfixMuted,.deuiHotfixThresholds{font-size:12px;color:#bbb;margin-top:4px}.deuiHotfixThresholds{display:grid;gap:3px}"+
      ".deuiHotfixStats{margin-top:5px;font-size:11px;font-weight:800;color:#e0d3a3}"+
      "@media(max-width:620px){.deuiHotfixGrid{grid-template-columns:1fr}}";
    (DOC.head||DOC.documentElement||DOC.body)?.appendChild(style);
  }
  return section;
}
function loadEditor(item){
  const section=ensureEditorSection();if(!section)return false;
  const visible=isDungeonEditorItem(item);section.style.display=visible?"block":"none";if(!visible)return false;
  const bonuses=item?.rpgBonuses&&typeof item.rpgBonuses==="object"?item.rpgBonuses:{};
  FIELDS.forEach(field=>{const input=DOC.getElementById("deuiHotfixBonus_"+field.key);if(input)input.value=number(bonuses[field.key])});
  const setInfo=DOC.getElementById("deuiHotfixSetInfo");if(setInfo)setInfo.innerHTML=setHtml(item);
  return true;
}
function readEditorBonuses(){
  const out={};
  FIELDS.forEach(field=>{
    const input=DOC?.getElementById("deuiHotfixBonus_"+field.key);
    const value=Number(input?.value);
    if(Number.isFinite(value))out[field.key]=value;
  });
  return out;
}
function persistBonuses(id,bonuses){
  id=String(id||"");if(!id)return false;
  try{
    const item=findItem(id);
    if(isBuiltinDungeonItem(item,id)&&typeof ROOT.loadDungeonItemOverrides==="function"&&typeof ROOT.saveDungeonItemOverrides==="function"){
      const overrides=ROOT.loadDungeonItemOverrides()||{};
      const previous=overrides[id]&&typeof overrides[id]==="object"?overrides[id]:{};
      overrides[id]={...previous,rpgBonuses:{...(previous.rpgBonuses||{}),...bonuses}};
      ROOT.saveDungeonItemOverrides(overrides);
      const pos=Array.isArray(ROOT.ITEMS)?ROOT.ITEMS.findIndex(item=>String(item?.id)===id):-1;
      if(pos>=0)ROOT.ITEMS.splice(pos,1);
      try{ROOT.ensureDungeonItems?.()}catch(e){}
      return true;
    }
  }catch(e){console.warn("Equipment hotfix builtin save",e)}
  try{
    if(typeof ROOT.loadCustomEquipment==="function"&&typeof ROOT.saveCustomEquipment==="function"){
      const list=ROOT.loadCustomEquipment()||[];
      const index=list.findIndex(item=>String(item?.id)===id);
      if(index>=0){
        list[index]={...list[index],rpgBonuses:{...(list[index].rpgBonuses||{}),...bonuses}};
        ROOT.saveCustomEquipment(list);
        try{ROOT.refreshCustomEquipmentIntoItems?.()}catch(e){}
        return true;
      }
    }
  }catch(e){console.warn("Equipment hotfix custom save",e)}
  return false;
}

const baseOpen=ROOT.openEquipmentEditor;
if(typeof baseOpen==="function"&&!baseOpen.__equipmentHotfix167817){
  const wrapped=function(){
    const result=baseOpen.apply(this,arguments);
    const id=String(DOC?.getElementById("eqEditId")?.value||arguments[0]||"");
    loadEditor(findItem(id));
    return result;
  };
  wrapped.__equipmentHotfix167817=true;wrapped.__original=baseOpen;ROOT.openEquipmentEditor=wrapped;
}
const baseSave=ROOT.saveEquipmentEditor;
if(typeof baseSave==="function"&&!baseSave.__equipmentHotfix167817){
  const wrapped=function(){
    ensureEditorSection();
    const idField=DOC?.getElementById("eqEditId");
    let id=String(idField?.value||"");
    const item=findItem(id);
    const dungeon=isDungeonEditorItem(item);
    if(!id&&dungeon&&idField){id="custom_item_"+Date.now()+"_"+Math.random().toString(36).slice(2,7);idField.value=id}
    const bonuses=dungeon?readEditorBonuses():null;
    const result=baseSave.apply(this,arguments);
    if(dungeon&&id&&bonuses){
      persistBonuses(id,bonuses);
      try{ROOT.renderEquipmentLibrary?.()}catch(e){}
      try{ROOT.renderGear?.()}catch(e){}
      try{ROOT.DungeonEquipmentUI?.refresh?.()}catch(e){}
    }
    return result;
  };
  wrapped.__equipmentHotfix167817=true;wrapped.__original=baseSave;ROOT.saveEquipmentEditor=wrapped;
}

ensureEditorSection();
try{ROOT.DungeonEquipmentUI?.refresh?.()}catch(e){}
try{ROOT.renderEquipmentLibrary?.()}catch(e){}
ROOT.DungeonEquipmentHotfix167817={FIELDS,bonusSummary,loadEditor,readEditorBonuses,persistBonuses};
})();