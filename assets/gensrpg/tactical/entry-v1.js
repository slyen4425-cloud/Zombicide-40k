(function(root){
"use strict";
const R=root||globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.1.0",APP_VERSION="16.78.114.11-phase8-session-activation";
const facadeFile="assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js";
const privateFiles=[
  "assets/gensrpg/gens-rpg-tactical-combat-v2.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js",
];
const files=[...privateFiles,facadeFile];
let installed=false,facadeLoading=false,facadeReady=!!R.GensRpgTacticalCombatV2Bridge;
let activating=false,active=false,baseReady=false,compatibilityDone=false,compatibilityOk=false,bridgeInstalled=false;
let readyQueue=[];

function flushReady(ok){
  const queue=readyQueue;readyQueue=[];
  for(const fn of queue)try{fn(ok!==false)}catch(e){console.error("GenSrpG Tactical V1 ready callback",e)}
}
function finishIfReady(){
  if(!activating||!baseReady||!bridgeInstalled||!compatibilityDone)return false;
  const ok=compatibilityOk!==false;
  active=ok;activating=false;
  flushReady(ok);
  return ok;
}
function compatibilityReady(ok=true){
  compatibilityDone=true;compatibilityOk=ok!==false;
  return finishIfReady();
}
function startCompatibility(){
  const chain=R.GensRpgTacticalCompatibilityChainPhase8;
  if(typeof chain?.activate!=="function")return false;
  try{return chain.activate()!==false}catch(e){console.error("GenSrpG Tactical V1 compatibility activation",e);compatibilityReady(false);return false}
}
function baseLoaded(){
  baseReady=true;
  try{bridgeInstalled=!!R.GensRpgTacticalCombatV2Bridge?.install?.(R)}
  catch(e){bridgeInstalled=false;console.error("GenSrpG Tactical V1 Bridge install",e)}
  if(!bridgeInstalled){compatibilityDone=true;compatibilityOk=false;return finishIfReady()}
  startCompatibility();
  return finishIfReady();
}
function loadPrivate(i){
  if(i>=privateFiles.length){baseLoaded();return}
  const file=privateFiles[i],s=D.createElement("script");
  s.src=file+"?v=16.78.105";
  s.async=false;
  s.onload=()=>loadPrivate(i+1);
  s.onerror=()=>{
    console.error("GenSrpG Tactical V1 private load failed",file);
    if(file==="assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js")compatibilityReady(false);
    loadPrivate(i+1);
  };
  (D.head||D.documentElement).appendChild(s);
}
function activate(onReady){
  if(typeof onReady==="function")readyQueue.push(onReady);
  if(active){flushReady(true);return true}
  if(activating)return true;
  if(!D||!(D.head||D.documentElement)){flushReady(false);return false}
  if(R.__gensTacticalV2Loader105){
    const warm=!!(R.GensRpgTacticalCombatV2&&R.GensRpgTacticalCombatV2Adapter&&R.GensRpgTacticalCombatV2Ui&&R.GensRpgTacticalCombatV2Bridge);
    if(warm){
      try{bridgeInstalled=R.GensRpgTacticalCombatV2Bridge.install?.(R)!==false}catch(e){bridgeInstalled=false}
      active=!!bridgeInstalled;flushReady(active);return active;
    }
    flushReady(false);return false;
  }
  R.__gensTacticalV2Loader105=true;
  activating=true;active=false;baseReady=false;compatibilityDone=false;compatibilityOk=false;bridgeInstalled=false;
  loadPrivate(0);
  return true;
}
function loadFacade(){
  if(facadeReady)return true;
  if(facadeLoading)return true;
  facadeLoading=true;
  const s=D.createElement("script");
  s.src=facadeFile+"?v=16.78.105";
  s.async=false;
  s.onload=()=>{facadeLoading=false;facadeReady=!!R.GensRpgTacticalCombatV2Bridge;if(!facadeReady)console.error("GenSrpG Tactical V1 Bridge facade missing after load")};
  s.onerror=()=>{facadeLoading=false;facadeReady=false;console.error("GenSrpG Tactical V1 Bridge facade load failed")};
  (D.head||D.documentElement).appendChild(s);
  return true;
}
function install(){
  if(installed)return true;
  if(!D||!(D.head||D.documentElement))return false;
  installed=true;
  return loadFacade();
}
function status(){return {installed,facadeReady:facadeReady||!!R.GensRpgTacticalCombatV2Bridge,activating,active,baseReady,compatibilityDone,bridgeInstalled}}
R.GensTacticalV1=Object.freeze({VERSION,APP_VERSION,files:[...files],privateFiles:[...privateFiles],facadeFile,install,activate,compatibilityReady,finalize:finishIfReady,status});
install();
})(typeof globalThis!=="undefined"?globalThis:this);