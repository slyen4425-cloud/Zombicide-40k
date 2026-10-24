/* GenSrpG Core Stats value/effects V1 — pure deterministic composition. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";
const Norm=ROOT.GensStatsNormalizationV1;
if(!Norm)throw new Error("GensStatsNormalizationV1 must load before GensStatsValueEngineV1");

const num=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function create(config={}){
  const definitions=new Map(
    (Array.isArray(config.definitions)?config.definitions:[])
      .map(Norm.normalizeDefinition)
      .filter(Boolean)
      .map(definition=>[definition.id,definition])
  );

  const active=new Set(
    (Array.isArray(config.active)?config.active:[])
      .map(Norm.canon)
      .filter(Boolean)
  );

  const baseValues=new Map();
  for(const [key,value] of Object.entries(config.baseValues||{})){
    const id=Norm.canon(key);
    if(id)baseValues.set(id,value);
  }

  const modifiers=(Array.isArray(config.modifiers)?config.modifiers:[])
    .map((modifier,index)=>{
      if(!modifier)return null;
      const target=Norm.canon(modifier.target);
      if(!target)return null;
      return {
        id:String(modifier.id||("modifier_"+(index+1))),
        target,
        value:num(modifier.value,0),
        source:String(modifier.source||""),
        enabled:modifier.enabled!==false
      };
    })
    .filter(Boolean);

  const effects=(Array.isArray(config.effects)?config.effects:[])
    .map((effect,index)=>Norm.normalizeEffect(effect,index))
    .filter(Boolean);

  const directValueTargets=new Set(
    (Array.isArray(config.directValueTargets)?config.directValueTargets:[])
      .map(Norm.canon)
      .filter(Boolean)
  );

  function definition(id){
    return definitions.get(Norm.canon(id))||null;
  }

  function isActive(id){
    return active.has(Norm.canon(id));
  }

  function rawBase(id){
    id=Norm.canon(id);
    const def=definitions.get(id);
    if(!def||!active.has(id))return 0;
    const raw=baseValues.has(id)?num(baseValues.get(id),def.defaultValue):def.defaultValue;
    return clamp(raw,def.min,def.max);
  }

  function activeModifiers(id){
    id=Norm.canon(id);
    return modifiers.filter(modifier=>modifier.enabled&&modifier.target===id);
  }

  function modifierTotal(id){
    return activeModifiers(id).reduce((total,modifier)=>total+modifier.value,0);
  }

  function baseValue(id){
    id=Norm.canon(id);
    const def=definitions.get(id);
    if(!def||!active.has(id))return 0;
    return rawBase(id)+modifierTotal(id);
  }

  function effectAmount(effect,seen=new Set()){
    const normalized=Norm.normalizeEffect(effect,0);
    if(!normalized||normalized.enabled===false)return 0;
    const sourceValue=value(normalized.source,seen);
    return Norm.effectContribution(normalized,sourceValue);
  }

  function matchingEffects(target,source){
    const canonicalSource=source===undefined?null:Norm.canon(source);
    return effects.filter(effect=>
      effect.enabled&&
      effect.target===target&&
      (canonicalSource===null||effect.source===canonicalSource)
    );
  }

  function effectRows(target,source,seen){
    return matchingEffects(target,source).map(effect=>{
      const sourceValue=value(effect.source,seen);
      return {
        id:effect.id,
        source:effect.source,
        target:effect.target,
        mode:effect.mode,
        sourceValue,
        contribution:Norm.effectContribution(effect,sourceValue)
      };
    });
  }

  function statEffectTotal(id,seen=new Set()){
    const target="stat:"+Norm.canon(id);
    return matchingEffects(target).reduce((total,effect)=>total+effectAmount(effect,seen),0);
  }

  function extraTotal(target,seen=new Set()){
    target=String(target||"");
    return matchingEffects(target).reduce((total,effect)=>total+effectAmount(effect,seen),0);
  }

  function sourceEffectTotal(target,source,seen=new Set()){
    target=String(target||"");
    return matchingEffects(target,source).reduce((total,effect)=>total+effectAmount(effect,seen),0);
  }

  function value(id,seen=new Set()){
    id=Norm.canon(id);
    const def=definitions.get(id);
    if(!def||!active.has(id))return 0;
    if(seen.has(id))return baseValue(id);
    const next=new Set(seen);
    next.add(id);
    let total=baseValue(id)+statEffectTotal(id,next);
    if(directValueTargets.has(id))total+=extraTotal(id,next);
    return clamp(total,def.min,def.max);
  }

  function detail(id){
    id=Norm.canon(id);
    const def=definitions.get(id)||null;
    if(!def||!active.has(id)){
      return {
        id,
        active:false,
        definition:def,
        rawBase:0,
        modifiers:[],
        modifierTotal:0,
        baseValue:0,
        statEffects:[],
        statEffectsTotal:0,
        directEffects:[],
        directEffectsTotal:0,
        subtotal:0,
        total:0,
        clamped:false
      };
    }

    const seen=new Set([id]);
    const rows=activeModifiers(id).map(modifier=>({...modifier}));
    const modifierSum=rows.reduce((total,modifier)=>total+modifier.value,0);
    const raw=rawBase(id);
    const base=raw+modifierSum;
    const statRows=effectRows("stat:"+id,undefined,seen);
    const directRows=directValueTargets.has(id)?effectRows(id,undefined,seen):[];
    const statTotal=statRows.reduce((total,row)=>total+row.contribution,0);
    const directTotal=directRows.reduce((total,row)=>total+row.contribution,0);
    const subtotal=base+statTotal+directTotal;
    const total=clamp(subtotal,def.min,def.max);

    return {
      id,
      active:true,
      definition:{...def},
      rawBase:raw,
      modifiers:rows,
      modifierTotal:modifierSum,
      baseValue:base,
      statEffects:statRows,
      statEffectsTotal:statTotal,
      directEffects:directRows,
      directEffectsTotal:directTotal,
      subtotal,
      total,
      clamped:total!==subtotal
    };
  }

  return Object.freeze({
    definition,
    isActive,
    rawBase,
    modifierTotal,
    baseValue,
    value,
    effectAmount,
    statEffectTotal,
    extraTotal,
    sourceEffectTotal,
    detail
  });
}

ROOT.GensStatsValueEngineV1=Object.freeze({
  VERSION,
  create
});
})(typeof window!=="undefined"?window:globalThis);
