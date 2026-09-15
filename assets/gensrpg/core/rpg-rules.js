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

  const VERSION="1.0.0";
  const DEFAULTS=Object.freeze({
    physicalDamageStep:10,
    physicalDamageGain:1,
    magicDamageStep:10,
    magicDamageGain:1,
    armorZeroBlockChance:50,
    minPhysicalDamageOnArmorFail:1,
  });

  const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));

  function normalizeRules(r={}){
    return {
      physicalDamageStep:Math.max(1,num(r.physicalDamageStep,DEFAULTS.physicalDamageStep)),
      physicalDamageGain:Math.max(0,num(r.physicalDamageGain,DEFAULTS.physicalDamageGain)),
      magicDamageStep:Math.max(1,num(r.magicDamageStep,DEFAULTS.magicDamageStep)),
      magicDamageGain:Math.max(0,num(r.magicDamageGain,DEFAULTS.magicDamageGain)),
      armorZeroBlockChance:clamp(num(r.armorZeroBlockChance,DEFAULTS.armorZeroBlockChance),0,100),
      minPhysicalDamageOnArmorFail:Math.max(0,num(r.minPhysicalDamageOnArmorFail,DEFAULTS.minPhysicalDamageOnArmorFail)),
    };
  }

  function stepBonus(value,step,gain){
    return Math.floor(Math.max(0,num(value,0))/Math.max(1,num(step,1)))*Math.max(0,num(gain,0));
  }

  function physicalDamageBonus(force,rules={}){
    const r=normalizeRules(rules);
    return stepBonus(force,r.physicalDamageStep,r.physicalDamageGain);
  }

  function magicDamageBonus(intelligence,rules={}){
    const r=normalizeRules(rules);
    return stepBonus(intelligence,r.magicDamageStep,r.magicDamageGain);
  }

  function resolvePhysicalDamage({weaponDamage=0,force=0,armor=0,rules={},armorRoll=null}={}){
    const r=normalizeRules(rules);
    const baseWeaponDamage=Math.max(0,num(weaponDamage,0));
    const statDamageBonus=physicalDamageBonus(force,r);
    const rawDamage=Math.max(0,Math.round(baseWeaponDamage+statDamageBonus));
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
      force:Math.max(0,num(force,0)),
      statDamageBonus,
      rawDamage,
      armor:armorValue,
      reducedDamage,
      armorFloorTriggered,
      armorZeroBlockChance:r.armorZeroBlockChance,
      armorRoll:resolvedArmorRoll,
      armorBlocked,
      finalDamage,
    };
  }

  function describePhysicalDamage(result={}){
    const lines=[
      `Arme : ${num(result.baseWeaponDamage,0)}`,
      `Force ${num(result.force,0)} : +${num(result.statDamageBonus,0)}`,
      `Dégâts bruts : ${num(result.rawDamage,0)}`,
      `Armure : -${num(result.armor,0)}`,
      `Après armure : ${num(result.reducedDamage,0)}`,
    ];
    if(result.armorFloorTriggered){
      const chance=clamp(num(result.armorZeroBlockChance,DEFAULTS.armorZeroBlockChance),0,100);
      lines.push(`Jet d’armure : ${chance}% blocage / ${100-chance}% minimum 1 dégât`);
      if(result.armorRoll!=null)lines.push(`Jet : ${result.armorRoll} → ${result.armorBlocked?"bloqué":"1 dégât"}`);
    }
    lines.push(`Résultat final : ${num(result.finalDamage,0)} dégât${num(result.finalDamage,0)>1?"s":""}`);
    return lines;
  }

  return {VERSION,DEFAULTS,normalizeRules,stepBonus,physicalDamageBonus,magicDamageBonus,resolvePhysicalDamage,describePhysicalDamage};
});
