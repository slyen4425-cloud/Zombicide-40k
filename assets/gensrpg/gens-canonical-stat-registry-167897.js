/* GenSrpG V16.78.97 — canonical RPG characteristic registry.
   One registry for core and authored characteristics. Normalizes legacy English ids,
   exposes editable core definitions in the existing editor, and disables the legacy
   secondary hero-stat renderer. No combat, movement, spawn or timeline changes. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.78.97",MIGRATION_KEY="canonicalStatRegistryV167897";
const ALIASES={agility:"agilite",spirit:"esprit"};
const CORE=[
  {id:"force",name:"Force",icon:"💪",kind:"score",min:0,max:999,defaultValue:10,visible:true,editMode:"points",usage:"",description:"Dégâts physiques et précision de mêlée.",effects:[]},
  {id:"agilite",name:"Agilité",icon:"🏃",kind:"score",min:0,max:999,defaultValue:10,visible:true,editMode:"points",usage:"",description:"Précision à distance, critique, esquive et initiative.",effects:[]},
  {id:"intelligence",name:"Intelligence",icon:"🧠",kind:"score",min:0,max:999,defaultValue:10,visible:true,editMode:"points",usage:"",description:"Dégâts et précision magiques.",effects:[]},
  {id:"esprit",name:"Esprit",icon:"✨",kind:"score",min:0,max:999,defaultValue:10,visible:true,editMode:"points",usage:"",description:"Mana et résistance magique.",effects:[]},
  {id:"endurance",name:"Endurance",icon:"❤️",kind:"score",min:0,max:999,defaultValue:10,visible:true,editMode:"points",usage:"",description:"Points de vie maximum.",effects:[]},
  {id:"initiative",name:"Initiative",icon:"⚡",kind:"score",min:-999,max:999,defaultValue:0,visible:true,editMode:"points",usage:"",description:"Ordre d'action et tests d'initiative selon les règles de l'univers.",effects:[]}
];
const clone=x=>JSON.parse(JSON.stringify(x));
const canon=id=>ALIASES[String(id||"")]||String(id||"");
function editorOpen(){try{return D?.getElementById("rpgUniverseEditorModal")?.style?.display==="block"}catch(e){return false}}
function profile(){try{return editorOpen()?R.currentRpgProfile?.()||R.getActiveGameProfile?.():R.getActiveGameProfile?.()||R.currentRpgProfile?.()}catch(e){return null}}
function profiles(){try{return R.loadGameProfiles?.()||[]}catch(e){return []}}
function saveProfiles(list){try{R.saveGameProfiles?.(list);return true}catch(e){return false}}
function normalizeActive(s){
  const out=[];for(const raw of Array.isArray(s?.active)?s.active:[]){const id=canon(raw);if(id&&!out.includes(id))out.push(id)}
  s.active=out;return out;
}
function ensureRegistry(p){
  if(!p?.rpgUniverse)return [];
  const s=p.rpgUniverse.stats=p.rpgUniverse.stats&&typeof p.rpgUniverse.stats==="object"?p.rpgUniverse.stats:{};
  normalizeActive(s);
  let defs=Array.isArray(s.customStats)?s.customStats.filter(Boolean).map(x=>({...x,id:canon(x.id)})):[];
  const seen=new Set();defs=defs.filter(d=>d.id&&!seen.has(d.id)&&(seen.add(d.id),true));
  for(const core of CORE){
    const i=defs.findIndex(d=>String(d.id)===core.id);
    if(i<0)defs.unshift(clone(core));
    else defs[i]={...clone(core),...defs[i],id:core.id,effects:Array.isArray(defs[i].effects)?defs[i].effects:[]};
    if(!s.active.includes(core.id)){
      const old=Object.keys(ALIASES).find(k=>ALIASES[k]===core.id);
      if(old&&Array.isArray(s.active)&&s.active.includes(old))s.active.push(core.id);
    }
  }
  s.customStats=defs;
  s[MIGRATION_KEY]=true;
  return defs;
}
function persistProfile(p){
  if(!p)return false;const all=profiles(),i=all.findIndex(x=>String(x?.id||"")===String(p.id||""));
  if(i<0)return false;all[i]=p;return saveProfiles(all);
}
function migrateAll(){
  const all=profiles();let changed=false;
  for(const p of all){if(p?.gameStyle!=="dungeon")continue;const before=JSON.stringify(p.rpgUniverse?.stats||{});ensureRegistry(p);if(JSON.stringify(p.rpgUniverse?.stats||{})!==before)changed=true}
  if(changed)saveProfiles(all);return changed;
}
function activeSet(p=profile()){const s=p?.rpgUniverse?.stats||{};normalizeActive(s);return new Set(s.active||[])}
function defs(p=profile()){return p?ensureRegistry(p):CORE.map(clone)}
function renderPrimaryList(){
  if(!D)return false;const host=D.getElementById("rpgStatsList"),p=profile();if(!host||!p)return false;
  const active=activeSet(p),list=defs(p);
  host.innerHTML=list.map(d=>'<label class="smodPoolRow" data-canonical-stat="1"><input type="checkbox" value="'+String(d.id).replace(/"/g,"&quot;")+'" '+(active.has(String(d.id))?'checked':'')+'><span>'+(d.icon?d.icon+' ':'')+String(d.name||d.id)+' </span></label>').join("");
  return true;
}
function tuneEditor(){
  if(!D)return false;renderPrimaryList();
  const box=D.getElementById("gcs167879Box");if(box){const strong=box.querySelector(".v2LibHead strong");if(strong)strong.textContent="🧩 Caractéristiques / statistiques";const help=box.querySelector(".small");if(help)help.textContent="Toutes les caractéristiques actives utilisent cette définition unique en jeu. Les statistiques de base et celles que tu crées suivent le même système."}
  return true;
}
function patchApi(){
  const api=R.GensCustomStats167879;if(!api||api.__canonical167897)return false;
  api.defs=function(){return defs()};
  api.def=function(id){id=canon(id);return defs().find(d=>String(d.id)===id)||null};
  api.activeIds=function(){return activeSet()};
  api.isActive=function(id){return activeSet().has(canon(id))};
  api.renderHero=function(){return true};
  api.__canonical167897=true;return true;
}
function patchEditor(){
  const old=R.renderRpgUniverseEditor;if(typeof old!=="function"||old.__canonical167897)return false;
  const wrapped=function(){const out=old.apply(this,arguments);try{const p=profile();if(p){ensureRegistry(p);persistProfile(p)}patchApi();R.GensCustomStats167879?.renderEditor?.();tuneEditor()}catch(e){console.warn("GenSrpG canonical stat editor",e)}return out};
  wrapped.__canonical167897=true;wrapped.__original=old;R.renderRpgUniverseEditor=wrapped;return true;
}
function install(){
  try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}
  migrateAll();patchApi();patchEditor();
  const p=profile();if(p){ensureRegistry(p);persistProfile(p)}
  try{R.GensCustomStats167879?.renderEditor?.()}catch(e){}
  tuneEditor();
  try{R.renderDungeonAttributes?.();R.renderDungeonHeroStats?.()}catch(e){}
  return true;
}
R.GensCanonicalStatRegistry167897={VERSION,APP_VERSION,MIGRATION_KEY,ALIASES,CORE,canon,profile,ensureRegistry,migrateAll,activeSet,defs,renderPrimaryList,tuneEditor,patchApi,patchEditor,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
