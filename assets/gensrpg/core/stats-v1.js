/* GenSrpG Phase 4 — Core Stats V1 pure normalization primitives.
   No DOM, storage, gameplay state, module ownership or combat resolution. */
(function(ROOT){
"use strict";

const VERSION="1.0.0";

const ALIASES=Object.freeze({
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
  ["damage:physical","⚔️ Dégâts physiques bruts"],
  ["damage:melee","🗡️ Dégâts bruts mêlée"],
  ["damage:ranged","🏹 Dégâts bruts distance"],
  ["damage:magic","✨ Dégâts magiques bruts"],
  ["hit:melee","🎯 Toucher mêlée"],
  ["hit:ranged","🎯 Toucher distance"],
  ["hit:magic","🎯 Toucher magie"],
  ["max_hp","❤️ PV maximum"],
  ["max_mana","🔷 Mana maximum"],
  ["crit","💥 Critique %"],
  ["dodge","💨 Esquive %"],
  ["magic_resistance","🔮 Résistance magique"],
  ["defense","🛡️ Défense"],
  ["armor","🧱 Armure"],
  ["movement","👣 Mouvement"],
  ["initiative","⚡ Initiative"],
  ["enemy_vision","👁️ Champ de vision des ennemis"]
].map(row=>Object.freeze(row.slice())));

const slug=value=>String(value||"")
  .trim()
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g,"")
  .replace(/[^a-z0-9_ -]/g,"")
  .replace(/[ -]+/g,"_")
  .replace(/^_+|_+$/g,"");

const canon=id=>ALIASES[String(id||"")]||String(id||"");

const number=(value,fallback=0)=>
  Number.isFinite(Number(value))?Number(value):fallback;

const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

function normalizeDefinition(definition){
  if(!definition)return null;
  const id=canon(slug(definition.id||definition.name));
  if(!id)return null;
  const min=number(definition.min,0);
  const max=Math.max(min,number(definition.max,999));
  return {
    id,
    name:String(definition.name||id),
    icon:String(definition.icon||"📊"),
    defaultValue:clamp(number(definition.defaultValue,0),min,max),
    min,
    max,
    visible:definition.visible!==false,
    description:String(definition.description||"")
  };
}

function targetValid(target){
  return TARGETS.some(row=>row[0]===target)||
    String(target||"").startsWith("stat:");
}

function normalizeEffect(effect,index=0){
  if(!effect)return null;
  const source=canon(effect.source);
  const target=String(effect.target||"");
  if(!source||!targetValid(target))return null;
  return {
    id:String(effect.id||("effect_"+(index+1))),
    source,
    target,
    mode:effect.mode==="threshold"?"threshold":"step",
    step:Math.max(1,number(effect.step,1)),
    gain:number(effect.gain,0),
    threshold:number(effect.threshold,10),
    comparator:["gt","gte","lt","lte","eq"].includes(effect.comparator)?effect.comparator:"gt",
    enabled:effect.enabled!==false
  };
}

function compare(value,comparator,threshold){
  return comparator==="gte"?value>=threshold:
    comparator==="lte"?value<=threshold:
    comparator==="lt"?value<threshold:
    comparator==="eq"?value===threshold:
    value>threshold;
}

function effectContribution(effect,sourceValue){
  if(!effect?.enabled)return 0;
  if(effect.mode==="threshold"){
    return compare(sourceValue,effect.comparator,effect.threshold)?effect.gain:0;
  }
  return Math.floor(sourceValue/Math.max(1,effect.step))*effect.gain;
}

ROOT.GensStatsV1=Object.freeze({
  VERSION,
  ALIASES,
  TARGETS,
  slug,
  canon,
  number,
  clamp,
  normalizeDefinition,
  targetValid,
  normalizeEffect,
  compare,
  effectContribution
});
})(typeof window!=="undefined"?window:globalThis);
