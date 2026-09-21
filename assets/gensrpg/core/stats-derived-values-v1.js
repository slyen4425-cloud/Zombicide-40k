/* GenSrpG Core Stats derived values V1 — pure deterministic derived formulas. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";
const Norm=ROOT.GensStatsNormalizationV1;
if(!Norm)throw new Error("GensStatsNormalizationV1 must load before GensStatsDerivedValuesV1");

const finite=value=>Number.isFinite(Number(value));
const num=(value,fallback=0)=>finite(value)?Number(value):fallback;
const record=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function valueMap(input){
  const out=new Map();
  if(!record(input))return out;
  for(const [key,value] of Object.entries(input)){
    const id=Norm.canon(key);
    if(!id||!finite(value))continue;
    out.set(id,Number(value));
  }
  return out;
}

function derive(config={}){
  const rules=record(config.rules)?config.rules:{};
  const values=valueMap(config.values);
  const external=record(config.external)?config.external:{};
  const effects=record(config.effects)?config.effects:{};

  const stat=id=>values.has(Norm.canon(id))?values.get(Norm.canon(id)):0;
  const ext=key=>num(external[key],0);
  const fx=key=>num(effects[key],0);
  const step=value=>Math.max(1,num(value,1));

  const force=stat("force");
  const intelligence=stat("intelligence");
  const endurance=stat("endurance");
  const esprit=stat("esprit");
  const agilite=stat("agilite");
  const initiative=stat("initiative");

  const historicalPhysical=rules.physicalDamageFormula==="percent"
    ?0
    :Math.floor(force/step(rules.physicalDamageStep))*num(rules.physicalDamageGain,0);

  const historicalMagic=rules.magicDamageFormula==="percent"
    ?0
    :Math.floor(intelligence/step(rules.magicDamageStep))*num(rules.magicDamageGain,0);

  const baseHp=Math.max(1,num(config.baseHp,3));
  const historicalHp=rules.hpFormula==="percent"
    ?Math.round(baseHp*(endurance*Math.max(0,num(rules.hpPercentPerPoint,0)))/100)
    :Math.floor(endurance/step(rules.enduranceHpStep))*num(rules.hpGain,0);

  const manaDerived=rules.manaFormula==="percent"
    ?Math.round(num(rules.baseMana,0)*(esprit*Math.max(0,num(rules.manaPercentPerPoint,0)))/100)
    :Math.floor(esprit/step(rules.spiritManaStep))*num(rules.manaGain,0);
  const historicalMana=Math.max(0,num(rules.baseMana,0)+manaDerived+ext("mana"));

  const critCap=num(rules.critCap,100);
  const critDerived=rules.critFormula==="perPoint"
    ?agilite*Math.max(0,num(rules.critPercentPerPoint,0))
    :Math.floor(agilite/step(rules.agilityCritStep))*num(rules.critGain,0);
  const historicalCrit=clamp(num(rules.baseCrit,0)+critDerived+ext("crit"),0,critCap);

  const dodgeCap=num(rules.dodgeCap,100);
  const dodgeDerived=rules.dodgeFormula==="perPoint"
    ?agilite*Math.max(0,num(rules.dodgePercentPerPoint,0))
    :Math.floor(agilite/step(rules.agilityDodgeStep))*num(rules.dodgeGain,0);
  const historicalDodge=clamp(num(rules.baseDodge,0)+dodgeDerived+ext("dodge"),0,dodgeCap);

  const magicResistanceDerived=rules.magicResistFormula==="perPoint"
    ?esprit*Math.max(0,num(rules.magicResistPerPoint,0))
    :Math.floor(esprit/step(rules.spiritMagicResistStep))*Math.max(0,num(rules.magicResistGain,0));
  const historicalMagicResistance=Math.max(0,magicResistanceDerived+ext("magicDefense"));

  const historical=Object.freeze({
    physicalDamageBonus:historicalPhysical,
    magicDamageBonus:historicalMagic,
    hpBonus:historicalHp,
    maxMana:historicalMana,
    crit:historicalCrit,
    dodge:historicalDodge,
    initiative,
    magicResistance:historicalMagicResistance
  });

  return Object.freeze({
    physicalDamageBonus:historicalPhysical+fx("damage:physical")+fx("damage:melee"),
    magicDamageBonus:historicalMagic+fx("damage:magic"),
    hpBonus:historicalHp+fx("max_hp"),
    maxMana:Math.max(0,historicalMana+fx("max_mana")),
    crit:clamp(historicalCrit+fx("crit"),0,critCap),
    dodge:clamp(historicalDodge+fx("dodge"),0,dodgeCap),
    initiative:initiative+fx("initiative"),
    magicResistance:Math.max(0,historicalMagicResistance+fx("magic_resistance")),
    historical
  });
}

ROOT.GensStatsDerivedValuesV1=Object.freeze({
  VERSION,
  derive
});
})(typeof window!=="undefined"?window:globalThis);
