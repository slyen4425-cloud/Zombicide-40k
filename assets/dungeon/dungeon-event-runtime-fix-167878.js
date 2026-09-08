/* GenSrpG V16.78.79 — shared Dungeon event spawn placement fixes.
   Keeps the existing event engine. Ambush and Reinforcement events now place newly spawned enemies
   on the closest valid cells around heroes instead of at an arbitrary far cell. */
(function(){
"use strict";
const R=typeof window!=="undefined"?window:globalThis;
const RT_KEY="gensrpg_dungeon_runtime_v2",APP_VERSION="16.78.79",VERSION="1.1.0";
let retries=0;
function read(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function write(x){try{localStorage.setItem(RT_KEY,JSON.stringify(x||{}));return true}catch(e){return false}}
function enemyList(){try{return R.loadActiveEnemies?.()||[]}catch(e){return []}}
function enemyIds(){return new Set(enemyList().map(e=>String(e?.id||"")).filter(Boolean))}
function text(evt){return (String(evt?.id||"")+" "+String(evt?.name||"")+" "+String(evt?.label||"")+" "+String(evt?.title||"")).toLowerCase()}
function isAmbush(evt){const t=text(evt);return /d_evt_ambush|\bembuscade\b|\bambush\b/.test(t)}
function isReinforcement(evt){const t=text(evt);return /reinfor|renfort/.test(t)}
function isCloseSpawnEvent(evt){return isAmbush(evt)||isReinforcement(evt)}
function mapSize(map){const n=Number(map?.size);if(Number.isInteger(n)&&n>0)return n;const total=Array.isArray(map?.cells)?map.cells.length:0;const root=Math.round(Math.sqrt(total));return root>0?root:1}
function neighbours(i,size,total){const r=Math.floor(i/size),c=i%size,out=[];if(r>0)out.push(i-size);if(r<size-1)out.push(i+size);if(c>0)out.push(i-1);if(c<size-1)out.push(i+1);return out.filter(n=>n>=0&&n<total)}
function blocked(v){return ["wall","void"].includes(String(v||"").toLowerCase())}
function heroCells(x){
  const out=[];const participants=Array.isArray(x?.participants)?x.participants:[],room=Number(x?.room)||0;
  for(const id of participants){
    try{if(typeof R.DungeonSpatial313?.sameView==="function"&&R.DungeonSpatial313.sameView(x,id)===false)continue}catch(e){}
    if(x?.heroRooms&&Object.prototype.hasOwnProperty.call(x.heroRooms,id)&&Number(x.heroRooms[id])!==room)continue;
    const n=Number(x?.positions?.[id]);if(Number.isInteger(n)&&n>=0&&!out.includes(n))out.push(n);
  }
  return out;
}
function candidateCells(x){
  const map=x?.last?.map,cells=Array.isArray(map?.cells)?map.cells:[],size=mapSize(map),heroes=heroCells(x);
  if(!cells.length||!heroes.length)return [];
  const occupied=new Set(Object.values(x?.enemyCells||{}).map(Number).filter(Number.isInteger));heroes.forEach(n=>occupied.add(n));
  const forbidden=new Set(["entry","exit","chest","cache","trap","puzzle","event","merchant","rest","boss"]);
  const dist=new Map(),queue=[];heroes.forEach(h=>{dist.set(h,0);queue.push(h)});
  let qi=0;while(qi<queue.length){const cur=queue[qi++],d=dist.get(cur)||0;for(const n of neighbours(cur,size,cells.length)){if(dist.has(n)||blocked(cells[n]))continue;dist.set(n,d+1);queue.push(n)}}
  return [...dist.entries()].filter(([i,d])=>d>0&&!occupied.has(i)&&!blocked(cells[i])&&!forbidden.has(String(cells[i]||"").toLowerCase())).sort((a,b)=>a[1]-b[1]||a[0]-b[0]).map(([i])=>i);
}
function placeNewEventEnemies(before){
  const x=read();if(!x?.last?.map)return 0;
  const all=enemyList(),newEnemies=all.filter(e=>{const id=String(e?.id||"");return id&&!before.has(id)&&!e?.removed&&!e?.defeated&&Number(e?.hp)>0&&Number(e?.dungeonRoom||x.room)===Number(x.room)});
  if(!newEnemies.length)return 0;
  const candidates=candidateCells(x);if(!candidates.length)return 0;
  x.enemyCells=x.enemyCells&&typeof x.enemyCells==="object"?x.enemyCells:{};let placed=0;
  for(const e of newEnemies){const cell=candidates.shift();if(cell===undefined)break;x.enemyCells[String(e.id)]=cell;e.dungeonCell200=cell;e.dungeonCell104=cell;e.dungeonRoom=Number(x.room)||0;placed++}
  if(!placed)return 0;
  try{R.saveActiveEnemies?.(all)}catch(e){}write(x);try{R.DungeonSpatial313?.persist?.(x)}catch(e){}try{R.DungeonCore01?.render?.()}catch(e){}return placed;
}
function placeNewAmbushEnemies(before){return placeNewEventEnemies(before)}
function install(){
  const old=R.applyDungeonTurnEvent;
  if(typeof old!=="function"){if(retries++<40&&typeof setTimeout==="function")setTimeout(install,100);return false}
  if(old.__der167879)return true;
  const wrapped=function(evt){const close=isCloseSpawnEvent(evt),before=close?enemyIds():null;const out=old.apply(this,arguments);if(close)try{placeNewEventEnemies(before)}catch(e){console.warn("Dungeon event proximity placement",e)}return out};
  wrapped.__der167879=true;wrapped.__original=old;R.applyDungeonTurnEvent=wrapped;try{R.GENSRPG_VERSION=APP_VERSION}catch(e){}return true;
}
R.DungeonEventRuntimeFix167878={VERSION,APP_VERSION,isAmbush,isReinforcement,isCloseSpawnEvent,mapSize,neighbours,heroCells,candidateCells,placeNewEventEnemies,placeNewAmbushEnemies,install};
install();if(typeof setTimeout==="function")for(const ms of [50,250,1000])setTimeout(install,ms);
})();
