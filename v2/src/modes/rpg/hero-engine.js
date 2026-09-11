import { resolveResourceMax } from '../../core/formulas.js';
import { activeFormSkillIds } from '../../core/hero-forms.js';
import { createInventoryState } from './inventory-engine.js';
import { equippedItemBonuses } from './item-engine.js';
import { resolveEquippedSetBonuses } from './set-engine.js';
import { createProgressionState } from './progression-engine.js';

function clone(value){return structuredClone(value);}
function uid(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}
function list(definitions,key){return Array.isArray(definitions?.[key])?definitions[key]:Object.values(definitions?.[key]||{});}

export function createHeroDefinition({
  id=uid(),name='Nouveau héros',enabled=true,icon=null,artId=null,audioId=null,
  statValues={},resourceValues={},skillIds=[],inventorySlots=[],startingItems=[],tags=[],metadata={}
}={}){
  return {
    id:String(id),name:String(name||'Héros'),enabled:enabled!==false,
    icon:icon==null?null:String(icon),artId:artId==null?null:String(artId),audioId:audioId==null?null:String(audioId),
    statValues:clone(statValues||{}),resourceValues:clone(resourceValues||{}),
    skillIds:[...(skillIds||[])].map(String),inventorySlots:[...(inventorySlots||[])].map(String),
    startingItems:(startingItems||[]).map(entry=>({itemId:String(entry.itemId||''),quantity:Math.max(0,Math.floor(Number(entry.quantity??1)||0))})),
    tags:[...(tags||[])].map(String),metadata:clone(metadata||{}),
  };
}

export function validateHeroDefinition(hero,definitions={}){
  const errors=[];
  const stats=new Set(list(definitions,'stats').map(x=>String(x.id)));
  const resources=new Set(list(definitions,'resources').map(x=>String(x.id)));
  const skills=new Set(list(definitions,'skills').map(x=>String(x.id)));
  const items=new Set(list(definitions,'items').map(x=>String(x.id)));
  if(!hero?.id) errors.push({code:'missing-id'});
  if(!hero?.name) errors.push({code:'missing-name'});
  for(const id of Object.keys(hero?.statValues||{})) if(!stats.has(String(id))) errors.push({code:'missing-stat',statId:String(id)});
  for(const id of Object.keys(hero?.resourceValues||{})) if(!resources.has(String(id))) errors.push({code:'missing-resource',resourceId:String(id)});
  for(const id of hero?.skillIds||[]) if(!skills.has(String(id))) errors.push({code:'missing-skill',skillId:String(id)});
  for(const entry of hero?.startingItems||[]) if(!items.has(String(entry.itemId))) errors.push({code:'missing-item',itemId:String(entry.itemId)});
  return {valid:errors.length===0,errors};
}

export function createHeroRuntime(hero,definitions={}, {instanceId=null,progression=null}={}){
  const definition=createHeroDefinition(hero||{});
  const state={stats:{},resources:{}};
  for(const stat of list(definitions,'stats')){
    const value=definition.statValues?.[stat.id];
    state.stats[String(stat.id)]=Number.isFinite(Number(value))?Number(value):Number(stat.baseValue||0);
  }
  for(const resource of list(definitions,'resources')){
    const max=resolveResourceMax(resource,state,definitions);
    const configured=definition.resourceValues?.[resource.id];
    const current=typeof configured==='object'?Number(configured.current):Number(configured);
    state.resources[String(resource.id)]={current:Number.isFinite(current)?Math.max(Number(resource.min??0),Math.min(max,current)):max,max};
  }
  const runtime={
    instanceId:String(instanceId||definition.id),heroId:definition.id,name:definition.name,icon:definition.icon,artId:definition.artId,audioId:definition.audioId,
    enabled:definition.enabled,active:true,ko:false,dead:false,state,
    baseSkillIds:[...definition.skillIds],activeForms:[],currentPermanentFormId:null,
    inventory:createInventoryState({slots:definition.inventorySlots}),
    progression:createProgressionState(progression||{}),tags:[...definition.tags],metadata:clone(definition.metadata),
  };
  return runtime;
}

export function resolveHeroSkillIds(heroRuntime,definitions={}){
  const ids=[];
  const push=id=>{const value=String(id);if(value&&!ids.includes(value))ids.push(value);};
  for(const id of heroRuntime?.baseSkillIds||[]) push(id);
  for(const id of equippedItemBonuses(heroRuntime?.inventory||{},definitions).skillIds) push(id);
  for(const id of resolveEquippedSetBonuses(heroRuntime?.inventory||{},definitions).skillIds) push(id);
  for(const id of activeFormSkillIds(heroRuntime||{})) push(id);
  return ids;
}

export function heroSheetSnapshot(heroRuntime,definitions={}){
  const equipment=equippedItemBonuses(heroRuntime?.inventory||{},definitions);
  const sets=resolveEquippedSetBonuses(heroRuntime?.inventory||{},definitions);
  return {
    instanceId:heroRuntime?.instanceId||null,heroId:heroRuntime?.heroId||null,name:heroRuntime?.name||'Héros',icon:heroRuntime?.icon||null,artId:heroRuntime?.artId||null,
    active:heroRuntime?.active!==false,ko:Boolean(heroRuntime?.ko),dead:Boolean(heroRuntime?.dead),
    stats:clone(heroRuntime?.state?.stats||{}),resources:clone(heroRuntime?.state?.resources||{}),
    progression:clone(heroRuntime?.progression||createProgressionState()),inventory:clone(heroRuntime?.inventory||createInventoryState()),
    skillIds:resolveHeroSkillIds(heroRuntime,definitions),activeForms:clone(heroRuntime?.activeForms||[]),currentPermanentFormId:heroRuntime?.currentPermanentFormId||null,
    equipmentEffectIds:equipment.effectIds,setProgress:sets.progress,setEffectIds:sets.effectIds,
  };
}

export function setHeroKo(heroRuntime,ko=true){
  const next=clone(heroRuntime); next.ko=Boolean(ko); if(next.ko) next.active=false; else if(!next.dead) next.active=true; return next;
}

export function setHeroDead(heroRuntime,dead=true){
  const next=clone(heroRuntime); next.dead=Boolean(dead); if(next.dead){next.ko=true;next.active=false;} return next;
}
