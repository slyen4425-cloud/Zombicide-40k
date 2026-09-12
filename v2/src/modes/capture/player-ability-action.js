import {useCaptureBattleAbility} from './capture.js';
import {resolveCaptureVitalEffect} from './vitals.js';

const clone=value=>structuredClone(value);

export const CAPTURE_PLAYER_ABILITY_ACTION_CONTRACT=Object.freeze({
  usesAuthoritativeBattleAbility:true,
  persistsOwnedCreatureAbilityState:true,
  defaultsToCaptureVitalEffectResolver:true,
  neverInitializesMissingAbilityState:true,
  neverUsesRpgRuntime:true,
});

function activeOwnedCreature(state){
  const activeId=String(state?.battle?.player?.activeInstanceId||'');
  if(!activeId) return null;
  return (state?.activeTeam||[]).find(entry=>String(entry?.instanceId||'')===activeId)||null;
}

export function executeCapturePlayerAbility(state,{abilityDef,effectResolver=resolveCaptureVitalEffect,reactionResolver=null,diagonal=false}={}){
  if(!state?.battle) return {ok:false,reason:'battle-missing',state};
  const active=activeOwnedCreature(state);
  if(!active) return {ok:false,reason:'capture-active-creature-not-in-team',state};
  if(!active.abilityState||typeof active.abilityState!=='object'){
    return {ok:false,reason:'capture-player-ability-state-missing',state};
  }

  const result=useCaptureBattleAbility(state,{
    side:'player',
    targetSide:'opponent',
    abilityDef,
    abilityState:clone(active.abilityState),
    effectResolver,
    reactionResolver,
    diagonal,
  });
  if(!result.ok) return result;

  const spentState=clone(result.abilityState||{});
  const activeId=String(active.instanceId);
  const nextActiveTeam=(result.state?.activeTeam||[]).map(entry=>String(entry?.instanceId||'')!==activeId
    ?clone(entry)
    :{...clone(entry),abilityState:spentState});
  const nextReserve=clone(result.state?.reserve||[]);
  const nextRoster=[...nextActiveTeam,...nextReserve].map(clone);
  let nextBattle=result.state?.battle?clone(result.state.battle):null;
  if(nextBattle&&String(nextBattle.player?.activeInstanceId||'')===activeId){
    nextBattle={
      ...nextBattle,
      player:{
        ...nextBattle.player,
        creature:{...clone(nextBattle.player?.creature||{}),abilityState:spentState},
      },
    };
  }
  const nextState={
    ...result.state,
    activeTeam:nextActiveTeam,
    reserve:nextReserve,
    roster:nextRoster,
    battle:nextBattle,
  };
  return {...result,state:nextState,abilityState:spentState};
}
