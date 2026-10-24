/* GenSrpG Core Stats normalization V1 — pure normalization helpers. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";

const ALIAS=Object.freeze({
  agility:"agilite",
  spirit:"esprit",
  strength:"force",
  dexterity:"agilite",
  wisdom:"esprit",
  constitution:"endurance",
  defence:"defense",
  armour:"armor",
  move:"movement"
});

const TARGETS=Object.freeze([
  "damage:physical",
  "damage:melee",
  "damage:ranged",
  "damage:magic",
  "hit:melee",
  "hit:ranged",
  "hit:magic",
  "max_hp",
  "max_mana",
  "crit",
  "dodge",
  "magic_resistance",
  "defense",
  "armor",
  "movement",
  "initiative",
  "enemy_vision"
]);

const num=(value,fallback=0)=>Number.isFinite(Number(value))?Number(value):fallback;
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function slug(value){
  return String(value||"")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9_ -]/g,"")
    .replace(/[ -]+/g,"_")
    .replace(/^_+|_+$/g,"");
}

function canon(id){
  const key=String(id||"");
  return ALIAS[key]||key;
}

function normalizeDefinition(definition){
  if(!definition)return null;
  const id=canon(slug(definition.id||definition.name));
  if(!id)return null;
  const min=num(definition.min,0);
  const max=Math.max(min,num(definition.max,999));
  return {
    id,
    name:String(definition.name||id),
    icon:String(definition.icon||"📊"),
    defaultValue:clamp(num(definition.defaultValue,0),min,max),
    min,
    max,
    visible:definition.visible!==false,
    description:String(definition.description||"")
  };
}

function isValidTarget(target){
  return TARGETS.includes(target)||String(target||"").startsWith("stat:");
}

function normalizeEffect(effect,index=0){
  if(!effect)return null;
  const source=canon(effect.source);
  const target=String(effect.target||"");
  if(!source||!isValidTarget(target))return null;
  return {
    id:String(effect.id||("effect_"+(index+1))),
    source,
    target,
    mode:effect.mode==="threshold"?"threshold":"step",
    step:Math.max(1,num(effect.step,1)),
    gain:num(effect.gain,0),
    threshold:num(effect.threshold,10),
    comparator:["gt","gte","lt","lte","eq"].includes(effect.comparator)?effect.comparator:"gt",
    enabled:effect.enabled!==false
  };
}

function compare(value,comparator,threshold){
  return comparator==="gte"
    ? value>=threshold
    : comparator==="lte"
      ? value<=threshold
      : comparator==="lt"
        ? value<threshold
        : comparator==="eq"
          ? value===threshold
          : value>threshold;
}

function effectContribution(effect,sourceValue){
  if(!effect||effect.enabled===false)return 0;
  const value=num(sourceValue,0);
  const gain=num(effect.gain,0);
  if(effect.mode==="threshold"){
    return compare(value,effect.comparator,num(effect.threshold,10))?gain:0;
  }
  return Math.floor(value/Math.max(1,num(effect.step,1)))*gain;
}

ROOT.GensStatsNormalizationV1=Object.freeze({
  VERSION,
  ALIAS,
  TARGETS,
  slug,
  canon,
  normalizeDefinition,
  isValidTarget,
  normalizeEffect,
  compare,
  effectContribution
});
})(typeof window!=="undefined"?window:globalThis);
