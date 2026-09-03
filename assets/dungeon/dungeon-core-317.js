/* GenSrpG Dungeon Core 3.17.1 — spatial return, armor floor and merchant stock UI hotfix */
(function(){
"use strict";

const ROOT=typeof window!=="undefined"?window:globalThis;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="3.17.1";
const APP_VERSION="16.78.12";

function clampInt(value,min,max,fallback){
  const n=Number(value);
  if(!Number.isFinite(n))return fallback;
  return Math.max(min,Math.min(max,Math.round(n)));
}
function esc(value){
  try{return typeof z40kEscHtml==="function"?z40kEscHtml(value):String(value??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]))}catch(e){return String(value??"")}
}
function escAttr(value){
  try{return typeof z40kEscAttr==="function"?z40kEscAttr(value):esc(value)}catch(e){return esc(value)}
}
function merchantCategory(it){
  const raw=[it?.type,it?.category,it?.subtype,it?.rpgSlot,it?.slot,it?.name].filter(Boolean).join(" ").toLowerCase();
  if(it?.consumable===true||/consomm|potion|parchemin|scroll|munition|ammo|carquois|elixir|élixir/.test(raw))return "consumables";
  if(it?.weapon===true||/\barme\b|weapon|épée|epee|arc|bow|bâton|baton|staff|hache|axe|dague|dagger|lance|spear|marteau|hammer/.test(raw))return "weapons";
  if(it?.equipment===true||it?.rpgSlot||/équipement|equipement|equipment|armure|armor|casque|helmet|plastron|chest|gantelet|glove|jambi|legs|botte|boots|bouclier|shield|anneau|ring|amulet|amulette/.test(raw))return "equipment";
  return "other";
}
function stockLimits(e){
  const s=e?.merchantStockLimits||{};
  return {
    weapons:clampInt(s.weapons,0,999,3),
    equipment:clampInt(s.equipment,0,999,3),
    consumables:clampInt(s.consumables,0,999,3),
    other:clampInt(s.other,0,999,3)
  };
}
function isPhysicalDamageType(type){
  const t=String(type||"physical").trim().toLowerCase();
  if(!t)return true;
  return !/(magic|magique|spell|sort|fire|feu|water|eau|earth|terre|air|wind|vent|light|lumi|shadow|ombre|electric|élect|lightning|foudre|ice|glace|frost|givre|poison|venin|acid|acide|holy|sacré|sacre|dark|void)/.test(t);
}
function resolveArmorFloor(elemental,reduction,configuredMin,damageType,rules,roll){
  const incoming=Math.max(0,Number(elemental)||0);
  if(incoming<=0)return 0;
  const reduced=incoming-Math.max(0,Number(reduction)||0);
  if(isPhysicalDamageType(damageType)&&reduced<=0){
    const chance=Math.max(0,Math.min(100,Number(rules?.armorZeroBlockChance??75)));
    const r=Number.isFinite(Number(roll))?Number(roll):(Math.random()*100);
    return r<chance?0:1;
  }
  return Math.max(1,Math.max(0,Number(configuredMin)||0),reduced);
}
function readRuntime(){
  try{return JSON.parse(localStorage.getItem(RT_KEY)||"null")}catch(e){return null}
}
function writeRuntime(x){
  try{localStorage.setItem(RT_KEY,JSON.stringify(x));return true}catch(e){return false}
}
function activeHeroId(x){
  const list=Array.isArray(x?.participants)?x.participants:[];
  const i=Math.max(0,Math.min(list.length-1,Number(x?.index)||0));
  return list[i]||"";
}
function mapIndex(map,kind){
  if(!map)return -1;
  const direct=kind==="entry"?map.entryIdx:map.exitIdx;
  if(Number.isInteger(Number(direct))&&Number(direct)>=0)return Number(direct);
  const cells=Array.isArray(map.cells)?map.cells:[];
  return cells.findIndex(c=>String(c||"").toLowerCase()===kind);
}
function tacticalBackRequiresEntry(){
  try{
    const mods=typeof gensGameplayModules==="function"?gensGameplayModules():null;
    const p=typeof currentRpgProfile==="function"?currentRpgProfile():null;
    const mv=p?.rpgUniverse?.movement||{};
    return !!mods?.movement&&String(mv.mode||"").toLowerCase()==="tactical";
  }catch(e){return false}
}
function notice(title,text){
  try{if(typeof modal==="function")return modal(title,text)}catch(e){}
  try{if(typeof alert==="function")alert((title?title+"\n":"")+(text||""))}catch(e){}
}
function goBackRoom(options){
  const opts=options||{};
  const spatial=ROOT.DungeonSpatial313;
  const x=readRuntime();
  if(!x||!spatial)return false;
  spatial.ensure(x);
  const heroId=activeHeroId(x);if(!heroId)return false;
  const currentRoom=Math.max(0,Number(spatial.roomOf(x,heroId)??x.room)||0);
  const targetRoom=currentRoom-1;
  if(targetRoom<1){if(!opts.silent)notice("↩️ Retour","Aucune salle précédente disponible.");return false}
  const targetState=x.roomStates?.[String(targetRoom)];
  if(!targetState?.last){if(!opts.silent)notice("↩️ Retour","La salle "+targetRoom+" n’a pas encore été visitée.");return false}
  if(!opts.ignorePosition&&tacticalBackRequiresEntry()){
    const entry=mapIndex(x.last?.map,"entry"),pos=Number(x.positions?.[heroId]);
    if(entry>=0&&pos!==entry){if(!opts.silent)notice("🚪 Retour","Place le héros actif sur la case ENTRÉE pour revenir dans la salle précédente.");return false}
  }
  const movementLeft=Number.isFinite(Number(x.remaining?.[heroId]))?Math.max(0,Number(x.remaining[heroId])):0;
  spatial.persist(x);
  spatial.setRoom(x,heroId,targetRoom);
  spatial.activate(x,heroId);
  const arrival=mapIndex(x.last?.map,"exit");
  x.positions=x.positions&&typeof x.positions==="object"?x.positions:{};
  if(arrival>=0)x.positions[heroId]=arrival;
  x.remaining=x.remaining&&typeof x.remaining==="object"?x.remaining:{};
  x.remaining[heroId]=movementLeft;
  x.dc317LastTransition={heroId,from:currentRoom,to:targetRoom,created:false,backward:true,at:Date.now()};
  spatial.persist(x);
  writeRuntime(x);
  if(!opts.skipRender){
    try{ROOT.DungeonCore01?.render?.()}catch(e){}
    try{ROOT.DungeonCore01?.show?.()}catch(e){}
    scheduleBackButton();
  }
  if(!opts.silent)notice("↩️ "+heroId,"Le héros revient dans la salle "+targetRoom+". Les autres héros restent à leur position.");
  return true;
}

