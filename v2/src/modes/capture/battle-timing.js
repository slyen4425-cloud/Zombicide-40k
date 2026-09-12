const clone=value=>structuredClone(value);

export const CAPTURE_BATTLE_TIMING_CONTRACT=Object.freeze({
  explicitClock:true,
  fixedRealtimeCadence:false,
  fixedIFrames:false,
  isolatedFromRpg:true,
});

export function setCaptureBattleReactionTime(battle,reactionTime){
  if(!battle) return {ok:false,reason:'battle-missing',battle};
  const value=Number(reactionTime);
  if(!Number.isFinite(value)) return {ok:false,reason:'capture-reaction-time-invalid',battle};
  return {
    ok:true,
    battle:{
      ...clone(battle),
      timing:{...(battle.timing||{}),reactionTime:value},
    },
    reactionTime:value,
  };
}

export function clearCaptureBattleReactionTime(battle){
  if(!battle) return {ok:false,reason:'battle-missing',battle};
  const next=clone(battle);
  next.timing={...(next.timing||{})};
  delete next.timing.reactionTime;
  return {ok:true,battle:next};
}
