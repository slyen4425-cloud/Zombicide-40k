import { shortestPathDistance, getActorPosition, moveActor, actorMovementAllowance, setActorPosition } from './spatial-engine.js';
import { shortestRoomPathDistance, hasRoomLineOfSight } from './room-tactical-bridge.js';

function clone(value){return structuredClone(value);}
function list(definitions,key){return Array.isArray(definitions?.[key])?definitions[key]:Object.values(definitions?.[key]||{});}
function byId(definitions,key,id){return list(definitions,key).find(x=>String(x.id)===String(id))||null;}

export function normalizeTacticalCombatConfig(config={}){
  const mode=['narrative','tactical','hybrid'].includes(config.mode)?config.mode:'hybrid';
  return {
    mode,
    movementEnabled:mode!=='narrative' && config.movementEnabled!==false,
    rangeEnabled:mode!=='narrative' && config.rangeEnabled!==false,
    lineOfSightEnabled:mode!=='narrative' && config.lineOfSightEnabled!==false,
    contactPenaltyEnabled:mode!=='narrative' && config.contactPenaltyEnabled!==false,
    defaultMeleeRange:Math.max(0,Number(config.defaultMeleeRange??1)||0),
    defaultRangedRange:Math.max(1,Number(config.defaultRangedRange??5)||1),
    rangedContactModifier:Number(config.rangedContactModifier??-20)||0,
  };
}

export function attackProfile(source={},config={}){
  const c=normalizeTacticalCombatConfig(config);
  const data=source?.data||source||{};
  const style=['melee','ranged','versatile'].includes(data.attackStyle)?data.attackStyle:(data.rangeMax!=null?'ranged':'melee');
  const rangeMin=Math.max(0,Number(data.rangeMin??(style==='ranged'?1:0))||0);
  const rangeMax=Math.max(rangeMin,Number(data.rangeMax??(style==='ranged'?c.defaultRangedRange:c.defaultMeleeRange))||0);
  return {
    style,
    rangeMin,
    rangeMax,
    requiresLineOfSight:data.requiresLineOfSight!==false,
    contactPenalty:data.contactPenalty==null?c.rangedContactModifier:Number(data.contactPenalty)||0,
    ignoresContactPenalty:Boolean(data.ignoresContactPenalty),
  };
}

export function resolveEquippedAttackSource(inventory,definitions={}, {slot='main-hand'}={}){
  const direct=inventory?.equipment?.[slot];
  if(direct){
    const item=byId(definitions,'items',direct.itemId);
    if(item?.enabled!==false) return item;
  }
  const seen=new Set();
  for(const record of Object.values(inventory?.equipment||{})){
    if(!record||seen.has(String(record.entryId))) continue;
    seen.add(String(record.entryId));
    const item=byId(definitions,'items',record.itemId);
    if(item?.enabled!==false&&['melee','ranged','versatile'].includes(String(item?.data?.attackStyle||''))) return item;
  }
  return null;
}

export function combatDistance(spatial,actorId,targetId,{diagonal=false,maxDistance=999,roomLayout=null}={}){
  const from=getActorPosition(spatial,actorId),to=getActorPosition(spatial,targetId);
  if(!from||!to) return Infinity;
  if(roomLayout) return shortestRoomPathDistance(roomLayout,from,to,{diagonal,maxDistance});
  return shortestPathDistance(spatial,from,to,{diagonal,maxDistance});
}

export function enemiesInContact(spatial,actorId,combat,{diagonal=false,roomLayout=null}={}){
  const actor=combat?.actors?.[String(actorId)];
  if(!actor) return [];
  return Object.values(combat?.actors||{}).filter(other=>other&&!other.ko&&String(other.id)!==String(actorId)&&String(other.side)!==String(actor.side)&&combatDistance(spatial,actorId,other.id,{diagonal,maxDistance:1,roomLayout})<=1).map(x=>String(x.id));
}

