/* GenSrpG V16.78.102.6 — combat transition root fix from clean V16.78.102.2.
   Root causes addressed without changing combat maths:
   - damage text is no longer blocked behind heavyweight combat/map rerenders;
   - the readable enemy runner no longer waits 2.8s before advancing;
   - enemy turns are kicked immediately after timeline advance instead of waiting for the watchdog;
   - HP/enemy persistence no longer destroys derived-stat caches. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.4.0",APP_VERSION="16.78.102.6";
const D6_MS=440,D100_MS=420,CALLBACK_DELAY=8,WATCHDOG_MS=700,REEL_STEPS=11;
const AI_START_MS=60,AI_RESULT_MS=650,AI_KICK_MS=35;
let generation=0,stateIds=new WeakMap(),nextStateId=1,enemyCache=new WeakMap();
let renderFlushQueued=false,pendingEnemyRender=null,pendingCombatRender=null;
const valueCaches={equipment:new Map(),attribute:new Map(),canonical:new Map()};
const metrics={equipmentHits:0,equipmentMisses:0,attributeHits:0,attributeMisses:0,canonicalHits:0,canonicalMisses:0,enemyHits:0,enemyMisses:0,clears:0,damageDeferrals:0,renderFlushes:0,aiRuns:0,aiAdvances:0,aiKicks:0};
const num=(v,f=0)=>Number.isFinite(Number(v))?Number(v):f;
function stateId(){const s=R.state;if(!s||typeof s!=="object")return "none";if(!stateIds.has(s))stateIds.set(s,nextStateId++);return stateIds.get(s)}
function actorKey(){return String(R.current||R.state?.currentHero||R.state?.heroId||"")+"|"+stateId()+"|"+generation+"|"}
function clear(){for(const cache of Object.values(valueCaches))cache.clear();enemyCache=new WeakMap();generation++;metrics.clears++;return true}
function wrapValue(name,cache,hitKey,missKey){const old=R[name];if(typeof old!=="function"||old.__gensRoot1026Value)return false;const wrapped=function(id){const key=actorKey()+String(id||"");if(cache.has(key)){metrics[hitKey]++;return cache.get(key)}metrics[missKey]++;const value=old.apply(this,arguments);cache.set(key,value);return value};wrapped.__gensRoot1026Value=true;wrapped.__original=old;R[name]=wrapped;return true}
function wrapCanonical(){const api=R.GensCleanRpgStats167874,old=api?.value;if(typeof old!=="function"||old.__gensRoot1026Value)return false;const wrapped=function(hero,id){const key=String(hero||"")+"|"+generation+"|"+String(id||"");if(valueCaches.canonical.has(key)){metrics.canonicalHits++;return valueCaches.canonical.get(key)}metrics.canonicalMisses++;const value=old.apply(this,arguments);valueCaches.canonical.set(key,value);return value};wrapped.__gensRoot1026Value=true;wrapped.__original=old;api.value=wrapped;return true}
function wrapEnemy(){const old=R.dungeonEnemyRpgStats;if(typeof old!=="function"||old.__gensRoot1026Value)return false;const wrapped=function(def){if(def&&typeof def==="object"&&enemyCache.has(def)){metrics.enemyHits++;return enemyCache.get(def)}metrics.enemyMisses++;const value=old.apply(this,arguments);if(def&&typeof def==="object")enemyCache.set(def,value);return value};wrapped.__gensRoot1026Value=true;wrapped.__original=old;R.dungeonEnemyRpgStats=wrapped;return true}
function wrapInvalidator(name){const old=R[name];if(typeof old!=="function"||old.__gensRoot1026Invalidator)return false;const wrapped=function(){clear();const out=old.apply(this,arguments);clear();return out};wrapped.__gensRoot1026Invalidator=true;wrapped.__original=old;R[name]=wrapped;return true}
function installStatInvalidators(){for(const name of ["changeDungeonAttribute","dungeonEquipItem","dungeonUnequipItem","equipDungeonItem","unequipDungeonItem","toggleDungeonEquipment","saveEquipmentEditor","saveDungeonHeroStats","saveGameProfiles"])wrapInvalidator(name)}
function once(fn){let done=false;return function(){if(done)return;done=true;return typeof fn==="function"?fn.apply(this,arguments):undefined}}
function safeVibrate(){try{R.navigator?.vibrate?.(10)}catch(e){}}
function randomFace(max){return 1+Math.floor(Math.random()*Math.max(1,num(max,1)))}
function finishTimer(finish,delay){const guarded=once(finish);const main=setTimeout(guarded,delay),watchdog=setTimeout(guarded,WATCHDOG_MS);return ()=>{clearTimeout(main);clearTimeout(watchdog);guarded()}}
function makeReel(max,finalValue,lineHeight,fontSize,width){const win=D.createElement("div"),track=D.createElement("div");win.className="gensDiceReelWindow";track.className="gensDiceReelTrack";Object.assign(win.style,{height:lineHeight+"px",lineHeight:lineHeight+"px",overflow:"hidden",width,margin:"0 auto",position:"relative"});Object.assign(track.style,{willChange:"transform",transform:"translate3d(0,0,0)",fontWeight:"900",fontSize:fontSize+"px",textAlign:"center"});const values=[];for(let i=0;i<REEL_STEPS-1;i++)values.push(randomFace(max));values.push(Math.max(1,Math.min(max,num(finalValue,1))));for(const value of values){const row=D.createElement("div");row.textContent=String(value);row.style.height=lineHeight+"px";row.style.lineHeight=lineHeight+"px";track.appendChild(row)}win.appendChild(track);return {win,track,values,lineHeight,finalValue:values.at(-1)}}
function animateTrack(track,lineHeight,steps,duration,delay=0){const y=-Math.max(0,steps-1)*lineHeight;try{if(typeof track?.animate==="function"){track.animate([{transform:"translate3d(0,0,0)"},{transform:"translate3d(0,"+y+"px,0)"}],{duration,delay,easing:"cubic-bezier(.12,.72,.18,1)",fill:"forwards"});return true}}catch(e){}try{track.style.transition="transform "+duration+"ms cubic-bezier(.12,.72,.18,1)";setTimeout(()=>{track.style.transform="translate3d(0,"+y+"px,0)"},Math.max(0,delay));return true}catch(e){return false}}
function animateCard(el,duration,delay=0){try{if(typeof el?.animate==="function"){el.animate([{transform:"translate3d(0,4px,0) rotate(-3deg) scale(.96)"},{transform:"translate3d(0,-4px,0) rotate(3deg) scale(1.03)",offset:.52},{transform:"translate3d(0,0,0) rotate(0deg) scale(1)"}],{duration,delay,easing:"ease-out"});return true}}catch(e){}return false}
function animateDiceFast(containerId,count,finalRolls,threshold,onDone){const box=D?.getElementById?.(containerId);if(!box){if(onDone)setTimeout(onDone,0);return false}const n=Math.max(0,num(count,0)),frag=D.createDocumentFragment(),dice=[];for(let i=0;i<n;i++){const finalValue=num(finalRolls?.[i],1),die=D.createElement("div");die.className="die rolling";die.dataset.value="rolling";const reel=makeReel(6,finalValue,34,25,"2.2em");die.appendChild(reel.win);frag.appendChild(die);dice.push({el:die,...reel,threshold:Math.max(1,num(threshold,1))})}box.replaceChildren(frag);dice.forEach((rec,i)=>{const delay=Math.min(i*12,48);animateTrack(rec.track,rec.lineHeight,rec.values.length,D6_MS,delay);animateCard(rec.el,D6_MS,delay)});finishTimer(()=>{for(const rec of dice){const ok=rec.finalValue>=rec.threshold;rec.el.className="die finalPop "+(ok?"success":"fail");rec.el.dataset.value=String(rec.finalValue);rec.el.textContent=String(rec.finalValue)}safeVibrate();if(onDone)setTimeout(onDone,CALLBACK_DELAY)},D6_MS+50);return true}
function animateRpgDiceFast(containerId,count,finalRolls,threshold,sides,onDone){const box=D?.getElementById?.(containerId);if(!box){if(onDone)setTimeout(onDone,0);return false}Object.assign(box.style,{display:"flex",flexWrap:"wrap",gap:"10px",justifyContent:"center",alignItems:"center",minHeight:"86px"});const n=Math.max(0,num(count,0)),max=Math.max(6,Math.min(100,num(sides,100))),target=Math.max(1,Math.min(max,num(threshold,1))),frag=D.createDocumentFragment(),cards=[];for(let i=0;i<n;i++){const finalValue=num(finalRolls?.[i],1),card=D.createElement("div");card.className="rpgD100Card rolling";const label=D.createElement("div");label.className="rpgD100Label";label.textContent="D"+max;const reel=makeReel(max,finalValue,38,29,"2.5em"),targetEl=D.createElement("div");targetEl.className="rpgD100Target";targetEl.textContent="Objectif : "+target+" ou plus";card.append(label,reel.win,targetEl);frag.appendChild(card);cards.push({el:card,label,...reel})}box.replaceChildren(frag);cards.forEach((rec,i)=>{const delay=Math.min(i*10,40);animateTrack(rec.track,rec.lineHeight,rec.values.length,D100_MS,delay);animateCard(rec.el,D100_MS,delay)});finishTimer(()=>{for(const rec of cards){const ok=rec.finalValue>=target;rec.el.className="rpgD100Card "+(ok?"success":"fail");rec.el.replaceChildren(rec.label);const value=D.createElement("div");value.className="rpgD100Value";value.textContent=String(rec.finalValue);const result=D.createElement("div");result.className="rpgD100Target";result.textContent=ok?"✅ RÉUSSITE · "+rec.finalValue+" ≥ "+target:"❌ ÉCHEC · "+rec.finalValue+" < "+target;rec.el.append(value,result)}safeVibrate();if(onDone)setTimeout(onDone,CALLBACK_DELAY)},D100_MS+45);return true}

/* Damage was already computed, but the legacy function synchronously rebuilt the enemy list
   and the entire combat UI before writing attackDiceResult. Queue those visual rebuilds until
   after at least one paint so the result/damage is visible immediately. */
