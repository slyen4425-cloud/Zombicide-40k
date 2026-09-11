import { validSkillTargets } from './targeting-engine.js';

function list(value){return Array.isArray(value)?value:Object.values(value||{});}

function definitionById(collection,id){
  return list(collection).find(entry=>String(entry?.id||'')===String(id||''))||null;
}

let liveContext={universe:{},combat:null,spatial:null,source:null,config:{}};
let installedRoot=null;

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

export function setCombatTargetUiContext({universe={},combat=null,spatial=null,source=null,config={}}={}){
  liveContext={universe:universe||{},combat:combat||null,spatial:spatial||null,source:source||null,config:config||{}};
  return liveContext;
}

function selectedSkill(root){
  const select=root?.querySelector?.('[data-dungeon-combat-skill]');
  if(!select) return null;
  return definitionById(liveContext.universe?.skills,select.value);
}

export function syncDungeonCombatTargetControls(root=globalThis.document){
  if(!root?.querySelector) return [];
  const targetSelect=root.querySelector('[data-dungeon-combat-target]');
  if(!targetSelect) return [];
  return syncCombatTargetSelect({
    select:targetSelect,
    universe:liveContext.universe,
    combat:liveContext.combat,
    skill:selectedSkill(root),
    spatial:liveContext.spatial,
    source:liveContext.source,
    config:liveContext.config,
  });
}

export function installDungeonCombatTargetUi(root=globalThis.document){
  if(!root?.addEventListener) return false;
  if(installedRoot===root) return true;
  root.addEventListener('change',event=>{
    const target=event?.target;
    if(!target?.matches?.('[data-dungeon-combat-skill]')) return;
    syncDungeonCombatTargetControls(root);
  });
  installedRoot=root;
  return true;
}
