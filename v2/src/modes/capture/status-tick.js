import {tickCaptureStatuses} from './statuses.js';

const clone=value=>structuredClone(value);

export function tickCaptureBattleStatuses(battle,{amount=1}={}){
  if(!battle||battle.status!=='active') return {ok:false,reason:'battle-not-active',battle};
  const next=clone(battle);
  const expired={player:[],opponent:[]};
  for(const side of ['player','opponent']){
    const result=tickCaptureStatuses(next[side]?.statuses||[],amount);
    if(next[side]) next[side].statuses=result.statuses;
    expired[side]=result.expired;
  }
  return {
    ok:true,
    amount:Math.max(0,Number(amount)||0),
    battle:next,
    expired,
  };
}