function runtimeStock(items,e){
  const x=readRuntime();
  if(x&&typeof x==="object"){
    const stock=x.merchantStock317&&typeof x.merchantStock317==="object"?x.merchantStock317:(x.merchantStock317={});
    const lim=stockLimits(e);let changed=false;
    for(const it of items||[]){
      const id=String(it?.id||"");if(!id)continue;
      if(!Object.prototype.hasOwnProperty.call(stock,id)){stock[id]=lim[merchantCategory(it)];changed=true}
    }
    return {stock,persist(){if(changed||true)writeRuntime(x)}};
  }
  return null;
}
function stateStock(st,items,e){
  st.merchantStock317=st.merchantStock317&&typeof st.merchantStock317==="object"?st.merchantStock317:{};
  const lim=stockLimits(e);
  for(const it of items||[]){const id=String(it?.id||"");if(id&&!Object.prototype.hasOwnProperty.call(st.merchantStock317,id))st.merchantStock317[id]=lim[merchantCategory(it)]}
  return {stock:st.merchantStock317,persist(){}};
}
function merchantStockContext(st,items,e){return runtimeStock(items,e)||stateStock(st,items,e)}

const MERCHANT_TABS=[
  {id:"weapons",label:"⚔️ Armes"},
  {id:"equipment",label:"🛡️ Armures & équipements"},
  {id:"consumables",label:"🧪 Consommables"},
  {id:"other",label:"📦 Autres"}
];
let merchantTab317="weapons";
function setMerchantTab(tab){
  const id=String(tab||"");
  if(MERCHANT_TABS.some(x=>x.id===id))merchantTab317=id;
  try{if(typeof ROOT.renderMerchant==="function")ROOT.renderMerchant()}catch(e){}
}
function tabButtonHtml(tab,items,stock){
  const count=items.filter(it=>merchantCategory(it)===tab.id).length;
  const units=items.filter(it=>merchantCategory(it)===tab.id).reduce((n,it)=>n+Math.max(0,Number(stock[String(it.id)])||0),0);
  const active=merchantTab317===tab.id;
  return '<button type="button" data-dc317-merchant-tab="'+tab.id+'" onclick="DungeonCore317.setMerchantTab(\''+tab.id+'\')" aria-pressed="'+(active?'true':'false')+'" style="'+(active?'font-weight:800;outline:2px solid currentColor;':'')+'">'+tab.label+' <span class="badge">'+count+' · '+units+'</span></button>';
}
function renderMerchant317(){
  const box=document.getElementById("merchantList"),wallet=document.getElementById("merchantWallet");if(!box)return;
  const e=typeof currentRpgEconomy==="function"?currentRpgEconomy():{},gold=(typeof current!=="undefined"&&current&&typeof gensHeroGold==="function")?gensHeroGold(current):0;
  if(wallet)wallet.innerHTML='<strong>'+gensCurrencyLabel(gold)+'</strong> · Prix achat ×'+Number(e.merchantBuyMultiplier||1)+' · Revente '+Number(e.sellPercent||0)+'%';
  const items=typeof merchantItems==="function"?merchantItems():[];
  const st=(typeof current!=="undefined"&&current&&typeof loadState==="function")?loadState(current):{inventory:[]};
  const ctx=merchantStockContext(st,items,e),stock=ctx.stock;ctx.persist();

  const tabs='<div id="dc317MerchantTabs" class="v2LibActions" style="display:flex;gap:6px;flex-wrap:wrap;margin:0 0 10px">'+MERCHANT_TABS.map(t=>tabButtonHtml(t,items,stock)).join("")+'</div>';
  const filtered=items.filter(it=>merchantCategory(it)===merchantTab317);
  let html=tabs;
  html+=filtered.length?filtered.map(it=>{
    const buy=Math.max(0,Math.round(dungeonMerchantDefaultPrice066(it)*(Number(e.merchantBuyMultiplier)||1)));
    const qty=Math.max(0,Number(stock[String(it.id)])||0),empty=qty<=0;
    return '<div class="v2LibCard" data-dc317-category="'+merchantCategory(it)+'"><div class="v2LibHead"><strong>'+esc(it.name||it.id)+'</strong><span class="badge">'+gensCurrencyLabel(buy)+'</span></div><div class="small">'+esc(it.type||"Objet")+' · <strong>Stock : '+qty+'</strong></div><div class="v2LibActions"><button type="button" '+(empty?'disabled title="Rupture de stock"':'onclick="merchantBuy(\''+escAttr(it.id)+'\')"')+'>'+(empty?'⛔ RUPTURE':'🛒 ACHETER')+'</button></div></div>';
  }).join(""):'<div class="empty">Aucun objet dans cette catégorie.</div>';

  if(typeof current!=="undefined"&&current){
    const inv=Array.isArray(st.inventory)?st.inventory:[];
    if(inv.length)html+='<h3 style="margin:12px 0 0">💸 Vendre</h3>'+inv.map((x,i)=>{const it=itemById(x.itemId||x.id),sell=Math.max(0,Math.round((Number(it?.price)||0)*(Number(e.sellPercent)||0)/100));return it&&sell>0?'<div class="v2LibCard"><div class="v2LibHead"><strong>'+esc(it.name)+'</strong><span class="badge">'+gensCurrencyLabel(sell)+'</span></div><div class="v2LibActions"><button type="button" onclick="merchantSell('+i+')">💸 VENDRE</button></div></div>':''}).join("");
  }
  box.innerHTML=html;
}
renderMerchant317.__dc317=true;