function queueHeavyRenders(enemyFn,combatFn){
  if(typeof enemyFn==="function")pendingEnemyRender=enemyFn;
  if(typeof combatFn==="function")pendingCombatRender=combatFn;
  if(renderFlushQueued)return;
  renderFlushQueued=true;
  const raf=typeof R.requestAnimationFrame==="function"?R.requestAnimationFrame.bind(R):(fn=>setTimeout(fn,16));
  raf(()=>raf(()=>{
    renderFlushQueued=false;
    const e=pendingEnemyRender,c=pendingCombatRender;pendingEnemyRender=null;pendingCombatRender=null;
    metrics.renderFlushes++;
    try{if(typeof e==="function")e.call(R)}catch(err){console.warn("GenSrpG 102.6 enemy render",err)}
    try{if(typeof c==="function")c.call(R)}catch(err){console.warn("GenSrpG 102.6 combat render",err)}
  }));
}
function wrapDamageResolution(name){
  const old=R[name];if(typeof old!=="function"||old.__gensRoot1026Damage)return false;
  const wrapped=function(){
    const enemyRender=R.renderActiveEnemies,combatRender=R.renderDungeonCombatRound;
    let needEnemy=false,needCombat=false;
    if(typeof enemyRender==="function")R.renderActiveEnemies=function(){needEnemy=true};
    if(typeof combatRender==="function")R.renderDungeonCombatRound=function(){needCombat=true};
    try{return old.apply(this,arguments)}
    finally{
      if(typeof enemyRender==="function")R.renderActiveEnemies=enemyRender;
      if(typeof combatRender==="function")R.renderDungeonCombatRound=combatRender;
      if(needEnemy||needCombat){metrics.damageDeferrals++;queueHeavyRenders(needEnemy?enemyRender:null,needCombat?combatRender:null)}
    }
  };
  wrapped.__gensRoot1026Damage=true;wrapped.__original=old;R[name]=wrapped;return true
}

