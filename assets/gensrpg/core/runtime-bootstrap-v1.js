/* GenSrpG architecture bootstrap V1 — extracted from the mobile performance layer.
   Transitional owner of extracted runtime modules + Tactical V2 + Survival isolation.
   Preserves the historical Tactical load order and retry timings while responsibilities
   progressively leave the monolithic index.html. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.1.0",APP_VERSION="16.78.114.11-architecture-bootstrap-2";
const PROGRESSION_SRC="assets/gensrpg/dungeon/progression-runtime-v1.js";
const files=[
  "assets/gensrpg/gens-rpg-tactical-combat-v2.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js",
  "assets/gensrpg/gens-survival-mode-isolation-1678104.js"
];
function finalize(){
  const apply=()=>{try{R.GensSurvivalModeIsolation1678104?.install?.();R.GensRpgTacticalCombatV2Bridge?.install?.(R)}catch(e){console.error("GenSrpG RuntimeBootstrap V1 install",e)}};
  apply();setTimeout(apply,250);setTimeout(apply,1200);setTimeout(apply,3000);
}
function load(i){
  if(i>=files.length){finalize();return}
  const s=D.createElement("script");
  s.src=files[i]+"?v=16.78.105";
  s.async=false;
  s.onload=()=>load(i+1);
  s.onerror=()=>{console.error("GenSrpG RuntimeBootstrap V1 load failed",files[i]);load(i+1)};
  (D.head||D.documentElement).appendChild(s);
}
function loadProgression(next){
  const done=()=>{if(typeof next==="function")next()};
  if(R.GensRpgProgressionRuntimeV1){try{R.GensRpgProgressionRuntimeV1.install?.(R)}catch(e){console.error("GenSrpG progression prerequisite install",e)}done();return true}
  const s=D.createElement("script");
  s.src=PROGRESSION_SRC+"?v=16.78.114.11";
  s.async=false;
  s.onload=done;
  s.onerror=()=>{console.error("GenSrpG progression prerequisite load failed",PROGRESSION_SRC);done()};
  (D.head||D.documentElement).appendChild(s);
  return true;
}
function install(){
  if(!D||!(D.head||D.documentElement))return false;
  if(R.__gensTacticalV2Loader105)return true;
  R.__gensTacticalV2Loader105=true;
  loadProgression(()=>load(0));
  return true;
}
R.GensRuntimeBootstrapV1={VERSION,APP_VERSION,PROGRESSION_SRC,files:[...files],install,finalize,loadProgression};
install();
})();
