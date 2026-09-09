/* GenSrpG V16.78.97 — safe canonical RPG stat block for Hero Editor.
   No global MutationObserver: this layer only reacts to explicit hero-editor lifecycle hooks. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.1.0",APP_VERSION="16.78.97";
const LEGACY_INPUTS={force:"hcRpgForce",agilite:"hcRpgAgility",intelligence:"hcRpgIntelligence",esprit:"hcRpgSpirit",endurance:"hcRpgEndurance",defense:"hcRpgDefense",armor:"hcRpgArmor",initiative:"hcRpgInitiative",movement:"hcRpgMovement"};
let editorId=null,scheduled=false;
const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
function api(){return R.GensCleanRpgStats167874||null}
function heroRecord(id){try{return R.CHARS?.[id]||R.findCustomHero?.(id)||null}catch(e){return null}}
function activeDefs(){try{return api()?.runtimeDefs?.()||[]}catch(e){return []}}
function legacyValue(id,d,rec){const el=D?.getElementById?.(LEGACY_INPUTS[id]);if(Number.isFinite(Number(rec?.dungeonStats?.[id])))return Number(rec.dungeonStats[id]);if(el&&Number.isFinite(Number(el.value)))return Number(el.value);return num(d?.defaultValue,0)}
function hideLegacy(host){for(const inputId of Object.values(LEGACY_INPUTS)){const input=D?.getElementById?.(inputId),label=input?.closest?.("label");if(label){label.dataset.gensLegacyHeroStat="1";label.style.display="none"}}for(const old of host?.querySelectorAll?.("[data-gens-dynamic-hero-stat-label]")||[])old.remove()}
function render(id=editorId){
 if(!D||!api())return false;editorId=id??editorId;const host=D.getElementById("hcRpgStatsFields");if(!host)return false;
 hideLegacy(host);
 let box=D.getElementById("hcCanonicalStatsFields167897");
 if(!box){box=D.createElement("div");box.id="hcCanonicalStatsFields167897";box.setAttribute("data-gens-canonical-hero-stats","1");box.style.display="contents";host.insertBefore(box,D.getElementById("hcRpgElementsWrap")||host.firstChild)}
 box.innerHTML="";
 const rec=heroRecord(editorId);
 for(const d of activeDefs()){
  const label=D.createElement("label");label.setAttribute("data-gens-canonical-hero-stat-label",d.id);label.textContent=(d.icon?d.icon+" ":"")+d.name+" ";
  const input=D.createElement("input");input.type="number";input.min=String(d.min);input.max=String(d.max);input.value=String(legacyValue(d.id,d,rec));input.setAttribute("data-gens-dynamic-hero-stat",d.id);input.setAttribute("data-gens-canonical-hero-stat",d.id);label.appendChild(input);box.appendChild(label)
 }
 return true
}
function read(){const out={};if(!D)return out;for(const input of D.querySelectorAll("#hcCanonicalStatsFields167897 [data-gens-canonical-hero-stat]")){const id=input.getAttribute("data-gens-canonical-hero-stat"),d=api()?.def?.(id);out[id]=num(input.value,d?.defaultValue||0)}return out}
function syncLegacy(vals=read()){if(!D)return vals;for(const [id,inputId] of Object.entries(LEGACY_INPUTS)){const el=D.getElementById(inputId);if(el&&Object.prototype.hasOwnProperty.call(vals,id))el.value=String(vals[id])}return vals}
function persist(id,vals,beforeIds=[]){if(!id||!vals)return false;try{const list=R.loadCustomHeroesMulti?.()||[];let target=list.find(x=>String(x.id)===String(id));if(!target&&list.length){const old=new Set(beforeIds.map(String));target=list.find(x=>!old.has(String(x.id)))}if(target){target.dungeonStats=target.dungeonStats&&typeof target.dungeonStats==="object"?target.dungeonStats:{};Object.assign(target.dungeonStats,vals);R.saveCustomHeroesMulti?.(list);if(R.CHARS?.[target.id]){R.CHARS[target.id].dungeonStats=R.CHARS[target.id].dungeonStats&&typeof R.CHARS[target.id].dungeonStats==="object"?R.CHARS[target.id].dungeonStats:{};Object.assign(R.CHARS[target.id].dungeonStats,vals)}return true}if(R.CHARS?.[id]){R.CHARS[id].dungeonStats=R.CHARS[id].dungeonStats&&typeof R.CHARS[id].dungeonStats==="object"?R.CHARS[id].dungeonStats:{};Object.assign(R.CHARS[id].dungeonStats,vals);return true}}catch(e){console.warn("dynamic hero editor save",e)}return false}
function wrap(name,maker){const old=R[name];if(typeof old!=="function"||old.__heroDyn897)return false;const w=maker(old);w.__heroDyn897=true;w.__original=old;R[name]=w;return true}
function schedule(){if(scheduled)return;scheduled=true;setTimeout(()=>{scheduled=false;try{render(editorId)}catch(e){}},0)}
function install(){
 if(!api()){setTimeout(install,25);return false}
 wrap("openHeroCreator",old=>function(id){editorId=id??null;const out=old.apply(this,arguments);schedule();return out});
 wrap("hcRenderRpgStatsUsage",old=>function(){const out=old.apply(this,arguments);if(D?.getElementById?.("hcRpgStatsFields"))schedule();return out});
 wrap("saveCustomHero",old=>function(){const vals=syncLegacy(),before=(R.loadCustomHeroesMulti?.()||[]).map(x=>x.id),editId=editorId;const out=old.apply(this,arguments);setTimeout(()=>{let id=editId;if(!id){const oldIds=new Set(before.map(String)),list=R.loadCustomHeroesMulti?.()||[];id=list.find(x=>!oldIds.has(String(x.id)))?.id||null}persist(id,vals,before)},0);return out});
 if(D?.getElementById?.("hcRpgStatsFields"))schedule();return true
}
R.GensHeroEditorDynamic167897={VERSION,APP_VERSION,LEGACY_INPUTS,activeDefs,render,read,syncLegacy,persist,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
