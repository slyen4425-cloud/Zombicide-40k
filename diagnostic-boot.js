/* GenSrpG opt-in Chrome mobile incident journal. Dedicated test page only.
 * Does not read saves or inject new module owners into game runtime.
 */
(function(){
"use strict";
const KEY="gensrpg_mobile_diag_v1";
const HISTORY_KEY="gensrpg_mobile_diag_history_v2",STAGE_KEY="gensrpg_mobile_diag_script_stage_v2";
const MAX_EVENTS=120,MAX_BYTES=45000;
const now=()=>new Date().toISOString();
const perf=()=>Math.round(performance.now());
function clean(input){
  let s=String(input==null?"":input);
  s=s.replace(/https?:\/\/[^\s"'<>]+/g,function(u){try{const v=new URL(u);return v.origin+v.pathname}catch(_){return "[url]"}});
  s=s.replace(/(?:token|apikey|password|secret|authorization|email|session)[=:]\s*[^\s,;]+/gi,"[private]");
  return s.slice(0,180);
}
let state;
try{
  const before=localStorage.getItem(KEY);
  const old=before?JSON.parse(before):null;
  const manualStart=sessionStorage.getItem("__gensDiagManualStart")==="1";
  sessionStorage.removeItem("__gensDiagManualStart");
  const recent=old&&old.version===1&&old.startedAt&&(Date.now()-new Date(old.startedAt).getTime()<1800000);
  if(recent&&!manualStart){
    state=old;
    state.ended=false;
    state.bootCount=(state.bootCount||1)+1;
  }else{
    // Keep prior diagnostics, including an unfinished crash, even when a new
    // test is explicitly launched. Never touch other localStorage keys.
    if(old&&old.events&&old.events.length){
      try{
        const saved=JSON.parse(localStorage.getItem(HISTORY_KEY)||"[]");
        const priorStage=JSON.parse(localStorage.getItem(STAGE_KEY)||"null");
        saved.unshift({log:old,stage:priorStage&&priorStage.session===old.id?priorStage:null});
        localStorage.setItem(HISTORY_KEY,JSON.stringify(saved.slice(0,3)));
      }catch(_){}
    }
    state={version:1,startedAt:now(),lastPulse:null,ended:false,origin:"diagnostic.html",id:Date.now().toString(36),agent:clean(navigator.userAgent),previousUnfinished:!!(old&&!old.ended),bootCount:1,events:[]};
  }
  localStorage.setItem(KEY,JSON.stringify(state));
}catch(_){
  state={version:1,startedAt:now(),ended:false,events:[],storageUnavailable:true};
}
let lastSave=0,active=true,frames=0,prevFrame=performance.now(),maxFrameGap=0;
function persist(force){
  if(!state)return;
  const t=performance.now();
  if(!force&&t-lastSave<300)return;
  lastSave=t;
  try{
    let v=JSON.stringify(state);
    while(v.length>MAX_BYTES&&state.events.length>10){state.events.shift();v=JSON.stringify(state)}
    localStorage.setItem(KEY,v);
  }catch(_){}
}
function rec(type,data,important){
  const e={at:now(),ms:perf(),type};
  if(data)for(const key of Object.keys(data))e[key]=typeof data[key]==="number"?data[key]:clean(data[key]);
  state.events.push(e);
  if(state.events.length>MAX_EVENTS)state.events.shift();
  persist(!!important);
}
const target=e=>{
  const node=e&&e.target;
  if(!node||!node.tagName)return "unknown";
  const tag=String(node.tagName).toLowerCase();
  if(/^(input|textarea|select)$/.test(tag))return tag;
  return clean(tag+(node.id?"#"+node.id:"")+(typeof node.className==="string"?"."+node.className.trim().replace(/\s+/g,".").slice(0,50):""));
};
rec(state.bootCount>1?"boot-again":"start",{ready:document.readyState,bootCount:state.bootCount||1},true);
window.addEventListener("error",e=>{
  if(e.target&&e.target!==window){const el=e.target;rec("resource-error",{tag:el.tagName||"",path:(()=>{try{return new URL(el.src||el.href||"",location.href).pathname}catch(_){return ""}})()},true)}
  else rec("javascript-error",{message:e.message||"unknown",file:(()=>{try{return new URL(e.filename||"",location.href).pathname}catch(_){return ""}})(),line:e.lineno||0,col:e.colno||0},true)
},true);
window.addEventListener("unhandledrejection",e=>rec("promise-error",{reason:(e.reason&&e.reason.message)||e.reason||"unknown"},true));
document.addEventListener("DOMContentLoaded",()=>rec("dom-ready",{elements:document.querySelectorAll("*").length},true),{once:true});
window.addEventListener("load",()=>rec("loaded",{elements:document.querySelectorAll("*").length},true),{once:true});
let pointerCount=0;
window.addEventListener("pointerdown",e=>{pointerCount++;rec("pointer",{target:target(e),count:pointerCount},true)},true);
window.addEventListener("click",e=>rec("click",{target:target(e),count:pointerCount},true),true);
window.addEventListener("pagehide",e=>{state.ended=true;rec("pagehide",{persisted:!!e.persisted},true);active=false},{once:true});
window.addEventListener("visibilitychange",()=>rec("visibility",{state:document.visibilityState},true));
try{
  const observer=new PerformanceObserver(list=>{for(const x of list.getEntries()){if(x.duration>=180)rec("long-task",{duration:Math.round(x.duration)},true)}});
  observer.observe({entryTypes:["longtask"]});
}catch(_){}
function frame(t){if(!active)return;frames++;const gap=t-prevFrame;prevFrame=t;if(gap>maxFrameGap)maxFrameGap=gap;requestAnimationFrame(frame)}
requestAnimationFrame(frame);
setInterval(()=>{
  if(!active)return;
  const m=performance.memory;
  state.lastPulse=now();
  rec("pulse",{frames:frames,maxFrameGap:Math.round(maxFrameGap),elements:document.querySelectorAll("*").length,heapMb:m?Math.round(m.usedJSHeapSize/1048576):"n/a",visibility:document.visibilityState},true);
  frames=0;maxFrameGap=0;
},2500);
try{
  if("serviceWorker" in navigator){
    navigator.serviceWorker.getRegistration().then(reg=>rec("service-worker",{active:!!reg?.active,controller:!!navigator.serviceWorker.controller},true)).catch(()=>{});
  }
}catch(_){}
function markScript(phase,index,source){
  // Dedicated tiny synchronous breadcrumb: survives a parser-blocking script
  // where neither click listeners nor long-task observers can run.
  try{
    localStorage.setItem(STAGE_KEY,JSON.stringify({
      session:state.id,at:now(),ms:perf(),phase:phase==="after"?"after":"before",
      script:index,source:clean(source||"inline")
    }));
  }catch(_){}
}
const diagEventCounts=Object.create(null);
function logBounded(type){
  const count=(diagEventCounts[type]||0)+1;diagEventCounts[type]=count;
  if(count<=3||count===10||count===50||count===100||count===500||count===1000)rec(type,{count},true);
}
window.__gensMobileDiagV1={version:3,log:rec,logBounded,markScript,read:()=>JSON.parse(JSON.stringify(state))};
})();
