import {
  createSpatialState,
  moveActor,
  setActorPosition,
} from '../../core/spatial-engine.js';
import {
  buildWorldIndex,
  validateWorld,
} from '../../core/world-graph.js';

function clone(value){return structuredClone(value);}

export const CAPTURE_RUNTIME_CONTRACT = Object.freeze({
  mode: 'capture',
  isolatedGameplayState: true,
  sharedSpatialCore: true,
  sharedWorldGraphCore: true,
  usesRpgTurnRuntime: false,
  usesRpgTimeline: false,
  explorationModel: 'free_exploration_target',
  combatModel: 'dynamic_dedicated_target',
});

export const captureStorageKeys = Object.freeze({
  profile: (profileId) => `gensrpg:v2:capture:profile:${String(profileId)}`,
  save: (saveId) => `gensrpg:v2:capture:save:${String(saveId)}`,
  roster: (playerId) => `gensrpg:v2:capture:player:${String(playerId)}:roster`,
  team: (playerId) => `gensrpg:v2:capture:player:${String(playerId)}:team`,
  reserve: (playerId) => `gensrpg:v2:capture:player:${String(playerId)}:reserve`,
});

export function createCaptureModeState({
  profileId='capture-default',
  playerId='player-1',
  worldIndex=null,
  zoneId='zone-1',
  actorId='trainer-1',
  actorPosition={x:0,y:0,zoneId},
  activeTeam=[],
  reserve=[],
}={}){
  if(activeTeam.length>6) throw new Error('capture-active-team-limit');
  let spatial=createSpatialState({zoneId});
  spatial=setActorPosition(spatial,actorId,actorPosition);
  return {
    schemaVersion:1,
    mode:'capture',
    profileId:String(profileId),
    playerId:String(playerId),
    actorId:String(actorId),
    worldIndex:worldIndex?clone(worldIndex):null,
    spatial,
    activeTeam:clone(activeTeam),
    reserve:clone(reserve),
    encounter:null,
    battle:null,
    exploration:{freeMovement:true,turnSequence:null},
  };
}

export function createCaptureWorldIndex({world=null,zones=[],rooms=[],links=[]}={}){
  const index=buildWorldIndex({world,zones,rooms,links});
  const validation=validateWorld(index);
  return {index,validation};
}

export function moveCaptureActor(state,target,{movement=999,diagonal=false}={}){
  const result=moveActor(state.spatial,state.actorId,target,{
    defaultMovement:movement,
    diagonal,
    actor:{},
  });
  if(!result.moved) return {...result,state};
  return {
    ...result,
    state:{...state,spatial:result.spatial},
  };
}

export function setCaptureTeam(state,{activeTeam=[],reserve=state.reserve||[]}={}){
  if(activeTeam.length>6) throw new Error('capture-active-team-limit');
  return {...state,activeTeam:clone(activeTeam),reserve:clone(reserve)};
}
