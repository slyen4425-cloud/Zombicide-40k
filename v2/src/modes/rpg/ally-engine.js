import { createHeroRuntime } from './hero-engine.js';
import { createCreatureRuntime } from './bestiary-engine.js';
import { resolveResourceMax } from '../../core/formulas.js';

function clone(value){return structuredClone(value);}
function uid(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}
function list(definitions,key){return Array.isArray(definitions?.[key])?definitions[key]:Object.values(definitions?.[key]||{});}
function byId(definitions,key,id){return list(definitions,key).find(x=>String(x.id)===String(id))||null;}

export const ALLY_KINDS=['companion','mercenary','summon','escort','npc'];
export const CONTROL_MODES=['player','ai','shared','none'];

export function createAllyDefinition({
  id=uid(),name='Nouvel allié',enabled=true,kind='companion',sourceKind='custom',sourceId=null,
  controlMode='ai',ownerRequired=false,canJoinCombat=true,followOwner=true,dismissible=true,
  duration={kind:'persistent',value:null},statValues={},resourceValues={},skillIds=[],icon=null,artId=null,audioId=null,
  tags=[],metadata={}
}={}){
  return {
    id:String(id),name:String(name||'Allié'),enabled:enabled!==false,
    kind:ALLY_KINDS.includes(kind)?kind:'companion',sourceKind:['hero','creature','custom'].includes(sourceKind)?sourceKind:'custom',
    sourceId:sourceId==null?null:String(sourceId),controlMode:CONTROL_MODES.includes(controlMode)?controlMode:'ai',
    ownerRequired:Boolean(ownerRequired),canJoinCombat:canJoinCombat!==false,followOwner:followOwner!==false,dismissible:dismissible!==false,
    duration:normalizeDuration(duration),statValues:clone(statValues||{}),resourceValues:clone(resourceValues||{}),
    skillIds:[...(skillIds||[])].map(String),icon:icon==null?null:String(icon),artId:artId==null?null:String(artId),audioId:audioId==null?null:String(audioId),
    tags:[...(tags||[])].map(String),metadata:clone(metadata||{}),
  };
}

function normalizeDuration(duration={}){
  const kind=['persistent','turns','rounds','room','combat'].includes(duration?.kind)?duration.kind:'persistent';
  return {kind,value:kind==='persistent'?null:Math.max(1,Math.floor(Number(duration?.value)||1))};
}

export function validateAllyDefinition(definition,definitions={}){
  const errors=[];
  if(!definition?.id) errors.push({code:'missing-id'});
  if(!definition?.name) errors.push({code:'missing-name'});
  if(definition?.sourceKind==='hero'&&!byId(definitions,'heroes',definition.sourceId)) errors.push({code:'missing-hero',heroId:String(definition.sourceId||'')});
  if(definition?.sourceKind==='creature'&&!byId(definitions,'bestiary',definition.sourceId)) errors.push({code:'missing-creature',creatureId:String(definition.sourceId||'')});
  if(definition?.ownerRequired&&!definition?.metadata?.ownerSelector) errors.push({code:'owner-selector-required'});
  if(definition?.sourceKind==='custom'){
    for(const id of Object.keys(definition.statValues||{})) if(!byId(definitions,'stats',id)) errors.push({code:'missing-stat',statId:String(id)});
    for(const id of Object.keys(definition.resourceValues||{})) if(!byId(definitions,'resources',id)) errors.push({code:'missing-resource',resourceId:String(id)});
    for(const id of definition.skillIds||[]) if(!byId(definitions,'skills',id)) errors.push({code:'missing-skill',skillId:String(id)});
  }
  return {valid:errors.length===0,errors};
}

function createCustomRuntime(definition,definitions,instanceId){
  const state={stats:{},resources:{}};
  for(const stat of list(definitions,'stats')) state.stats[String(stat.id)]=Number(definition.statValues?.[stat.id]??stat.baseValue??0)||0;
  for(const resource of list(definitions,'resources')){
    const max=resolveResourceMax(resource,state,definitions);
    const configured=definition.resourceValues?.[resource.id];
    const current=typeof configured==='object'?Number(configured.current):Number(configured);
    state.resources[String(resource.id)]={current:Number.isFinite(current)?Math.max(Number(resource.min??0),Math.min(max,current)):max,max};
  }
  return {instanceId,name:definition.name,state,skillIds:[...definition.skillIds],icon:definition.icon,artId:definition.artId,audioId:definition.audioId,active:true,ko:false,dead:false};
}

