/* GenSrpG V16.78.102.2 — mobile combat hot-path.
   Keeps dice results and combat rules unchanged. The patch only replaces repeated
   main-thread DOM ticks and memoizes derived values until combat state mutates. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.3.0",APP_VERSION="16.78.114.11-architecture-performance-1";
const D6_MS=440,D100_MS=420,CALLBACK_DELAY=8,WATCHDOG_MS=700,REEL_STEPS=11;
const nativeAnimateDice=typeof R.animateDice==="function"?R.animateDice:null;
const nativeAnimateRpgDice=typeof R.animateRpgDice==="function"?R.animateRpgDice:null;
let generation=0,stateIds=new WeakMap(),nextStateId=1,enemyCache=new WeakMap();
const valueCaches={equipment:new Map(),attribute:new Map(),canonical:new Map()};
const metrics={equipmentHits:0,equipmentMisses:0,attributeHits:0,attributeMisses:0,canonicalHits:0,canonicalMisses:0,enemyHits:0,enemyMisses:0,clears:0};
const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
function stateId(){const s=R.state;if(!s||typeof s!=="object")return "none";if(!stateIds.has(s))stateIds.set(s,nextStateId++);return stateIds.get(s)}
function actorKey(){return String(R.current||R.state?.currentHero||R.state?.heroId||"")+"|"+stateId()+"|"+generation+"|"}
function clear(){for(const cache of Object.values(valueCaches))cache.clear();enemyCache=new WeakMap();generation++;metrics.clears++;return true}
function wrapValue(name,cache,hitKey,missKey){const old=R[name];if(typeof old!=="function"||old.__gensMobileCombat1022)return false;const wrapped=function(id){const key=actorKey()+String(id||"");if(cache.has(key)){metrics[hitKey]++;return cache.get(key)}metrics[missKey]++;const value=old.apply(this,arguments);cache.set(key,value);return value};wrapped.__gensMobileCombat1022=true;wrapped.__original=old;R[name]=wrapped;return true}
function wrapCanonical(){const api=R.GensCleanRpgStats167874,old=api?.value;if(typeof old!=="function"||old.__gensMobileCombat1022)return false;const wrapped=function(hero,id){const key=String(hero||"")+"|"+generation+"|"+String(id||"");if(valueCaches.canonical.has(key)){metrics.canonicalHits++;return valueCaches.canonical.get(key)}metrics.canonicalMisses++;const value=old.apply(this,arguments);valueCaches.canonical.set(key,value);return value};wrapped.__gensMobileCombat1022=true;wrapped.__original=old;api.value=wrapped;return true}
function wrapEnemy(){const old=R.dungeonEnemyRpgStats;if(typeof old!=="function"||old.__gensMobileCombat1022)return false;const wrapped=function(def){if(def&&typeof def==="object"&&enemyCache.has(def)){metrics.enemyHits++;return enemyCache.get(def)}metrics.enemyMisses++;const value=old.apply(this,arguments);if(def&&typeof def==="object")enemyCache.set(def,value);return value};wrapped.__gensMobileCombat1022=true;wrapped.__original=old;R.dungeonEnemyRpgStats=wrapped;return true}
function isEquipmentInvalidator(name){return name==="save"||name==="dc214Equip"||name==="removeInventoryEntry"}
function invalidateEquipmentLocal(){try{return R.GensEquipmentStatCleanup1678102?.invalidateEquipmentBonusCache?.()!==false}catch(e){return false}}
function wrapInvalidator(name){const old=R[name];if(typeof old!=="function"||old.__gensMobileCombat1022Invalidator)return false;const wrapped=function(){clear();const out=old.apply(this,arguments);if(isEquipmentInvalidator(name))invalidateEquipmentLocal();return out};wrapped.__gensMobileCombat1022Invalidator=true;wrapped.__original=old;R[name]=wrapped;return true}
function once(fn){let done=false;return function(){if(done)return;done=true;return typeof fn==="function"?fn.apply(this,arguments):undefined}}
function safeVibrate(){try{R.navigator?.vibrate?.(10)}catch(e){}}
function randomFace(max){return 1+Math.floor(Math.random()*Math.max(1,num(max,1)))}
function finishTimer(finish,delay){const guarded=once(finish);const main=setTimeout(guarded,delay),watchdog=setTimeout(guarded,WATCHDOG_MS);return ()=>{clearTimeout(main);clearTimeout(watchdog);guarded()}}
function makeReel(max,finalValue,lineHeight,fontSize,width){const win=D.createElement("div"),track=D.createElement("div");win.className="gensDiceReelWindow";track.className="gensDiceReelTrack";Object.assign(win.style,{height:lineHeight+"px",lineHeight:lineHeight+"px",overflow:"hidden",width,margin:"0 auto",position:"relative"});Object.assign(track.style,{willChange:"transform",transform:"translate3d(0,0,0)",fontWeight:"900",fontSize:fontSize+"px",textAlign:"center"});const values=[];for(let i=0;i<REEL_STEPS-1;i++)values.push(randomFace(max));values.push(Math.max(1,Math.min(max,num(finalValue,1))));for(const value of values){const row=D.createElement("div");row.textContent=String(value);row.style.height=lineHeight+"px";row.style.lineHeight=lineHeight+"px";track.appendChild(row)}win.appendChild(track);return {win,track,values,lineHeight,finalValue:values.at(-1)}}
function animateTrack(track,lineHeight,steps,duration,delay=0){const y=-Math.max(0,steps-1)*lineHeight;try{if(typeof track?.animate==="function"){track.animate([{transform:"translate3d(0,0,0)"},{transform:"translate3d(0,"+y+"px,0)"}],{duration,delay,easing:"cubic-bezier(.12,.72,.18,1)",fill:"forwards"});return true}}catch(e){}try{track.style.transition="transform "+duration+"ms cubic-bezier(.12,.72,.18,1)";setTimeout(()=>{track.style.transform="translate3d(0,"+y+"px,0)"},Math.max(0,delay));return true}catch(e){return false}}
function animateCard(el,duration,delay=0){try{if(typeof el?.animate==="function"){el.animate([{transform:"translate3d(0,4px,0) rotate(-3deg) scale(.96)"},{transform:"translate3d(0,-4px,0) rotate(3deg) scale(1.03)",offset:.52},{transform:"translate3d(0,0,0) rotate(0deg) scale(1)"}],{duration,delay,easing:"ease-out"});return true}}catch(e){}return false}
function animateDiceFast(containerId,count,finalRolls,threshold,onDone){const box=D?.getElementById?.(containerId);if(!box){if(onDone)setTimeout(onDone,0);return false}const n=Math.max(0,num(count,0)),frag=D.createDocumentFragment(),dice=[];for(let i=0;i<n;i++){const finalValue=num(finalRolls?.[i],1),die=D.createElement("div");die.className="die rolling";die.dataset.value="rolling";const reel=makeReel(6,finalValue,34,25,"2.2em");die.appendChild(reel.win);frag.appendChild(die);dice.push({el:die,...reel,threshold:Math.max(1,num(threshold,1))})}box.replaceChildren(frag);dice.forEach((rec,i)=>{const delay=Math.min(i*12,48);animateTrack(rec.track,rec.lineHeight,rec.values.length,D6_MS,delay);animateCard(rec.el,D6_MS,delay)});finishTimer(()=>{for(const rec of dice){const ok=rec.finalValue>=rec.threshold;rec.el.className="die finalPop "+(ok?"success":"fail");rec.el.dataset.value=String(rec.finalValue);rec.el.textContent=String(rec.finalValue)}safeVibrate();if(onDone)setTimeout(onDone,CALLBACK_DELAY)},D6_MS+50);return true}
function animateRpgDiceFast(containerId,count,finalRolls,threshold,sides,onDone){const box=D?.getElementById?.(containerId);if(!box){if(onDone)setTimeout(onDone,0);return false}Object.assign(box.style,{display:"flex",flexWrap:"wrap",gap:"10px",justifyContent:"center",alignItems:"center",minHeight:"86px"});const n=Math.max(0,num(count,0)),max=Math.max(6,Math.min(100,num(sides,100))),target=Math.max(1,Math.min(max,num(threshold,1))),frag=D.createDocumentFragment(),cards=[];for(let i=0;i<n;i++){const finalValue=num(finalRolls?.[i],1),card=D.createElement("div");card.className="rpgD100Card rolling";const label=D.createElement("div");label.className="rpgD100Label";label.textContent="D"+max;const reel=makeReel(max,finalValue,38,29,"2.5em"),targetEl=D.createElement("div");targetEl.className="rpgD100Target";targetEl.textContent="Objectif : "+target+" ou plus";card.append(label,reel.win,targetEl);frag.appendChild(card);cards.push({el:card,label,...reel})}box.replaceChildren(frag);cards.forEach((rec,i)=>{const delay=Math.min(i*10,40);animateTrack(rec.track,rec.lineHeight,rec.values.length,D100_MS,delay);animateCard(rec.el,D100_MS,delay)});finishTimer(()=>{for(const rec of cards){const ok=rec.finalValue>=target;rec.el.className="rpgD100Card "+(ok?"success":"fail");rec.el.replaceChildren(rec.label);const value=D.createElement("div");value.className="rpgD100Value";value.textContent=String(rec.finalValue);const result=D.createElement("div");result.className="rpgD100Target";result.textContent=ok?"✅ RÉUSSITE · "+rec.finalValue+" ≥ "+target:"❌ ÉCHEC · "+rec.finalValue+" < "+target;rec.el.append(value,result)}safeVibrate();if(onDone)setTimeout(onDone,CALLBACK_DELAY)},D100_MS+45);return true}
function dungeonDiceContext(){
  try{const p=R.getActiveGameProfile?.()||R.activeGameProfileRaw?.();if(p?.gameStyle)return p.gameStyle==="dungeon"}catch(e){}
  try{const f=R.localStorage?.getItem?.("gensrpg_session_family_guard_v1");if(f==="survival")return false;if(f==="adventure")return true}catch(e){}
  try{if(typeof R.currentGameStyle==="function")return R.currentGameStyle()==="dungeon"}catch(e){}
  try{if(typeof R.isDungeonMode==="function")return !!R.isDungeonMode()}catch(e){}
  return true;
}
function animateDiceDispatch(){if(!dungeonDiceContext()&&nativeAnimateDice)return nativeAnimateDice.apply(this,arguments);return animateDiceFast.apply(this,arguments)}
function animateRpgDiceDispatch(){if(!dungeonDiceContext()&&nativeAnimateRpgDice)return nativeAnimateRpgDice.apply(this,arguments);return animateRpgDiceFast.apply(this,arguments)}
function install(){wrapValue("dungeonEquipmentBonus",valueCaches.equipment,"equipmentHits","equipmentMisses");wrapValue("dungeonAttributeValue",valueCaches.attribute,"attributeHits","attributeMisses");wrapCanonical();wrapEnemy();for(const name of ["applyDungeonAttackDamage","applyBossAttackDamage","silentHeroDamage023","changeDungeonAttribute","dc214Equip","dc214Reload","save","removeInventoryEntry","saveState","saveActiveEnemies","saveDungeonHeroState","saveDungeonHeroStats","saveGameProfiles","saveCustomHero"])wrapInvalidator(name);if(D){R.animateDice=animateDiceDispatch;R.animateRpgDice=animateRpgDiceDispatch}return true}
function reinstall(){install();setTimeout(install,250);setTimeout(install,1200)}
function loadRuntimeBootstrap(){
  if(!D||!(D.head||D.documentElement)||R.__gensRuntimeBootstrapEntryV1)return false;
  R.__gensRuntimeBootstrapEntryV1=true;
  const s=D.createElement("script");
  s.src="assets/gensrpg/core/runtime-bootstrap-v1.js?v=1";
  s.async=false;
  s.onerror=()=>console.error("GenSrpG RuntimeBootstrap V1 entry load failed");
  (D.head||D.documentElement).appendChild(s);
  return true;
}
R.GensMobileCombatPerformance16781022={VERSION,APP_VERSION,D6_MS,D100_MS,WATCHDOG_MS,REEL_STEPS,clear,install,makeReel,animateDiceFast,animateRpgDiceFast,animateDiceDispatch,animateRpgDiceDispatch,dungeonDiceContext,loadRuntimeBootstrap,metrics:()=>({...metrics})};
reinstall();
loadRuntimeBootstrap();
})();
