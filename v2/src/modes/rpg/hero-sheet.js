import { createHeroRuntime, heroSheetSnapshot } from './hero-engine.js';
import { resolveDungeonCharacterAsset, resolveDungeonItemAsset } from './dungeon-asset-resolver.js';

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function list(definitions,key){return Array.isArray(definitions?.[key])?definitions[key]:Object.values(definitions?.[key]||{});}
function byId(definitions,key,id){return list(definitions,key).find(x=>String(x.id)===String(id))||null;}
function equippedEntryIds(inventory={}){return new Set(Object.values(inventory.equipment||{}).filter(Boolean).map(row=>String(row.entryId)));}
function itemAsset(item={}){return resolveDungeonItemAsset(item);}

export function buildHeroSheetModel(hero,definitions={}){
  const runtime=createHeroRuntime(hero,definitions);
  const sheet=heroSheetSnapshot(runtime,definitions);
  const stats=list(definitions,'stats').filter(x=>x?.enabled!==false&&x?.visible!==false).map(def=>({id:String(def.id),name:def.name||'Statistique',icon:def.icon||'📊',value:Number(sheet.stats?.[def.id]??def.baseValue??0)}));
  const resources=list(definitions,'resources').filter(x=>x?.enabled!==false&&x?.visible!==false).map(def=>{const state=sheet.resources?.[def.id]||{current:0,max:0};return{id:String(def.id),name:def.name||'Ressource',icon:def.icon||'◆',current:Number(state.current??0),max:Number(state.max??0)};});
  const skills=sheet.skillIds.map(id=>{const def=byId(definitions,'skills',id);return{id:String(id),name:def?.name||'Compétence',icon:def?.icon||'✨',kind:def?.kind||'active'};});
  const inventory=sheet.inventory||{entries:[],equipment:{},slots:[]};
  const equippedIds=equippedEntryIds(inventory);
  const entries=(inventory.entries||[]).map(entry=>{const item=byId(definitions,'items',entry.itemId)||{};return{entryId:String(entry.entryId),itemId:String(entry.itemId),name:item.name||'Objet',icon:item.icon||'🎒',kind:item.kind||'misc',rarity:item.rarity||'common',quantity:Number(entry.quantity||1),equipped:equippedIds.has(String(entry.entryId)),assetUrl:itemAsset(item)};});
  const equipment=(inventory.slots||[]).map(slot=>{
    const record=inventory.equipment?.[slot]||null;
    if(!record) return {slot:String(slot),empty:true,item:null,primary:true};
    const item=byId(definitions,'items',record.itemId)||{};
    const primary=String(record.primarySlot||slot)===String(slot);
    return {slot:String(slot),empty:false,primary,item:{entryId:String(record.entryId),itemId:String(record.itemId),name:item.name||'Objet',icon:item.icon||'🎒',kind:item.kind||'misc',rarity:item.rarity||'common',assetUrl:itemAsset(item)}};
  });
  const setProgress=(sheet.setProgress||[]).map(progress=>{
    const set=byId(definitions,'sets',progress.setId)||{};
    const activeIds=new Set((progress.itemIds||[]).map(String));
    const pieces=(set.itemIds||[]).map(itemId=>{
      const item=byId(definitions,'items',itemId)||{};
      return {itemId:String(itemId),name:item.name||'Pièce de set',icon:item.icon||'🧩',equipped:activeIds.has(String(itemId)),assetUrl:itemAsset(item)};
    });
    return {setId:String(progress.setId||set.id||''),name:set.name||progress.name||progress.setId||'Set',icon:set.icon||'🧩',artId:set.artId||null,equippedCount:Number(progress.equipped??progress.count??0),total:Number(progress.total??pieces.length),pieces,activeThresholds:progress.activeThresholds||[]};
  });
  return {heroId:sheet.heroId,name:sheet.name,icon:sheet.icon||'🧙',artId:sheet.artId,assetUrl:resolveDungeonCharacterAsset({id:sheet.heroId,name:sheet.name,artId:sheet.artId}),status:sheet.dead?'Mort':sheet.ko?'KO':'Prêt',stats,resources,skills,inventory:entries,startingItems:entries,equipment,level:sheet.progression.level||1,xp:sheet.progression.xp||0,skillPoints:sheet.progression.skillPoints||0,statPoints:sheet.progression.statPoints||0,setProgress,activeForms:sheet.activeForms||[]};
}

