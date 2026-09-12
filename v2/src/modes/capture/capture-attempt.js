import {resolveCaptureItem} from './items.js';

const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));

export const CAPTURE_ATTEMPT_CONTRACT=Object.freeze({
  lowHpThresholdPercent:30,
  requiresSpeciesRate:true,
  requiresOrbCoefficient:true,
  lowHpMultiplierConfigurable:true,
  unknownCoefficientPolicy:'block_attempt',
  usesRpgCombatMath:false,
});

export function computeCaptureChance({
  speciesCaptureRate,
  currentHp,
  maxHp,
  orbId,
  orbLibrary,
  lowHpThresholdPercent=30,
  lowHpMultiplier,
}={}){
  const baseRate=Number(speciesCaptureRate);
  if(!Number.isFinite(baseRate)||baseRate<0) return {ok:false,reason:'missing_species_capture_rate'};

  const hpMax=Number(maxHp);
  const hpCurrent=Number(currentHp);
  if(!Number.isFinite(hpMax)||hpMax<=0||!Number.isFinite(hpCurrent)) return {ok:false,reason:'invalid_hp'};

  const resolved=resolveCaptureItem(orbId,orbLibrary);
  if(!resolved.found) return {ok:false,reason:'unknown_capture_item'};

  const orbCoefficient=Number(resolved.item.captureCoefficient);
  if(!Number.isFinite(orbCoefficient)||orbCoefficient<=0){
    return {ok:false,reason:'pending_orb_coefficient',itemId:resolved.canonicalId};
  }

  const hpPercent=clamp((hpCurrent/hpMax)*100,0,100);
  const lowHp=hpPercent<Number(lowHpThresholdPercent);

  let hpMultiplier=1;
  if(lowHp){
    hpMultiplier=Number(lowHpMultiplier);
    if(!Number.isFinite(hpMultiplier)||hpMultiplier<=0){
      return {ok:false,reason:'pending_low_hp_multiplier'};
    }
  }

  const chancePercent=clamp(baseRate*orbCoefficient*hpMultiplier,0,100);
  return {
    ok:true,
    baseRate,
    hpPercent,
    lowHp,
    orbId:resolved.canonicalId,
    orbCoefficient,
    hpMultiplier,
    chancePercent,
  };
}

export function resolveCaptureAttempt(config={},random=Math.random){
  const chance=computeCaptureChance(config);
  if(!chance.ok) return {...chance,captured:false,rolled:false};
  const roll=clamp(Number(random())*100,0,100);
  return {
    ...chance,
    rolled:true,
    roll,
    captured:roll<chance.chancePercent,
  };
}
