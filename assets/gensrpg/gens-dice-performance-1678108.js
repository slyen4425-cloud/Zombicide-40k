/* GenSrpG V16.78.110 — mobile-safe visible dice animation.
   Keeps a real numeric die visible during the roll, uses compositor-only motion,
   and performs a single DOM finalisation. No per-frame JS or interval churn. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="3.0.0",APP_VERSION="16.78.110";
const D6_MS=520,D100_MS=500,CALLBACK_DELAY=35,WATCHDOG_MS=850;
function once(fn){let done=false;return function(){if(done)return;done=true;return typeof fn==="function"?fn.apply(this,arguments):undefined}}
function safeVibrate(){try{if(R.navigator?.vibrate)R.navigator.vibrate(12)}catch(e){}}
function randomFace(max){return 1+Math.floor(Math.random()*Math.max(1,Number(max)||1))}
function animateNode(el,frames,duration,delay=0){
 try{if(typeof el?.animate==="function"){el.animate(frames,{duration,delay,easing:"cubic-bezier(.18,.78,.22,1)",fill:"none"});return true}}catch(e){}
 try{el.style.transition="transform "+duration+"ms cubic-bezier(.18,.78,.22,1), opacity "+duration+"ms ease";el.style.transform="translateY(-6px) rotate(18deg) scale(1.08)";el.style.opacity=".78";setTimeout(()=>{el.style.transform="translateY(0) rotate(0deg) scale(1)";el.style.opacity="1"},Math.max(16,delay+45));return true}catch(e){return false}
}
function numericDie(finalValue,threshold){const d=D.createElement("div");d.className="die rolling";d.dataset.value="rolling";const span=D.createElement("span");span.textContent=String(randomFace(6));d.appendChild(span);return {el:d,text:span,finalValue:Number(finalValue)||1,threshold:Number(threshold)||1}}
function finishTimer(finish,delay){const guarded=once(finish);const main=setTimeout(guarded,delay);const watchdog=setTimeout(guarded,WATCHDOG_MS);return ()=>{clearTimeout(main);clearTimeout(watchdog);guarded()}}
function animateDiceFast(containerId,count,finalRolls,threshold,onDone){
 const box=D?.getElementById?.(containerId);if(!box){if(onDone)setTimeout(onDone,0);return false}
 const n=Math.max(0,Number(count)||0),frag=D.createDocumentFragment(),dice=[];
 for(let i=0;i<n;i++){const rec=numericDie(finalRolls?.[i],threshold);dice.push(rec);frag.appendChild(rec.el)}
 box.replaceChildren(frag);
 dice.forEach((rec,i)=>animateNode(rec.el,[{transform:"translate3d(0,8px,0) rotate(-24deg) scale(.88)",opacity:.68},{transform:"translate3d(0,-10px,0) rotate(22deg) scale(1.12)",opacity:1,offset:.5},{transform:"translate3d(0,0,0) rotate(0deg) scale(1)",opacity:1}],D6_MS,Math.min(i*16,64)));
 const finish=()=>{for(const rec of dice){rec.el.className="die finalPop "+(rec.finalValue>=rec.threshold?"success":"fail");rec.el.dataset.value=String(rec.finalValue);rec.text.textContent=String(rec.finalValue);rec.el.style.transform="";rec.el.style.opacity=""}safeVibrate();if(onDone)setTimeout(onDone,CALLBACK_DELAY)};
 finishTimer(finish,D6_MS);return true;
}
function animateRpgDiceFast(containerId,count,finalRolls,threshold,sides,onDone){
 const box=D?.getElementById?.(containerId);if(!box){if(onDone)setTimeout(onDone,0);return false}
 box.style.display="flex";box.style.flexWrap="wrap";box.style.gap="10px";box.style.justifyContent="center";box.style.alignItems="center";box.style.minHeight="86px";
 const n=Math.max(0,Number(count)||0),max=Math.max(6,Math.min(100,Number(sides)||100)),target=Math.max(1,Math.min(max,Number(threshold)||1));
 const frag=D.createDocumentFragment(),cards=[];
 for(let i=0;i<n;i++){const d=D.createElement("div");d.className="rpgD100Card rolling";const l=D.createElement("div");l.className="rpgD100Label";l.textContent="D"+max;const v=D.createElement("div");v.className="rpgD100Value";v.textContent=String(randomFace(max));const t=D.createElement("div");t.className="rpgD100Target";t.textContent="Objectif : "+target+" ou plus";d.append(l,v,t);frag.appendChild(d);cards.push({el:d,value:v,target:t,finalValue:Number(finalRolls?.[i])||1})}
 box.replaceChildren(frag);
 cards.forEach((c,i)=>animateNode(c.el,[{transform:"translate3d(0,7px,0) rotate(-5deg) scale(.9)",opacity:.68},{transform:"translate3d(0,-8px,0) rotate(5deg) scale(1.08)",opacity:1,offset:.5},{transform:"translate3d(0,0,0) rotate(0deg) scale(1)",opacity:1}],D100_MS,Math.min(i*14,56)));
 const finish=()=>{for(const c of cards){const ok=c.finalValue>=target;c.el.className="rpgD100Card "+(ok?"success":"fail");c.value.textContent=String(c.finalValue);c.target.textContent=ok?"✅ RÉUSSITE · "+c.finalValue+" ≥ "+target:"❌ ÉCHEC · "+c.finalValue+" < "+target;c.el.style.transform="";c.el.style.opacity=""}safeVibrate();if(onDone)setTimeout(onDone,CALLBACK_DELAY)};
 finishTimer(finish,D100_MS);return true;
}
function install(){if(!D)return false;R.animateDice=animateDiceFast;R.animateRpgDice=animateRpgDiceFast;return true}
R.GensDicePerformance1678108={VERSION,APP_VERSION,D6_MS,D100_MS,CALLBACK_DELAY,WATCHDOG_MS,animateNode,animateDiceFast,animateRpgDiceFast,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
