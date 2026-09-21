/* GenSrpG Core Stats snapshot V1 — pure immutable canonical snapshot. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";
const Norm=ROOT.GensStatsNormalizationV1;
if(!Norm)throw new Error("GensStatsNormalizationV1 must load before GensStatsSnapshotV1");

const finite=value=>Number.isFinite(Number(value));
const num=(value,fallback=0)=>finite(value)?Number(value):fallback;
const record=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);
const DERIVED_KEYS=Object.freeze([
  "physicalDamageBonus",
  "magicDamageBonus",
  "hpBonus",
  "maxMana",
  "crit",
  "dodge",
  "initiative",
  "magicResistance"
]);

function definitions(input){
  const out=[];
  const seen=new Set();
  for(const raw of Array.isArray(input)?input:[]){
    const def=Norm.normalizeDefinition(raw);
    if(!def||seen.has(def.id))continue;
    seen.add(def.id);
    out.push(def);
  }
  return out;
}

function canonicalValues(input){
  const out=new Map();
  const priority=new Map();
  if(!record(input))return out;
  for(const [rawKey,rawValue] of Object.entries(input)){
    if(!finite(rawValue))continue;
    const slug=Norm.slug(rawKey);
    const id=Norm.canon(slug);
    if(!id)continue;
    const rank=id===slug?2:1;
    const previous=priority.get(id)||0;
    if(rank<previous)continue;
    out.set(id,Number(rawValue));
    priority.set(id,rank);
  }
  return out;
}

function create(config={}){
  const defs=definitions(config.definitions);
  const provided=canonicalValues(config.values);
  const values={};
  const canonical=[];

  for(const def of defs){
    const value=provided.has(def.id)?provided.get(def.id):num(def.defaultValue,0);
    values[def.id]=value;
    canonical.push(Object.freeze({
      id:def.id,
      name:def.name,
      icon:def.icon,
      value
    }));
  }

  const derivedInput=record(config.derived)?config.derived:{};
  const derived={};
  for(const key of DERIVED_KEYS)derived[key]=num(derivedInput[key],0);

  return Object.freeze({
    version:VERSION,
    heroId:String(config.heroId||""),
    canonical:Object.freeze(canonical),
    values:Object.freeze(values),
    derived:Object.freeze(derived)
  });
}

ROOT.GensStatsSnapshotV1=Object.freeze({
  VERSION,
  DERIVED_KEYS,
  create
});
})(typeof window!=="undefined"?window:globalThis);
