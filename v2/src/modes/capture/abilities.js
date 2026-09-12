const clone=value=>structuredClone(value);

export function normalizeCaptureAbility(def={}){
  return {
    id:String(def.id||''),
    name:String(def.name||def.id||''),
    chargeMax:def.chargeMax==null?null:Math.max(0,Number(def.chargeMax)||0),
    cost:def.cost==null?null:Math.max(0,Number(def.cost)||0),
    cooldown:def.cooldown==null?null:Math.max(0,Number(def.cooldown)||0),
    range:def.range==null?null:Math.max(0,Number(def.range)||0),
    effect:def.effect==null?null:clone(def.effect),
    tags:[...(def.tags||[])],
    source:def.source||'capture',
  };
}

export function initializeCreatureAbilityState(creature={},abilityDefs=[]){
  const defs={};
  for(const raw of abilityDefs){
    const def=normalizeCaptureAbility(raw);
    if(def.id) defs[def.id]=def;
  }
  const state={};
  for(const abilityId of creature.abilityIds||[]){
    const def=defs[abilityId];
    if(!def) continue;
    const saved=creature?.abilityCharges?.[abilityId];
    state[abilityId]={
      charges:saved==null?def.chargeMax:Math.max(0,Number(saved)||0),
      chargeMax:def.chargeMax,
      cooldownRemaining:0,
      cost:def.cost,
    };
  }
  return state;
}

export function canUseCaptureAbility(abilityState,abilityId){
  const slot=abilityState?.[abilityId];
  if(!slot) return {ok:false,reason:'unknown_capture_ability'};
  if(slot.cooldownRemaining>0) return {ok:false,reason:'capture_ability_cooldown'};
  if(slot.charges!=null && slot.charges<=0) return {ok:false,reason:'capture_ability_no_charges'};
  return {ok:true};
}

export function spendCaptureAbility(abilityState,abilityId,{cooldown=0}={}){
  const check=canUseCaptureAbility(abilityState,abilityId);
  const next=clone(abilityState||{});
  if(!check.ok) return {...check,state:next};
  const slot=next[abilityId];
  if(slot.charges!=null) slot.charges=Math.max(0,slot.charges-1);
  slot.cooldownRemaining=Math.max(slot.cooldownRemaining||0,Number(cooldown)||0);
  return {ok:true,state:next};
}

export function tickCaptureAbilityCooldowns(abilityState,amount=1){
  const next=clone(abilityState||{});
  const delta=Math.max(0,Number(amount)||0);
  for(const slot of Object.values(next)) slot.cooldownRemaining=Math.max(0,(slot.cooldownRemaining||0)-delta);
  return next;
}
