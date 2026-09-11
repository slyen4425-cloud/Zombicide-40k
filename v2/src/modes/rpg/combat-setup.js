import { createCombatState } from './combat-engine.js';
import { buildAllyCombatants } from './ally-runtime.js';

function idSet(combatants=[]){return new Set((combatants||[]).map(x=>String(x?.id)));}

export function buildCombatantsWithAllies({
  combatants=[],
  allyRoster=null,
  spatial=null,
  engagerId=null,
  spatialConfig={},
  allySide='heroes',
  initiativeResolver=null,
}={}){
  const base=[...(combatants||[])].filter(Boolean).map(x=>structuredClone(x));
  if(!allyRoster||!spatial||!engagerId) return {combatants:base,addedAllyIds:[]};
  const existing=idSet(base);
  const allies=buildAllyCombatants(allyRoster,spatial,engagerId,{spatialConfig,side:allySide,initiativeResolver});
  const added=[];
  for(const ally of allies){
    const id=String(ally.id);
    if(existing.has(id)) continue;
    existing.add(id);
    base.push(ally);
    added.push(id);
  }
  return {combatants:base,addedAllyIds:added};
}

export function createCombatWithAllies(options={}){
  const built=buildCombatantsWithAllies(options);
  const combat=createCombatState({combatants:built.combatants,round:options.round??1});
  return {combat,addedAllyIds:built.addedAllyIds};
}
