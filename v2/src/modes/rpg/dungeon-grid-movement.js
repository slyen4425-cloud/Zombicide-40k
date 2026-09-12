import { actorMovementAllowance, getActorPosition, setActorPosition } from './spatial-engine.js';
import { shortestRoomPathDistance } from './room-tactical-bridge.js';

function clone(value){return structuredClone(value);}
function list(source){return Array.isArray(source)?source:Object.values(source||{});}
function heroRuntimeFor(heroRuntimes,heroId){return list(heroRuntimes).find(hero=>String(hero?.instanceId||hero?.heroId||'')===String(heroId))||null;}
function finiteCell(value){const n=Number(value);return Number.isInteger(n)?n:null;}

export const DUNGEON_GRID_MOVEMENT_CONTRACT=Object.freeze({
  usesSpatialCore:true,
  usesRoomTacticalBridge:true,
  outsideCombatOnly:true,
  mutatesDefinitions:false,
});

export function moveFocusedDungeonHeroOnGrid({roomRuntime=null,heroRuntimes=[],spatial=null,roomLayout=null,target=null,spatialConfig={},activeCombat=null}={}){
  if(!roomRuntime?.currentRoomId||!roomRuntime?.focusedHeroId) return {ok:false,reason:'dungeon-move-runtime-missing',roomRuntime,spatial};
  if(activeCombat&&activeCombat.phase!=='ended') return {ok:false,reason:'dungeon-move-combat-active',roomRuntime,spatial};
  if(!roomLayout) return {ok:false,reason:'dungeon-move-layout-missing',roomRuntime,spatial};

  const heroId=String(roomRuntime.focusedHeroId);
  const location=roomRuntime.heroLocations?.[heroId];
  if(!location||String(location.roomId)!==String(roomRuntime.currentRoomId)) return {ok:false,reason:'dungeon-move-hero-not-in-room',roomRuntime,spatial};
  const runtime=heroRuntimeFor(heroRuntimes,heroId);
  if(!runtime||runtime.ko||runtime.dead||runtime.active===false) return {ok:false,reason:'dungeon-move-hero-unavailable',roomRuntime,spatial};

  const activeSpatial=spatial||roomRuntime.spatial||null;
  if(!activeSpatial) return {ok:false,reason:'dungeon-move-spatial-missing',roomRuntime,spatial};
  const from=getActorPosition(activeSpatial,heroId);
  if(!from) return {ok:false,reason:'dungeon-move-position-missing',roomRuntime,spatial:activeSpatial};

  const x=finiteCell(target?.x),y=finiteCell(target?.y);
  if(x==null||y==null) return {ok:false,reason:'dungeon-move-target-invalid',roomRuntime,spatial:activeSpatial};
  const zoneId=String(from.zoneId??activeSpatial.zoneId??roomRuntime.currentRoomId);
  const to={x,y,zoneId};
  const allowance=actorMovementAllowance(runtime,{...spatialConfig,actor:runtime});
  const distance=shortestRoomPathDistance(roomLayout,from,to,{diagonal:Boolean(spatialConfig?.diagonal),maxDistance:allowance});
  if(!Number.isFinite(distance)||distance>allowance) return {ok:false,reason:'dungeon-move-out-of-range',roomRuntime,spatial:activeSpatial,distance,allowance};

  const nextSpatial=setActorPosition(activeSpatial,heroId,to);
  const nextRuntime=clone(roomRuntime);
  nextRuntime.spatial=clone(nextSpatial);
  return {ok:true,heroId,target:to,distance,allowance,spatial:nextSpatial,roomRuntime:nextRuntime};
}
