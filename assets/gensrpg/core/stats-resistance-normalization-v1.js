/* GenSrpG Core Stats resistance normalization V1 — pure transport normalization. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";
const aliases=Object.freeze({
  feu:"fire",fire:"fire",
  eau:"water",water:"water",
  terre:"earth",earth:"earth",
  lumiere:"light",light:"light",
  ombre:"shadow",shadow:"shadow",
  air:"air",
  electricite:"electric",electric:"electric",electricity:"electric",lightning:"electric"
});

const finite=value=>Number.isFinite(Number(value));
const record=value=>value!==null&&typeof value==="object"&&!Array.isArray(value);

function normalizeKey(value){
  let key=String(value??"").trim().toLowerCase();
  if(typeof key.normalize==="function")key=key.normalize("NFD").replace(/[\u0300-\u036f]/g,"");
  if(key.startsWith("element:"))key=key.slice(8).trim();
  return aliases[key]||key;
}

function bounds(options){
  const hasMin=finite(options?.min),hasMax=finite(options?.max);
  return {
    min:hasMin?Number(options.min):-Infinity,
    max:hasMax?Number(options.max):Infinity
  };
}

function normalizedValue(raw,options){
  const policy=options?.invalid==="zero"?"zero":"skip";
  let value=Number(raw);
  if(!Number.isFinite(value)){
    if(policy!=="zero")return null;
    value=0;
  }
  const b=bounds(options);
  value=Math.max(b.min,Math.min(b.max,value));
  return value;
}

function normalize(input,options={}){
  const out=[];
  const push=(rawKey,rawValue,requireKey)=>{
    const sourceKey=String(rawKey??"");
    if(requireKey&&!sourceKey)return;
    const key=normalizeKey(sourceKey);
    if(requireKey&&!key)return;
    const value=normalizedValue(rawValue,options);
    if(value===null)return;
    out.push(Object.freeze({key,value}));
  };

  if(Array.isArray(input)){
    for(const row of input){
      if(!record(row))continue;
      push(row.kind,row.value,true);
    }
  }else if(record(input)){
    for(const [key,value] of Object.entries(input))push(key,value,false);
  }

  return Object.freeze(out);
}

function collapse(entries,options={}){
  const strategy=String(options.strategy||"");
  if(strategy!=="sum"&&strategy!=="last")throw new Error("Unsupported resistance collapse strategy");
  const out={};
  for(const row of Array.isArray(entries)?entries:[]){
    if(!record(row)||!finite(row.value))continue;
    const key=normalizeKey(row.key);
    const value=Number(row.value);
    if(strategy==="sum")out[key]=(finite(out[key])?Number(out[key]):0)+value;
    else out[key]=value;
  }
  return Object.freeze(out);
}

ROOT.GensStatsResistanceNormalizationV1=Object.freeze({
  VERSION,
  normalizeKey,
  normalize,
  collapse
});
})(typeof window!=="undefined"?window:globalThis);
