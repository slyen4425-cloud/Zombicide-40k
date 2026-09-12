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
  resolveCaptureAbilityAction,
  switchCaptureActiveCreature,
} from './dynamic-combat.js';
import {
  chooseCaptureAiAction,
  executeCaptureAiAction,
} from './ai.js';
import {resolveCaptureAttempt} from './capture-attempt.js';
import {consumeCaptureItem,createCaptureInventory} from './items.js';
import {tickCaptureReactionStateMap} from './reaction-state.js';

function clone(value){return structuredClone(value);}
function makeId(){
  if(globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID();
  return `capture-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

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
  inventory=createCaptureInventory(),
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
    inventory:clone(inventory),
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
  const result=moveActor(state.spatial,state.actorId,target,{defaultMovement:movement,diagonal,actor:{}});
  if(!result.moved) return {...result,state};
  return {...result,state:{...state,spatial:result.spatial}};
}

export function enterCaptureRoom(state,roomId,{biomes=[],rng=Math.random}={}){
  if(state.encounter) return {ok:false,reason:'encounter-active',state};
  const room=state.worldIndex?.rooms?.[String(roomId)]||null;
  if(!room) return {ok:false,reason:'room-missing',state};
  const biomeIndex=buildCaptureBiomeIndex(biomes);
  const biome=biomeForCaptureRoom(room,biomeIndex);
  const rolled=biome?rollCaptureWildEncounter({biome,rng}):{ok:true,reason:'room-without-biome',encounter:null};
  const next={...state,exploration:{...(state.exploration||{}),freeMovement:true,turnSequence:null,currentRoomId:String(roomId)},encounter:rolled.encounter?clone(rolled.encounter):null};
  return {ok:true,reason:rolled.reason,room:clone(room),biome:biome?clone(biome):null,roll:rolled.roll??null,encounter:next.encounter,state:next};
}

export function clearCaptureEncounter(state){return {...state,encounter:null};}

export function startCaptureBattle(state,{playerActiveInstanceId=null,opponent=null,zoneId='capture-battle',playerPosition,opponentPosition}={}){
  if(state.battle) return {ok:false,reason:'battle-active',state};
  if(!state.encounter) return {ok:false,reason:'capture-battle-encounter-required',state};
  try{
    const battle=createCaptureBattleState({encounter:state.encounter,activeTeam:state.activeTeam,playerActiveInstanceId,opponent,zoneId,...(playerPosition?{playerPosition}:{}),...(opponentPosition?{opponentPosition}:{})});
    return {ok:true,battle,state:{...state,battle,exploration:{...(state.exploration||{}),freeMovement:false}}};
  }catch(error){return {ok:false,reason:error?.message||'capture-battle-start-failed',state};}
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

export function useCaptureBattleAbility(state,{side='player',targetSide='opponent',abilityDef,abilityState,effectResolver=null,reactionResolver=null,diagonal=false}={}){
  if(!state.battle) return {ok:false,reason:'battle-missing',state};
  const result=resolveCaptureAbilityAction({
    battle:state.battle,
    side,
    targetSide,
    abilityDef,
    abilityState,
    effectResolver,
    reactionResolver,
    diagonal,
    activeTeam:state.activeTeam,
  });
  if(!result.ok) return {...result,state};

  let activeTeam=clone(result.activeTeam||state.activeTeam||[]);
  const battlePlayer=result.battle?.player||null;
  if(battlePlayer?.activeInstanceId){
    activeTeam=activeTeam.map(entry=>String(entry.instanceId)!==String(battlePlayer.activeInstanceId)
      ? clone(entry)
      : {...clone(entry),reactionState:clone(battlePlayer.reactionState||{})});
  }
  const reserve=clone(state.reserve||[]);
  const roster=[...activeTeam,...reserve].map(clone);
  const ended=result.battle?.status==='ended';
  const endReason=result.battle?.endReason||null;
  const clearEncounter=ended&&(endReason==='opponent_ko'||endReason==='flee'||endReason==='capture_success');
  const next={
    ...state,
    activeTeam,
    reserve,
    roster,
    battle:ended?null:clone(result.battle),
    encounter:clearEncounter?null:state.encounter,
    exploration:{...(state.exploration||{}),freeMovement:ended?true:false},
  };
  return {
    ...result,
    ended,
    endReason,
    state:next,
  };
}

export function runCaptureAiStep(state,{abilityDefs=[],abilityState={},effectResolver=null,reactionResolver=null}={}){
  if(!state.battle) return {ok:false,reason:'battle-missing',state,abilityState:clone(abilityState)};
  const decision=chooseCaptureAiAction({battle:state.battle,abilityDefs,abilityState});
  if(decision.type==='ability'){
    const abilityDef=(abilityDefs||[]).find(entry=>String(entry.id)===String(decision.abilityId));
    const result=useCaptureBattleAbility(state,{
      side:'opponent',
      targetSide:'player',
      abilityDef,
      abilityState,
      effectResolver,
      reactionResolver,
    });
    return {...result,decision};
  }

  const result=executeCaptureAiAction({
    battle:state.battle,
    abilityDefs,
    abilityState,
    effectResolver,
  });
  if(!result.ok) return {...result,state};
  return {
    ...result,
    ended:false,
    endReason:null,
    state:{
      ...state,
      battle:clone(result.battle),
      exploration:{...(state.exploration||{}),freeMovement:false},
    },
  };
}

export function tickCaptureBattleReactionCooldowns(state,{amount=1}={}){
  if(!state?.battle) return {ok:false,reason:'battle-missing',state};
  const battle=clone(state.battle);
  battle.player.reactionState=tickCaptureReactionStateMap(battle.player?.reactionState||{},amount);
  battle.opponent.reactionState=tickCaptureReactionStateMap(battle.opponent?.reactionState||{},amount);
  const activeId=String(battle.player?.activeInstanceId||'');
  const activeTeam=(state.activeTeam||[]).map(entry=>String(entry.instanceId)!==activeId
    ? clone(entry)
    : {...clone(entry),reactionState:clone(battle.player.reactionState||{})});
  const reserve=clone(state.reserve||[]);
  const roster=[...activeTeam,...reserve].map(clone);
  return {ok:true,amount:Math.max(0,Number(amount)||0),state:{...state,battle,activeTeam,reserve,roster}};
}

export function advanceCaptureBattleTime(state,{amount=1,tickReactionCooldowns=true}={}){
  if(!state?.battle) return {ok:false,reason:'battle-missing',state};
  const delta=Math.max(0,Number(amount)||0);
  let nextState=state;
  const battle=clone(state.battle);
  const current=Number(battle?.timing?.reactionTime);
  const reactionTime=(Number.isFinite(current)?current:0)+delta;
  battle.timing={...(battle.timing||{}),reactionTime};
  nextState={...state,battle};
  if(tickReactionCooldowns&&delta>0){
    const ticked=tickCaptureBattleReactionCooldowns(nextState,{amount:delta});
    if(!ticked.ok) return ticked;
    nextState=ticked.state;
  }
  return {ok:true,amount:delta,reactionTime,state:nextState};
}

export function attemptCaptureInBattle(state,{orbId,speciesCaptureRate,currentHp,maxHp,orbLibrary,lowHpMultiplier,rng=Math.random}={}){
  if(!state.battle) return {ok:false,reason:'battle-missing',state};
  if(state.battle.status!=='active'||state.battle.mode!=='wild') return {ok:false,reason:'capture-attempt-requires-active-wild-battle',state};
  const encounterSpecies=String(state.battle.encounter?.speciesId||state.encounter?.speciesId||'');
  const opponentSpecies=String(state.battle.opponent?.creature?.speciesId||'');
  if(!encounterSpecies||encounterSpecies!==opponentSpecies) return {ok:false,reason:'capture-battle-species-mismatch',state};

  const attempt=resolveCaptureAttempt({speciesCaptureRate,currentHp,maxHp,orbId,orbLibrary,lowHpMultiplier},rng);
  if(!attempt.ok) return {...attempt,state};

  const consumed=consumeCaptureItem(state.inventory,attempt.orbId,1,orbLibrary);
  if(!consumed.ok) return {...consumed,state};

  if(!attempt.captured){
    return {ok:true,captured:false,attempt,state:{...state,inventory:consumed.inventory}};
  }

  const creature={
    instanceId:makeId(),
    speciesId:encounterSpecies,
    legacySpeciesId:null,
    nickname:'',
    level:Math.max(1,Number(state.battle.opponent?.creature?.level)||1),
    xp:0,
    currentHp:Number.isFinite(Number(currentHp))?Math.max(0,Number(currentHp)):null,
    maxHp:Number.isFinite(Number(maxHp))?Math.max(0,Number(maxHp)):null,
    abilityCharges:clone(state.battle.opponent?.creature?.abilityCharges||{}),
    reactionState:clone(state.battle.opponent?.reactionState||{}),
    metadata:{capturedFrom:'wild_battle'},
  };

  const activeTeam=clone(state.activeTeam||[]);
  const reserve=clone(state.reserve||[]);
  const destination=activeTeam.length<6?'active':'reserve';
  if(destination==='active') activeTeam.push(creature); else reserve.push(creature);
  const roster=[...activeTeam,...reserve].map(clone);
  const ended=endCaptureBattle(state.battle,'capture_success');
  const next={
    ...state,
    inventory:consumed.inventory,
    activeTeam,
    reserve,
    roster,
    battle:null,
    encounter:null,
    exploration:{...(state.exploration||{}),freeMovement:true},
  };
  return {ok:true,captured:true,attempt,destination,creature:clone(creature),endedBattle:ended.battle,state:next};
}

export function finishCaptureBattle(state,reason){
  if(!state.battle) return {ok:false,reason:'battle-missing',state};
  const ended=endCaptureBattle(state.battle,reason);
  if(!ended.ok) return {...ended,state};
  const clearEncounter=reason==='capture_success'||reason==='opponent_ko'||reason==='flee';
  const next={...state,battle:null,encounter:clearEncounter?null:state.encounter,exploration:{...(state.exploration||{}),freeMovement:true}};
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
  return {...state,roster:clone(imported.roster),activeTeam:clone(split.activeTeam),reserve:clone(split.reserve),quarantine:[...(state.quarantine||[]).map(clone),...imported.quarantine.map(clone)]};
}

export function moveCaptureRosterCreature(state,instanceId,destination){
  const moved=moveOwnedCreature({activeTeam:state.activeTeam,reserve:state.reserve},instanceId,destination);
  if(!moved.ok) return {...moved,state};
  return {...moved,state:{...state,activeTeam:clone(moved.activeTeam),reserve:clone(moved.reserve),roster:[...moved.activeTeam,...moved.reserve].map(clone)}};
}
