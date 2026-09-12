import {collectCaptureStatusEffects,tickCaptureStatuses} from './statuses.js';
import {applyCaptureDamage,applyCaptureHealing,createCaptureVitals} from './vitals.js';
import {resolveCaptureKoState} from './dynamic-combat.js';

const clone=value=>structuredClone(value);

function applyPeriodicEffectsToSide(battle,side,effects=[]){
  const next=clone(battle);
  const actor=next?.[side];
  if(!actor) return {battle:next,applied:[]};
  actor.vitals=createCaptureVitals(actor.vitals||actor.creature||{});
  const applied=[];
  for(const effect of effects||[]){
    const stacks=Math.max(1,Number(effect.stacks)||1);
    const amount=Math.max(0,Number(effect.amount)||0)*stacks;
    if(effect.type==='damage'){
      const result=applyCaptureDamage(actor.vitals,amount);
      actor.vitals=result.vitals;
      applied.push({type:'damage',amount:result.amount,statusId:effect.statusId||null,stacks,ko:result.ko});
      continue;
    }
    if(effect.type==='heal'){
      const result=applyCaptureHealing(actor.vitals,amount);
      actor.vitals=result.vitals;
      applied.push({type:'heal',amount:result.amount,statusId:effect.statusId||null,stacks,ko:result.ko,reason:result.reason||null});
    }
  }
  return {battle:next,applied};
}

export function tickCaptureBattleStatuses(battle,{amount=1,activeTeam=[]}={}){
  if(!battle||battle.status!=='active') return {ok:false,reason:'battle-not-active',battle};
  let next=clone(battle);
  const expired={player:[],opponent:[]};
  const applied={player:[],opponent:[]};

  for(const side of ['player','opponent']){
    const currentStatuses=clone(next[side]?.statuses||[]);
    const periodicEffects=collectCaptureStatusEffects(currentStatuses)
      .filter(effect=>effect.type==='damage'||effect.type==='heal');
    const periodic=applyPeriodicEffectsToSide(next,side,periodicEffects);
    next=periodic.battle;
    applied[side]=periodic.applied;

    const result=tickCaptureStatuses(currentStatuses,amount);
    if(next[side]) next[side].statuses=result.statuses;
    expired[side]=result.expired;
  }

  const ko=resolveCaptureKoState(next,activeTeam);
  if(!ko.ok) return {...ko,expired,applied};
  return {
    ok:true,
    amount:Math.max(0,Number(amount)||0),
    battle:ko.battle,
    activeTeam:ko.activeTeam,
    koOutcome:ko.outcome,
    expired,
    applied,
    ...(ko.previousInstanceId?{previousInstanceId:ko.previousInstanceId}:{}),
    ...(ko.activeInstanceId?{activeInstanceId:ko.activeInstanceId}:{}),
  };
}
