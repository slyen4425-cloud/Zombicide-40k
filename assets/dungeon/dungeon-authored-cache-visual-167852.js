/* GenSrpG Dungeon — authored cache/runtime visual bridge 16.78.67.
   Built World Builder only: keeps authored cache behavior, overlays the validated wall asset
   on real runtime wall cells, and recenters/reduces enemy artwork on its authored tactical cell.
   No movement, combat, timeline, spawn or room geometry behavior is changed. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="1.1.0",APP_VERSION="16.78.67";
const WALL_ASSET="assets/dungeon/creatures/dng_wall_block.jpg";
let retries=0;
function readRt(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function authored(x){return !!(x?.last?.authoredRuntime167839&&x?.last?.worldDungeonId&&x?.last?.worldNodeId)}
function cacheCells(x){return new Set((Array.isArray(x?.last?.authoredCacheCells167849)?x.last.authoredCacheCells167849:[]).map(Number).filter(Number.isInteger))}
function ensureStyle(){if(!DOC||DOC.getElementById("dac167852Style"))return;const s=DOC.createElement("style");s.id="dac167852Style";s.textContent='.dc047Cell{position:relative}.dac167852Cache{position:absolute;z-index:45;left:50%;top:50%;transform:translate(-50%,-50%);min-width:30px;height:30px;padding:0 5px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#34220f;border:2px solid #d6a85c;color:#fff;font-size:18px;font-weight:900;line-height:1;pointer-events:none;box-shadow:0 2px 10px #000c}.dac167852Cache::after{content:"Cache";position:absolute;top:31px;left:50%;transform:translateX(-50%);font-size:8px;white-space:nowrap;background:#120d07dd;border:1px solid #806033;border-radius:5px;padding:1px 4px;color:#f4d59b}.dav167867Wall{position:absolute;z-index:36;inset:0;border-radius:inherit;background-image:url("'+WALL_ASSET+'");background-position:center;background-size:cover;background-repeat:no-repeat;pointer-events:none}.dav167867EnemyArt{position:absolute!important;left:50%!important;top:50%!important;width:80%!important;height:80%!important;max-width:80%!important;max-height:80%!important;object-fit:contain!important;object-position:50% 50%!important;margin:0!important;transform:translate(-50%,-50%)!important;transform-origin:center!important;z-index:48!important}';DOC.head?.appendChild(s)}
function cleanupLegacyChestScenes(x){if(!authored(x))return 0;const cells=cacheCells(x);if(!cells.size)return 0;let all=[];try{all=ROOT.loadDungeonSceneElements?.()||[]}catch(e){return 0}const room=Number(x.room)||0;let removed=0;const next=all.filter(el=>{if(el?.kind!=="chest"||el?.exactChest167824===true)return true;if(Number(el?.room||0)!==room)return true;const c=Number(el?.cellIndex);if(!Number.isInteger(c)||!cells.has(c))return true;removed++;return false});if(removed){try{ROOT.saveDungeonSceneElements?.(next)}catch(e){}}return removed}
function enemyCellIndexes(x){return new Set(Object.values(x?.enemyCells||{}).map(Number).filter(Number.isInteger))}
function paintBoardVisuals(x,grid,cells){
  grid.querySelectorAll(".dav167867Wall").forEach(el=>el.remove());
  grid.querySelectorAll(".dav167867EnemyArt").forEach(el=>el.classList.remove("dav167867EnemyArt"));
  if(!authored(x))return false;
  const mapCells=Array.isArray(x?.last?.map?.cells)?x.last.map.cells:[];
  for(let i=0;i<cells.length;i++){
    if(String(mapCells[i]||"")!=="wall")continue;
    const cover=DOC.createElement("div");cover.className="dav167867Wall";cover.setAttribute("aria-hidden","true");cells[i].appendChild(cover);
  }
  for(const idx of enemyCellIndexes(x)){
    const cell=cells[idx];if(!cell)continue;
    const images=[...cell.querySelectorAll("img")];
    for(const img of images)img.classList.add("dav167867EnemyArt");
  }
  return true;
}
function paint(){if(!DOC)return false;ensureStyle();const x=readRt(),grid=DOC.querySelector("#dc047RoomBoard .dc047Grid");if(!grid)return false;grid.querySelectorAll(".dac167852Cache").forEach(el=>el.remove());const cells=[...grid.querySelectorAll(":scope > .dc047Cell")];paintBoardVisuals(x,grid,cells);if(!authored(x))return false;for(const idx of cacheCells(x)){if(!cells[idx])continue;const mark=DOC.createElement("div");mark.className="dac167852Cache";mark.textContent="🕳️";mark.setAttribute("aria-label","Cache / lieu d’intérêt");cells[idx].appendChild(mark)}return true}
function sync(){const x=readRt();if(!x||!authored(x))return false;cleanupLegacyChestScenes(x);paint();try{ROOT.DungeonZoneLinks167846?.paintTravelButtons?.()}catch(e){}return true}
function wrap(){const core=ROOT.DungeonCore01;if(!core)return false;for(const name of ["render","show"]){const old=core[name];if(typeof old!=="function"||old.__dac167852)continue;const w=function(){try{const x=readRt();if(x)cleanupLegacyChestScenes(x)}catch(e){}const out=old.apply(this,arguments);try{sync()}catch(e){}return out};w.__dac167852=true;w.__dacOriginal=old;core[name]=w}const mv=ROOT.dungeonMoveHero098;if(typeof mv==="function"&&!mv.__dac167852){const w=function(){const out=mv.apply(this,arguments);try{sync()}catch(e){}return out};w.__dac167852=true;w.__dacOriginal=mv;ROOT.dungeonMoveHero098=w}return true}
function install(){if(wrap()){for(const ms of [0,50,250])setTimeout(sync,ms);return true}if(retries++<30&&typeof setTimeout==="function")setTimeout(install,100);return false}
ROOT.DungeonAuthoredCacheVisual167852={VERSION,APP_VERSION,WALL_ASSET,cacheCells,enemyCellIndexes,cleanupLegacyChestScenes,paintBoardVisuals,paint,sync,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}
})();
