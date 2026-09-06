/* GenSrpG Dungeon — authored cache marker guard 16.78.49.
   Built World Builder rooms own cache / place-of-interest cells outside the legacy random-cache handler.
   The authored cache positions remain recorded for the zone-link layer, while the legacy semantic map sees floor.
   Random Dungeon, Capture and Survival are untouched. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="1.0.0",APP_VERSION="16.78.49";
let retries=0;
function readRt(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function saveRt(x){try{localStorage.setItem(RT_KEY,JSON.stringify(x||{}));return true}catch(e){return false}}
function authored(x){return !!(x?.last?.authoredRuntime167839&&x?.last?.worldDungeonId&&x?.last?.worldNodeId)}
function sanitize(x){
 if(!authored(x)||!Array.isArray(x?.last?.map?.cells))return false;
 const cells=x.last.map.cells,known=new Set(Array.isArray(x.last.authoredCacheCells167849)?x.last.authoredCacheCells167849.map(Number):[]);let changed=false;
 for(let i=0;i<cells.length;i++)if(String(cells[i])==="cache"){known.add(i);cells[i]="floor";changed=true}
 const list=[...known].filter(Number.isInteger).sort((a,b)=>a-b);
 if(JSON.stringify(list)!==JSON.stringify(x.last.authoredCacheCells167849||[])){x.last.authoredCacheCells167849=list;changed=true}
 if(changed){try{ROOT.DungeonSpatial313?.ensure?.(x);ROOT.DungeonSpatial313?.persist?.(x)}catch(e){}saveRt(x)}
 return true;
}
function sync(){const x=readRt();return x?sanitize(x):false}
function wrapCore(){const core=ROOT.DungeonCore01;if(!core)return false;for(const name of ["render","show","explore"]){const old=core[name];if(typeof old!=="function"||old.__authoredCacheGuard167849)continue;const w=function(){try{sync()}catch(e){}const out=old.apply(this,arguments);try{sync()}catch(e){}return out};w.__authoredCacheGuard167849=true;w.__authoredCacheGuardOriginal=old;core[name]=w}return true}
function install(){if(wrapCore()){sync();return true}if(retries++<30&&typeof setTimeout==="function")setTimeout(install,100);return false}
ROOT.DungeonAuthoredCacheGuard167849={VERSION,APP_VERSION,sanitize,sync,wrapCore,install};
install();
})();
