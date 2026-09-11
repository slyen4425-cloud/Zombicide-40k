import { setActorPosition, moveActor, combatParticipants } from './spatial-engine.js';
import { combatEligibleAllies, tickAllyDurations } from './ally-engine.js';

function clone(value){return structuredClone(value);}

function allyActorState(runtime){
  return clone(runtime?.actor?.state || runtime?.state || {stats:{},resources:{}});
}

export function placeAlly(roster,spatial,instanceId,position={}){
  const runtime=roster?.actors?.[String(instanceId)];
  if(!runtime) return {ok:false,reason:'missing-ally',roster,spatial};
  if(runtime.active===false||runtime.dismissed||runtime.expired) return {ok:false,reason:'inactive',roster,spatial};
  const nextRoster=clone(roster);
  const zoneId=String(position.zoneId ?? spatial?.zoneId ?? runtime.roomId ?? 'zone-1');
  nextRoster.actors[String(instanceId)].x=Number(position.x)||0;
  nextRoster.actors[String(instanceId)].y=Number(position.y)||0;
  nextRoster.actors[String(instanceId)].roomId=zoneId;
  const nextSpatial=setActorPosition(spatial,String(instanceId),{x:position.x,y:position.y,zoneId});
  return {ok:true,roster:nextRoster,spatial:nextSpatial};
}

export function moveAlly(roster,spatial,instanceId,target,spatialConfig={}){
  const runtime=roster?.actors?.[String(instanceId)];
  if(!runtime) return {ok:false,reason:'missing-ally',roster,spatial};
  if(runtime.active===false||runtime.dismissed||runtime.expired) return {ok:false,reason:'inactive',roster,spatial};
  const actor=runtime.actor||{};
  const moved=moveActor(spatial,String(instanceId),target,{...spatialConfig,actor});
  if(!moved.moved) return {ok:false,reason:moved.reason,roster,spatial:moved.spatial,distance:moved.distance,allowance:moved.allowance};
  const nextRoster=clone(roster);
  const pos=moved.spatial.positions?.[String(instanceId)];
  nextRoster.actors[String(instanceId)].x=pos?.x??null;
  nextRoster.actors[String(instanceId)].y=pos?.y??null;
  nextRoster.actors[String(instanceId)].roomId=pos?.zoneId??nextRoster.actors[String(instanceId)].roomId;
  return {ok:true,roster:nextRoster,spatial:moved.spatial,distance:moved.distance,allowance:moved.allowance};
}

export function alliesNearEngager(roster,spatial,engagerId,spatialConfig={}){
  const candidates=combatEligibleAllies(roster,{roomId:null}).map(runtime=>String(runtime.instanceId));
  const ids=combatParticipants(spatial,String(engagerId),candidates,spatialConfig);
  return ids.map(id=>roster.actors?.[id]).filter(Boolean);
}

export function buildAllyCombatants(roster,spatial,engagerId,{spatialConfig={},side='heroes',initiativeResolver=null}={}){
  return alliesNearEngager(roster,spatial,engagerId,spatialConfig).map(runtime=>({
    id:String(runtime.instanceId),
    side:String(runtime.metadata?.combatSide||side),
    initiative:Number(initiativeResolver?initiativeResolver(runtime):runtime.actor?.initiative??runtime.metadata?.initiative??0)||0,
    state:allyActorState(runtime),
    ko:Boolean(runtime.actor?.ko||runtime.ko),
    allyKind:runtime.kind,
    controlMode:runtime.controlMode,
    ownerActorId:runtime.ownerActorId||null,
  }));
}

export function syncAlliesFromCombat(roster,combat){
  const next=clone(roster);
  for(const id of next.order||[]){
    const runtime=next.actors?.[id];
    const actor=combat?.actors?.[id];
    if(!runtime||!actor) continue;
    runtime.actor=runtime.actor||{};
    runtime.actor.state=clone(actor.state||{});
    runtime.actor.ko=Boolean(actor.ko);
    if(actor.ko) runtime.actor.active=false;
  }
  return next;
}

export function finishAllyCombat(roster){
  const ticked=tickAllyDurations(roster,'combat',1);
  return {roster:ticked.roster,expiredInstanceIds:ticked.expiredInstanceIds};
}

export function finishAllyTurn(roster){
  const ticked=tickAllyDurations(roster,'turns',1);
  return {roster:ticked.roster,expiredInstanceIds:ticked.expiredInstanceIds};
}

export function finishAllyRound(roster){
  const ticked=tickAllyDurations(roster,'rounds',1);
  return {roster:ticked.roster,expiredInstanceIds:ticked.expiredInstanceIds};
}
