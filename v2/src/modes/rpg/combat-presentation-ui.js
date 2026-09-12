import { installDungeonCombatTargetUi, setCombatTargetUiContext, syncDungeonCombatTargetControls } from './combat-target-ui.js';
import { resolveDungeonCharacterAsset } from './dungeon-asset-resolver.js';

function esc(value=''){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}
function list(value){return Array.isArray(value)?value:Object.values(value||{});}

function definitionById(collection,id){
  return list(collection).find(entry=>String(entry?.id||'')===String(id||''))||null;
}

export function combatActorDefinition(universe={},actor=null,id=null){
  if(!actor) return null;
  if(actor.side==='heroes') return definitionById(universe.heroes,actor.metadata?.heroId||id);
  return definitionById(universe.bestiary,actor.metadata?.creatureId||id);
}

export function combatActorDisplayName(universe={},actor=null,id=null){
  if(!actor) return String(id||'—');
  const definition=combatActorDefinition(universe,actor,id);
  if(actor.side==='heroes') return definition?.name||actor.metadata?.heroId||String(id||'Héros');
  return definition?.name||actor.metadata?.creatureId||String(id||'Ennemi');
}

export function combatActorAssetUrl(universe={},actor=null,id=null){
  if(!actor) return null;
  const definition=combatActorDefinition(universe,actor,id)||{};
  return resolveDungeonCharacterAsset({
    ...definition,
    artId:actor.metadata?.artId||definition.artId,
    name:definition.name||combatActorDisplayName(universe,actor,id),
    id:definition.id||actor.metadata?.heroId||actor.metadata?.creatureId||id,
  });
}

export function combatResourceEntries(universe={},actor=null){
  if(!actor) return [];
  const known=list(universe.resources);
  const state=actor.state?.resources||{};
  const ids=[];
  for(const def of known) if(def?.id!=null&&Object.prototype.hasOwnProperty.call(state,String(def.id))) ids.push(String(def.id));
  for(const id of Object.keys(state)) if(!ids.includes(String(id))) ids.push(String(id));
  return ids.map(id=>{
    const def=definitionById(known,id)||{};
    const raw=state[id];
    const current=Number(raw?.current??raw??0)||0;
    const maxValue=Number(raw?.max);
    const max=Number.isFinite(maxValue)?maxValue:null;
    return {id,name:String(def.name||id),icon:String(def.icon||'◆'),current,max};
  });
}

export function combatTimelineEntries(universe={},combat=null){
  if(!combat) return [];
  return (combat.order||[]).map((id,index)=>{
    const actor=combat.actors?.[id]||null;
    const definition=combatActorDefinition(universe,actor,id)||{};
    return {
      id:String(id),
      name:combatActorDisplayName(universe,actor,id),
      icon:String(definition.icon||actor?.metadata?.icon||(actor?.side==='heroes'?'🛡️':'👹')),
      assetUrl:combatActorAssetUrl(universe,actor,id),
      side:String(actor?.side||''),
      ko:Boolean(actor?.ko),
      active:String(combat.activeActorId||'')===String(id),
      index,
    };
  });
}

function effectSummary(universe,effects=[]){
  const applied=(effects||[]).filter(effect=>effect?.applied);
  if(!applied.length) return 'aucun effet appliqué';
  return applied.map(entry=>definitionById(universe.effects,entry.effectId)?.name||entry.effectId||'effet').join(', ');
}

export function combatJournalEntries(universe={},combat=null,{limit=8}={}){
  const rows=[];
  for(const event of combat?.log||[]){
    if(event.type==='action-resolved'){
      const actor=combat.actors?.[event.actorId];
      const target=combat.actors?.[event.targetId];
      const roll=event.check?.roll;
      rows.push({
        kind:'action',
        seq:event.seq??null,
        text:`${combatActorDisplayName(universe,actor,event.actorId)} → ${combatActorDisplayName(universe,target,event.targetId)} : ${event.check?.success===false?'échec':'réussite'}${roll!=null?` (jet ${roll})`:''} · ${effectSummary(universe,event.effects)}`,
      });
    } else if(event.type==='combatant-ko'){
      rows.push({kind:'ko',seq:event.seq??null,text:`${combatActorDisplayName(universe,combat.actors?.[event.actorId],event.actorId)} est KO.`});
    } else if(event.type==='combat-ended'){
      rows.push({kind:'end',seq:event.seq??null,text:`Combat terminé · vainqueur : ${event.winner||'aucun'}.`});
    } else if(event.type==='turn-begin'){
      rows.push({kind:'turn',seq:event.seq??null,text:`Tour de ${combatActorDisplayName(universe,combat.actors?.[event.actorId],event.actorId)}.`});
    }
  }
  return rows.slice(-Math.max(1,Number(limit)||8));
}

function renderCombatPortrait(entry,{timeline=false}={}){
  const base=timeline?'combat-turn-portrait':'combatant-portrait';
  if(entry.assetUrl) return `<span class="${base} has-art" aria-hidden="true"><img src="${esc(entry.assetUrl)}" alt="" loading="lazy"></span>`;
  const fallbackIcon=entry.icon||(entry.side==='heroes'?'🛡️':'👹');
  return `<span class="${base} fallback" aria-hidden="true">${esc(fallbackIcon)}</span>`;
}

export function renderCombatPresentation(universe={},combat=null,{journalLimit=8}={}){
  if(!combat) return '';
  setCombatTargetUiContext({universe,combat});
  installDungeonCombatTargetUi();
  if(typeof queueMicrotask==='function') queueMicrotask(()=>syncDungeonCombatTargetControls());
  const timeline=combatTimelineEntries(universe,combat);
  const cards=timeline.map(entry=>{
    const actor=combat.actors?.[entry.id];
    const resources=combatResourceEntries(universe,actor);
    return `<article class="combatant-card ${entry.active?'active':''} ${entry.ko?'ko':''}" data-combat-actor="${esc(entry.id)}"><div class="combatant-card-head">${renderCombatPortrait(entry)}<div class="editor-card-head"><strong>${entry.side==='heroes'?'🛡️':'👹'} ${esc(entry.name)}</strong>${entry.ko?'<span class="status-pill">KO</span>':entry.active?'<span class="status-pill">Tour actif</span>':''}</div></div><div class="combat-chips">${resources.map(resource=>`<span class="combat-chip">${esc(resource.icon)} ${esc(resource.name)} <strong>${resource.current}${resource.max!=null?` / ${resource.max}`:''}</strong></span>`).join('')||'<span class="muted">Aucune ressource affichée</span>'}</div></article>`;
  }).join('');
  const journal=combatJournalEntries(universe,combat,{limit:journalLimit});
  return `<div class="combat-timeline" aria-label="Ordre des tours">${timeline.map(entry=>`<span class="combat-turn ${entry.active?'active':''} ${entry.ko?'ko':''}">${renderCombatPortrait(entry,{timeline:true})}<span>${esc(entry.name)}${entry.ko?' · KO':''}</span></span>`).join('')}</div><div class="combat-grid">${cards}</div><div class="combat-journal"><h4>Journal moteur</h4>${journal.length?journal.slice().reverse().map(entry=>`<div class="combat-log-row"><span>${entry.seq!=null?`#${entry.seq}`:'•'}</span><strong>${esc(entry.text)}</strong></div>`).join(''):'<p class="muted">Aucune action résolue pour le moment.</p>'}</div>`;
}
