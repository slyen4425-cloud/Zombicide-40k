/* GenSrpG Core Stats modifier provider V1 — pure explicit source composition. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";
const Norm=ROOT.GensStatsNormalizationV1;
if(!Norm)throw new Error("GensStatsNormalizationV1 must load before GensStatsModifierProviderV1");

const finite=value=>Number.isFinite(Number(value));
const record=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);

function normalizedDefinitions(input){
  const out=[];
  const seen=new Set();
  for(const raw of Array.isArray(input)?input:[]){
    const definition=Norm.normalizeDefinition(raw);
    if(!definition||seen.has(definition.id))continue;
    seen.add(definition.id);
    out.push(definition);
  }
  return out;
}

function collect(config={}){
  const definitions=normalizedDefinitions(config.definitions);
  const known=new Set(definitions.map(definition=>definition.id));
  const modifiers=[];

  for(const rawSource of Array.isArray(config.sources)?config.sources:[]){
    const source=String(rawSource?.source||"").trim();
    if(!source||!record(rawSource?.values))continue;

    const totals=new Map();
    for(const [key,rawValue] of Object.entries(rawSource.values)){
      const target=Norm.canon(key);
      if(!known.has(target)||!finite(rawValue))continue;
      totals.set(target,(totals.get(target)||0)+Number(rawValue));
    }

    for(const definition of definitions){
      if(!totals.has(definition.id))continue;
      const value=totals.get(definition.id);
      if(value===0)continue;
      modifiers.push(Object.freeze({
        id:source+":"+definition.id,
        target:definition.id,
        value,
        source,
        enabled:rawSource.enabled!==false
      }));
    }
  }

  return Object.freeze(modifiers);
}

ROOT.GensStatsModifierProviderV1=Object.freeze({
  VERSION,
  collect
});
})(typeof window!=="undefined"?window:globalThis);
