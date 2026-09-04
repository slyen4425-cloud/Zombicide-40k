/* GenSrpG V16.78.34 — large Dungeon rooms up to 15x15.
   Keeps the existing square-grid movement/combat model and removes the historical 6-9 cap.
   Built-world rooms keep their own dimensions; generated rooms may now use 6, 9 or 15 cells. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="1.0.0",APP_VERSION="16.78.34",MAX_SIZE=15,MIN_SIZE=6;
function clamp(v,min=MIN_SIZE,max=MAX_SIZE,fallback=9){const n=Math.round(Number(v));return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback}
function cfg(){try{return ROOT.loadDungeonConfig?.()||{}}catch(e){return {}}}
function gridSize(){
  const c=cfg(),direct=Number(c.roomSizeCells??c.gridSize??c.roomSize);
  if(Number.isFinite(direct)&&direct>0)return clamp(direct);
  if(String(c.roomGeometry||"")==="random")return MIN_SIZE+Math.floor(Math.random()*(MAX_SIZE-MIN_SIZE+1));
  const key=String(c.size||"medium").toLowerCase();
  return clamp(({small:6,medium:9,large:15,huge:15,xl:15}[key]||9));
}
function carve(a,n,r1,c1,r2,c2){for(let r=r1;r<=r2;r++)for(let c=c1;c<=c2;c++)if(r>=0&&c>=0&&r<n&&c<n)a[r*n+c]="floor"}
function floors(a){return a.map((x,i)=>x==="floor"?i:-1).filter(i=>i>=0)}
function pick(a){return a.length?a[Math.floor(Math.random()*a.length)]:-1}
function opposite(e){return e==="top"?"bottom":e==="bottom"?"top":e==="left"?"right":"left"}
function edge(a,n,e){return floors(a).filter(i=>{const r=Math.floor(i/n),c=i%n;return e==="top"?r===0:e==="bottom"?r===n-1:e==="left"?c===0:c===n-1})}
function inward(n,i,e){return e==="top"?i+n:e==="bottom"?i-n:e==="left"?i+1:i-1}
function shape(n){
  const a=Array(n*n).fill("void"),m=Math.floor(n/2),types=["room","rect","corridor","corridorL","cross","roomL","arena"];
  let type=types[Math.floor(Math.random()*types.length)];
  const lane=Math.max(1,Math.min(3,Math.floor(n/5)));
  if(type==="room")carve(a,n,1,1,n-2,n-2);
  else if(type==="rect"){if(Math.random()<.5)carve(a,n,1,0,n-2,n-1);else carve(a,n,0,1,n-1,n-2)}
  else if(type==="corridor"){if(Math.random()<.5)carve(a,n,m-lane,0,m+lane,n-1);else carve(a,n,0,m-lane,n-1,m+lane)}
  else if(type==="corridorL"){carve(a,n,m-lane,0,m+lane,m+lane);carve(a,n,m-lane,m-lane,n-1,m+lane)}
  else if(type==="cross"){carve(a,n,m-lane,0,m+lane,n-1);carve(a,n,0,m-lane,n-1,m+lane)}
  else if(type==="roomL"){carve(a,n,1,1,n-2,m+lane);carve(a,n,m-lane,m-lane,n-2,n-2)}
  else carve(a,n,1,1,n-2,n-2);
  return {type,a};
}
function generate(kind,enemyQty){
  const n=clamp(gridSize()),s=shape(n);let a=s.a;
  let entry=["top","right","bottom","left"][Math.floor(Math.random()*4)],exit=opposite(entry);
  let ei=pick(edge(a,n,entry)),xo=pick(edge(a,n,exit));
  if(ei<0||xo<0){a=Array(n*n).fill("floor");entry="left";exit="right";ei=Math.floor(n/2)*n;xo=ei+n-1;s.type="room"}
  a[ei]="entry";a[xo]="exit";const used=new Set([ei,xo]);let hi=inward(n,ei,entry);if(a[hi]!=="floor")hi=pick(floors(a));if(hi>=0){a[hi]="hero";used.add(hi)}
  const obstacleMax=n>=13?18:n>=10?12:7,obstacleCount=Math.min(obstacleMax,Math.floor(floors(a).length*.055));
  for(let k=0;k<obstacleCount;k++){const f=floors(a).filter(i=>!used.has(i));if(!f.length)break;const i=pick(f);a[i]=Math.random()<.5?"cover":"wall";used.add(i)}
  let chestIdx=-1;if(kind==="chest"||Math.random()<.25){const f=floors(a).filter(i=>!used.has(i));chestIdx=pick(f);if(chestIdx>=0){a[chestIdx]="chest";used.add(chestIdx)}}
  const enemies=[];for(let q=0;q<Math.max(0,Number(enemyQty)||0);q++){const f=floors(a).filter(i=>!used.has(i));if(!f.length)break;const i=pick(f);a[i]="enemy";used.add(i);enemies.push(i)}
  let objective={type:"reach_exit",status:"open",title:"Atteindre la sortie",text:"La voie vers la porte suivante est libre."};
  return {version:4,size:n,width:n,height:n,cells:a,entry,exit,entryIdx:ei,exitIdx:xo,heroIdx:hi,chestIdx,enemies,objective,shape:s.type,environment:"dungeon",generatedAt:Date.now(),largeRoom167834:true};
}
function ensureStyle(){if(!DOC||DOC.getElementById("dlr167834Style"))return;const s=DOC.createElement("style");s.id="dlr167834Style";s.textContent=`#dc047RoomBoard{overflow:auto;-webkit-overflow-scrolling:touch}.dc047Grid{width:max-content;min-width:100%}.dc047Grid>.dc047Cell{min-width:28px;min-height:28px}.dc047Grid.dlr167834Large>.dc047Cell{font-size:clamp(11px,2.7vw,18px)}@media(max-width:620px){.dc047Grid>.dc047Cell{min-width:26px;min-height:26px}}`;DOC.head.appendChild(s)}
function markLarge(){if(!DOC)return;const map=(()=>{try{return ROOT.loadDungeonState?.()?.last?.map||JSON.parse(localStorage.getItem("gensrpg_dungeon_runtime_v2")||"null")?.last?.map}catch(e){return null}})();const g=DOC.querySelector?.("#dc047RoomBoard .dc047Grid");if(g)g.classList.toggle("dlr167834Large",Number(map?.size||map?.width||0)>9)}
function wrapRender(){const core=ROOT.DungeonCore01;if(!core)return false;for(const name of ["render","show"]){const old=core[name];if(typeof old!=="function"||old.__dlr167834)continue;const w=function(){const r=old.apply(this,arguments);markLarge();return r};w.__dlr167834=true;w.__dlr167834Original=old;core[name]=w}return true}
function install(){ROOT.dungeonGridSize=gridSize;ROOT.generateDungeonMap=generate;ensureStyle();wrapRender();markLarge();ROOT.GENSRPG_VERSION=APP_VERSION;return true}
ROOT.DungeonLargeRoom167834={VERSION,APP_VERSION,MIN_SIZE,MAX_SIZE,gridSize,generate,install};
install();if(typeof setTimeout==="function")setTimeout(install,0);
})();
