/* GenSrpG architecture bootstrap V1 — extracted runtime loader.
   The native index.html changeXP() function owns manual hero-sheet XP again.
   This bootstrap must not replace that owner with progression-runtime-v1. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.2.0",APP_VERSION="16.78.114.11-architecture-bootstrap-3";
const files=[
  "assets/gensrpg/gens-rpg-tactical-combat-v2.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js",
];
function finalize(){
  const apply=()=>{try{R.GensRpgTacticalCombatV2Bridge?.install?.(R)}catch(e){console.error("GenSrpG RuntimeBootstrap V1 install",e)}};
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
function install(){
  if(!D||!(D.head||D.documentElement))return false;
  if(R.__gensTacticalV2Loader105)return true;
  R.__gensTacticalV2Loader105=true;
  load(0);
  return true;
}
R.GensRuntimeBootstrapV1={VERSION,APP_VERSION,files:[...files],install,finalize};
install();
})();
