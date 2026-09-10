/* GenSrpG V16.78.110 — combat hot-path performance guard.
   Memoizes repeated stat reads only for the current JS turn, so renderers can reuse
   identical values without rebuilding the canonical stat engine dozens of times.
   No gameplay math is changed and caches are cleared before any wrapped mutation/render. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis;
const VERSION="1.0.0",APP_VERSION="16.78.110";
let attrCache=new Map(),valueCache=new Map(),enemyCache=new WeakMap(),defsCache=null,clearQueued=false;
const metrics={attrHits:0,attrMisses:0,valueHits:0,valueMisses:0,enemyHits:0,enemyMisses:0};
function clear(){attrCache.clear();valueCache.clear();enemyCache=new WeakMap();defsCache=null;clearQueued=false}
function queueClear(){if(clearQueued)return;clearQueued=true;const q=typeof R.queueMicrotask==="function"?R.queueMicrotask.bind(R):(fn=>Promise.resolve().then(fn));q(clear)}
function actorKey(){return String(R.current||"")+"|"}
function wrapAttribute(){const old=R.dungeonAttributeValue;if(typeof old!=="function"||old.__gcrp110)return false;const w=function(id){const k=actorKey()+String(id||"");if(attrCache.has(k)){metrics.attrHits++;return attrCache.get(k)}metrics.attrMisses++;const v=old.apply(this,arguments);attrCache.set(k,v);queueClear();return v};w.__gcrp110=true;w.__original=old;R.dungeonAttributeValue=w;return true}
function wrapCanonicalApi(){const api=R.GensCleanRpgStats167874;if(!api)return false;
 if(typeof api.value==="function"&&!api.value.__gcrp110){const old=api.value;const w=function(hero,id){const k=String(hero||"")+"|"+String(id||"");if(valueCache.has(k)){metrics.valueHits++;return valueCache.get(k)}metrics.valueMisses++;const v=old.apply(this,arguments);valueCache.set(k,v);queueClear();return v};w.__gcrp110=true;w.__original=old;api.value=w}
 if(typeof api.runtimeDefs==="function"&&!api.runtimeDefs.__gcrp110){const old=api.runtimeDefs;const w=function(){if(defsCache)return defsCache;defsCache=old.apply(this,arguments);queueClear();return defsCache};w.__gcrp110=true;w.__original=old;api.runtimeDefs=w}
 return true}
function wrapEnemyStats(){const old=R.dungeonEnemyRpgStats;if(typeof old!=="function"||old.__gcrp110)return false;const w=function(def){if(def&&typeof def==="object"&&enemyCache.has(def)){metrics.enemyHits++;return enemyCache.get(def)}metrics.enemyMisses++;const v=old.apply(this,arguments);if(def&&typeof def==="object")enemyCache.set(def,v);queueClear();return v};w.__gcrp110=true;w.__original=old;R.dungeonEnemyRpgStats=w;return true}
function wrapClearBefore(name){const old=R[name];if(typeof old!=="function"||old.__gcrp110Clear)return false;const w=function(){clear();return old.apply(this,arguments)};w.__gcrp110Clear=true;w.__original=old;R[name]=w;return true}
function install(){wrapCanonicalApi();wrapAttribute();wrapEnemyStats();for(const n of ["renderDungeonCombatRound","__dc302RenderCombat","__dc214RenderCombat","applyDungeonAttackDamage","silentHeroDamage023","changeDungeonAttribute","dc214Equip","dc214Reload","save","saveState"])wrapClearBefore(n);return true}
function reinstall(){install();setTimeout(install,250);setTimeout(install,1200)}
R.GensCombatRuntimePerformance1678110={VERSION,APP_VERSION,clear,install,metrics:()=>({...metrics})};
reinstall();
})();
