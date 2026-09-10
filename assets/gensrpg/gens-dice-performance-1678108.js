/* GenSrpG V16.78.108 — mobile-safe dice animation.
   Replaces high-frequency DOM churn with one short visual phase and a bounded callback.
   Combat math/results are untouched: only presentation timing is changed. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.78.108";
const D6_MS=420,D100_MS=380,CALLBACK_DELAY=70,WATCHDOG_MS=900;
let installed=false;
function once(fn){let done=false;return function(){if(done)return;done=true;if(typeof fn==="function")fn.apply(this,arguments)}}
function finishWithin(fn,delay){const done=once(fn);const main=setTimeout(done,Math.max(0,Number(delay)||0));const watchdog=setTimeout(done,WATCHDOG_MS);return {main,watchdog,done}}
function safeVibrate(){try{if(R.navigator?.vibrate)R.navigator.vibrate(18)}catch(e){}}
function numericDie(finalValue,threshold){const d=D.createElement("div");d.className="die rolling";d.dataset.value="";const span=D.createElement("span");const text=D.createTextNode("?");span.appendChild(text);d.appendChild(span);return {el:d,text,finalValue:Number(finalValue)||1,threshold:Number(threshold)||1}}
function animateDiceFast(containerId,count,finalRolls,threshold,onDone){
 const box=D?.getElementById?.(containerId);if(!box){if(onDone)setTimeout(onDone,0);return}
 const n=Math.max(0,Number(count)||0),frag=D.createDocumentFragment(),dice=[];
 for(let i=0;i<n;i++){const rec=numericDie(finalRolls?.[i],threshold);dice.push(rec);frag.appendChild(rec.el)}
 box.replaceChildren(frag);
 const finish=()=>{for(const rec of dice){rec.el.className="die finalPop "+(rec.finalValue>=rec.threshold?"success":"fail");rec.el.dataset.value=String(rec.finalValue);rec.text.nodeValue=String(rec.finalValue)}safeVibrate();if(onDone)setTimeout(onDone,CALLBACK_DELAY)};
 const guarded=once(finish);setTimeout(guarded,D6_MS);setTimeout(guarded,WATCHDOG_MS);return true;
}
function animateRpgDiceFast(containerId,count,finalRolls,threshold,sides,onDone){
 const box=D?.getElementById?.(containerId);if(!box){if(onDone)setTimeout(onDone,0);return}
 box.style.display="flex";box.style.flexWrap="wrap";box.style.gap="10px";box.style.justifyContent="center";box.style.alignItems="center";box.style.minHeight="86px";
 const n=Math.max(0,Number(count)||0),max=Math.max(6,Math.min(100,Number(sides)||100)),target=Math.max(1,Math.min(max,Number(threshold)||1));
 const frag=D.createDocumentFragment(),cards=[];
 for(let i=0;i<n;i++){const d=D.createElement("div");d.className="rpgD100Card";const l=D.createElement("div");l.className="rpgD100Label";l.textContent="D"+max;const v=D.createElement("div");v.className="rpgD100Value";const vt=D.createTextNode("…");v.appendChild(vt);const t=D.createElement("div");t.className="rpgD100Target";const tt=D.createTextNode("Objectif : "+target+" ou plus");t.appendChild(tt);d.append(l,v,t);frag.appendChild(d);cards.push({el:d,valueText:vt,targetText:tt,finalValue:Number(finalRolls?.[i])||1})}
 box.replaceChildren(frag);
 const finish=()=>{for(const c of cards){const ok=c.finalValue>=target;c.el.className="rpgD100Card "+(ok?"success":"fail");c.valueText.nodeValue=String(c.finalValue);c.targetText.nodeValue=ok?"✅ RÉUSSITE · "+c.finalValue+" ≥ "+target:"❌ ÉCHEC · "+c.finalValue+" < "+target}safeVibrate();if(onDone)setTimeout(onDone,CALLBACK_DELAY)};
 const guarded=once(finish);setTimeout(guarded,D100_MS);setTimeout(guarded,WATCHDOG_MS);return true;
}
function install(){
 if(!D)return false;
 R.animateDice=animateDiceFast;R.animateRpgDice=animateRpgDiceFast;installed=true;return true;
}
function keepInstalled(){install();let tries=0;const retry=()=>{if(R.animateDice!==animateDiceFast||R.animateRpgDice!==animateRpgDiceFast)install();if(tries++<80)setTimeout(retry,100)};setTimeout(retry,0)}
R.GensDicePerformance1678108={VERSION,APP_VERSION,D6_MS,D100_MS,CALLBACK_DELAY,WATCHDOG_MS,animateDiceFast,animateRpgDiceFast,install,keepInstalled};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",keepInstalled,{once:true}):keepInstalled()}
})();