function rarityLabel(value){const labels={common:'Commun',uncommon:'Peu commun',rare:'Rare',epic:'Épique',legendary:'Légendaire'};return labels[String(value)]||String(value||'Commun');}
function art(url,alt,cls){return url?`<span class="${cls} has-art"><img src="${esc(url)}" alt="${esc(alt)}" loading="lazy"></span>`:'';}

export function renderHeroSheet(model){
  const resourceRows=model.resources.map(r=>`<div class="hero-resource"><div><span>${esc(r.icon)} ${esc(r.name)}</span><strong>${r.current}/${r.max}</strong></div><progress max="${Math.max(1,r.max)}" value="${Math.max(0,Math.min(r.max,r.current))}"></progress></div>`).join('')||'<p class="muted">Aucune ressource visible.</p>';
  const statRows=model.stats.map(s=>`<div class="hero-stat"><span>${esc(s.icon)} ${esc(s.name)}</span><strong>${s.value}</strong></div>`).join('')||'<p class="muted">Aucune statistique visible.</p>';
  const skillRows=model.skills.map(s=>`<div class="hero-chip hero-skill-chip"><span>${esc(s.icon)}</span><div><strong>${esc(s.name)}</strong><small>${esc(s.kind)}</small></div></div>`).join('')||'<p class="muted">Aucune compétence.</p>';
  const equipmentRows=model.equipment.map(slot=>slot.empty
    ?`<div class="hero-equipment-slot empty"><span class="hero-equipment-slot-name">${esc(slot.slot)}</span><span class="muted">Emplacement vide</span></div>`
    :`<div class="hero-equipment-slot ${slot.primary?'primary':'linked'}"><span class="hero-equipment-slot-name">${esc(slot.slot)}</span><div class="hero-equipment-item">${art(slot.item.assetUrl,slot.item.name,'hero-item-art')||`<span>${esc(slot.item.icon)}</span>`}<div><strong>${esc(slot.item.name)}</strong><small>${esc(rarityLabel(slot.item.rarity))}${slot.primary?'':' · lié'}</small></div></div></div>`).join('')||'<p class="muted">Aucun emplacement d’équipement configuré.</p>';
  const inventoryRows=model.inventory.map(item=>`<article class="hero-inventory-item ${item.equipped?'equipped':''}" data-rarity="${esc(item.rarity)}">${art(item.assetUrl,item.name,'hero-inventory-icon')||`<span class="hero-inventory-icon">${esc(item.icon)}</span>`}<div class="hero-inventory-copy"><strong>${esc(item.name)}</strong><small>${esc(rarityLabel(item.rarity))} · ${esc(item.kind)}${item.equipped?' · équipé':''}</small></div><span class="hero-inventory-qty">×${item.quantity}</span></article>`).join('')||'<p class="muted">Inventaire vide.</p>';
  const setRows=model.setProgress.map(set=>{
    const pieces=set.pieces.map(piece=>`<span class="hero-set-piece ${piece.equipped?'equipped':'missing'}" title="${esc(piece.name)}">${art(piece.assetUrl,piece.name,'hero-set-piece-art')||`<span>${esc(piece.icon)}</span>`}</span>`).join('');
    return `<div class="hero-set-row"><div class="hero-set-copy"><strong>${esc(set.icon)} ${esc(set.name)}</strong><span>${set.equippedCount}/${set.total} pièce${set.total>1?'s':''}</span></div>${pieces?`<div class="hero-set-pieces" aria-label="Pièces de ${esc(set.name)}">${pieces}</div>`:''}</div>`;
  }).join('')||'<p class="muted">Aucun bonus de set actif.</p>';
  const avatar=model.assetUrl?`<div class="hero-avatar has-art"><img src="${esc(model.assetUrl)}" alt="Portrait de ${esc(model.name)}"></div>`:`<div class="hero-avatar">${esc(model.icon)}</div>`;
  return `<section class="hero-sheet"><header class="hero-sheet-head">${avatar}<div class="hero-identity"><p class="eyebrow">FICHE HÉROS</p><h2>${esc(model.name)}</h2><div class="hero-identity-meta"><span class="status-pill">${esc(model.status)}</span><span>Niveau ${model.level}</span><span>${model.xp} XP</span></div></div></header><section class="hero-progress-card"><div class="hero-progress-main"><strong>Progression</strong><span>${model.xp} XP · niveau ${model.level}</span></div><div class="hero-points"><span>✨ ${model.skillPoints} pts compétence</span><span>📊 ${model.statPoints} pts caractéristique</span></div></section><nav class="hero-sheet-section-nav" aria-label="Sections de la fiche"><a href="#heroVitals">État</a><a href="#heroEquipment">Équipement</a><a href="#heroInventory">Inventaire</a><a href="#heroSkills">Compétences</a></nav><section class="hero-sheet-grid"><article class="hero-sheet-card hero-vitals-card" id="heroVitals"><h3>❤️ État du héros</h3><div class="hero-resource-list">${resourceRows}</div><div class="hero-stat-grid">${statRows}</div></article><article class="hero-sheet-card hero-equipment-card" id="heroEquipment"><div class="hero-card-title"><h3>🛡️ Équipement</h3><span class="status-pill">${model.equipment.filter(x=>!x.empty&&x.primary).length} équipé${model.equipment.filter(x=>!x.empty&&x.primary).length>1?'s':''}</span></div><div class="hero-equipment-grid">${equipmentRows}</div><div class="hero-set-list">${setRows}</div></article><article class="hero-sheet-card hero-inventory-card" id="heroInventory"><div class="hero-card-title"><h3>🎒 Inventaire</h3><span class="status-pill">${model.inventory.length} entrée${model.inventory.length>1?'s':''}</span></div><div class="hero-inventory-grid">${inventoryRows}</div></article><article class="hero-sheet-card hero-skills-card" id="heroSkills"><h3>✨ Compétences</h3><div class="hero-chip-grid">${skillRows}</div></article></section></section>`;
}

