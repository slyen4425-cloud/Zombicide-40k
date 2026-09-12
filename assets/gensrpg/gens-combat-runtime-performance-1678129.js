/* GenSrpG V16.78.129 — Dungeon combat hot-path cache isolation.
   Keeps canonical stat reads cached across repeated combat renders and only invalidates
   on state mutations. Scoped to Dungeon RPG stat accessors; gameplay math is unchanged. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis;
const VERSION="3.0.0",APP_VERSION="16.78.129";
let attrCache=new Map(),valueCache=new Map(),enemyCache=new WeakMap(),defsCache=null,generation=0;
const metrics={attrHits:0,attrMisses:0,valueHits:0,valueMisses:0,enemyHits:0,enemyMisses:0,clears:0};
function clear(){attrCache.clear();valueCache.clear();enemyCache=new WeakMap();defsCache=null;generation++;metrics.clears++}
function actorKey(){return String(R.current||"")+"|"+generation+"|"}
function wrapAttribute(){const old=R.dungeonAttributeValue;if(typeof old!=="function"||old.__gcrp129)return false;const w=function(id){const k=actorKey()+String(id||"");if(attrCache.has(k)){metrics.attrHits++;return attrCache.get(k)}metrics.attrMisses++;const v=old.apply(this,arguments);attrCache.set(k,v);return v};w.__gcrp129=true;w.__original=old;R.dungeonAttributeValue=w;return true}
function wrapCanonicalApi(){const api=R.GensCleanRpgStats167874;if(!api)return false;
 if(typeof api.value==="function"&&!api.value.__gcrp129){const old=api.value;const w=function(hero,id){const k=String(hero||"")+"|"+generation+"|"+String(id||"");if(valueCache.has(k)){metrics.valueHits++;return valueCache.get(k)}metrics.valueMisses++;const v=old.apply(this,arguments);valueCache.set(k,v);return v};w.__gcrp129=true;w.__original=old;api.value=w}
 if(typeof api.runtimeDefs==="function"&&!api.runtimeDefs.__gcrp129){const old=api.runtimeDefs;const w=function(){if(defsCache)return defsCache;defsCache=old.apply(this,arguments);return defsCache};w.__gcrp129=true;w.__original=old;api.runtimeDefs=w}
 return true}
function wrapEnemyStats(){const old=R.dungeonEnemyRpgStats;if(typeof old!=="function"||old.__gcrp129)return false;const w=function(def){if(def&&typeof def==="object"&&enemyCache.has(def)){metrics.enemyHits++;return enemyCache.get(def)}metrics.enemyMisses++;const v=old.apply(this,arguments);if(def&&typeof def==="object")enemyCache.set(def,v);return v};w.__gcrp129=true;w.__original=old;R.dungeonEnemyRpgStats=w;return true}
function wrapClearBefore(name){const old=R[name];if(typeof old!=="function"||old.__gcrp129Clear)return false;const w=function(){clear();return old.apply(this,arguments)};w.__gcrp129Clear=true;w.__original=old;R[name]=w;return true}
function install(){wrapCanonicalApi();wrapAttribute();wrapEnemyStats();
 /* Deliberately do not invalidate on combat render functions: nested/full combat rerenders
    must reuse the same canonical stat snapshot until a real state mutation occurs. */
 for(const n of ["applyDungeonAttackDamage","silentHeroDamage023","changeDungeonAttribute","dc214Equip","dc214Reload","save","saveState","saveActiveEnemies","saveDungeonHeroState","saveDungeonHeroStats"])wrapClearBefore(n);
 return true}
function reinstall(){install();setTimeout(install,250);setTimeout(install,1200)}
R.GensCombatRuntimePerformance1678129={VERSION,APP_VERSION,clear,install,generation:()=>generation,metrics:()=>({...metrics})};
reinstall();
})();
