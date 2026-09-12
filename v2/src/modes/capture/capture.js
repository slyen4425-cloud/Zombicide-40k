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
import {
  biomeForCaptureRoom,
  buildCaptureBiomeIndex,
  rollCaptureWildEncounter,
} from './encounters.js';
import {
  createCaptureBattleState,
  endCaptureBattle,
  moveCaptureBattleActor,
  switchCaptureActiveCreature,
} from './dynamic-combat.js';

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
  biomes: (profileId) => `gensrpg:v2:capture:profile:${String(profileId)}:biomes`,
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
  currentRoomId=null,
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
    exploration:{freeMovement:true,turnSequence:null,currentRoomId:currentRoomId?String(currentRoomId):null},
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

export function enterCaptureRoom(state,roomId,{biomes=[],rng=Math.random}={}){
  if(state.encounter) return {ok:false,reason:'encounter-active',state};
  const room=state.worldIndex?.rooms?.[String(roomId)]||null;
  if(!room) return {ok:false,reason:'room-missing',state};
  const biomeIndex=buildCaptureBiomeIndex(biomes);
  const biome=biomeForCaptureRoom(room,biomeIndex);
  const rolled=biome?rollCaptureWildEncounter({biome,rng}):{ok:true,reason:'room-without-biome',encounter:null};
  const next={
    ...state,
    exploration:{...(state.exploration||{}),freeMovement:true,turnSequence:null,currentRoomId:String(roomId)},
    encounter:rolled.encounter?clone(rolled.encounter):null,
  };
  return {ok:true,reason:rolled.reason,room:clone(room),biome:biome?clone(biome):null,roll:rolled.roll??null,encounter:next.encounter,state:next};
}

export function clearCaptureEncounter(state){
  return {...state,encounter:null};
}

export function startCaptureBattle(state,{playerActiveInstanceId=null,opponent=null,zoneId='capture-battle',playerPosition,opponentPosition}={}){
  if(state.battle) return {ok:false,reason:'battle-active',state};
  if(!state.encounter) return {ok:false,reason:'capture-battle-encounter-required',state};
  try{
    const battle=createCaptureBattleState({
      encounter:state.encounter,
      activeTeam:state.activeTeam,
      playerActiveInstanceId,
      opponent,
      zoneId,
      ...(playerPosition?{playerPosition}:{}),
      ...(opponentPosition?{opponentPosition}:{}),
    });
    return {ok:true,battle,state:{...state,battle,exploration:{...(state.exploration||{}),freeMovement:false}}};
  }catch(error){
    return {ok:false,reason:error?.message||'capture-battle-start-failed',state};
  }
}

export function moveCaptureBattleCreature(state,side,target,options={}){
  if(!state.battle) return {ok:false,reason:'battle-missing',state};
  const moved=moveCaptureBattleActor(state.battle,side,target,options);
  if(!moved.ok) return {...moved,state};
  return {...moved,state:{...state,battle:moved.battle}};
}

export function switchCaptureBattleCreature(state,nextInstanceId){
  if(!state.battle) return {ok:false,reason:'battle-missing',state};
  const switched=switchCaptureActiveCreature(state.battle,state.activeTeam,nextInstanceId);
  if(!switched.ok) return {...switched,state};
  return {...switched,state:{...state,battle:switched.battle}};
}

export function finishCaptureBattle(state,reason){
  if(!state.battle) return {ok:false,reason:'battle-missing',state};
  const ended=endCaptureBattle(state.battle,reason);
  if(!ended.ok) return {...ended,state};
  const clearEncounter=reason==='capture_success'||reason==='opponent_ko'||reason==='flee';
  const next={
    ...state,
    battle:null,
    encounter:clearEncounter?null:state.encounter,
    exploration:{...(state.exploration||{}),freeMovement:true},
  };
  return {ok:true,endReason:String(reason),endedBattle:ended.battle,state:next};
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
