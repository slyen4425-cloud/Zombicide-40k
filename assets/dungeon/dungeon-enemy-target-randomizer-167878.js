/* GenSrpG Dungeon V16.78.78 — enemy target randomization.
   Keeps MJ forced targets authoritative. Automatic enemy attacks choose among living combat heroes
   with threat weighting and a mild repeat-target penalty. Foundation for future tanking/aggro. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const VERSION="1.0.0",APP_VERSION="16.78.78";
const REPEAT_FACTOR=.35;
const lastByEnemy=new Map();
let retries=0;
function livingHeroes(){
  const ids=Array.isArray(ROOT.dungeonCombatSelection?.heroes)?ROOT.dungeonCombatSelection.heroes:[];
  return ids.filter(id=>{try{return Number(ROOT.dungeonCombatHeroSnapshot?.(id)?.hp)>0}catch(e){return false}}).map(String);
}
function threat(heroId){
  try{if(typeof ROOT.dungeonHeroThreatScore==="function")return Math.max(.01,Number(ROOT.dungeonHeroThreatScore(heroId))||1)}catch(e){}
  try{return Math.max(.01,1+(Number(ROOT.loadState?.(heroId)?.dungeonThreatBonus)||0))}catch(e){return 1}
}
function choose(enemyId,rng=Math.random){
  const ids=livingHeroes();if(!ids.length)return null;if(ids.length===1)return ids[0];
  const previous=lastByEnemy.get(String(enemyId));
  const weighted=ids.map(id=>({id,w:threat(id)*(String(id)===String(previous)?REPEAT_FACTOR:1)}));
  const total=weighted.reduce((n,x)=>n+x.w,0);let roll=Math.max(0,Math.min(.999999999,Number(rng())||0))*total;
  for(const x of weighted){roll-=x.w;if(roll<=0){lastByEnemy.set(String(enemyId),x.id);return x.id}}
  const picked=weighted[weighted.length-1].id;lastByEnemy.set(String(enemyId),picked);return picked;
}
function isMjControlledEnemy(instanceId){
  try{
    const cur=typeof ROOT.dungeonCurrentTurn156==="function"?ROOT.dungeonCurrentTurn156():null;
    return !!(ROOT.dungeonTurn156?.active&&cur?.kind==="enemy"&&String(cur.id)===String(instanceId)&&typeof ROOT.dungeonShouldMjControl156==="function"&&ROOT.dungeonShouldMjControl156(cur));
  }catch(e){return false}
}
function wrap(){
  const old=ROOT.rollDungeonEnemyAttackSkill;if(typeof old!=="function"||old.__dtr167878)return false;
  const w=function(instanceId,skillId,targetHeroId=null){
    if(isMjControlledEnemy(instanceId))return old.apply(this,arguments);
    const picked=choose(instanceId);if(!picked)return old.apply(this,arguments);
    return old.call(this,instanceId,skillId,picked);
  };
  w.__dtr167878=true;w.__dtrOriginal=old;ROOT.rollDungeonEnemyAttackSkill=w;return true;
}
function install(){if(wrap())return true;if(retries++<50&&typeof setTimeout==="function")setTimeout(install,100);return false}
ROOT.DungeonEnemyTargetRandomizer167878={VERSION,APP_VERSION,REPEAT_FACTOR,livingHeroes,threat,choose,isMjControlledEnemy,install,lastByEnemy};
if(typeof document!=="undefined"){if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",install,{once:true});else install()}
})();
