/* GenSrpG architecture bootstrap V1 — extracted runtime loader.
   The native index.html changeXP() function owns manual hero-sheet XP again.
   Tactical internal composition is owned by assets/gensrpg/tactical/entry-v1.js. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.3.0",APP_VERSION="16.78.114.11-phase8-tactical-entry";
const files=[
  "assets/gensrpg/tactical/entry-v1.js",
];
let installed=false;
function load(i){
  if(i>=files.length)return;
  const s=D.createElement("script");
  s.src=files[i]+"?v=1";
  s.async=false;
  s.onload=()=>load(i+1);
  s.onerror=()=>{console.error("GenSrpG RuntimeBootstrap V1 load failed",files[i]);load(i+1)};
  (D.head||D.documentElement).appendChild(s);
}
function install(){
  if(!D||!(D.head||D.documentElement))return false;
  if(installed)return true;
  installed=true;
  load(0);
  return true;
}
R.GensRuntimeBootstrapV1={VERSION,APP_VERSION,files:[...files],install};
install();
})();