export function evaluateAttackPosition({spatial,combat,actorId,targetId,source,config={}}={}){
  const c=normalizeTacticalCombatConfig(config);
  if(c.mode==='narrative'||!c.rangeEnabled) return {ok:true,distance:null,modifier:0,profile:attackProfile(source,c),contactEnemyIds:[],lineOfSight:true};
  const profile=attackProfile(source,c);
  const roomLayout=config.roomLayout||null;
  const distance=combatDistance(spatial,actorId,targetId,{diagonal:Boolean(config.diagonal),maxDistance:profile.rangeMax,roomLayout});
  if(!Number.isFinite(distance)) return {ok:false,reason:'target-unreachable',distance,modifier:0,profile,contactEnemyIds:[],lineOfSight:false};
  if(distance<profile.rangeMin) return {ok:false,reason:'too-close',distance,modifier:0,profile,contactEnemyIds:[],lineOfSight:true};
  if(distance>profile.rangeMax) return {ok:false,reason:'out-of-range',distance,modifier:0,profile,contactEnemyIds:[],lineOfSight:true};
  const from=getActorPosition(spatial,actorId),to=getActorPosition(spatial,targetId);
  const lineOfSight=!roomLayout||!c.lineOfSightEnabled||!profile.requiresLineOfSight?true:hasRoomLineOfSight(roomLayout,from,to);
  if(!lineOfSight) return {ok:false,reason:'line-of-sight-blocked',distance,modifier:0,profile,contactEnemyIds:[],lineOfSight:false};
  const contactEnemyIds=c.contactPenaltyEnabled&&profile.style==='ranged'?enemiesInContact(spatial,actorId,combat,{diagonal:Boolean(config.diagonal),roomLayout}):[];
  const modifier=contactEnemyIds.length&&!profile.ignoresContactPenalty?profile.contactPenalty:0;
  return {ok:true,distance,modifier,profile,contactEnemyIds,lineOfSight:true};
}

export function createCombatMovementState(combat,config={}){
  const remaining={};
  if(normalizeTacticalCombatConfig(config).movementEnabled){
    for(const actor of Object.values(combat?.actors||{})) remaining[String(actor.id)]=actorMovementAllowance(actor,config);
  }
  return {remaining,spent:{}};
}

export function moveCombatActor({spatial,combat,actorId,target,moveState,config={}}={}){
  const c=normalizeTacticalCombatConfig(config);
  if(!c.movementEnabled) return {ok:false,reason:'movement-disabled',spatial,moveState};
  if(String(combat?.activeActorId)!==String(actorId)) return {ok:false,reason:'not-active-actor',spatial,moveState};
  const allowance=Math.max(0,Number(moveState?.remaining?.[actorId]??0));
  const actor=combat?.actors?.[String(actorId)]||{};
  let moved;
  if(config.roomLayout){
    const from=getActorPosition(spatial,actorId);
    const distance=shortestRoomPathDistance(config.roomLayout,from,target,{diagonal:Boolean(config.diagonal),maxDistance:allowance});
    moved=Number.isFinite(distance)&&distance<=allowance?{moved:true,spatial:setActorPosition(spatial,actorId,target),distance,allowance}:{moved:false,reason:'out-of-range',spatial,distance,allowance};
  } else moved=moveActor(spatial,actorId,target,{...config,actor,defaultMovement:allowance,movementStatId:null});
  if(!moved.moved) return {ok:false,reason:moved.reason||'move-refused',spatial,moveState,distance:moved.distance};
  const next=clone(moveState||{remaining:{},spent:{}});
  next.remaining=next.remaining||{}; next.spent=next.spent||{};
  next.remaining[String(actorId)]=Math.max(0,allowance-moved.distance);
  next.spent[String(actorId)]=(Number(next.spent[String(actorId)])||0)+moved.distance;
  return {ok:true,spatial:moved.spatial,moveState:next,distance:moved.distance,remaining:next.remaining[String(actorId)]};
}

export function resetActorCombatMovement(moveState,actor,config={}){
  const next=clone(moveState||{remaining:{},spent:{}}); next.remaining=next.remaining||{}; next.spent=next.spent||{};
  next.remaining[String(actor.id)]=normalizeTacticalCombatConfig(config).movementEnabled?actorMovementAllowance(actor,config):0;
  next.spent[String(actor.id)]=0;
  return next;
}
