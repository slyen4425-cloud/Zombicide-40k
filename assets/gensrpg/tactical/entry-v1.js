(function(root){
"use strict";
const R=root||globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.2.0",APP_VERSION="16.78.114.11-phase8-session-teardown";
const detectionFile="assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js";
const facadeFile="assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js";
const privateFiles=[
  "assets/gensrpg/gens-rpg-tactical-combat-v2.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js",
];
const files=[detectionFile,...privateFiles,facadeFile];
let installed=false,facadeLoading=false,facadeReady=!!R.GensRpgTacticalCombatV2Bridge;
let detectionLoading=false,detectionReady=!!R.GensRpgTacticalRuntimeAuthority1678113;
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
  try{R.GensRpgTacticalCombatV2Ui?.installGlobalPolish?.()}catch(e){console.error("GenSrpG Tactical V1 UI install",e)}
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
  const warm=!!(R.GensRpgTacticalCombatV2&&R.GensRpgTacticalCombatV2Adapter&&R.GensRpgTacticalCombatV2Ui&&R.GensRpgTacticalCombatV2Bridge&&R.GensRpgTacticalCompatibilityChainPhase8);
  if(warm){baseLoaded();return true}
  loadPrivate(0);
  return true;
}
function deactivate(){
  try{R.GensRpgTacticalCompatibilityChainPhase8?.deactivate?.(R)}catch(e){console.error("GenSrpG Tactical V1 compatibility teardown",e)}
  try{R.GensRpgTacticalCombatV2Bridge?.dispose?.(R)}catch(e){console.error("GenSrpG Tactical V1 Bridge teardown",e)}
  try{R.GensRpgTacticalCombatV2Ui?.dispose?.(R)}catch(e){console.error("GenSrpG Tactical V1 UI teardown",e)}
  activating=false;active=false;baseReady=false;compatibilityDone=false;compatibilityOk=false;bridgeInstalled=false;readyQueue=[];
  R.__gensTacticalV2Loader105=false;
  // The private Tactical session is torn down; Dungeon still needs its one
  // V113 encounter detector before the next encounter can begin.
  ensureDetection();
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
// Detection must be ready *before* a Dungeon encounter can activate Tactical.
// It is the SAME V113 owner that the private compatibility chain uses later;
// the rest of Tactical (engine, UI, dice) remains lazy.
function ensureDetection(){
  const owner=R.GensRpgTacticalRuntimeAuthority1678113;
  if(owner){
    try{owner.install?.(R);detectionReady=true}catch(e){detectionReady=false;console.error("GenSrpG Tactical V113 detection install",e)}
    return loadFacade();
  }
  if(detectionLoading)return true;
  if(!D||!(D.head||D.documentElement))return false;
  detectionLoading=true;
  const script=D.createElement("script");script.src=detectionFile+"?v=16.78.114.10";script.async=false;
  script.onload=()=>{
    detectionLoading=false;
    try{
      const api=R.GensRpgTacticalRuntimeAuthority1678113;
      detectionReady=!!api;
      api?.install?.(R);
      if(!api)console.error("GenSrpG Tactical V113 detection owner missing after load");
    }catch(e){detectionReady=false;console.error("GenSrpG Tactical V113 detection install",e)}
    loadFacade();
  };
  script.onerror=()=>{detectionLoading=false;detectionReady=false;console.error("GenSrpG Tactical V113 detection owner failed to load");loadFacade()};
  (D.head||D.documentElement).appendChild(script);
  return true;
}
function install(){
  if(installed)return true;
  if(!D||!(D.head||D.documentElement))return false;
  installed=true;
  return ensureDetection();
}
function status(){return {installed,detectionReady:detectionReady||!!R.GensRpgTacticalRuntimeAuthority1678113,facadeReady:facadeReady||!!R.GensRpgTacticalCombatV2Bridge,activating,active,baseReady,compatibilityDone,bridgeInstalled}}
R.GensTacticalV1=Object.freeze({VERSION,APP_VERSION,files:[...files],privateFiles:[...privateFiles],detectionFile,facadeFile,install,activate,deactivate,dispose:deactivate,compatibilityReady,finalize:finishIfReady,status});
install();
})(typeof globalThis!=="undefined"?globalThis:this);