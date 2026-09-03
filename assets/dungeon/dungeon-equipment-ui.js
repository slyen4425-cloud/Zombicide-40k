/* GenSrpG Dungeon — final equipment UI bridge 1.0
   UI-only adapter: set progress + existing rpgBonuses settings.
   It intentionally does not modify movement, combat, timeline or spawn logic. */
(function(){
"use strict";

const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="1.0.0";
const FIELDS=Object.freeze([
  {key:"armor",label:"Armure"},
  {key:"defense",label:"Défense"},
  {key:"force",label:"Force"},
  {key:"agilite",label:"Agilité"},
  {key:"endurance",label:"Endurance"},
  {key:"intelligence",label:"Intelligence"},
  {key:"esprit",label:"Esprit"},
  {key:"initiative",label:"Initiative"},
  {key:"magicDefense",label:"Défense magique"},
  {key:"crit",label:"Critique %"},
  {key:"mana",label:"Mana"},
  {key:"dodge",label:"Esquive %"}
]);

let refreshing=false;
let scheduled=false;
let observer=null;
let hookedRenderer=null;

function esc(value){
  const s=String(value??"");
  try{
    if(typeof ROOT.z40kEscHtml==="function")return ROOT.z40kEscHtml(s);
  }catch(e){}
  return s.replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function escAttr(value){return esc(value)}
function numeric(value,fallback=0){
  const n=Number(value);
  return Number.isFinite(n)?n:fallback;
}
function thresholds(set){
  if(Array.isArray(set?.thresholds))return [...set.thresholds].sort((a,b)=>numeric(a?.pieces)-numeric(b?.pieces));
  return Object.entries(set?.thresholds||{}).map(([pieces,bonuses])=>({pieces:numeric(pieces),bonuses})).sort((a,b)=>a.pieces-b.pieces);
}
function bonusText(bonuses){
  const labels=Object.fromEntries(FIELDS.map(field=>[field.key,field.label]));
  return Object.entries(bonuses||{}).filter(([,value])=>numeric(value)!==0).map(([key,value])=>{
    const n=numeric(value);
    return (n>0?"+":"")+n+" "+(labels[key]||key);
  }).join(" · ")||"Bonus descriptif";
}
function allItems(){
  try{
    if(typeof ROOT.dungeonItems==="function"){
      const list=ROOT.dungeonItems();
      if(Array.isArray(list))return list;
    }
  }catch(e){}
  try{
    if(Array.isArray(ROOT.ITEMS))return ROOT.ITEMS;
  }catch(e){}
  return [];
}
function findItem(itemId){
  const id=String(itemId||"");
  try{
    if(typeof ROOT.itemById==="function"){
      const item=ROOT.itemById(id);
      if(item)return item;
    }
  }catch(e){}
  return allItems().find(item=>String(item?.id||"")===id)||null;
}
function equippedItems(){
  try{
    if(typeof ROOT.dungeonEquippedItems==="function"){
      const list=ROOT.dungeonEquippedItems();
      if(Array.isArray(list))return list.filter(Boolean);
    }
  }catch(e){}
  return [];
}
function fallbackSetStates(items){
  const registry=ROOT.DUNGEON_EQUIPMENT_SETS||{};
  const groups={};
  (items||[]).forEach(item=>{
    const setId=String(item?.setId||"");
    const set=registry[setId];
    if(!set)return;
    const piece=String(item?.setPieceId||item?.id||"");
    if(!piece)return;
    const group=groups[setId]||(groups[setId]={setId,set,count:0,pieces:new Set(),items:[],activeThresholds:[],bonuses:{}});
    if(group.pieces.has(piece))return;
    group.pieces.add(piece);group.items.push(item);group.count=group.pieces.size;
  });
  return Object.values(groups).map(group=>{
    group.activeThresholds=thresholds(group.set).filter(t=>group.count>=Math.max(1,numeric(t?.pieces,1)));
    return group;
  });
}
function setStates(items=equippedItems()){
  try{
    if(typeof ROOT.dungeonSetStateFromItems316==="function"){
      const states=ROOT.dungeonSetStateFromItems316(items);
      if(Array.isArray(states))return states;
    }
  }catch(e){}
  return fallbackSetStates(items);
}
function getSetProgress(items=equippedItems()){
  return setStates(items).map(state=>{
    const set=state?.set||ROOT.DUNGEON_EQUIPMENT_SETS?.[state?.setId]||{};
    const count=Math.max(0,numeric(state?.count));
    const list=thresholds(set);
    const total=Math.max(count,numeric(set?.pieceCount),...list.map(t=>numeric(t?.pieces)));
    return {
      setId:String(state?.setId||set?.id||""),
      name:String(set?.name||state?.setId||"Set"),
      count,
      total,
      items:Array.isArray(state?.items)?state.items:[],
      earned:list.filter(t=>count>=numeric(t?.pieces)),
      next:list.filter(t=>count<numeric(t?.pieces))
    };
  });
}
function thresholdRows(list,active){
  if(!list.length)return '<div class="deuiEmpty">Aucun</div>';
  return list.map(t=>'<div class="deuiThreshold '+(active?"active":"next")+'">'+(active?"✅":"🔒")+' '+numeric(t?.pieces)+' pièces : '+esc(bonusText(t?.bonuses))+'</div>').join("");
}
function renderSetProgressHtml(progress=getSetProgress()){
  if(!progress.length)return "";
  return '<section class="deuiBlock deuiSets"><div class="deuiTitle">🧩 BONUS DE SET</div>'+progress.map(set=>
      '<article class="deuiSet" data-deui-set="'+escAttr(set.setId)+'">'+
        '<div class="deuiSetName">'+esc(set.name)+' — '+set.count+'/'+set.total+'</div>'+
        (set.items.length?'<div class="deuiPieces">'+set.items.map(item=>esc(item?.name||item?.id||"Pièce")).join(" · ")+'</div>':'')+
        '<div class="deuiThresholdGroup"><strong>Paliers obtenus</strong>'+thresholdRows(set.earned,true)+'</div>'+
        '<div class="deuiThresholdGroup"><strong>Prochains paliers</strong>'+thresholdRows(set.next,false)+'</div>'+
      '</article>'
    ).join("")+'</section>';
}
function settingsForItem(item){
  const bonuses=item?.rpgBonuses&&typeof item.rpgBonuses==="object"?item.rpgBonuses:{};
  return FIELDS.map(field=>({key:field.key,label:field.label,value:numeric(bonuses[field.key])}));
}
function renderItemSettingsHtml(items=equippedItems()){
  const gear=(items||[]).filter(item=>item&&item.id);
  if(!gear.length)return "";
  return '<section class="deuiBlock deuiSettings"><details><summary>⚙️ Réglages équipements</summary>'+ '<div class="deuiHint">Ces champs utilisent directement <code>rpgBonuses</code>, le système de statistiques existant.</div>'+ gear.map(item=>
      '<article class="deuiItemSettings"><div class="deuiItemName">'+esc(item.name||item.id)+'</div><div class="deuiGrid">'+ settingsForItem(item).map(field=>
        '<label><span>'+esc(field.label)+'</span><input type="number" step="1" value="'+field.value+'" data-deui-item="'+escAttr(item.id)+'" data-deui-stat="'+escAttr(field.key)+'"></label>'
      ).join("")+'</div></article>'
    ).join("")+'</details></section>';
}
function findExistingWriter(){
  const bulk=["saveDungeonItemOverrides","storeDungeonItemOverrides","persistDungeonItemOverrides"];
  for(const name of bulk)if(typeof ROOT[name]==="function")return {kind:"bulk",name,fn:ROOT[name]};
  const single=["setDungeonItemOverride","updateDungeonItemOverride"];
  for(const name of single)if(typeof ROOT[name]==="function")return {kind:"single",name,fn:ROOT[name]};
  return null;
}
function setEquipmentBonus(itemId,key,rawValue){
  const field=FIELDS.find(entry=>entry.key===String(key||""));
  const value=Number(rawValue);
  if(!field||!Number.isFinite(value))return {ok:false,persisted:false};
  const item=findItem(itemId);
  if(!item)return {ok:false,persisted:false};

  item.rpgBonuses={...(item.rpgBonuses||{}),[field.key]:value};

  let overrides=null,nextOverride=null,persisted=false;
  try{
    if(typeof ROOT.loadDungeonItemOverrides==="function"){
      const loaded=ROOT.loadDungeonItemOverrides();
      overrides=loaded&&typeof loaded==="object"?loaded:{};
      const previous=overrides[item.id]&&typeof overrides[item.id]==="object"?overrides[item.id]:{};
      nextOverride={...previous,rpgBonuses:{...(previous.rpgBonuses||{}),[field.key]:value}};
      overrides[item.id]=nextOverride;
    }
  }catch(e){}

  const writer=findExistingWriter();
  if(writer){
    try{
      if(writer.kind==="bulk")writer.fn.call(ROOT,overrides||{[item.id]:nextOverride||{rpgBonuses:{[field.key]:value}}});
      else writer.fn.call(ROOT,item.id,nextOverride||{rpgBonuses:{...(item.rpgBonuses||{})}});
      persisted=true;
    }catch(e){console.warn("Dungeon equipment UI: override save failed",e)}
  }

  try{if(typeof ROOT.refreshCustomEquipmentIntoItems==="function")ROOT.refreshCustomEquipmentIntoItems()}catch(e){}
  scheduleRefresh();
  return {ok:true,persisted};
}
function host(){
  if(!DOC)return null;
  return DOC.getElementById("dungeonEquipmentSlots")|| DOC.querySelector?.("[data-dungeon-equipment-sheet]")|| DOC.querySelector?.(".dungeonEquipmentSlots")||null;
}
function ensureBox(parent,id){
  if(!DOC||!parent)return null;
  let box=DOC.getElementById(id);
  if(box&&box.parentNode!==parent){
    try{box.remove()}catch(e){}
    box=null;
  }
  if(!box){
    box=DOC.createElement("div");box.id=id;box.className="deuiFinal";
    parent.appendChild(box);
  }
  return box;
}
function ensureStyles(){
  if(!DOC||DOC.getElementById("deuiFinalStyles"))return;
  const style=DOC.createElement("style");style.id="deuiFinalStyles";
  style.textContent=".deuiFinal{margin-top:10px}.deuiBlock{margin-top:10px;padding:10px;border:1px solid #444;border-radius:12px;background:#141414}.deuiTitle,.deuiSetName,.deuiItemName{font-weight:900}.deuiSet{margin-top:9px;padding-top:9px;border-top:1px solid #333}.deuiSet:first-of-type{border-top:0}.deuiPieces,.deuiHint{font-size:12px;color:#aaa;margin-top:4px}.deuiThresholdGroup{margin-top:8px}.deuiThreshold{font-size:12px;margin-top:4px}.deuiThreshold.active{font-weight:700}.deuiThreshold.next{opacity:.72}.deuiEmpty{font-size:12px;color:#888;margin-top:3px}.deuiSettings summary{cursor:pointer;font-weight:900}.deuiItemSettings{margin-top:10px;padding-top:9px;border-top:1px solid #333}.deuiGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;margin-top:7px}.deuiGrid label{display:grid;grid-template-columns:1fr 72px;gap:6px;align-items:center;font-size:12px}.deuiGrid input{width:100%;box-sizing:border-box;background:#0d0d0d;color:#fff;border:1px solid #555;border-radius:7px;padding:6px}@media(max-width:620px){.deuiGrid{grid-template-columns:1fr}}";
  (DOC.head||DOC.documentElement||DOC.body)?.appendChild(style);
}
function refresh(){
  if(refreshing)return false;
  const parent=host();
  if(!parent)return false;
  refreshing=true;
  try{
    ensureStyles();
    const box=ensureBox(parent,"dungeonEquipmentUiFinal");
    if(!box)return false;
    const html=renderSetProgressHtml()+renderItemSettingsHtml();
    if(box.innerHTML!==html)box.innerHTML=html;
    return true;
  }finally{refreshing=false}
}
function scheduleRefresh(){
  if(scheduled)return;
  scheduled=true;
  const run=()=>{scheduled=false;try{hookRenderer()}catch(e){}try{refresh()}catch(e){console.warn("Dungeon equipment UI refresh",e)}};
  if(typeof ROOT.requestAnimationFrame==="function")ROOT.requestAnimationFrame(run);
  else if(typeof setTimeout==="function")setTimeout(run,0);
  else run();
}
function hookRenderer(){
  const current=ROOT.renderDungeonGear;
  if(typeof current!=="function"||current.__deuiFinal||current===hookedRenderer)return false;
  const wrapped=function(){
    const result=current.apply(this,arguments);
    scheduleRefresh();
    return result;
  };
  wrapped.__deuiFinal=true;
  wrapped.__deuiOriginal=current;
  hookedRenderer=wrapped;
  ROOT.renderDungeonGear=wrapped;
  return true;
}
function bind(){
  if(!DOC||DOC.__deuiFinalBound)return;
  DOC.__deuiFinalBound=true;
  DOC.addEventListener?.("change",event=>{
    const input=event?.target;
    const itemId=input?.dataset?.deuiItem,stat=input?.dataset?.deuiStat;
    if(!itemId||!stat)return;
    setEquipmentBonus(itemId,stat,input.value);
  });
}
function observe(){
  if(!DOC||typeof ROOT.MutationObserver!=="function"||observer)return;
  observer=new ROOT.MutationObserver(()=>scheduleRefresh());
  try{observer.observe(DOC.documentElement||DOC.body,{childList:true,subtree:true})}catch(e){}
}
function install(){
  bind();ensureStyles();hookRenderer();refresh();observe();
  if(DOC&&DOC.readyState==="loading")DOC.addEventListener?.("DOMContentLoaded",scheduleRefresh,{once:true});
  if(typeof setTimeout==="function")setTimeout(scheduleRefresh,0);
  return true;
}

ROOT.DungeonEquipmentUI={VERSION,supportedBonusFields:FIELDS,thresholds,getSetProgress,renderSetProgressHtml,settingsForItem,renderItemSettingsHtml,setEquipmentBonus,refresh,install};
install();
})();