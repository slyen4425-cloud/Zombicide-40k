/* GenSrpG V16.78.112 — low-latency combat turn handoff.
   Starts the enemy runner immediately after the turn actually advances, while preserving
   all existing guards (player popup, MJ control, aiBusy). The runner's old 250 ms startup
   delay is reduced to 25 ms. No combat math, target, damage or result popup changes. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis;
const VERSION="2.0.0",APP_VERSION="16.78.112",AI_START_MS=25,LEGACY_AI_START_MS=250;
function wrapRunner(){
 const old=R.dungeonRunAi156;
 if(typeof old!=="function"||old.__gcf112Runner)return false;
 const wrapped=function(){
   const realTimeout=R.setTimeout;
   if(typeof realTimeout!=="function")return old.apply(this,arguments);
   R.setTimeout=function(fn,delay){const args=[...arguments];if(Number(delay)===LEGACY_AI_START_MS)args[1]=AI_START_MS;return realTimeout.apply(this,args)};
   try{return old.apply(this,arguments)}finally{R.setTimeout=realTimeout}
 };
 wrapped.__gcf112Runner=true;wrapped.__original=old;R.dungeonRunAi156=wrapped;return true;
}
function kickEnemyNow(){
 try{
  const turn=R.dungeonTurn156;if(!turn?.active||turn.aiBusy)return false;
  const actor=typeof R.dungeonCurrentTurn156==="function"?R.dungeonCurrentTurn156():null;
  if(!actor||actor.kind!=="enemy")return false;
  if(typeof R.dungeonShouldMjControl156==="function"&&R.dungeonShouldMjControl156(actor))return false;
  if(typeof R.dungeonRunAi156!=="function")return false;
  R.dungeonRunAi156(actor);return true;
 }catch(e){return false}
}
function wrapAdvance(){
 const old=R.dungeonAdvanceTurn156;
 if(typeof old!=="function"||old.__gcf112Advance)return false;
 const wrapped=function(){const out=old.apply(this,arguments);const q=typeof R.queueMicrotask==="function"?R.queueMicrotask.bind(R):(fn=>Promise.resolve().then(fn));q(kickEnemyNow);return out};
 wrapped.__gcf112Advance=true;wrapped.__original=old;R.dungeonAdvanceTurn156=wrapped;return true;
}
function install(){wrapRunner();wrapAdvance();return true}
function reinstall(){install();setTimeout(install,250);setTimeout(install,1200)}
R.GensCombatFlow1678111={VERSION,APP_VERSION,AI_START_MS,LEGACY_AI_START_MS,kickEnemyNow,install};
reinstall();
})();
