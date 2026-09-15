/* GenSrpG Core RPG rules — pure, side-effect-free target implementation.
   This module is intentionally NOT auto-installed. It is the migration target for
   shared RPG calculations currently spread across the legacy runtime.
*/
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgCoreRules=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const VERSION="1.3.0";
  const DEFAULTS=Object.freeze({
    physicalDamageFormula:"step",
    physicalDamageStep:10,
    physicalDamageGain:1,
    physicalDamagePercentPerPoint:0,
    magicDamageFormula:"step",
    magicDamageStep:10,
    magicDamageGain:1,
    magicDamagePercentPerPoint:0,
    magicResistFormula:"step",
    spiritMagicResistStep:20,
    magicResistGain:1,
    magicResistPerPoint:0,
    minMagicDamage:1,
    armorZeroBlockChance:50,
    minPhysicalDamageOnArmorFail:1,
  });

  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const formula=(v,percentName="percent",fallback="step")=>v===percentName?percentName:fallback;

  function normalizeRules(r={}){
    return {
      physicalDamageFormula:formula(r.physicalDamageFormula,"percent","step"),
      physicalDamageStep:Math.max(1,num(r.physicalDamageStep,DEFAULTS.physicalDamageStep)),
      physicalDamageGain:Math.max(0,num(r.physicalDamageGain,DEFAULTS.physicalDamageGain)),
      physicalDamagePercentPerPoint:clamp(num(r.physicalDamagePercentPerPoint,DEFAULTS.physicalDamagePercentPerPoint),0,100),
      magicDamageFormula:formula(r.magicDamageFormula,"percent","step"),
      magicDamageStep:Math.max(1,num(r.magicDamageStep,DEFAULTS.magicDamageStep)),
      magicDamageGain:Math.max(0,num(r.magicDamageGain,DEFAULTS.magicDamageGain)),
      magicDamagePercentPerPoint:clamp(num(r.magicDamagePercentPerPoint,DEFAULTS.magicDamagePercentPerPoint),0,100),
      magicResistFormula:r.magicResistFormula==="perPoint"?"perPoint":"step",
      spiritMagicResistStep:Math.max(1,num(r.spiritMagicResistStep,DEFAULTS.spiritMagicResistStep)),
      magicResistGain:Math.max(0,num(r.magicResistGain,DEFAULTS.magicResistGain)),
      magicResistPerPoint:clamp(num(r.magicResistPerPoint,DEFAULTS.magicResistPerPoint),0,100),
      minMagicDamage:Math.max(0,num(r.minMagicDamage,DEFAULTS.minMagicDamage)),
      armorZeroBlockChance:clamp(num(r.armorZeroBlockChance,DEFAULTS.armorZeroBlockChance),0,100),
      minPhysicalDamageOnArmorFail:Math.max(0,num(r.minPhysicalDamageOnArmorFail??r.minPhysicalDamage,DEFAULTS.minPhysicalDamageOnArmorFail)),
    };
  }

  function stepBonus(value,step,gain){
    return Math.floor(Math.max(0,num(value,0))/Math.max(1,num(step,1)))*Math.max(0,num(gain,0));
  }

  function percentBonus(baseDamage,value,percentPerPoint){
    const base=Math.max(0,num(baseDamage,0));
    const pct=Math.max(0,num(value,0))*Math.max(0,num(percentPerPoint,0));
    return {percent:pct,bonus:Math.max(0,Math.round(base*pct/100))};
  }

  function physicalDamageBonus(force,rules={}){
    const r=normalizeRules(rules);
    if(r.physicalDamageFormula==="percent")return 0;
    return stepBonus(force,r.physicalDamageStep,r.physicalDamageGain);
  }

  function physicalDamagePercent(force,rules={}){
    const r=normalizeRules(rules);
    return r.physicalDamageFormula==="percent"?Math.max(0,num(force,0))*r.physicalDamagePercentPerPoint:0;
  }

  function physicalDamageScaling(baseDamage,force,rules={}){
    const r=normalizeRules(rules),base=Math.max(0,num(baseDamage,0)),value=Math.max(0,num(force,0));
    if(r.physicalDamageFormula==="percent"){
      const p=percentBonus(base,value,r.physicalDamagePercentPerPoint);
      return {formula:"percent",statValue:value,step:0,gain:0,percentPerPoint:r.physicalDamagePercentPerPoint,percent:p.percent,bonus:p.bonus,scaledDamage:base+p.bonus};
    }
    const bonus=stepBonus(value,r.physicalDamageStep,r.physicalDamageGain);
    return {formula:"step",statValue:value,step:r.physicalDamageStep,gain:r.physicalDamageGain,percentPerPoint:0,percent:0,bonus,scaledDamage:base+bonus};
  }

  function magicDamageBonus(intelligence,rules={}){
    const r=normalizeRules(rules);
    if(r.magicDamageFormula==="percent")return 0;
    return stepBonus(intelligence,r.magicDamageStep,r.magicDamageGain);
  }

  function magicDamagePercent(intelligence,rules={}){
    const r=normalizeRules(rules);
    return r.magicDamageFormula==="percent"?Math.max(0,num(intelligence,0))*r.magicDamagePercentPerPoint:0;
  }

  function magicDamageScaling(baseDamage,intelligence,rules={}){
    const r=normalizeRules(rules),base=Math.max(0,num(baseDamage,0)),value=Math.max(0,num(intelligence,0));
    if(r.magicDamageFormula==="percent"){
      const p=percentBonus(base,value,r.magicDamagePercentPerPoint);
      return {formula:"percent",statValue:value,step:0,gain:0,percentPerPoint:r.magicDamagePercentPerPoint,percent:p.percent,bonus:p.bonus,scaledDamage:base+p.bonus};
    }
    const bonus=stepBonus(value,r.magicDamageStep,r.magicDamageGain);
    return {formula:"step",statValue:value,step:r.magicDamageStep,gain:r.magicDamageGain,percentPerPoint:0,percent:0,bonus,scaledDamage:base+bonus};
  }

  function magicResistanceBonus(spirit,rules={}){
    const r=normalizeRules(rules),value=Math.max(0,num(spirit,0));
    return r.magicResistFormula==="perPoint"
      ? value*r.magicResistPerPoint
      : stepBonus(value,r.spiritMagicResistStep,r.magicResistGain);
  }

  function resolveMagicResistance({spirit=0,equipmentBonus=0,skillBonus=0,rules={}}={}){
    const r=normalizeRules(rules),resolvedSpirit=Math.max(0,num(spirit,0));
    const derived=magicResistanceBonus(resolvedSpirit,r);
    const equipment=Math.max(0,num(equipmentBonus,0)),skill=Math.max(0,num(skillBonus,0));
    return {
      spirit:resolvedSpirit,
      formula:r.magicResistFormula,
      spiritMagicResistStep:r.spiritMagicResistStep,
      magicResistGain:r.magicResistGain,
      magicResistPerPoint:r.magicResistPerPoint,
      derived,
      equipmentBonus:equipment,
      skillBonus:skill,
      total:Math.max(0,derived+equipment+skill),
    };
  }

  function resolvePhysicalDamage({weaponDamage=0,force=0,armor=0,rules={},armorRoll=null}={}){
    const r=normalizeRules(rules);
    const baseWeaponDamage=Math.max(0,num(weaponDamage,0));
    const resolvedForce=Math.max(0,num(force,0));
    const scaling=physicalDamageScaling(baseWeaponDamage,resolvedForce,r);
    const statDamageBonus=scaling.bonus;
    const rawDamage=Math.max(0,Math.round(scaling.scaledDamage));
    const armorValue=Math.max(0,num(armor,0));
    const reducedDamage=Math.max(0,rawDamage-armorValue);

    let finalDamage=reducedDamage;
    let armorFloorTriggered=false;
    let armorBlocked=false;
    let resolvedArmorRoll=null;

    if(rawDamage>0&&reducedDamage<=0){
      armorFloorTriggered=true;
      resolvedArmorRoll=armorRoll==null?null:clamp(Math.trunc(num(armorRoll,0)),0,99);
      if(resolvedArmorRoll!=null){
        armorBlocked=resolvedArmorRoll<r.armorZeroBlockChance;
        finalDamage=armorBlocked?0:r.minPhysicalDamageOnArmorFail;
      }
    }

    return {
      baseWeaponDamage,
      force:resolvedForce,
      physicalDamageFormula:r.physicalDamageFormula,
      physicalDamageStep:r.physicalDamageStep,
      physicalDamageGain:r.physicalDamageGain,
      physicalDamagePercentPerPoint:r.physicalDamagePercentPerPoint,
      statDamagePercent:scaling.percent,
      statDamageBonus,
      rawDamage,
      armor:armorValue,
      reducedDamage,
      armorFloorTriggered,
      armorZeroBlockChance:r.armorZeroBlockChance,
      minPhysicalDamageOnArmorFail:r.minPhysicalDamageOnArmorFail,
      armorRoll:resolvedArmorRoll,
      armorBlocked,
      finalDamage,
    };
  }

  function describePhysicalDamage(result={}){
    const formulaMode=result.physicalDamageFormula==="percent"?"percent":"step";
    const step=Math.max(1,num(result.physicalDamageStep,DEFAULTS.physicalDamageStep));
    const gain=Math.max(0,num(result.physicalDamageGain,DEFAULTS.physicalDamageGain));
    const pctPerPoint=Math.max(0,num(result.physicalDamagePercentPerPoint,DEFAULTS.physicalDamagePercentPerPoint));
    const minOnFail=Math.max(0,num(result.minPhysicalDamageOnArmorFail,DEFAULTS.minPhysicalDamageOnArmorFail));
    const force=num(result.force,0),statBonus=num(result.statDamageBonus,0);
    const statLine=formulaMode==="percent"
      ?`Force ${force} (règle +${pctPerPoint}%/point = ${num(result.statDamagePercent,0)}%) : +${statBonus}`
      :`Force ${force} (règle ${step}/+${gain}) : +${statBonus}`;
    const lines=[
      `Arme : ${num(result.baseWeaponDamage,0)}`,
      statLine,
      `Dégâts bruts : ${num(result.rawDamage,0)}`,
      `Armure : -${num(result.armor,0)}`,
      `Après armure : ${num(result.reducedDamage,0)}`,
    ];
    if(result.armorFloorTriggered){
      const chance=clamp(num(result.armorZeroBlockChance,DEFAULTS.armorZeroBlockChance),0,100);
      lines.push(`Jet d’armure : ${chance}% blocage / ${100-chance}% minimum ${minOnFail} dégât${minOnFail>1?"s":""}`);
      if(result.armorRoll!=null){
        const outcome=result.armorBlocked?"bloqué":`${minOnFail} dégât${minOnFail>1?"s":""}`;
        lines.push(`Jet : ${result.armorRoll} → ${outcome}`);
      }
    }
    lines.push(`Résultat final : ${num(result.finalDamage,0)} dégât${num(result.finalDamage,0)>1?"s":""}`);
    return lines;
  }

  return {
    VERSION,
    DEFAULTS,
    normalizeRules,
    stepBonus,
    percentBonus,
    physicalDamageBonus,
    physicalDamagePercent,
    physicalDamageScaling,
    magicDamageBonus,
    magicDamagePercent,
    magicDamageScaling,
    magicResistanceBonus,
    resolveMagicResistance,
    resolvePhysicalDamage,
    describePhysicalDamage,
  };
});
