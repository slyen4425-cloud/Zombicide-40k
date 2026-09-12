import {getActorPosition,shortestPathDistance} from '../../core/spatial-engine.js';

const clone=value=>structuredClone(value);

export const CAPTURE_UI_SPATIAL_SUMMARY_CONTRACT=Object.freeze({
  presentationOnly:true,
  readsAuthoritativeBattleSpatial:true,
  computesDistanceWithSharedSpatialCore:true,
  mutatesBattle:false,
  mutatesGameplayState:false,
  derivesAbilityRangeRules:false,
  isolatedFromRpg:true,
});

export function buildCaptureSpatialSummary(state,{diagonal=false}={}){
  const battle=state?.battle;
  if(!battle||battle.status!=='active') return null;
  const playerActorId=battle.player?.actorId||null;
  const opponentActorId=battle.opponent?.actorId||null;
  if(!playerActorId||!opponentActorId) return null;
  const playerPosition=getActorPosition(battle.spatial,playerActorId);
  const opponentPosition=getActorPosition(battle.spatial,opponentActorId);
  if(!playerPosition||!opponentPosition) return null;
  const distance=shortestPathDistance(battle.spatial,playerPosition,opponentPosition,{diagonal:Boolean(diagonal),maxDistance:999});
  return {
    playerPosition:clone(playerPosition),
    opponentPosition:clone(opponentPosition),
    distance:Number.isFinite(distance)?distance:null,
    distanceLabel:Number.isFinite(distance)?String(distance):'inaccessible',
    diagonal:Boolean(diagonal),
  };
}
