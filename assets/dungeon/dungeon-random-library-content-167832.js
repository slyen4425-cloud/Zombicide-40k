/* GenSrpG V16.78.32 — random selections backed by the existing Dungeon libraries.
   Does not create new enemy/item catalogs. It only resolves the special editor choices
   before the existing spawn/inventory functions receive them. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.78.32";
const RANDOM_ENEMY_ID="__random_enemy__",RANDOM_ITEM_ID="__random_item__";
let installed=false;
function uniqueIds(list){const seen=new Set(),out=[];for(const x of Array.isArray(list)?list:[]){const id=String(x?.id||x?.enemyId||x?.itemId||x?.key||"");if(!id||id===RANDOM_ENEMY_ID||id===RANDOM_ITEM_ID||seen.has(id))continue;seen.add(id);out.push(id)}return out}
function enemyPool(){let list=[];try{list=ROOT.enemiesForMode?.(true)||[]}catch(e){}let ids=uniqueIds(list);if(!ids.length)ids=["dng_skeleton","dng_skeleton_archer","dng_skeleton_guard","dng_ghoul","dng_wraith","dng_lich","dng_goblin","dng_goblin_archer","dng_goblin_shaman","dng_orc","dng_orc_berserker","dng_orc_shaman","dng_spider","dng_direwolf","dng_harpy","dng_troll","dng_golem","dng_minotaur","dng_wyvern","dng_necromancer"];return ids}
function itemPool(){let list=[];try{list=ROOT.itemsForMode?.(true)||[]}catch(e){}if(!Array.isArray(list)||!list.length)try{list=ROOT.merchantItems?.()||[]}catch(e){}return uniqueIds(list)}
function pick(list){const a=Array.isArray(list)?list:[];if(!a.length)return "";return String(a[Math.max(0,Math.min(a.length-1,Math.floor(Math.random()*a.length)))])}
function randomEnemyId(){return pick(enemyPool())||"dng_skeleton"}
function randomItemId(){return pick(itemPool())}
function patchEnemySpawner(){const old=ROOT.trackSpawnedEnemyInstances;if(typeof old!=="function")return false;if(old.__drl167832)return true;const wrapped=function(enemyId){const args=[...arguments];if(String(enemyId)===RANDOM_ENEMY_ID)args[0]=randomEnemyId();return old.apply(this,args)};wrapped.__drl167832=true;wrapped.__drl167832Original=old;ROOT.trackSpawnedEnemyInstances=wrapped;return true}
function patchInventoryFactory(){const old=ROOT.makeInventoryEntry;if(typeof old!=="function")return false;if(old.__drl167832)return true;const wrapped=function(itemId){const args=[...arguments];if(String(itemId)===RANDOM_ITEM_ID){const resolved=randomItemId();if(resolved)args[0]=resolved}return old.apply(this,args)};wrapped.__drl167832=true;wrapped.__drl167832Original=old;ROOT.makeInventoryEntry=wrapped;return true}
function install(){try{ROOT.GENSRPG_VERSION=APP_VERSION}catch(e){}const a=patchEnemySpawner(),b=patchInventoryFactory();installed=installed||a||b;return a&&b}
function boot(){install();for(const ms of [50,250,1000,2500])setTimeout(()=>install(),ms)}
ROOT.DungeonRandomLibraryContent167832={VERSION,APP_VERSION,RANDOM_ENEMY_ID,RANDOM_ITEM_ID,enemyPool,itemPool,randomEnemyId,randomItemId,patchEnemySpawner,patchInventoryFactory,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",boot,{once:true});else boot()}else boot();
})();
