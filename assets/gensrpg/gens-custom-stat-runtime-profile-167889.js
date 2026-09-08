/* GenSrpG V16.78.97 — canonical RPG stat authority.
   Core and authored characteristics share one rpgUniverse.stats registry. Legacy
   agility/spirit ids are normalized to agilite/esprit, core definitions are editable
   in the existing stat editor, and the old secondary custom renderer is suppressed so
   the final inline canonical Dungeon renderer is the sole sheet renderer.
   No movement/spawn/timeline/combat changes. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="4.0.0",APP_VERSION="16.78.97",MIGRATION_KEY="canonicalStatAuthorityV167897";
const ALIASES={agility:"agilite",spirit:"esprit"};
const CORE=[
 {id:"force",name:"Force",icon:"💪",kind:"score",min:0,max:999,defaultValue:10,visible:true,editMode:"points",usage:"",description:"Dégâts physiques et précision de mêlée.",effects:[]},
 {id:"agilite",name:"Agilité",icon:"🏃",kind:"score",min:0,max:999,defaultValue:10,visible:true,editMode:"points",usage:"",description:"Précision à distance, critique, esquive et initiative.",effects:[]},
 {id:"intelligence",name:"Intelligence",icon:"🧠",kind:"score",min:0,max:999,defaultValue:10,visible:true,editMode:"points",usage:"",description:"Dégâts et précision magiques.",effects:[]},
 {id:"esprit",name:"Esprit",icon:"✨",kind:"score",min:0,max:999,defaultValue:10,visible:true,editMode:"points",usage:"",description:"Mana et résistance magique.",effects:[]},
 {id:"endurance",name:"Endurance",icon:"❤️",kind:"score",min:0,max:999,defaultValue:10,visible:true,editMode:"points",usage:"",description:"Points de vie maximum.",effects:[]},
 {id:"initiative",name:"Initiative",icon:"⚡",kind:"score",min:-999,max:999,defaultValue:0,visible:true,editMode:"points",usage:"",description:"Ordre d'action et tests d'initiative selon les règles de l'univers.",effects:[]}
];
const cp=x=>JSON.parse(JSON.stringify(x));
const canon=id=>ALIASES[String(id||"")]||String(id||"");
function editorOpen(){try{return D?.getElementById("rpgUniverseEditorModal")?.style?.display==="block"}catch(e){return false}}
function activeProfile(){try{return R.getActiveGameProfile?.()||null}catch(e){return null}}
function contextProfile(){try{return editorOpen()?R.currentRpgProfile?.()||activeProfile():activeProfile()||R.currentRpgProfile?.()}catch(e){return activeProfile()}}
function profiles(){try{return R.loadGameProfiles?.()||[]}catch(e){return []}}
function saveProfiles(list){try{R.saveGameProfiles?.(list);return true}catch(e){return false}}
function profileStats(p=contextProfile()){
 if(!p?.rpgUniverse)return null;
 const s=p.rpgUniverse.stats=p.rpgUniverse.stats&&typeof p.rpgUniverse.stats==="object"?p.rpgUniverse.stats:{};
 const active=[];for(const raw of Array.isArray(s.active)?s.active:[]){const id=canon(raw);if(id&&!active.includes(id))active.push(id)}s.active=active;
 let defs=Array.isArray(s.customStats)?s.customStats.filter(Boolean).map(d=>({...d,id:canon(d.id)})):[];
 const seen=new Set();defs=defs.filter(d=>d.id&&!seen.has(d.id)&&(seen.add(d.id),true));
 for(const core of CORE){const i=defs.findIndex(d=>String(d.id)===core.id);if(i<0)defs.unshift(cp(core));else defs[i]={...cp(core),...defs[i],id:core.id,effects:Array.isArray(defs[i].effects)?defs[i].effects:[]}}
 s.customStats=defs;s[MIGRATION_KEY]=true;return s;
}
function persistProfile(p){if(!p)return false;const all=profiles(),i=all.findIndex(x=>String(x?.id||"")===String(p.id||""));if(i<0)return false;all[i]=p;return saveProfiles(all)}
function migrateProfiles(){const all=profiles();let changed=false;for(const p of all){if(p?.gameStyle!=="dungeon")continue;const before=JSON.stringify(p.rpgUniverse?.stats||{});profileStats(p);if(JSON.stringify(p.rpgUniverse?.stats||{})!==before)changed=true}if(changed)saveProfiles(all);return changed}
function rawActiveSet(p=contextProfile()){const s=profileStats(p);return new Set((s?.active||[]).map(canon))}
function setActive(id,enabled){const p=contextProfile(),s=profileStats(p);id=canon(id);if(!s||!id)return false;const active=new Set(s.active.map(canon));enabled?active.add(id):active.delete(id);s.active=[...active];const ok=persistProfile(p);try{R.renderDungeonAttributes?.();R.renderDungeonHeroStats?.()}catch(e){}return ok}
function patchCanonicalApi(){
 const api=R.GensCustomStats167879;if(!api||api.__canonical167897)return false;
 api.defs=function(){return profileStats(contextProfile())?.customStats||[]};
 api.def=function(id){id=canon(id);return api.defs().find(d=>String(d?.id||"")===id)||null};
 api.activeIds=function(){return rawActiveSet()};
 api.isActive=function(id){return rawActiveSet().has(canon(id))};
 // The old engine's local renderHero closure still exists, but all exported calls are neutralized.
 api.renderHero=function(){return true};
 api.__canonical167897=true;return true;
}
function renderPrimaryList(){
 if(!D)return false;const host=D.getElementById("rpgStatsList"),p=contextProfile(),s=profileStats(p);if(!host||!s)return false;
 const active=new Set(s.active.map(canon));
 host.innerHTML=s.customStats.map(d=>'<label class="smodPoolRow" data-canonical-stat="1"><input type="checkbox" value="'+String(d.id).replace(/"/g,"&quot;")+'" '+(active.has(String(d.id))?'checked':'')+'><span>'+(d.icon?d.icon+' ':'')+String(d.name||d.id)+'</span></label>').join("");
 return true;
}
function bindEditorAutosave(){
 if(!D)return false;const primary=D.getElementById("rpgStatsList");
 if(primary&&!primary.dataset.canonical167897){primary.dataset.canonical167897="1";primary.addEventListener("change",e=>{const input=e.target?.closest?.('input[type="checkbox"]');if(input)setActive(input.value,!!input.checked)})}
 const custom=D.getElementById("gcs167879Box");
 if(custom&&!custom.dataset.canonical167897){custom.dataset.canonical167897="1";custom.addEventListener("change",e=>{const t=e.target;if(!t?.matches?.("[data-gcs],[data-e]"))return;try{R.GensCustomStats167879?.persist?.()}catch(err){console.warn("GenSrpG V16.78.97 stat autosave",err)}})}
 return true;
}
function tuneEditor(){
 renderPrimaryList();const box=D?.getElementById("gcs167879Box");if(box){const title=box.querySelector(".v2LibHead strong");if(title)title.textContent="🧩 Caractéristiques / statistiques";const help=box.querySelector(".small");if(help)help.textContent="Les caractéristiques de base et celles que tu crées utilisent maintenant la même définition en jeu."}
 bindEditorAutosave();return true;
}
function patchEditorRenderer(){
 const old=R.renderRpgUniverseEditor;if(typeof old!=="function"||old.__canonical167897)return false;
 const wrapped=function(){const out=old.apply(this,arguments);try{const p=contextProfile();if(p){profileStats(p);persistProfile(p)}patchCanonicalApi();R.GensCustomStats167879?.renderEditor?.();tuneEditor()}catch(e){console.warn("GenSrpG V16.78.97 canonical editor",e)}return out};
 wrapped.__canonical167897=true;wrapped.__original=old;R.renderRpgUniverseEditor=wrapped;return true;
}
function wrapCoreFinal(name){
 const core=R.DungeonCore01,old=core?.[name];if(typeof old!=="function"||old.__canonical167897)return false;
 const wrapped=function(){const out=old.apply(this,arguments);try{D?.getElementById("gcsHeroStats")?.remove?.();R.renderDungeonAttributes?.()}catch(e){}return out};
 wrapped.__canonical167897=true;wrapped.__original=old;core[name]=wrapped;return true;
}
function patchSheetFinalizer(){wrapCoreFinal("render");wrapCoreFinal("show");return true}
function install(){
 try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}
 migrateProfiles();patchCanonicalApi();patchEditorRenderer();patchSheetFinalizer();
 const p=contextProfile();if(p){profileStats(p);persistProfile(p)}
 try{R.GensCustomStats167879?.renderEditor?.()}catch(e){}tuneEditor();
 try{D?.getElementById("gcsHeroStats")?.remove?.();R.renderDungeonAttributes?.();R.renderDungeonHeroStats?.()}catch(e){}
 return true;
}
R.GensCustomStatRuntimeProfile167889={VERSION,APP_VERSION,MIGRATION_KEY,ALIASES,CORE,canon,editorOpen,activeProfile,contextProfile,profileStats,migrateProfiles,rawActiveSet,setActive,patchCanonicalApi,renderPrimaryList,bindEditorAutosave,tuneEditor,patchEditorRenderer,patchSheetFinalizer,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
