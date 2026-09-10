/* GenSrpG V16.78.112 — smooth mobile dice reel animation.
   Replaces low-frequency numeric DOM ticks with a compositor-driven reel.
   One bounded completion timer, no interval, no per-frame JS, no gameplay math change. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="5.0.0",APP_VERSION="16.78.112";
const D6_MS=440,D100_MS=420,CALLBACK_DELAY=8,WATCHDOG_MS=650,REEL_STEPS=11;
function once(fn){let done=false;return function(){if(done)return;done=true;return typeof fn==="function"?fn.apply(this,arguments):undefined}}
function safeVibrate(){try{if(R.navigator?.vibrate)R.navigator.vibrate(10)}catch(e){}}
function randomFace(max){return 1+Math.floor(Math.random()*Math.max(1,Number(max)||1))}
function finishTimer(finish,delay){const guarded=once(finish);const main=setTimeout(guarded,delay);const watchdog=setTimeout(guarded,WATCHDOG_MS);return ()=>{clearTimeout(main);clearTimeout(watchdog);guarded()}}
function makeReel(max,finalValue,lineHeight,fontSize,width){
 const win=D.createElement("div"),track=D.createElement("div");
 win.className="gensDiceReelWindow";track.className="gensDiceReelTrack";
 win.style.height=lineHeight+"px";win.style.lineHeight=lineHeight+"px";win.style.overflow="hidden";win.style.width=width;win.style.margin="0 auto";win.style.position="relative";
 track.style.willChange="transform";track.style.transform="translate3d(0,0,0)";track.style.fontWeight="900";track.style.fontSize=fontSize+"px";track.style.textAlign="center";
 const values=[];for(let i=0;i<REEL_STEPS-1;i++)values.push(randomFace(max));values.push(Math.max(1,Math.min(max,Number(finalValue)||1)));
 for(const value of values){const row=D.createElement("div");row.textContent=String(value);row.style.height=lineHeight+"px";row.style.lineHeight=lineHeight+"px";track.appendChild(row)}
 win.appendChild(track);return {win,track,values,lineHeight,finalValue:values[values.length-1]};
}
function animateTrack(track,lineHeight,steps,duration,delay=0){
 const y=-Math.max(0,steps-1)*lineHeight;
 try{if(typeof track?.animate==="function"){track.animate([{transform:"translate3d(0,0,0)"},{transform:"translate3d(0,"+y+"px,0)"}],{duration,delay,easing:"cubic-bezier(.12,.72,.18,1)",fill:"forwards"});return true}}catch(e){}
 try{track.style.transition="transform "+duration+"ms cubic-bezier(.12,.72,.18,1)";setTimeout(()=>{track.style.transform="translate3d(0,"+y+"px,0)"},Math.max(0,delay));return true}catch(e){return false}
}
function animateCard(el,duration,delay=0){
 try{if(typeof el?.animate==="function"){el.animate([{transform:"translate3d(0,4px,0) rotate(-3deg) scale(.96)"},{transform:"translate3d(0,-4px,0) rotate(3deg) scale(1.03)",offset:.52},{transform:"translate3d(0,0,0) rotate(0deg) scale(1)"}],{duration,delay,easing:"ease-out"});return true}}catch(e){}return false;
}
function animateDiceFast(containerId,count,finalRolls,threshold,onDone){
 const box=D?.getElementById?.(containerId);if(!box){if(onDone)setTimeout(onDone,0);return false}
 const n=Math.max(0,Number(count)||0),frag=D.createDocumentFragment(),dice=[];
 for(let i=0;i<n;i++){
  const finalValue=Number(finalRolls?.[i])||1,d=D.createElement("div");d.className="die rolling";d.dataset.value="rolling";
  const reel=makeReel(6,finalValue,34,25,"2.2em");d.appendChild(reel.win);frag.appendChild(d);dice.push({el:d,...reel,threshold:Math.max(1,Number(threshold)||1)});
 }
 box.replaceChildren(frag);
 dice.forEach((rec,i)=>{const delay=Math.min(i*12,48);animateTrack(rec.track,rec.lineHeight,rec.values.length,D6_MS,delay);animateCard(rec.el,D6_MS,delay)});
 const finish=()=>{for(const rec of dice){const ok=rec.finalValue>=rec.threshold;rec.el.className="die finalPop "+(ok?"success":"fail");rec.el.dataset.value=String(rec.finalValue);rec.el.textContent=String(rec.finalValue)}safeVibrate();if(onDone)setTimeout(onDone,CALLBACK_DELAY)};
 finishTimer(finish,D6_MS+50);return true;
}
function animateRpgDiceFast(containerId,count,finalRolls,threshold,sides,onDone){
 const box=D?.getElementById?.(containerId);if(!box){if(onDone)setTimeout(onDone,0);return false}
 box.style.display="flex";box.style.flexWrap="wrap";box.style.gap="10px";box.style.justifyContent="center";box.style.alignItems="center";box.style.minHeight="86px";
 const n=Math.max(0,Number(count)||0),max=Math.max(6,Math.min(100,Number(sides)||100)),target=Math.max(1,Math.min(max,Number(threshold)||1));
 const frag=D.createDocumentFragment(),cards=[];
 for(let i=0;i<n;i++){
  const finalValue=Number(finalRolls?.[i])||1,d=D.createElement("div");d.className="rpgD100Card rolling";
  const l=D.createElement("div");l.className="rpgD100Label";l.textContent="D"+max;
  const reel=makeReel(max,finalValue,38,29,"2.5em");
  const t=D.createElement("div");t.className="rpgD100Target";t.textContent="Objectif : "+target+" ou plus";
  d.append(l,reel.win,t);frag.appendChild(d);cards.push({el:d,target:t,...reel});
 }
 box.replaceChildren(frag);
 cards.forEach((c,i)=>{const delay=Math.min(i*10,40);animateTrack(c.track,c.lineHeight,c.values.length,D100_MS,delay);animateCard(c.el,D100_MS,delay)});
 const finish=()=>{for(const c of cards){const ok=c.finalValue>=target;c.el.className="rpgD100Card "+(ok?"success":"fail");const l=c.el.querySelector?.(".rpgD100Label")||null;c.el.replaceChildren();if(l)c.el.appendChild(l);const v=D.createElement("div");v.className="rpgD100Value";v.textContent=String(c.finalValue);const t=D.createElement("div");t.className="rpgD100Target";t.textContent=ok?"✅ RÉUSSITE · "+c.finalValue+" ≥ "+target:"❌ ÉCHEC · "+c.finalValue+" < "+target;c.el.append(v,t)}safeVibrate();if(onDone)setTimeout(onDone,CALLBACK_DELAY)};
 finishTimer(finish,D100_MS+45);return true;
}
function install(){if(!D)return false;R.animateDice=animateDiceFast;R.animateRpgDice=animateRpgDiceFast;return true}
R.GensDicePerformance1678108={VERSION,APP_VERSION,D6_MS,D100_MS,CALLBACK_DELAY,WATCHDOG_MS,REEL_STEPS,makeReel,animateTrack,animateDiceFast,animateRpgDiceFast,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
