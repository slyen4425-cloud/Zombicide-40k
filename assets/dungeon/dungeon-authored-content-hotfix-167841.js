/* GenSrpG V16.78.41 — authored Dungeon content hotfix.
   Fixes default enemy HP, hides unrevealed trap markers, and removes legacy chest scene cards
   while a World Builder dungeon is active. Reuses the existing zone-content/runtime systems. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.78.41";
const RT_KEY="gensrpg_dungeon_runtime_v2";
const CONTENT_KEY="gensrpg_zone_instance_content_v1";
let installed=false;
function clone(v){try{return v==null?v:JSON.parse(JSON.stringify(v))}catch(e){return v}}
function readJson(k,f){try{const v=JSON.parse(localStorage.getItem(k)||"null");return v==null?f:v}catch(e){return f}}
function writeJson(k,v){localStorage.setItem(k,JSON.stringify(v));return v}
function authoredActive(){try{if(ROOT.DungeonAuthoredRuntime167839?.active?.())return true}catch(e){}const x=readJson(RT_KEY,null);return !!x?.last?.authoredRuntime167839}
function defaultHpValue(v){return v===null||v===""||typeof v==="undefined"||!Number.isFinite(Number(v))||Number(v)===1}
function sanitizeContentInput(content){const c=clone(content)||{};if(Array.isArray(c.enemies))for(const e of c.enemies){if(e&&defaultHpValue(e.hp))delete e.hp}return c}
function scrubStoredDefaultEnemyHp(){const all=readJson(CONTENT_KEY,{});if(!all||typeof all!=="object"||Array.isArray(all))return false;let changed=false;for(const dungeon of Object.values(all)){if(!dungeon||typeof dungeon!=="object")continue;for(const zone of Object.values(dungeon)){if(!zone||typeof zone!=="object"||!Array.isArray(zone.enemies))continue;for(const e of zone.enemies){if(e&&Object.prototype.hasOwnProperty.call(e,"hp")&&defaultHpValue(e.hp)){delete e.hp;changed=true}}}}if(changed)writeJson(CONTENT_KEY,all);return changed}
function markerWithoutTrap(content,cell){let marker="floor";for(const e of content?.enemies||[])if(Number(e?.cell)===cell)marker=String(e?.role)==="boss"?"boss":"enemy";for(const c of content?.chests||[])if(Number(c?.cell)===cell)marker="chest";for(const p of content?.puzzles||[])if(Number(p?.cell)===cell)marker="puzzle";for(const n of content?.npcs||[])if(Number(n?.cell)===cell)marker="npc";for(const i of content?.items||[])if(Number(i?.cell)===cell)marker="item";return marker}
function hideAuthoredTrapMarkers(){const x=readJson(RT_KEY,null);if(!x?.last?.authoredRuntime167839||!Array.isArray(x?.last?.map?.cells))return false;let content={};try{content=ROOT.DungeonZoneContent167824?.getZoneContent?.(String(x.last.worldDungeonId||""),String(x.last.worldNodeId||""))||{}}catch(e){}let changed=false;x.last.map.cells=x.last.map.cells.map((v,i)=>{if(String(v)!=="trap")return v;changed=true;return markerWithoutTrap(content,i)});if(changed){try{ROOT.DungeonSpatial313?.ensure?.(x);ROOT.DungeonSpatial313?.persist?.(x)}catch(e){}writeJson(RT_KEY,x)}return changed}
function cleanLegacyChestCards(){if(!DOC||!authoredActive())return 0;let removed=0;const cards=Array.from(DOC.querySelectorAll?.("#dc200Scene .dc200SceneCard")||[]);for(const card of cards){if(!String(card?.textContent||"").toLowerCase().includes("coffre"))continue;try{card.remove()}catch(e){if(card?.style)card.style.display="none"}removed++}return removed}
function wrapZoneApi(){const api=ROOT.DungeonZoneContent167824;if(!api)return false;if(api.__dacf167841)return true;
 const oldGet=api.getZoneContent;if(typeof oldGet==="function"){const w=function(){scrubStoredDefaultEnemyHp();return oldGet.apply(this,arguments)};w.__dacf167841=true;w.__dacf167841Original=oldGet;api.getZoneContent=w}
 const oldSave=api.saveZoneContent;if(typeof oldSave==="function"){const w=function(d,n,c){const out=oldSave.call(this,d,n,sanitizeContentInput(c));scrubStoredDefaultEnemyHp();try{return typeof oldGet==="function"?oldGet.call(this,d,n):out}catch(e){return out}};w.__dacf167841=true;w.__dacf167841Original=oldSave;api.saveZoneContent=w}
 const oldApply=api.applyCurrentZone;if(typeof oldApply==="function"){const w=function(){scrubStoredDefaultEnemyHp();const out=oldApply.apply(this,arguments);hideAuthoredTrapMarkers();cleanLegacyChestCards();return out};w.__dacf167841=true;w.__dacf167841Original=oldApply;api.applyCurrentZone=w}
 const oldAddEnemy=api.addEnemy;if(typeof oldAddEnemy==="function"){const w=function(){const out=oldAddEnemy.apply(this,arguments);scrubStoredDefaultEnemyHp();return out};w.__dacf167841=true;w.__dacf167841Original=oldAddEnemy;api.addEnemy=w}
 const oldTrap=api.triggerTrap;if(typeof oldTrap==="function"){const w=function(){const out=oldTrap.apply(this,arguments);hideAuthoredTrapMarkers();return out};w.__dacf167841=true;w.__dacf167841Original=oldTrap;api.triggerTrap=w}
 api.__dacf167841=true;return true}
function wrapCore(){const core=ROOT.DungeonCore01;if(!core)return false;for(const name of ["render","show"]){const old=core[name];if(typeof old!=="function"||old.__dacf167841)continue;const w=function(){const out=old.apply(this,arguments);if(authoredActive()){hideAuthoredTrapMarkers();cleanLegacyChestCards()}return out};w.__dacf167841=true;w.__dacf167841Original=old;core[name]=w}const scene=ROOT.renderScene200;if(typeof scene==="function"&&!scene.__dacf167841){const w=function(){const out=scene.apply(this,arguments);cleanLegacyChestCards();return out};w.__dacf167841=true;w.__dacf167841Original=scene;ROOT.renderScene200=w}return true}
function install(){try{ROOT.GENSRPG_VERSION=APP_VERSION}catch(e){}scrubStoredDefaultEnemyHp();wrapZoneApi();wrapCore();if(authoredActive()){hideAuthoredTrapMarkers();cleanLegacyChestCards()}installed=!!ROOT.DungeonZoneContent167824?.__dacf167841;return installed}
ROOT.DungeonAuthoredContentFix167841={VERSION,APP_VERSION,RT_KEY,CONTENT_KEY,defaultHpValue,sanitizeContentInput,scrubStoredDefaultEnemyHp,markerWithoutTrap,hideAuthoredTrapMarkers,cleanLegacyChestCards,wrapZoneApi,wrapCore,install};
install();if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}if(typeof setTimeout==="function")for(const ms of [50,250,1000,2500])setTimeout(install,ms);
})();
