/* GenSrpG Core Stats Armor contract V1 — pure semantic helpers. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";

const has=(obj,key)=>Object.prototype.hasOwnProperty.call(obj||{},key);
const finite=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function normalizeScore(value){
  return Math.max(0,finite(value,0));
}

function dungeonRules(rules){
  const r=rules&&typeof rules==="object"?rules:{};
  const stepRaw=has(r,"armorReductionStep")?r.armorReductionStep:2;
  const gainRaw=has(r,"armorReductionGain")?r.armorReductionGain:1;
  const step=clamp(Number(stepRaw)||2,1,9999);
  const gain=clamp(Number(gainRaw)||0,0,99);
  return {step,gain};
}

function dungeonReductionFromScore(score,rules={}){
  const r=dungeonRules(rules);
  return Math.max(0,Math.floor(normalizeScore(score)/r.step)*r.gain);
}

function tacticalReductionFromScore(score,options={}){
  return options&&options.ignoreArmor===true?0:normalizeScore(score);
}

function floorPolicy(rules={}){
  const r=rules&&typeof rules==="object"?rules:{};
  const zeroRaw=has(r,"armorZeroBlockChance")?r.armorZeroBlockChance:75;
  const minRaw=has(r,"minPhysicalDamage")?r.minPhysicalDamage:1;
  return Object.freeze({
    zeroBlockChance:clamp(Number(zeroRaw)||0,0,100),
    minPhysicalDamage:clamp(Number(minRaw)||0,0,99)
  });
}

ROOT.GensStatsArmorContractV1=Object.freeze({
  VERSION,
  normalizeScore,
  dungeonReductionFromScore,
  tacticalReductionFromScore,
  floorPolicy
});

})(typeof window!=="undefined"?window:globalThis);
