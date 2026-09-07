/* GenSrpG Dungeon — authored cache/runtime visual bridge 16.78.75.
   Built World Builder only: paints the actual authored room terrain in the live tactical board,
   uses the validated wall artwork, normalizes authored actor token framing, and hides only
   two exact redundant runtime summary blocks. No gameplay state is changed. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="1.3.4",APP_VERSION="16.78.75";
const FLOOR_ROOT="assets/dungeon/creatures/";
const WALL_ASSET=FLOOR_ROOT+"dng_wall_block.jpg";
const FLOOR_THEMES=new Set(["stone","cave","forest","ice","lava"]);
const ACTOR_RATIO=.76;
const ACTOR_RATIO_MEDIUM=.82;
const ACTOR_RATIO_COMPACT=.88;
const ACTOR_ZOOM=1.12;
const UI_ENEMY_SUMMARY_SELECTOR="#dc01Enemies";
const UI_GHOST_CHEST_SELECTOR="#dc200Scene .dc200SceneCard:has(> .dc309SceneChest)";
let retries=0;
function readRt(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function authored(x){return !!(x?.last?.authoredRuntime167839&&x?.last?.worldDungeonId&&x?.last?.worldNodeId)}
function cacheCells(x){return new Set((Array.isArray(x?.last?.authoredCacheCells167849)?x.last.authoredCacheCells167849:[]).map(Number).filter(Number.isInteger))}
function floorAsset(themeName,index){const t=String(themeName||"").toLowerCase();if(!FLOOR_THEMES.has(t))return "";const variant=String((Math.max(0,Number(index)||0)%6)+1).padStart(2,"0");return FLOOR_ROOT+"dng_floor_"+t+"_"+variant+".png"}
function authoredRoom(x){const id=String(x?.last?.customRoomId||"");if(!id)return null;try{return ROOT.DungeonRoomCreator100?.findRoom?.(id)||null}catch(e){return null}}
function ensureStyle(){if(!DOC||DOC.getElementById("dac167852Style"))return;const s=DOC.createElement("style");s.id="dac167852Style";s.textContent='.dc047Cell{position:relative;background-size:cover!important;background-position:center!important;background-repeat:no-repeat!important}.dav167870WallCell{color:transparent!important;text-shadow:none!important}.dav167870WallCell>*{visibility:hidden!important}.dac167852Cache{position:absolute;z-index:45;left:50%;top:50%;transform:translate(-50%,-50%);min-width:30px;height:30px;padding:0 5px;border-radius:8px;display:flex;align-items:center;justify-content:center;background:#34220f;border:2px solid #d6a85c;color:#fff!important;font-size:18px;font-weight:900;line-height:1;pointer-events:none;box-shadow:0 2px 10px #000c;visibility:visible!important}.dac167852Cache::after{content:"Cache";position:absolute;top:31px;left:50%;transform:translateX(-50%);font-size:8px;white-space:nowrap;background:#120d07dd;border:1px solid #806033;border-radius:5px;padding:1px 4px;color:#f4d59b}.dav167870EnemyToken{position:absolute!important;left:50%!important;top:50%!important;right:auto!important;bottom:auto!important;width:76%!important;height:76%!important;max-width:88%!important;max-height:88%!important;margin:0!important;transform:translate(-50%,-50%)!important;transform-origin:center!important;display:grid!important;place-items:center!important;z-index:48!important;overflow:hidden!important}.dav167870EnemyToken img,.dav167870EnemyToken.dav167870EnemyImage{display:block!important;width:100%!important;height:100%!important;max-width:100%!important;max-height:100%!important;object-fit:cover!important;object-position:50% 50%!important;margin:0!important}'+UI_ENEMY_SUMMARY_SELECTOR+'{display:none!important}'+UI_GHOST_CHEST_SELECTOR+'{display:none!important}';DOC.head?.appendChild(s)}
function cleanupLegacyChestScenes(x){if(!authored(x))return 0;const cells=cacheCells(x);if(!cells.size)return 0;let all=[];try{all=ROOT.loadDungeonSceneElements?.()||[]}catch(e){return 0}const room=Number(x.room)||0;let removed=0;const next=all.filter(el=>{if(el?.kind!=="chest"||el?.exactChest167824===true)return true;if(Number(el?.room||0)!==room)return true;const c=Number(el?.cellIndex);if(!Number.isInteger(c)||!cells.has(c))return true;removed++;return false});if(removed){try{ROOT.saveDungeonSceneElements?.(next)}catch(e){}}return removed}
function enemyCellIndexes(x){return new Set(Object.values(x?.enemyCells||{}).map(Number).filter(Number.isInteger))}
function heroCellIndexes(x){const out=new Set(),positions=x?.positions&&typeof x.positions==="object"?x.positions:{},heroRooms=x?.heroRooms&&typeof x.heroRooms==="object"?x.heroRooms:{},room=Number(x?.room)||0;const heroes=Array.isArray(x?.participants)&&x.participants.length?x.participants:Object.keys(positions);for(const hero of heroes){if(Object.prototype.hasOwnProperty.call(heroRooms,hero)&&Number(heroRooms[hero])!==room)continue;const idx=Number(positions[hero]);if(Number.isInteger(idx)&&idx>=0)out.add(idx)}return out}
function actorCellIndexes(x){const out=enemyCellIndexes(x);for(const idx of heroCellIndexes(x))out.add(idx);return out}
function setBg(cell,url){if(!cell?.style)return;cell.style.setProperty("background-image",url?'url("'+url+'")':"none","important");cell.style.setProperty("background-size","cover","important");cell.style.setProperty("background-position","center","important");cell.style.setProperty("background-repeat","no-repeat","important")}
function enemyTokenRoot(cell,img){let node=img;while(node?.parentElement&&node.parentElement!==cell)node=node.parentElement;return node||img}
function isActorImage(img){const raw=String(img?.getAttribute?.("src")||img?.src||"").toLowerCase();if(!raw)return false;if(raw.startsWith("data:image/")||raw.startsWith("blob:"))return true;const base=raw.split(/[?#]/)[0].split("/").pop()||"";if(/^dng_(?:floor_|wall_)/.test(base)||/^(?:dungeon_|dloot_|ditem_)/.test(base))return false;if(/^dng_(?:bow|staff|longsword|shield|leather|chain)(?:\.|_)/.test(base))return false;return /^dng_/.test(base)}
function actorRatioForSide(side){const n=Number(side)||0;if(n>0&&n<=54)return ACTOR_RATIO_COMPACT;if(n>54&&n<=82)return ACTOR_RATIO_MEDIUM;return ACTOR_RATIO}
function actorTokenSize(cell){let side=0;try{const r=cell?.getBoundingClientRect?.();side=Math.min(Number(r?.width)||0,Number(r?.height)||0)}catch(e){}if(!side){side=Math.min(Number(cell?.clientWidth)||0,Number(cell?.clientHeight)||0)}return side>0?Math.max(18,Math.round(side*actorRatioForSide(side))):0}
function fitActorToken(cell,img){const token=enemyTokenRoot(cell,img),size=actorTokenSize(cell);token.classList?.add("dav167870EnemyToken");if(token===img)token.classList?.add("dav167870EnemyImage");if(token?.style?.setProperty){token.style.setProperty("left","50%","important");token.style.setProperty("top","50%","important");token.style.setProperty("right","auto","important");token.style.setProperty("bottom","auto","important");token.style.setProperty("margin","0","important");token.style.setProperty("transform","translate(-50%,-50%)","important");if(size){const px=size+"px";for(const p of ["width","height","max-width","max-height"])token.style.setProperty(p,px,"important")}token.style.setProperty("overflow","hidden","important")}if(img?.style?.setProperty){img.style.setProperty("width","100%","important");img.style.setProperty("height","100%","important");img.style.setProperty("max-width","100%","important");img.style.setProperty("max-height","100%","important");img.style.setProperty("object-fit","cover","important");img.style.setProperty("object-position","50% 50%","important");img.style.setProperty("transform","scale("+ACTOR_ZOOM+")","important");img.style.setProperty("transform-origin","50% 50%","important")}return size}
function refitDc310Tokens(root){const scope=root||DOC?.querySelector?.("#dc047RoomBoard");if(!scope)return 0;let count=0;for(const token of scope.querySelectorAll?.(".dc310Hero,.dc310Enemy")||[]){const cell=token.closest?.(".dc047Cell");const img=token.querySelector?.("img");if(cell&&img){fitActorToken(cell,img);count++}}return count}
function paintBoardVisuals(x,grid,cells){
  grid.querySelectorAll(".dav167870EnemyToken").forEach(el=>el.classList.remove("dav167870EnemyToken","dav167870EnemyImage"));
  for(const cell of cells){cell.classList?.remove("dav167869WallCell","dav167870WallCell");if(cell?.style)cell.style.removeProperty("color")}
  if(!authored(x))return false;
  const room=authoredRoom(x),roomCells=Array.isArray(room?.cells)?room.cells:[],theme=String(room?.theme||x?.last?.map?.environment||"stone").toLowerCase();
  const fallback=Array.isArray(x?.last?.map?.cells)?x.last.map.cells:[];
  for(let i=0;i<cells.length;i++){
    const source=roomCells[i]||null;
    const wall=source?String(source.terrain||"")==="wall":String(fallback[i]||"")==="wall";
    if(wall){cells[i].classList?.add("dav167870WallCell");setBg(cells[i],WALL_ASSET);continue}
    const floor=floorAsset(theme,i);setBg(cells[i],floor||"");
  }
  for(const idx of actorCellIndexes(x)){
    const cell=cells[idx];if(!cell)continue;
    const images=[...cell.querySelectorAll("img")].filter(isActorImage);
    for(const img of images)fitActorToken(cell,img)
  }
  refitDc310Tokens(grid);
  if(grid.dataset){grid.dataset.dav167870Theme=theme;grid.dataset.dav167870Room=String(room?.id||x?.last?.customRoomId||"")}
  return true;
}
function paint(){if(!DOC)return false;ensureStyle();const x=readRt(),grid=DOC.querySelector("#dc047RoomBoard .dc047Grid");if(!grid)return false;grid.querySelectorAll(".dac167852Cache").forEach(el=>el.remove());const cells=[...grid.querySelectorAll(":scope > .dc047Cell")];paintBoardVisuals(x,grid,cells);if(!authored(x))return false;for(const idx of cacheCells(x)){if(!cells[idx])continue;const mark=DOC.createElement("div");mark.className="dac167852Cache";mark.textContent="🕳️";mark.setAttribute("aria-label","Cache / lieu d’intérêt");cells[idx].appendChild(mark)}return true}
function sync(){const x=readRt();if(!x||!authored(x))return false;cleanupLegacyChestScenes(x);paint();try{ROOT.DungeonZoneLinks167846?.paintTravelButtons?.()}catch(e){}return true}
function wrap(){const core=ROOT.DungeonCore01;if(!core)return false;for(const name of ["render","show"]){const old=core[name];if(typeof old!=="function"||old.__dac167852)continue;const w=function(){try{const x=readRt();if(x)cleanupLegacyChestScenes(x)}catch(e){}const out=old.apply(this,arguments);try{sync()}catch(e){}return out};w.__dac167852=true;w.__dacOriginal=old;core[name]=w}const mv=ROOT.dungeonMoveHero098;if(typeof mv==="function"&&!mv.__dac167852){const w=function(){const out=mv.apply(this,arguments);try{sync()}catch(e){}return out};w.__dac167852=true;w.__dacOriginal=mv;ROOT.dungeonMoveHero098=w}return true}
function installTokenMutationSync(){if(!DOC||ROOT.__dac167852TokenObserver)return false;const board=DOC.querySelector("#dc047RoomBoard");if(!board||typeof ROOT.MutationObserver!=="function")return false;let queued=false;const schedule=()=>{if(queued)return;queued=true;const run=()=>{queued=false;try{refitDc310Tokens(board)}catch(e){}};if(typeof ROOT.requestAnimationFrame==="function")ROOT.requestAnimationFrame(run);else setTimeout(run,0)};const obs=new ROOT.MutationObserver(muts=>{for(const m of muts){for(const n of m.addedNodes||[]){if(n?.nodeType!==1)continue;if(n.matches?.(".dc310Hero,.dc310Enemy")||n.querySelector?.(".dc310Hero,.dc310Enemy")){schedule();return}}}});obs.observe(board,{childList:true,subtree:true});ROOT.__dac167852TokenObserver=obs;schedule();return true}
function installResizeSync(){if(!DOC||ROOT.__dac167852ResizeInstalled)return;ROOT.__dac167852ResizeInstalled=true;try{ROOT.addEventListener?.("resize",()=>{try{sync()}catch(e){}},{passive:true})}catch(e){}try{if(typeof ROOT.ResizeObserver==="function"){const grid=DOC.querySelector("#dc047RoomBoard .dc047Grid");if(grid){const ro=new ROOT.ResizeObserver(()=>{try{sync()}catch(e){}});ro.observe(grid);ROOT.__dac167852ResizeObserver=ro}}}catch(e){}installTokenMutationSync()}
function install(){ensureStyle();if(wrap()){for(const ms of [0,50,250])setTimeout(()=>{sync();installResizeSync();installTokenMutationSync()},ms);return true}if(retries++<30&&typeof setTimeout==="function")setTimeout(install,100);return false}
ROOT.DungeonAuthoredCacheVisual167852={VERSION,APP_VERSION,FLOOR_THEMES,WALL_ASSET,ACTOR_RATIO,ACTOR_RATIO_MEDIUM,ACTOR_RATIO_COMPACT,ACTOR_ZOOM,UI_ENEMY_SUMMARY_SELECTOR,UI_GHOST_CHEST_SELECTOR,floorAsset,authoredRoom,enemyTokenRoot,isActorImage,actorRatioForSide,actorTokenSize,fitActorToken,refitDc310Tokens,installTokenMutationSync,cacheCells,enemyCellIndexes,heroCellIndexes,actorCellIndexes,cleanupLegacyChestScenes,paintBoardVisuals,paint,sync,install};
if(DOC){if(DOC.readyState==="loading")DOC.addEventListener("DOMContentLoaded",install,{once:true});else install()}
})();
