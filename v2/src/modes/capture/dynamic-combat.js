import {
  createSpatialState,
  getActorPosition,
  moveActor,
  setActorPosition,
  shortestPathDistance,
} from '../../core/spatial-engine.js';
import {
  canUseCaptureAbility,
  normalizeCaptureAbility,
  spendCaptureAbility,
} from './abilities.js';

const clone=value=>structuredClone(value);

export const CAPTURE_DYNAMIC_COMBAT_RUNTIME=Object.freeze({
  dedicatedRuntime:true,
  usesRpgTurnRuntime:false,
  usesTurnSequence:false,
  usesD100Timeline:false,
  oneActiveCreaturePerSideByDefault:true,
  exactRealtimeTiming:'future_design_not_frozen',
});

function ownedInstance(team,instanceId){
  return (team||[]).find(entry=>String(entry.instanceId)===String(instanceId))||null;
}

function actorId(side,instanceId){return `${String(side)}:${String(instanceId)}`;}

export function createCaptureBattleState({
  encounter,
  activeTeam=[],
  playerActiveInstanceId=null,
  opponent=null,
  zoneId='capture-battle',
  playerPosition={x:0,y:0,zoneId},
  opponentPosition={x:3,y:0,zoneId},
}={}){
  if(!encounter) throw new Error('capture-battle-encounter-required');
  const selected=playerActiveInstanceId?ownedInstance(activeTeam,playerActiveInstanceId):(activeTeam[0]||null);
  if(!selected) throw new Error('capture-battle-player-active-required');
  const wild=opponent||{
    instanceId:`wild:${String(encounter.speciesId||'unknown')}`,
    speciesId:String(encounter.speciesId||''),
    wild:true,
  };
  if(!wild.speciesId) throw new Error('capture-battle-opponent-species-required');
  const playerActorId=actorId('player',selected.instanceId);
  const opponentActorId=actorId('opponent',wild.instanceId);
  let spatial=createSpatialState({zoneId});
  spatial=setActorPosition(spatial,playerActorId,playerPosition);
  spatial=setActorPosition(spatial,opponentActorId,opponentPosition);
  return {
    schemaVersion:1,
    runtime:'capture_dynamic',
    status:'active',
    encounter:clone(encounter),
    mode:encounter.type==='wild'?'wild':'battle',
    player:{activeInstanceId:String(selected.instanceId),actorId:playerActorId},
    opponent:{activeInstanceId:String(wild.instanceId),actorId:opponentActorId,creature:clone(wild)},
    spatial,
    pendingAction:null,
    actionLog:[],
    timing:{model:'future_design_not_frozen'},
  };
}

export function moveCaptureBattleActor(battle,side,target,{movement=3,diagonal=false}={}){
  if(!battle||battle.status!=='active') return {ok:false,reason:'battle-not-active',battle};
  const actor=battle[String(side)]?.actorId;
  if(!actor) return {ok:false,reason:'battle-side-missing',battle};
  const moved=moveActor(battle.spatial,actor,target,{defaultMovement:movement,diagonal,actor:{}});
  if(!moved.moved) return {ok:false,reason:moved.reason,battle,distance:moved.distance,allowance:moved.allowance};
  return {ok:true,battle:{...battle,spatial:moved.spatial},distance:moved.distance,allowance:moved.allowance};
}

export function captureBattleDistance(battle,fromSide='player',toSide='opponent',{diagonal=false,maxDistance=999}={}){
  const fromActor=battle?.[String(fromSide)]?.actorId;
  const toActor=battle?.[String(toSide)]?.actorId;
  if(!fromActor||!toActor) return Infinity;
  const from=getActorPosition(battle.spatial,fromActor);
  const to=getActorPosition(battle.spatial,toActor);
  return shortestPathDistance(battle.spatial,from,to,{diagonal,maxDistance});
}

export function isCaptureTargetInRange(battle,range,{fromSide='player',toSide='opponent',diagonal=false}={}){
  const normalizedRange=Math.max(0,Number(range)||0);
  const distance=captureBattleDistance(battle,fromSide,toSide,{diagonal,maxDistance:999});
  return {ok:Number.isFinite(distance)&&distance<=normalizedRange,distance,range:normalizedRange};
}

