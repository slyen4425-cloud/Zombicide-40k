import { createCreatureRuntime, claimCreatureLoot } from './bestiary-engine.js';

function clone(value){return structuredClone(value);}
function uid(){return globalThis.crypto?.randomUUID?.()||`v2_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;}

export const SPAWN_KINDS=['normal','event','ambush','reinforcement','boss'];

export function createSpawnDefinition({
  id=uid(),name='Nouveau spawn',kind='normal',enabled=true,roomId=null,creatureId=null,count=1,
  x=null,y=null,once=true,conditionIds=[],requiredFlagId=null,requiredItemId=null,bossKeyItemId=null,
}={}){
  return {
    id:String(id),name:String(name||'Spawn'),kind:SPAWN_KINDS.includes(kind)?kind:'normal',enabled:enabled!==false,
    roomId:roomId==null?null:String(roomId),creatureId:creatureId==null?null:String(creatureId),count:Math.max(1,Math.floor(Number(count)||1)),
    x:Number.isFinite(Number(x))?Number(x):null,y:Number.isFinite(Number(y))?Number(y):null,once:once!==false,
    conditionIds:[...(conditionIds||[])].map(String),requiredFlagId:requiredFlagId==null?null:String(requiredFlagId),
    requiredItemId:requiredItemId==null?null:String(requiredItemId),bossKeyItemId:bossKeyItemId==null?null:String(bossKeyItemId),
  };
}

export function createSpawnState(){return {processedSpawnIds:[],spawnedInstanceIds:[],log:[],sequence:0};}

function appendLog(state,type,payload={}){const next=clone(state);next.sequence=(Number(next.sequence)||0)+1;next.log.push({seq:next.sequence,type,...clone(payload)});return next;}
function byId(list,id){return (list||[]).find(x=>String(x.id)===String(id));}

export function canExecuteSpawn(definition,context={}){
  const def=createSpawnDefinition(definition||{});
  const roomId=String(context.roomId||'');
  if(!def.enabled) return {ok:false,reason:'disabled'};
  if(!def.roomId||roomId!==def.roomId) return {ok:false,reason:'wrong-room'};
  if(def.once&&(context.spawnState?.processedSpawnIds||[]).includes(def.id)) return {ok:false,reason:'already-processed'};
  const creature=byId(context.universe?.bestiary,def.creatureId);
  if(!creature) return {ok:false,reason:'creature-missing'};
  if(def.kind==='boss'&&!creature.boss) return {ok:false,reason:'creature-not-boss'};
  if(def.kind!=='boss'&&creature.boss===true&&context.allowBossOutsideBossSpawn!==true) return {ok:false,reason:'boss-requires-boss-spawn'};
  if(def.requiredFlagId&&!context.flags?.[def.requiredFlagId]) return {ok:false,reason:'missing-flag'};
  if(def.requiredItemId&&(Number(context.inventory?.[def.requiredItemId])||0)<=0) return {ok:false,reason:'missing-item'};
  if(typeof context.conditionEvaluator==='function'&&def.conditionIds.length&&!context.conditionEvaluator(def.conditionIds,context)) return {ok:false,reason:'conditions'};
  return {ok:true,def,creature};
}

export function executeSpawn(definition,context={}){
  const check=canExecuteSpawn(definition,context);
  const baseState=clone(context.spawnState||createSpawnState());
  const room=clone(context.roomRuntime||null);
  if(!check.ok) return {ok:false,reason:check.reason,spawnState:baseState,roomRuntime:room,instances:[]};
  if(!room||String(room.roomId)!==check.def.roomId) return {ok:false,reason:'room-runtime-mismatch',spawnState:baseState,roomRuntime:room,instances:[]};

  const existingIds=new Set((room.entities||[]).map(e=>String(e.id||e.instanceId)));
  const instances=[];
  room.entities=Array.isArray(room.entities)?room.entities:[];
  for(let i=0;i<check.def.count;i++){
    const instanceId=`spawn:${check.def.id}:${i+1}`;
    if(existingIds.has(instanceId)) continue;
    const creatureRuntime=createCreatureRuntime(check.creature,context.universe||{}, {instanceId,roomId:check.def.roomId,x:check.def.x,y:check.def.y});
    room.entities.push({id:instanceId,kind:'creature',active:true,defeated:false,removed:false,x:creatureRuntime.x,y:creatureRuntime.y,data:{creatureRuntime}});
    existingIds.add(instanceId);instances.push(creatureRuntime);
  }

  let nextState=clone(baseState);
  if(!nextState.processedSpawnIds.includes(check.def.id)) nextState.processedSpawnIds.push(check.def.id);
  for(const instance of instances) if(!nextState.spawnedInstanceIds.includes(instance.instanceId)) nextState.spawnedInstanceIds.push(instance.instanceId);
  nextState=appendLog(nextState,'spawn-executed',{spawnId:check.def.id,roomId:check.def.roomId,kind:check.def.kind,created:instances.length});

  const rewards=[];
  if(check.def.kind==='boss'&&check.def.bossKeyItemId) rewards.push({itemId:check.def.bossKeyItemId,source:'boss-key'});
  return {ok:true,spawnState:nextState,roomRuntime:room,instances,rewards};
}

export function resolveRoomCreatureDefeat(roomRuntime,instanceId,universe={}, {random=Math.random}={}){
  const room=clone(roomRuntime||null);
  if(!room) return {ok:false,reason:'room-runtime-missing',roomRuntime, drops:[]};
  const entity=(room.entities||[]).find(x=>String(x.id)===String(instanceId));
  if(!entity||entity.kind!=='creature') return {ok:false,reason:'creature-entity-missing',roomRuntime,drops:[]};
  const runtime=entity.data?.creatureRuntime;
  if(!runtime) return {ok:false,reason:'creature-runtime-missing',roomRuntime,drops:[]};
  const creature=byId(universe.bestiary,runtime.creatureId);
  if(!creature) return {ok:false,reason:'creature-definition-missing',roomRuntime,drops:[]};

  const defeatedRuntime={...clone(runtime),defeated:true,active:false};
  const claimed=claimCreatureLoot(defeatedRuntime,creature,{random});
  const finalRuntime=claimed.runtime||defeatedRuntime;
  entity.active=false;
  entity.defeated=true;
  entity.data={...(entity.data||{}),creatureRuntime:clone(finalRuntime)};
  return {
    ok:claimed.ok,
    reason:claimed.reason||null,
    roomRuntime:room,
    creatureRuntime:clone(finalRuntime),
    drops:clone(claimed.drops||[]),
  };
}
