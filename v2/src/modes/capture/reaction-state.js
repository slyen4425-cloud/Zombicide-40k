const clone=value=>structuredClone(value);

export const CAPTURE_REACTION_STATE_CONTRACT=Object.freeze({
  perCreatureInstance:true,
  explicitCooldownTick:true,
  noImplicitResourcePool:true,
  isolatedFromRpg:true,
});

export function normalizeCaptureReactionState(state={}){
  const resource=state.resource==null?null:Math.max(0,Number(state.resource)||0);
  return {
    resource,
    cooldownRemaining:Math.max(0,Number(state.cooldownRemaining)||0),
  };
}

export function reactionStateFromCreature(creature={},reactionId=''){
  const id=String(reactionId||'');
  const saved=creature?.reactionState?.[id]||{};
  return normalizeCaptureReactionState(saved);
}

export function canUseCaptureReactionState(state={},reaction={}){
  const current=normalizeCaptureReactionState(state);
  if(current.cooldownRemaining>0) return {ok:false,reason:'capture-reaction-cooldown',state:current};
  const cost=Math.max(0,Number(reaction?.cost)||0);
  if(cost>0&&current.resource==null) return {ok:false,reason:'capture-reaction-resource-unconfigured',state:current};
  if(cost>0&&current.resource<cost) return {ok:false,reason:'capture-reaction-resource-insufficient',state:current};
  return {ok:true,state:current};
}

export function spendCaptureReactionState(state={},reaction={}){
  const usable=canUseCaptureReactionState(state,reaction);
  if(!usable.ok) return usable;
  const cost=Math.max(0,Number(reaction?.cost)||0);
  const cooldown=Math.max(0,Number(reaction?.cooldown)||0);
  return {
    ok:true,
    state:{
      resource:usable.state.resource==null?null:Math.max(0,usable.state.resource-cost),
      cooldownRemaining:cooldown,
    },
  };
}

export function tickCaptureReactionStateMap(reactionState={},amount=1){
  const delta=Math.max(0,Number(amount)||0);
  const next={};
  for(const [id,raw] of Object.entries(reactionState||{})){
    const state=normalizeCaptureReactionState(raw);
    next[String(id)]={...state,cooldownRemaining:Math.max(0,state.cooldownRemaining-delta)};
  }
  return clone(next);
}