export function resolveCaptureAbilityAction({
  battle,
  side='player',
  targetSide='opponent',
  abilityDef,
  abilityState,
  effectResolver=null,
  diagonal=false,
}={}){
  if(!battle||battle.status!=='active') return {ok:false,reason:'battle-not-active',battle,abilityState:clone(abilityState||{})};
  const actor=battle[String(side)]?.actorId;
  const targetActor=battle[String(targetSide)]?.actorId;
  if(!actor||!targetActor) return {ok:false,reason:'battle-side-missing',battle,abilityState:clone(abilityState||{})};
  const ability=normalizeCaptureAbility(abilityDef||{});
  if(!ability.id) return {ok:false,reason:'capture-ability-id-required',battle,abilityState:clone(abilityState||{})};
  const usable=canUseCaptureAbility(abilityState,ability.id);
  if(!usable.ok) return {...usable,battle,abilityState:clone(abilityState||{})};
  if(ability.range!=null){
    const rangeCheck=isCaptureTargetInRange(battle,ability.range,{fromSide:side,toSide:targetSide,diagonal});
    if(!rangeCheck.ok) return {ok:false,reason:'capture-target-out-of-range',...rangeCheck,battle,abilityState:clone(abilityState||{})};
  }
  const spent=spendCaptureAbility(abilityState,ability.id,{cooldown:ability.cooldown||0});
  if(!spent.ok) return {...spent,battle};
  const action={
    type:'ability',
    side:String(side),
    targetSide:String(targetSide),
    abilityId:ability.id,
    effect:clone(ability.effect),
    resolved:false,
  };
  const resolution=typeof effectResolver==='function'
    ? effectResolver({battle:clone(battle),action:clone(action),ability:clone(ability)})
    : {ok:true,outcome:{type:'declared_effect',effect:clone(ability.effect)}};
  if(resolution?.ok===false){
    return {ok:false,reason:resolution.reason||'capture-effect-resolution-failed',battle,abilityState:clone(abilityState||{})};
  }
  const resolvedAction={...action,resolved:true,outcome:clone(resolution?.outcome??null)};
  const nextBattle={
    ...battle,
    pendingAction:null,
    actionLog:[...(battle.actionLog||[]).map(clone),resolvedAction],
  };
  return {
    ok:true,
    battle:nextBattle,
    abilityState:spent.state,
    action:resolvedAction,
  };
}

export function switchCaptureActiveCreature(battle,activeTeam,nextInstanceId){
  if(!battle||battle.status!=='active') return {ok:false,reason:'battle-not-active',battle};
  const next=ownedInstance(activeTeam,nextInstanceId);
  if(!next) return {ok:false,reason:'capture-active-creature-not-in-team',battle};
  if(String(next.instanceId)===String(battle.player.activeInstanceId)) return {ok:false,reason:'capture-creature-already-active',battle};
  const previousActorId=battle.player.actorId;
  const previousPosition=getActorPosition(battle.spatial,previousActorId);
  const nextActorId=actorId('player',next.instanceId);
  let spatial=clone(battle.spatial);
  if(previousPosition) spatial=setActorPosition(spatial,nextActorId,previousPosition);
  if(spatial.positions) delete spatial.positions[previousActorId];
  return {
    ok:true,
    previousInstanceId:String(battle.player.activeInstanceId),
    activeInstanceId:String(next.instanceId),
    battle:{
      ...battle,
      player:{activeInstanceId:String(next.instanceId),actorId:nextActorId},
      spatial,
    },
  };
}

export function endCaptureBattle(battle,reason){
  const allowed=new Set(['opponent_ko','capture_success','flee','player_team_unavailable']);
  if(!allowed.has(String(reason))) return {ok:false,reason:'capture-battle-invalid-end-reason',battle};
  return {ok:true,battle:{...battle,status:'ended',endReason:String(reason),pendingAction:null}};
}
