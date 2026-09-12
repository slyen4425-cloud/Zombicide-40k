import {getActorPosition} from '../../core/spatial-engine.js';
import {
  captureBattleDistance,
  isCaptureTargetInRange,
  moveCaptureBattleActor,
  resolveCaptureAbilityAction,
} from './dynamic-combat.js';
import {canUseCaptureAbility,normalizeCaptureAbility} from './abilities.js';

const clone=value=>structuredClone(value);

export const CAPTURE_AI_CONTRACT=Object.freeze({
  dedicatedCaptureAi:true,
  usesRpgAi:false,
  usesRpgTimeline:false,
  priorities:['usable_ability_in_range','move_toward_target','wait'],
  finalBehaviorModel:'future_design_not_frozen',
});

function usableAbilityChoices(abilityDefs=[],abilityState={}){
  return (abilityDefs||[])
    .map(normalizeCaptureAbility)
    .filter(ability=>ability.id&&canUseCaptureAbility(abilityState,ability.id).ok);
}

export function chooseCaptureAiAction({battle,abilityDefs=[],abilityState={}}={}){
  if(!battle||battle.status!=='active') return {type:'wait',reason:'battle-not-active'};
  const usable=usableAbilityChoices(abilityDefs,abilityState);
  for(const ability of usable){
    if(ability.range==null||isCaptureTargetInRange(battle,ability.range,{fromSide:'opponent',toSide:'player'}).ok){
      return {type:'ability',abilityId:ability.id};
    }
  }
  const distance=captureBattleDistance(battle,'opponent','player',{maxDistance:999});
  if(Number.isFinite(distance)&&distance>0) return {type:'move_toward_target',distance};
  return {type:'wait',reason:'no-available-action'};
}

function nextStepTowardTarget(battle){
  const from=getActorPosition(battle.spatial,battle.opponent?.actorId);
  const to=getActorPosition(battle.spatial,battle.player?.actorId);
  if(!from||!to||String(from.zoneId)!==String(to.zoneId)) return null;
  const candidates=[
    {x:from.x+1,y:from.y,zoneId:from.zoneId},
    {x:from.x-1,y:from.y,zoneId:from.zoneId},
    {x:from.x,y:from.y+1,zoneId:from.zoneId},
    {x:from.x,y:from.y-1,zoneId:from.zoneId},
  ];
  const currentDistance=captureBattleDistance(battle,'opponent','player',{maxDistance:999});
  for(const target of candidates){
    const moved=moveCaptureBattleActor(battle,'opponent',target,{movement:1,diagonal:false});
    if(!moved.ok) continue;
    const nextDistance=captureBattleDistance(moved.battle,'opponent','player',{maxDistance:999});
    if(nextDistance<currentDistance) return target;
  }
  return null;
}

export function executeCaptureAiAction({
  battle,
  abilityDefs=[],
  abilityState={},
  effectResolver=null,
}={}){
  const decision=chooseCaptureAiAction({battle,abilityDefs,abilityState});
  if(decision.type==='ability'){
    const abilityDef=(abilityDefs||[]).find(entry=>String(entry.id)===String(decision.abilityId));
    const result=resolveCaptureAbilityAction({
      battle,
      side:'opponent',
      targetSide:'player',
      abilityDef,
      abilityState,
      effectResolver,
    });
    return {...result,decision};
  }
  if(decision.type==='move_toward_target'){
    const target=nextStepTowardTarget(battle);
    if(!target) return {ok:false,reason:'capture-ai-no-path',battle,abilityState:clone(abilityState),decision:{type:'wait',reason:'no-path'}};
    const moved=moveCaptureBattleActor(battle,'opponent',target,{movement:1,diagonal:false});
    return moved.ok
      ? {ok:true,battle:moved.battle,abilityState:clone(abilityState),decision:{...decision,target}}
      : {ok:false,reason:moved.reason,battle,abilityState:clone(abilityState),decision};
  }
  return {ok:true,battle,abilityState:clone(abilityState),decision};
}
