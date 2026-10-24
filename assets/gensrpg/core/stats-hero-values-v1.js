/* GenSrpG Core Stats hero values V1 — pure explicit base-value provider. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";
const Norm=ROOT.GensStatsNormalizationV1;
if(!Norm)throw new Error("GensStatsNormalizationV1 must load before GensStatsHeroValuesV1");

const finite=value=>Number.isFinite(Number(value));
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const record=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);

function valueMap(input){
  const out=new Map();
  if(!record(input))return out;
  for(const [key,value] of Object.entries(input)){
    const id=Norm.canon(key);
    if(!id||!finite(value))continue;
    out.set(id,Object.freeze({
      value:Number(value),
      inputKey:String(key)
    }));
  }
  return out;
}

function definitionMap(input){
  const out=new Map();
  for(const source of Array.isArray(input)?input:[]){
    const definition=Norm.normalizeDefinition(source);
    if(definition)out.set(definition.id,definition);
  }
  return out;
}

function resolve(config={}){
  const definitions=definitionMap(config.definitions);
  const definitionValues=valueMap(config.definitionValues);
  const runtimeContainer=record(config.runtimeValues);
  const runtimeValues=runtimeContainer?valueMap(config.runtimeValues):new Map();
  const fallbackValues=valueMap(config.fallbackValues);
  const clampWithoutRuntime=new Set(
    (Array.isArray(config.clampWithoutRuntime)?config.clampWithoutRuntime:[])
      .map(Norm.canon)
      .filter(Boolean)
  );

  const baseValues={};
  const details={};

  for(const [id,definition] of definitions){
    let source="default";
    let inputKey=null;
    let rawValue=definition.defaultValue;

    const runtime=runtimeValues.get(id);
    const defined=definitionValues.get(id);
    const fallback=fallbackValues.get(id);

    if(runtimeContainer&&runtime){
      source="runtime";
      inputKey=runtime.inputKey;
      rawValue=runtime.value;
    }else if(defined){
      source="definition";
      inputKey=defined.inputKey;
      rawValue=defined.value;
    }else if(fallback){
      source="fallback";
      inputKey=fallback.inputKey;
      rawValue=fallback.value;
    }

    const clampApplied=runtimeContainer||clampWithoutRuntime.has(id);
    const value=clampApplied
      ?clamp(rawValue,definition.min,definition.max)
      :rawValue;

    baseValues[id]=value;
    details[id]=Object.freeze({
      id,
      source,
      inputKey,
      rawValue,
      value,
      min:definition.min,
      max:definition.max,
      runtimeContainer,
      clampApplied,
      clamped:value!==rawValue
    });
  }

  return Object.freeze({
    baseValues:Object.freeze(baseValues),
    details:Object.freeze(details)
  });
}

ROOT.GensStatsHeroValuesV1=Object.freeze({
  VERSION,
  resolve
});
})(typeof window!=="undefined"?window:globalThis);
