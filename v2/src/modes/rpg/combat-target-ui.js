import { validSkillTargets } from './targeting-engine.js';

function list(value){return Array.isArray(value)?value:Object.values(value||{});}

function definitionById(collection,id){
  return list(collection).find(entry=>String(entry?.id||'')===String(id||''))||null;
}

export function combatTargetLabel(universe={},combat=null,actor=null){
  if(!actor) return 'Cible';
  if(actor.side==='heroes') return definitionById(universe.heroes,actor.metadata?.heroId||actor.id)?.name||actor.metadata?.heroId||String(actor.id||'Héros');
  return definitionById(universe.bestiary,actor.metadata?.creatureId)?.name||actor.metadata?.creatureId||String(actor.id||'Ennemi');
}

export function combatTargetEntriesForSkill({universe={},combat=null,skill=null,spatial=null,source=null,config={}}={}){
  if(!combat||combat.phase!=='turn'||!combat.activeActorId||!skill) return [];
  const actorId=String(combat.activeActorId);
  return validSkillTargets({combat,actorId,targetKind:skill.target||'enemy',spatial,source,config}).map(entry=>({
    id:String(entry.actor.id),
    side:String(entry.actor.side||''),
    self:String(entry.actor.id)===actorId,
    name:combatTargetLabel(universe,combat,entry.actor),
  }));
}

export function syncCombatTargetSelect({select,universe={},combat=null,skill=null,spatial=null,source=null,config={}}={}){
  if(!select) return [];
  const entries=combatTargetEntriesForSkill({universe,combat,skill,spatial,source,config});
  select.innerHTML=entries.map(entry=>`<option value="${String(entry.id).replace(/"/g,'&quot;')}">${entry.self?'👤 ':entry.side==='heroes'?'🛡️ ':'👹 '}${entry.name}</option>`).join('');
  select.disabled=!entries.length;
  return entries;
}
