import { resolveResourceMax } from '../../core/formulas.js';

function clone(value){return structuredClone(value);}
function uid(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}

export function createCreatureDefinition({
  id=uid(),name='Nouvelle créature',enabled=true,boss=false,icon=null,artId=null,audioId=null,
  statValues={},resourceValues={},skillIds=[],loot=[],ai={kind:'basic'},tags=[],xp=0,
}={}){
  return {
    id:String(id),name:String(name||'Créature'),enabled:enabled!==false,boss:Boolean(boss),
    icon:icon==null?null:String(icon),artId:artId==null?null:String(artId),audioId:audioId==null?null:String(audioId),
    statValues:clone(statValues||{}),resourceValues:clone(resourceValues||{}),
    skillIds:[...(skillIds||[])].map(String),loot:(loot||[]).map(entry=>({
      itemId:String(entry.itemId||''),quantityMin:Math.max(0,Number(entry.quantityMin??entry.quantity??1)||0),
      quantityMax:Math.max(0,Number(entry.quantityMax??entry.quantity??1)||0),chance:Math.max(0,Math.min(100,Number(entry.chance??100)||0)),
    })),
    ai:{kind:String(ai?.kind||'basic'),...clone(ai||{})},tags:[...(tags||[])].map(String),xp:Math.max(0,Number(xp)||0),
  };
}

export function ensureBestiary(universe){
  universe.bestiary=Array.isArray(universe.bestiary)?universe.bestiary:[];
  return universe;
}

function defMap(list){return new Map((list||[]).map(x=>[String(x.id),x]));}

export function validateCreatureDefinition(creature,universe={}){
  const errors=[];
  const stats=defMap(universe.stats),resources=defMap(universe.resources),skills=defMap(universe.skills);
  if(!creature?.id) errors.push({code:'missing-id'});
  if(!creature?.name) errors.push({code:'missing-name'});
  for(const statId of Object.keys(creature?.statValues||{})) if(!stats.has(String(statId))) errors.push({code:'missing-stat',statId:String(statId)});
  for(const resourceId of Object.keys(creature?.resourceValues||{})) if(!resources.has(String(resourceId))) errors.push({code:'missing-resource',resourceId:String(resourceId)});
  for(const skillId of creature?.skillIds||[]) if(!skills.has(String(skillId))) errors.push({code:'missing-skill',skillId:String(skillId)});
  for(const entry of creature?.loot||[]) if(!entry.itemId) errors.push({code:'missing-loot-item'});
  return {valid:errors.length===0,errors};
}

export function createCreatureRuntime(creature,universe={}, {instanceId=uid(),roomId=null,x=null,y=null}={}){
  const definition=createCreatureDefinition(creature||{});
  const state={stats:{},resources:{}};
  for(const stat of universe.stats||[]) state.stats[String(stat.id)]=Number(definition.statValues?.[stat.id] ?? stat.baseValue ?? 0)||0;
  for(const resource of universe.resources||[]){
    const max=resolveResourceMax(resource,state,universe);
    const configured=definition.resourceValues?.[resource.id];
    const current=typeof configured==='object'?Number(configured.current):Number(configured);
    state.resources[String(resource.id)]={current:Number.isFinite(current)?current:max,max};
  }
  return {
    instanceId:String(instanceId),creatureId:definition.id,name:definition.name,boss:definition.boss,
    roomId:roomId==null?null:String(roomId),x:Number.isFinite(Number(x))?Number(x):null,y:Number.isFinite(Number(y))?Number(y):null,
    active:true,defeated:false,removed:false,state,skillIds:[...definition.skillIds],ai:clone(definition.ai),tags:[...definition.tags],xp:definition.xp,
  };
}

export function chooseCreatureAction(runtime,universe={},context={}){
  if(!runtime||runtime.defeated||runtime.removed||runtime.active===false) return {ok:false,reason:'inactive'};
  const skills=defMap(universe.skills);
  const available=(runtime.skillIds||[]).map(id=>skills.get(String(id))).filter(skill=>skill&&skill.enabled!==false);
  if(!available.length) return {ok:false,reason:'no-skill'};
  const ai=runtime.ai||{};
  let skill=available[0];
  if(ai.kind==='random'){
    const random=context.random||Math.random;
    const index=Math.min(available.length-1,Math.floor(Math.max(0,Math.min(0.999999999,Number(random()))) * available.length));
    skill=available[index];
  } else if(ai.kind==='priority'&&Array.isArray(ai.skillPriority)) {
    skill=ai.skillPriority.map(id=>skills.get(String(id))).find(s=>s&&available.some(a=>String(a.id)===String(s.id)))||available[0];
  }
  return {ok:true,skillId:String(skill.id),targetRule:String(ai.targetRule||'nearest')};
}

export function rollCreatureLoot(creature,{random=Math.random}={}){
  const drops=[];
  for(const entry of creature?.loot||[]){
    const chance=Math.max(0,Math.min(100,Number(entry.chance??100)||0));
    if(Number(random())*100>=chance) continue;
    const min=Math.max(0,Math.floor(Number(entry.quantityMin??1)||0));
    const max=Math.max(min,Math.floor(Number(entry.quantityMax??min)||min));
    const quantity=min===max?min:min+Math.floor(Math.max(0,Math.min(0.999999999,Number(random())))*(max-min+1));
    if(entry.itemId&&quantity>0) drops.push({itemId:String(entry.itemId),quantity});
  }
  return drops;
}
