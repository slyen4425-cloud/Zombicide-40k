const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const clone=value=>structuredClone(value);

export function createCaptureVitals({currentHp,maxHp}={}){
  const max=Math.max(1,Number(maxHp)||1);
  const current=clamp(Number(currentHp ?? max),0,max);
  return {currentHp:current,maxHp:max,ko:current<=0};
}

export function applyCaptureDamage(vitals,amount){
  const next=createCaptureVitals(vitals);
  const value=Math.max(0,Number(amount)||0);
  next.currentHp=clamp(next.currentHp-value,0,next.maxHp);
  next.ko=next.currentHp<=0;
  return {vitals:next,amount:value,ko:next.ko};
}

export function applyCaptureHealing(vitals,amount){
  const next=createCaptureVitals(vitals);
  const value=Math.max(0,Number(amount)||0);
  if(next.ko) return {vitals:next,amount:0,ko:true,reason:'capture-heal-does-not-revive'};
  const before=next.currentHp;
  next.currentHp=clamp(next.currentHp+value,0,next.maxHp);
  return {vitals:next,amount:next.currentHp-before,ko:false};
}

export function resolveCaptureVitalEffect({battle,action,ability}={}){
  const effect=ability?.effect||action?.effect||null;
  if(!effect||!effect.type) return {ok:true,outcome:{type:'no_vital_effect'}};
  const targetSide=String(action?.targetSide||'opponent');
  const target=battle?.[targetSide];
  if(!target) return {ok:false,reason:'capture-vital-target-missing'};
  const nextBattle=clone(battle);
  const targetState=nextBattle[targetSide];
  targetState.vitals=createCaptureVitals(targetState.vitals||targetState.creature||{});

  if(effect.type==='damage'){
    const result=applyCaptureDamage(targetState.vitals,effect.amount);
    targetState.vitals=result.vitals;
    return {ok:true,battle:nextBattle,outcome:{type:'damage',amount:result.amount,targetSide,ko:result.ko,vitals:clone(result.vitals)}};
  }
  if(effect.type==='heal'){
    const result=applyCaptureHealing(targetState.vitals,effect.amount);
    targetState.vitals=result.vitals;
    return {ok:true,battle:nextBattle,outcome:{type:'heal',amount:result.amount,targetSide,ko:result.ko,vitals:clone(result.vitals),reason:result.reason||null}};
  }
  return {ok:true,outcome:{type:'declared_effect',effect:clone(effect)}};
}