export function createAllyRuntime(definition,definitions={}, {instanceId=uid(),ownerActorId=null,roomId=null,x=null,y=null}={}){
  const def=createAllyDefinition(definition||{});
  if(def.ownerRequired&&!ownerActorId) return {ok:false,reason:'owner-required'};
  let actor;
  if(def.sourceKind==='hero'){
    const source=byId(definitions,'heroes',def.sourceId); if(!source) return {ok:false,reason:'source-missing'};
    actor=createHeroRuntime(source,definitions,{instanceId});
  } else if(def.sourceKind==='creature') {
    const source=byId(definitions,'bestiary',def.sourceId); if(!source) return {ok:false,reason:'source-missing'};
    actor=createCreatureRuntime(source,definitions,{instanceId,roomId,x,y});
  } else actor=createCustomRuntime(def,definitions,String(instanceId));
  const remaining=def.duration.kind==='persistent'?null:def.duration.value;
  return {ok:true,runtime:{
    instanceId:String(instanceId),allyDefinitionId:def.id,name:def.name,kind:def.kind,sourceKind:def.sourceKind,sourceId:def.sourceId,
    controlMode:def.controlMode,ownerActorId:ownerActorId==null?null:String(ownerActorId),canJoinCombat:def.canJoinCombat,followOwner:def.followOwner,dismissible:def.dismissible,
    durationKind:def.duration.kind,remaining,roomId:roomId==null?actor.roomId??null:String(roomId),x:Number.isFinite(Number(x))?Number(x):actor.x??null,y:Number.isFinite(Number(y))?Number(y):actor.y??null,
    active:true,dismissed:false,expired:false,actor,tags:[...def.tags],metadata:clone(def.metadata),
  }};
}

export function createAllyRoster(){return {actors:{},order:[],history:[]};}

export function addAlly(roster,runtime){
  if(!runtime?.instanceId) return {ok:false,reason:'missing-instance',roster};
  const id=String(runtime.instanceId); if(roster?.actors?.[id]) return {ok:false,reason:'duplicate-instance',roster};
  const next=clone(roster||createAllyRoster()); next.actors=next.actors||{}; next.order=Array.isArray(next.order)?next.order:[]; next.history=Array.isArray(next.history)?next.history:[];
  next.actors[id]=clone(runtime); next.order.push(id); next.history.push({type:'added',instanceId:id,kind:runtime.kind});
  return {ok:true,roster:next};
}

export function canPlayerControl(runtime,{playerActorIds=[]}={}){
  if(!runtime||runtime.active===false||runtime.dismissed||runtime.expired) return {ok:false,reason:'inactive'};
  if(runtime.controlMode==='none') return {ok:false,reason:'not-controllable'};
  if(runtime.controlMode==='ai') return {ok:false,reason:'ai-controlled'};
  if(runtime.controlMode==='shared') return {ok:true};
  if(runtime.controlMode==='player'){
    if(!runtime.ownerActorId) return {ok:true};
    return playerActorIds.map(String).includes(String(runtime.ownerActorId))?{ok:true}:{ok:false,reason:'not-owner'};
  }
  return {ok:false,reason:'not-controllable'};
}

export function controllableAllies(roster,context={}){
  return (roster?.order||[]).map(id=>roster.actors?.[id]).filter(Boolean).filter(runtime=>canPlayerControl(runtime,context).ok);
}

export function combatEligibleAllies(roster,{roomId=null}={}){
  return (roster?.order||[]).map(id=>roster.actors?.[id]).filter(runtime=>runtime&&runtime.active!==false&&!runtime.dismissed&&!runtime.expired&&runtime.canJoinCombat!==false&&(roomId==null||String(runtime.roomId)===String(roomId)));
}

export function dismissAlly(roster,instanceId){
  const runtime=roster?.actors?.[instanceId]; if(!runtime) return {ok:false,reason:'missing-ally',roster};
  if(runtime.dismissible===false) return {ok:false,reason:'not-dismissible',roster};
  const next=clone(roster); next.actors[instanceId].dismissed=true; next.actors[instanceId].active=false; next.history=[...(next.history||[]),{type:'dismissed',instanceId:String(instanceId)}];
  return {ok:true,roster:next};
}

export function tickAllyDurations(roster,kind='turns',amount=1){
  const next=clone(roster||createAllyRoster()); const expired=[]; const delta=Math.max(1,Math.floor(Number(amount)||1));
  for(const id of next.order||[]){
    const runtime=next.actors?.[id]; if(!runtime||runtime.expired||runtime.dismissed||runtime.durationKind!==kind||runtime.remaining==null) continue;
    runtime.remaining=Math.max(0,Number(runtime.remaining)-delta);
    if(runtime.remaining<=0){runtime.expired=true;runtime.active=false;expired.push(String(id));next.history=[...(next.history||[]),{type:'expired',instanceId:String(id),durationKind:kind}];}
  }
  return {roster:next,expiredInstanceIds:expired};
}