function merchantBuy317(itemId){
  if(typeof current==="undefined"||!current)return;const it=itemById(itemId);if(!it)return;
  const e=currentRpgEconomy(),price=Math.max(0,Math.round(dungeonMerchantDefaultPrice066(it)*(Number(e.merchantBuyMultiplier)||1)));
  const items=merchantItems(),st=loadState(current);st.inventory=Array.isArray(st.inventory)?st.inventory:[];
  const ctx=merchantStockContext(st,items,e),stock=ctx.stock,id=String(itemId),qty=Math.max(0,Number(stock[id])||0);
  if(qty<=0){ctx.persist();notice("⛔ Rupture de stock",(it.name||"Cet objet")+" n’est plus disponible chez ce marchand.");renderMerchant317();return}
  if(gensHeroGold(current)<price){notice("🪙 Achat","Pas assez de "+(e.currencyName||"Or")+".");return}
  st.inventory.push(makeInventoryEntry(itemId));st.gold=gensHeroGold(current)-price;stock[id]=qty-1;ctx.persist();
  localStorage.setItem(key(current),JSON.stringify(st));if(typeof state!=="undefined")state=st;renderMerchant317();try{renderInventory();renderEconomyWallet()}catch(e){}
}
merchantBuy317.__dc317=true;

function merchantSell317(index){
  if(typeof current==="undefined"||!current)return;const st=loadState(current);st.inventory=Array.isArray(st.inventory)?st.inventory:[];const entry=st.inventory[index],it=itemById(entry?.itemId||entry?.id);if(!it)return;
  const e=currentRpgEconomy(),price=Math.max(0,Math.round((Number(it.price)||0)*(Number(e.sellPercent)||0)/100));if(price<=0)return;
  const items=merchantItems(),ctx=merchantStockContext(st,items,e),stock=ctx.stock,id=String(it.id);
  st.inventory.splice(index,1);st.gold=gensHeroGold(current)+price;stock[id]=Math.max(0,Number(stock[id])||0)+1;ctx.persist();
  localStorage.setItem(key(current),JSON.stringify(st));if(typeof state!=="undefined")state=st;renderMerchant317();try{renderInventory();renderHands();renderGear();renderEconomyWallet()}catch(e){}
}
merchantSell317.__dc317=true;

