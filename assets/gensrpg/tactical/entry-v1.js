(function(root){
"use strict";
const R=root||globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.78.114.11-phase8-composition-1";
const files=[
  "assets/gensrpg/gens-rpg-tactical-combat-v2.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js",
  "assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js",
];
function finalize(){
  const apply=()=>{try{R.GensRpgTacticalCombatV2Bridge?.install?.(R)}catch(e){console.error("GenSrpG Tactical V1 install",e)}};
  apply();
}
function load(i){
  if(i>=files.length){finalize();return}
  const s=D.createElement("script");
  s.src=files[i]+"?v=16.78.105";
  s.async=false;
  s.onload=()=>load(i+1);
  s.onerror=()=>{console.error("GenSrpG Tactical V1 load failed",files[i]);load(i+1)};
  (D.head||D.documentElement).appendChild(s);
}
function install(){
  if(!D||!(D.head||D.documentElement))return false;
  if(R.__gensTacticalV2Loader105)return true;
  R.__gensTacticalV2Loader105=true;
  load(0);
  return true;
}
R.GensTacticalV1=Object.freeze({VERSION,APP_VERSION,files:[...files],install,finalize});
install();
})(typeof globalThis!=="undefined"?globalThis:this);
