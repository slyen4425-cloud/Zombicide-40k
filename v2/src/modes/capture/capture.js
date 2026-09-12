import {
  createSpatialState,
  moveActor,
  setActorPosition,
} from '../../core/spatial-engine.js';
import {
  buildWorldIndex,
  validateWorld,
} from '../../core/world-graph.js';
import {
  importLegacyOwnedCreatures,
  moveOwnedCreature,
  splitRosterIntoTeamAndReserve,
} from './roster.js';

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
  lazyInitializationRequired: true,
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
  roster=[],
  activeTeam=[],
  reserve=[],
  quarantine=[],
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
    roster:clone(roster),
    activeTeam:clone(activeTeam),
    reserve:clone(reserve),
    quarantine:clone(quarantine),
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
  const roster=[...activeTeam,...reserve].map(clone);
  return {...state,roster,activeTeam:clone(activeTeam),reserve:clone(reserve)};
}

export function initializeCaptureRoster(state,{legacyOwned=[],canonicalization={},preferredActiveIds=[]}={}){
  const imported=importLegacyOwnedCreatures(legacyOwned,canonicalization);
  const split=splitRosterIntoTeamAndReserve(imported.roster,{preferredActiveIds,teamSize:6});
  return {
    ...state,
    roster:clone(imported.roster),
    activeTeam:clone(split.activeTeam),
    reserve:clone(split.reserve),
    quarantine:[...(state.quarantine||[]).map(clone),...imported.quarantine.map(clone)],
  };
}

export function moveCaptureRosterCreature(state,instanceId,destination){
  const moved=moveOwnedCreature({activeTeam:state.activeTeam,reserve:state.reserve},instanceId,destination);
  if(!moved.ok) return {...moved,state};
  return {
    ...moved,
    state:{
      ...state,
      activeTeam:clone(moved.activeTeam),
      reserve:clone(moved.reserve),
      roster:[...moved.activeTeam,...moved.reserve].map(clone),
    },
  };
}
