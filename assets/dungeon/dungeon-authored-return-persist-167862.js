/* GenSrpG Dungeon — authored return spatial persistence 16.78.62.
   Ensures a successful authored enterNode transition persists the final hero position
   before the UI renders. This fixes secondary-cache returns restoring an older doorway cell.
   Does not alter movement allowance, graph routing, room content, combat or grid geometry. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="1.0.0",APP_VERSION="16.78.62";
let retries=0;
function readRt(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function writeRt(x){try{localStorage.setItem(RT_KEY,JSON.stringify(x||{}));return true}catch(e){return false}}
function activeHero(x){const a=Array.isArray(x?.participants)?x.participants:[],i=Math.max(0,Math.min(Math.max(0,a.length-1),Number(x?.index)||0));return String(a[i]||"")}
function persistFinalPosition(){const x=readRt();if(!x?.last?.authoredRuntime167839)return false;const hero=activeHero(x);if(!hero||!Number.isFinite(Number(x?.positions?.[hero])))return false;try{ROOT.DungeonSpatial313?.ensure?.(x);ROOT.DungeonSpatial313?.persist?.(x)}catch(e){console.warn("Authored return spatial persistence",e)}writeRt(x);return true}
function wrap(){const A=ROOT.DungeonAuthoredRuntime167839;if(!A||typeof A.enterNode!=="function")return false;if(A.enterNode.__returnPersist167862)return true;const old=A.enterNode;const wrapped=function(){const out=old.apply(this,arguments);if(out)persistFinalPosition();return out};wrapped.__returnPersist167862=true;wrapped.__original=old;A.enterNode=wrapped;return true}
function install(){if(wrap())return true;if(retries++<30&&typeof setTimeout==="function")setTimeout(install,80);return false}
ROOT.DungeonAuthoredReturnPersist167862={VERSION,APP_VERSION,readRt,activeHero,persistFinalPosition,wrap,install};
install();
})();
