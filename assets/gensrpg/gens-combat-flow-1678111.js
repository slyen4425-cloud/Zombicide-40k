/* GenSrpG V16.78.111 — combat flow latency trim.
   Keeps the existing Dungeon AI logic and popups, but shortens only the deliberate
   250 ms AI startup pause used by dungeonRunAi156. No combat math or turn rules change. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis;
const VERSION="1.0.0",APP_VERSION="16.78.111",AI_START_MS=90,LEGACY_AI_START_MS=250;
function install(){
 const old=R.dungeonRunAi156;
 if(typeof old!=="function"||old.__gcf111)return false;
 const wrapped=function(){
   const realTimeout=R.setTimeout;
   if(typeof realTimeout!=="function")return old.apply(this,arguments);
   R.setTimeout=function(fn,delay){
     const args=[...arguments];
     if(Number(delay)===LEGACY_AI_START_MS)args[1]=AI_START_MS;
     return realTimeout.apply(this,args);
   };
   try{return old.apply(this,arguments)}finally{R.setTimeout=realTimeout}
 };
 wrapped.__gcf111=true;wrapped.__original=old;
 R.dungeonRunAi156=wrapped;
 return true;
}
function reinstall(){install();setTimeout(install,250);setTimeout(install,1200)}
R.GensCombatFlow1678111={VERSION,APP_VERSION,AI_START_MS,LEGACY_AI_START_MS,install};
reinstall();
})();
