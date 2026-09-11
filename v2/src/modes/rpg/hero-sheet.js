import { createHeroRuntime, heroSheetSnapshot } from './hero-engine.js';

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function list(definitions,key){return Array.isArray(definitions?.[key])?definitions[key]:Object.values(definitions?.[key]||{});}
function byId(definitions,key,id){return list(definitions,key).find(x=>String(x.id)===String(id))||null;}

export function buildHeroSheetModel(hero,definitions={}){
  const runtime=createHeroRuntime(hero,definitions);
  const sheet=heroSheetSnapshot(runtime,definitions);
  const stats=list(definitions,'stats').filter(x=>x?.enabled!==false&&x?.visible!==false).map(def=>({id:String(def.id),name:def.name||'Statistique',icon:def.icon||'📊',value:Number(sheet.stats?.[def.id]??def.baseValue??0)}));
  const resources=list(definitions,'resources').filter(x=>x?.enabled!==false&&x?.visible!==false).map(def=>{const state=sheet.resources?.[def.id]||{current:0,max:0};return{id:String(def.id),name:def.name||'Ressource',icon:def.icon||'◆',current:Number(state.current??0),max:Number(state.max??0)};});
  const skills=sheet.skillIds.map(id=>{const def=byId(definitions,'skills',id);return{id:String(id),name:def?.name||'Compétence',icon:def?.icon||'✨',kind:def?.kind||'active'};});
  const startingItems=(hero?.startingItems||[]).map(entry=>{const item=byId(definitions,'items',entry.itemId);return{id:String(entry.itemId),name:item?.name||'Objet',icon:item?.icon||'🎒',quantity:Number(entry.quantity||0)};}).filter(x=>x.quantity>0);
  return {heroId:sheet.heroId,name:sheet.name,icon:sheet.icon||'🧙',artId:sheet.artId,status:sheet.dead?'Mort':sheet.ko?'KO':'Prêt',stats,resources,skills,startingItems,level:sheet.progression.level||1,xp:sheet.progression.xp||0,skillPoints:sheet.progression.skillPoints||0,statPoints:sheet.progression.statPoints||0,setProgress:sheet.setProgress||[],activeForms:sheet.activeForms||[]};
}

export function renderHeroSheet(model){
  const resourceRows=model.resources.map(r=>`<div class="hero-resource"><div><span>${esc(r.icon)} ${esc(r.name)}</span><strong>${r.current}/${r.max}</strong></div><progress max="${Math.max(1,r.max)}" value="${Math.max(0,Math.min(r.max,r.current))}"></progress></div>`).join('')||'<p class="muted">Aucune ressource visible.</p>';
  const statRows=model.stats.map(s=>`<div class="hero-stat"><span>${esc(s.icon)} ${esc(s.name)}</span><strong>${s.value}</strong></div>`).join('')||'<p class="muted">Aucune statistique visible.</p>';
  const skillRows=model.skills.map(s=>`<div class="hero-chip"><span>${esc(s.icon)}</span><div><strong>${esc(s.name)}</strong><small>${esc(s.kind)}</small></div></div>`).join('')||'<p class="muted">Aucune compétence.</p>';
  const itemRows=model.startingItems.map(i=>`<div class="hero-chip"><span>${esc(i.icon)}</span><div><strong>${esc(i.name)}</strong><small>x${i.quantity}</small></div></div>`).join('')||'<p class="muted">Aucun équipement de départ.</p>';
  return `<section class="hero-sheet"><header class="hero-sheet-head"><div class="hero-avatar">${esc(model.icon)}</div><div><p class="eyebrow">FICHE HÉROS</p><h2>${esc(model.name)}</h2><span class="status-pill">${esc(model.status)}</span></div></header><section class="hero-progress-card"><div><strong>Niveau ${model.level}</strong><span>${model.xp} XP</span></div><div class="hero-points"><span>✨ ${model.skillPoints} pts compétence</span><span>📊 ${model.statPoints} pts caractéristique</span></div></section><section class="hero-sheet-grid"><article class="hero-sheet-card"><h3>Ressources</h3>${resourceRows}</article><article class="hero-sheet-card"><h3>Statistiques</h3><div class="hero-stat-grid">${statRows}</div></article><article class="hero-sheet-card"><h3>Compétences</h3><div class="hero-chip-grid">${skillRows}</div></article><article class="hero-sheet-card"><h3>Équipement de départ</h3><div class="hero-chip-grid">${itemRows}</div></article></section></section>`;
}

export function mountHeroSheet(host,universe){
  const heroes=list(universe,'heroes').filter(h=>h?.enabled!==false);
  if(!heroes.length){host.innerHTML='<section class="panel"><h2>Fiches héros</h2><p class="muted">Aucun héros n’est encore défini dans cet univers. La fiche est prête et utilisera automatiquement les statistiques, ressources, compétences et objets configurés.</p></section>';return;}
  let selected=String(heroes[0].id);
  const render=()=>{const hero=heroes.find(h=>String(h.id)===selected)||heroes[0];const model=buildHeroSheetModel(hero,universe);host.innerHTML=`<section class="workspace-head"><div><p class="eyebrow">RPG · HÉROS</p><h2>Fiche de personnage</h2><p class="muted">Vue mobile en lecture seule pour valider l’organisation avant de brancher l’état de partie persistant.</p></div></section><label class="wide-label">Héros<select id="heroSheetSelect">${heroes.map(h=>`<option value="${esc(h.id)}" ${String(h.id)===selected?'selected':''}>${esc(h.icon||'🧙')} ${esc(h.name||'Héros')}</option>`).join('')}</select></label>${renderHeroSheet(model)}`;host.querySelector('#heroSheetSelect')?.addEventListener('change',event=>{selected=event.target.value;render();});};
  render();
}
