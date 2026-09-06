/* GenSrpG Dungeon — tactical grid display recovery 16.78.56.
   Removes the obsolete cache UX render wrapper if it is still live in memory,
   then forces one normal Dungeon render. Never edits grid CSS itself. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.78.56";
let installed=false;
function unwrap(name){const core=ROOT.DungeonCore01,fn=core?.[name];if(typeof fn!=="function")return false;if(fn.__cacheUx167853&&typeof fn.__cacheUxOriginal==="function"){core[name]=fn.__cacheUxOriginal;return true}return false}
function recover(){const changed=unwrap("render")|unwrap("show");try{ROOT.DungeonCore01?.render?.()}catch(e){}try{ROOT.DungeonZoneLinks167846?.paintTravelButtons?.()}catch(e){}try{ROOT.DungeonAuthoredRuntime167839?.syncActionButton?.()}catch(e){}return !!changed}
function install(){if(installed)return true;installed=true;for(const ms of [0,20,100,300])setTimeout(recover,ms);return true}
ROOT.DungeonGridDisplayRecovery167856={VERSION,APP_VERSION,unwrap,recover,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}
})();