function installMerchantOverrides(){
  if(typeof ROOT.renderMerchant!=="function"||typeof ROOT.merchantBuy!=="function"||typeof ROOT.merchantSell!=="function")return false;
  if(ROOT.renderMerchant.__dc317&&ROOT.merchantBuy.__dc317&&ROOT.merchantSell.__dc317)return true;
  ROOT.renderMerchant=renderMerchant317;
  ROOT.merchantBuy=merchantBuy317;
  ROOT.merchantSell=merchantSell317;
  return true;
}

let merchantRetryTimer=0;
function ensureMerchantOverrides(){
  installMerchantOverrides();
  if(typeof setInterval==="function"&&!merchantRetryTimer){
    merchantRetryTimer=setInterval(()=>{try{installMerchantOverrides()}catch(e){}},1200);
  }
}

let backQueued=false;
function scheduleBackButton(){
  if(backQueued)return;backQueued=true;
  const run=()=>{backQueued=false;ensureBackButton()};
  if(typeof requestAnimationFrame==="function")requestAnimationFrame(run);else setTimeout(run,0);
}
function ensureBackButton(){
  const explore=document.getElementById("dc01Explore");if(!explore)return;
  const x=readRuntime(),spatial=ROOT.DungeonSpatial313;
  let existing=document.getElementById("dc317BackRoom");
  if(!x||!spatial){if(existing)existing.remove();return}
  spatial.ensure(x);const heroId=activeHeroId(x),room=heroId?Math.max(0,Number(spatial.roomOf(x,heroId)??x.room)||0):0,target=room-1;
  const available=target>=1&&!!x.roomStates?.[String(target)]?.last&&!x.branch?.active;
  if(!available){if(existing)existing.remove();return}
  if(!existing){
    existing=document.createElement("button");existing.id="dc317BackRoom";existing.type="button";existing.onclick=()=>goBackRoom();
    if(explore.className)existing.className=explore.className;
    explore.parentNode?.insertBefore(existing,explore);
  }
  existing.textContent="↩️ SALLE "+target;
  existing.title="Revenir dans la salle précédente avec le héros actif";
}

function install(){
  ensureMerchantOverrides();
  scheduleBackButton();
  if(typeof MutationObserver==="function"&&document?.documentElement){
    const obs=new MutationObserver(()=>{scheduleBackButton();try{installMerchantOverrides()}catch(e){}});obs.observe(document.documentElement,{childList:true,subtree:true});
  }
}

ROOT.DungeonCore317={VERSION,APP_VERSION,merchantCategory,stockLimits,isPhysicalDamageType,resolveArmorFloor,readRuntime,writeRuntime,goBackRoom,ensureBackButton,installMerchantOverrides,setMerchantTab,MERCHANT_TABS};
ROOT.GENSRPG_VERSION=APP_VERSION;
ROOT.DUNGEON_CORE_VERSION=VERSION;
if(typeof document!=="undefined"){
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install();
  if(typeof ROOT.addEventListener==="function")ROOT.addEventListener("load",ensureMerchantOverrides,{once:true});
}
})();
