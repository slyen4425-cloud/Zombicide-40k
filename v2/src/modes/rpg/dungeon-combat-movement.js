import { getActorPosition } from './spatial-engine.js';
import { createCombatMovementState, moveCombatActor } from './tactical-combat.js';

function clone(value){return structuredClone(value);}
function list(value){return Array.isArray(value)?value:Object.values(value||{});}
function heroRuntimeFor(heroRuntimes,actorId){
  return list(heroRuntimes).find(hero=>String(hero?.instanceId||hero?.heroId||'')===String(actorId))||null;
}
function cellKey(x,y){return `${Number(x)},${Number(y)}`;}
function finiteCell(value){const n=Number(value);return Number.isInteger(n)?n:null;}

export const DUNGEON_COMBAT_MOVEMENT_CONTRACT=Object.freeze({
  sameCombatEngine:true,
  reusesTacticalCombatMoveActor:true,
  usesSpatialCore:true,
  budgetPerTurnSequence:true,
  attackDoesNotAutoTrigger:true,
  mutatesDefinitions:false,
});

function occupiedLayout(layout,combat,spatial,actorId){
  const next=clone(layout||{});
  next.cells={...(next.cells||{})};
  for(const actor of Object.values(combat?.actors||{})){
    if(!actor||actor.ko||String(actor.id)===String(actorId)) continue;
    const pos=getActorPosition(spatial,actor.id);
    if(!pos) continue;
    const key=cellKey(pos.x,pos.y);
    next.cells[key]={...(next.cells[key]||{}),blocked:true};
  }
  return next;
}

function currentMoveState(combat,config){
  const saved=combat?.metadata?.tacticalMoveState||null;
  if(saved&&Number(saved.turnSequence)===Number(combat?.turnSequence)&&saved.state) return clone(saved.state);
  return createCombatMovementState(combat,config);
}

export function dungeonCombatMovementState({combat=null,heroRuntimes=[],spatialConfig={},roomLayout=null}={}){
  if(!combat||combat.phase!=='turn'||!combat.activeActorId) return {enabled:false,reason:'not-in-turn',actorId:null,allowance:0,spent:0,remaining:0};
  const actor=combat.actors?.[combat.activeActorId];
  if(!actor||actor.side!=='heroes'||actor.ko) return {enabled:false,reason:'not-hero-turn',actorId:actor?.id||null,allowance:0,spent:0,remaining:0};
  const runtime=heroRuntimeFor(heroRuntimes,actor.id);
  if(!runtime||runtime.ko||runtime.dead||runtime.active===false) return {enabled:false,reason:'hero-unavailable',actorId:String(actor.id),allowance:0,spent:0,remaining:0};
  const config={...spatialConfig,roomLayout};
  const moveState=currentMoveState(combat,config);
  const remaining=Math.max(0,Number(moveState?.remaining?.[actor.id])||0);
  const spent=Math.max(0,Number(moveState?.spent?.[actor.id])||0);
  return {enabled:true,reason:null,actorId:String(actor.id),allowance:remaining+spent,spent,remaining,moveState};
}

export function moveActiveDungeonHeroInCombat({combat=null,roomRuntime=null,heroRuntimes=[],spatial=null,roomLayout=null,target=null,spatialConfig={}}={}){
  const state=dungeonCombatMovementState({combat,heroRuntimes,spatialConfig,roomLayout});
  if(!state.enabled) return {ok:false,reason:state.reason,combat,roomRuntime,spatial,movement:state};
  if(!roomLayout) return {ok:false,reason:'combat-move-layout-missing',combat,roomRuntime,spatial,movement:state};
  const activeSpatial=spatial||roomRuntime?.spatial||null;
  if(!activeSpatial) return {ok:false,reason:'combat-move-spatial-missing',combat,roomRuntime,spatial,movement:state};
  const from=getActorPosition(activeSpatial,state.actorId);
  if(!from) return {ok:false,reason:'combat-move-position-missing',combat,roomRuntime,spatial:activeSpatial,movement:state};
  const x=finiteCell(target?.x),y=finiteCell(target?.y);
  if(x==null||y==null) return {ok:false,reason:'combat-move-target-invalid',combat,roomRuntime,spatial:activeSpatial,movement:state};
  const to={x,y,zoneId:String(from.zoneId??activeSpatial.zoneId??roomRuntime?.currentRoomId??'')};
  if(Number(from.x)===x&&Number(from.y)===y) return {ok:false,reason:'combat-move-same-cell',combat,roomRuntime,spatial:activeSpatial,movement:state};
  for(const actor of Object.values(combat.actors||{})){
    if(!actor||actor.ko||String(actor.id)===state.actorId) continue;
    const pos=getActorPosition(activeSpatial,actor.id);
    if(pos&&Number(pos.x)===x&&Number(pos.y)===y&&String(pos.zoneId??'')===String(to.zoneId??'')) return {ok:false,reason:'combat-move-cell-occupied',combat,roomRuntime,spatial:activeSpatial,movement:state};
  }
  if(state.remaining<=0) return {ok:false,reason:'combat-move-budget-spent',combat,roomRuntime,spatial:activeSpatial,movement:state};

  const tacticalLayout=occupiedLayout(roomLayout,combat,activeSpatial,state.actorId);
  const config={...spatialConfig,roomLayout:tacticalLayout};
  const moved=moveCombatActor({spatial:activeSpatial,combat,actorId:state.actorId,target:to,moveState:state.moveState,config});
  if(!moved.ok) return {ok:false,reason:`combat-move-${moved.reason||'refused'}`,combat,roomRuntime,spatial:activeSpatial,distance:moved.distance,movement:state};

  const nextCombat=clone(combat);
  nextCombat.metadata=nextCombat.metadata||{};
  nextCombat.metadata.tacticalMoveState={turnSequence:Number(combat.turnSequence)||0,state:clone(moved.moveState)};
  nextCombat.log=[...(nextCombat.log||[]),{type:'combat-move',actorId:state.actorId,turnSequence:Number(combat.turnSequence)||0,distance:moved.distance,to:clone(to)}];
  const nextRuntime=roomRuntime?clone(roomRuntime):null;
  if(nextRuntime) nextRuntime.spatial=clone(moved.spatial);
  const movement={enabled:true,reason:null,actorId:state.actorId,allowance:state.allowance,spent:Number(moved.moveState?.spent?.[state.actorId])||0,remaining:Number(moved.remaining)||0,moveState:clone(moved.moveState)};
  return {ok:true,reason:null,combat:nextCombat,roomRuntime:nextRuntime,spatial:moved.spatial,actorId:state.actorId,from:clone(from),target:to,distance:moved.distance,movement};
}
