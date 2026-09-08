/* GenSrpG V16.78.89 — custom stats use the active RPG profile during gameplay.
   Tiny compatibility bridge: no new stat storage, no new effect engine, no movement/spawn/timeline hooks. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis,D=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.78.89";
function editorOpen(){try{return D?.getElementById("rpgUniverseEditorModal")?.style?.display==="block"}catch(e){return false}}
function activeProfile(){try{return R.getActiveGameProfile?.()||null}catch(e){return null}}
function patchCanonicalApi(){
  const api=R.GensCustomStats167879;if(!api||api.__gcsRuntimeProfile167889)return false;
  const names=["defs","def","activeIds","isActive","value","setValue","change","syncHero"];
  for(const name of names){
    const old=api[name];if(typeof old!=="function"||old.__gcsRuntimeProfile167889)continue;
    const wrapped=function(){
      if(editorOpen()||typeof R.currentRpgProfile!=="function"||typeof R.getActiveGameProfile!=="function")return old.apply(api,arguments);
      const prior=R.currentRpgProfile;
      try{
        R.currentRpgProfile=function(){return activeProfile()||prior()};
        return old.apply(api,arguments);
      }finally{R.currentRpgProfile=prior}
    };
    wrapped.__gcsRuntimeProfile167889=true;wrapped.__original=old;api[name]=wrapped;
  }
  api.__gcsRuntimeProfile167889=true;return true;
}
function refreshSheet(){try{return R.GensGenericStats167887?.patchSheetTexts?.()||false}catch(e){return false}}
function install(){try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}patchCanonicalApi();refreshSheet();return true}
R.GensCustomStatRuntimeProfile167889={VERSION,APP_VERSION,editorOpen,activeProfile,patchCanonicalApi,refreshSheet,install};
if(D){D.readyState==="loading"?D.addEventListener("DOMContentLoaded",install,{once:true}):install()}
})();