export function mountHeroSheet(host,universe){
  const heroes=list(universe,'heroes').filter(h=>h?.enabled!==false);
  if(!heroes.length){host.innerHTML='<section class="panel"><h2>Fiches héros</h2><p class="muted">Aucun héros n’est encore défini dans cet univers. La fiche est prête et utilisera automatiquement les statistiques, ressources, compétences et objets configurés.</p></section>';return;}
  let selected=String(heroes[0].id);
  const render=()=>{const hero=heroes.find(h=>String(h.id)===selected)||heroes[0];const model=buildHeroSheetModel(hero,universe);host.innerHTML=`<section class="workspace-head hero-workspace-head"><div><p class="eyebrow">RPG · HÉROS</p><h2>Personnage</h2><p class="muted">Lecture de la configuration actuelle du héros avec son équipement et son inventaire runtime de départ.</p></div></section><label class="wide-label hero-picker">Héros<select id="heroSheetSelect">${heroes.map(h=>`<option value="${esc(h.id)}" ${String(h.id)===selected?'selected':''}>${esc(h.icon||'🧙')} ${esc(h.name||'Héros')}</option>`).join('')}</select></label>${renderHeroSheet(model)}`;host.querySelector('#heroSheetSelect')?.addEventListener('change',event=>{selected=event.target.value;render();});};
  render();
}