function globalCheckGameOver(){try{return typeof R.checkGameOver==="function"&&R.checkGameOver()}catch(e){return false}}
function heroLabel(id){try{if(typeof CHARS!=="undefined"&&CHARS?.[id]?.name)return CHARS[id].name}catch(e){}return String(id||"")}
function installFastAiRunner(){
  const old=R.dungeonRunAi156;if(typeof old!=="function"||old.__gensRoot1026Ai)return false;
  const fast=function(actor){
    const turn=R.dungeonTurn156;
    if(!actor||actor.kind!=="enemy"||!turn||turn.aiBusy)return;
    if(globalCheckGameOver())return;
    const load=typeof R.loadActiveEnemies==="function"?R.loadActiveEnemies:(typeof loadActiveEnemies==="function"?loadActiveEnemies:null);
    const defFn=typeof R.activeEnemyDefinition==="function"?R.activeEnemyDefinition:(typeof activeEnemyDefinition==="function"?activeEnemyDefinition:null);
    const skillsFn=typeof R.dungeonEnemyAttackSkills==="function"?R.dungeonEnemyAttackSkills:(typeof dungeonEnemyAttackSkills==="function"?dungeonEnemyAttackSkills:null);
    const targetFn=typeof R.dungeonAiTarget156==="function"?R.dungeonAiTarget156:(typeof dungeonAiTarget156==="function"?dungeonAiTarget156:null);
    const rulesFn=typeof R.dungeonMjRules151==="function"?R.dungeonMjRules151:(typeof dungeonMjRules151==="function"?dungeonMjRules151:null);
    const resolver=typeof R.resolveReadable==="function"?R.resolveReadable:(typeof resolveReadable==="function"?resolveReadable:null);
    const popup=typeof R.showAiPopup==="function"?R.showAiPopup:(typeof showAiPopup==="function"?showAiPopup:null);
    const advance=()=>{metrics.aiAdvances++;turn.aiBusy=false;try{R.dungeonAdvanceTurn156?.()}catch(e){console.warn("AI advance 102.6",e)}};
    if(!load||!defFn||!skillsFn||!targetFn||!resolver){return old.apply(this,arguments)}
    const inst=(load()||[]).find(e=>String(e.id)===String(actor.id));if(!inst){advance();return}
    const def=defFn(inst.enemyId),skills=skillsFn(def)||[];if(!def||!skills.length){advance();return}
    const target=targetFn();if(!target){if(!globalCheckGameOver())advance();return}
    const rules=rulesFn?.()||{};let skill=skills[0];
    if(rules.aiTactics==="advanced")skill=[...skills].sort((a,b)=>(Number(b.power||b.damage||0))-(Number(a.power||a.damage||0)))[0]||skill;
    else if(rules.aiTactics==="standard")skill=skills[Math.floor(Math.random()*skills.length)]||skill;
    turn.aiBusy=true;metrics.aiRuns++;
    setTimeout(()=>{
      try{
        const res=resolver(inst,def,skill,target),enemyName=def.name||"Ennemi",targetName=heroLabel(target);
        R.dungeonAiLast023={enemy:enemyName,target:targetName,...res,at:Date.now()};
        try{popup?.(enemyName,targetName,res)}catch(e){}
        queueHeavyRenders(null,typeof R.renderDungeonCombatRound==="function"?R.renderDungeonCombatRound:null);
        setTimeout(()=>{
          try{D?.getElementById?.("dc032AiPopup")?.classList?.remove("open")}catch(e){}
          if(globalCheckGameOver()){turn.aiBusy=false;return}
          advance();
        },AI_RESULT_MS);
      }catch(e){
        console.warn("AI fast runner 102.6",e);
        try{D?.getElementById?.("dc032AiPopup")?.classList?.remove("open")}catch(_){}
        setTimeout(advance,80);
      }
    },AI_START_MS);
  };
  fast.__gensRoot1026Ai=true;fast.__original=old;R.dungeonRunAi156=fast;return true
}
function installImmediateAiKick(){
  const old=R.dungeonAdvanceTurn156;if(typeof old!=="function"||old.__gensRoot1026Advance)return false;
  const wrapped=function(){
    const out=old.apply(this,arguments);
    setTimeout(()=>{
      try{
        const cur=typeof R.dungeonCurrentTurn156==="function"?R.dungeonCurrentTurn156():null;
        if(cur?.kind==="enemy"&&R.dungeonTurn156?.active&&!R.dungeonTurn156.aiBusy){metrics.aiKicks++;R.dungeonRunAi156?.(cur)}
      }catch(e){}
    },AI_KICK_MS);
    return out
  };
  wrapped.__gensRoot1026Advance=true;wrapped.__original=old;R.dungeonAdvanceTurn156=wrapped;return true
}

function install(){
  wrapValue("dungeonEquipmentBonus",valueCaches.equipment,"equipmentHits","equipmentMisses");
  wrapValue("dungeonAttributeValue",valueCaches.attribute,"attributeHits","attributeMisses");
  wrapCanonical();wrapEnemy();installStatInvalidators();
  wrapDamageResolution("applyDungeonAttackDamage");wrapDamageResolution("applyBossAttackDamage");
  installFastAiRunner();installImmediateAiKick();
  if(D){R.animateDice=animateDiceFast;R.animateRpgDice=animateRpgDiceFast}
  return true
}
function reinstall(){install();setTimeout(install,250);setTimeout(install,1200)}
R.GensMobileCombatPerformance16781022={VERSION,APP_VERSION,D6_MS,D100_MS,WATCHDOG_MS,REEL_STEPS,AI_START_MS,AI_RESULT_MS,AI_KICK_MS,clear,install,makeReel,animateDiceFast,animateRpgDiceFast,metrics:()=>({...metrics})};
reinstall();
})();
