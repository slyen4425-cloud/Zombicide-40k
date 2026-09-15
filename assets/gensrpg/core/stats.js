/* GenSrpG Core Stats — pure, side-effect-free stat/effect evaluator.
   Gameplay definitions and values are provided by data; this module owns only
   normalization, dependency evaluation, cycle protection and explainable totals.
*/
(function(root,factory){
  const api=factory();
  if(typeof module!=="undefined"&&module.exports)module.exports=api;
  if(root)root.GensRpgCoreStats=api;
})(typeof globalThis!=="undefined"?globalThis:this,function(){
  "use strict";

  const VERSION="1.0.0";
  const DEFAULT_ALIASES=Object.freeze({
    agility:"agilite",
    spirit:"esprit",
    strength:"force",
    dexterity:"agilite",
    wisdom:"esprit",
    constitution:"endurance",
    defence:"defense",
    armour:"armor",
    move:"movement",
  });

  const num=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
  const cloneSet=value=>value instanceof Set?new Set(value):new Set(Array.isArray(value)?value:[]);

  function slug(value){
    return String(value??"")
      .trim()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g,"")
      .replace(/[^a-z0-9_ -]/g,"")
      .replace(/[ -]+/g,"_")
      .replace(/^_+|_+$/g,"");
  }

  function aliasMap(custom={}){
    const out={...DEFAULT_ALIASES};
    for(const [key,value] of Object.entries(custom||{})){
      const k=slug(key),v=slug(value);
      if(k&&v)out[k]=v;
    }
    return out;
  }

  function canonicalId(value,aliases={}){
    const id=slug(value),map=aliasMap(aliases);
    return map[id]||id;
  }

  function normalizeDefinition(definition,aliases={}){
    if(!definition||typeof definition!=="object")return null;
    const id=canonicalId(definition.id||definition.name,aliases);
    if(!id)return null;
    const min=Number.isFinite(Number(definition.min))?Number(definition.min):Number.NEGATIVE_INFINITY;
    const maxCandidate=Number.isFinite(Number(definition.max))?Number(definition.max):Number.POSITIVE_INFINITY;
    const max=Math.max(min,maxCandidate);
    const defaultValue=num(definition.defaultValue,0);
    return {
      ...definition,
      id,
      name:String(definition.name||id),
      defaultValue:Math.max(min,Math.min(max,defaultValue)),
      min,
      max,
      visible:definition.visible!==false,
    };
  }

  function normalizeEffect(effect,index=0,aliases={}){
    if(!effect||typeof effect!=="object")return null;
    const source=canonicalId(effect.source,aliases);
    const targetRaw=String(effect.target||"").trim();
    if(!source||!targetRaw)return null;
    const target=targetRaw.startsWith("stat:")
      ? "stat:"+canonicalId(targetRaw.slice(5),aliases)
      : canonicalId(targetRaw,aliases);
    if(!target||target==="stat:")return null;
    const mode=effect.mode==="threshold"?"threshold":"step";
    const comparator=["gt","gte","lt","lte","eq"].includes(effect.comparator)?effect.comparator:"gt";
    return {
      ...effect,
      id:String(effect.id||`effect_${index+1}`),
      source,
      target,
      mode,
      step:Math.max(1,num(effect.step,1)),
      gain:num(effect.gain,0),
      threshold:num(effect.threshold,0),
      comparator,
      enabled:effect.enabled!==false,
    };
  }

  function compare(value,comparator,threshold){
    if(comparator==="gte")return value>=threshold;
    if(comparator==="lte")return value<=threshold;
    if(comparator==="lt")return value<threshold;
    if(comparator==="eq")return value===threshold;
    return value>threshold;
  }

  function createEvaluator({
    definitions=[],
    activeIds=null,
    effects=[],
    baseValues={},
    getBaseValue=null,
    directTargets=[],
    aliases={},
  }={}){
    const mapAliases=aliasMap(aliases);
    const defs=new Map();
    for(const raw of definitions||[]){
      const normalized=normalizeDefinition(raw,mapAliases);
      if(normalized)defs.set(normalized.id,normalized);
    }
    const active=activeIds==null
      ? new Set(defs.keys())
      : new Set((activeIds||[]).map(id=>canonicalId(id,mapAliases)).filter(Boolean));
    const normalizedEffects=(effects||[])
      .map((effect,index)=>normalizeEffect(effect,index,mapAliases))
      .filter(Boolean);
    const direct=new Set((directTargets||[]).map(id=>canonicalId(id,mapAliases)).filter(Boolean));

    function definition(id){return defs.get(canonicalId(id,mapAliases))||null}
    function isActive(id){return active.has(canonicalId(id,mapAliases))}
    function clampFor(id,value){
      const def=definition(id);
      if(!def)return num(value,0);
      return Math.max(def.min,Math.min(def.max,num(value,def.defaultValue)));
    }
    function base(id){
      const cid=canonicalId(id,mapAliases),def=definition(cid);
      if(!def||!isActive(cid))return 0;
      let raw;
      if(typeof getBaseValue==="function")raw=getBaseValue(cid,def);
      else raw=Object.prototype.hasOwnProperty.call(baseValues||{},cid)?baseValues[cid]:def.defaultValue;
      return clampFor(cid,raw);
    }
    function amount(effect,seen){
      if(!effect?.enabled)return 0;
      const sourceValue=value(effect.source,seen);
      if(effect.mode==="threshold")return compare(sourceValue,effect.comparator,effect.threshold)?effect.gain:0;
      return Math.floor(sourceValue/Math.max(1,effect.step))*effect.gain;
    }
    function totalForTarget(target,seen=new Set()){
      const normalized=String(target||"").startsWith("stat:")
        ? "stat:"+canonicalId(String(target).slice(5),mapAliases)
        : canonicalId(target,mapAliases);
      return normalizedEffects
        .filter(effect=>effect.enabled&&effect.target===normalized)
        .reduce((sum,effect)=>sum+amount(effect,seen),0);
    }
    function value(id,seen=new Set()){
      const cid=canonicalId(id,mapAliases),def=definition(cid);
      if(!def||!isActive(cid))return 0;
      if(seen.has(cid))return base(cid);
      const next=cloneSet(seen);next.add(cid);
      let result=base(cid)+totalForTarget("stat:"+cid,next);
      if(direct.has(cid))result+=totalForTarget(cid,next);
      return clampFor(cid,result);
    }
    function breakdown(id){
      const cid=canonicalId(id,mapAliases),def=definition(cid);
      if(!def||!isActive(cid))return {id:cid,active:false,base:0,statEffects:0,directEffects:0,raw:0,final:0};
      const seen=new Set([cid]);
      const baseAmount=base(cid);
      const statEffects=totalForTarget("stat:"+cid,seen);
      const directEffects=direct.has(cid)?totalForTarget(cid,seen):0;
      const raw=baseAmount+statEffects+directEffects;
      return {id:cid,active:true,base:baseAmount,statEffects,directEffects,raw,final:clampFor(cid,raw),min:def.min,max:def.max};
    }
    function runtimeDefinitions(){return [...defs.values()].filter(def=>isActive(def.id)&&def.visible!==false)}

    return {
      definition,
      isActive,
      base,
      value,
      breakdown,
      totalForTarget,
      runtimeDefinitions,
      effects:()=>normalizedEffects.slice(),
    };
  }

  return {
    VERSION,
    DEFAULT_ALIASES,
    slug,
    aliasMap,
    canonicalId,
    normalizeDefinition,
    normalizeEffect,
    compare,
    createEvaluator,
  };
});
