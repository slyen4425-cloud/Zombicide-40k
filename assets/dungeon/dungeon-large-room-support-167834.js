/* GenSrpG V16.78.35 — real Dungeon room-size + built-world geometry authority.
   This guard runs around the actual DungeonCore01.explore path. It repairs a late legacy
   9x9 clamp after room creation and keeps a selected World Builder room authoritative
   independently from the Zone content mode. Combat/timeline/spawn producers are untouched. */
(function(){
"use strict";
const ROOT=typeof window!=="undefined"?window:globalThis;
const DOC=typeof document!=="undefined"?document:null;
const VERSION="2.0.0",APP_VERSION="16.78.35",MAX_SIZE=15,MIN_SIZE=6;
const RT_KEY="gensrpg_dungeon_runtime_v2";
let exploreBusy=false;
function clone(v){try{return v==null?v:JSON.parse(JSON.stringify(v))}catch(e){return v}}
function readRt(){try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}}
function writeRt(x){try{localStorage.setItem(RT_KEY,JSON.stringify(x||{}));return true}catch(e){return false}}
function cfg(){try{return ROOT.loadDungeonConfig?.()||{}}catch(e){return {}}}
function clamp(v,min=MIN_SIZE,max=MAX_SIZE,fallback=9){const n=Math.round(Number(v));return Number.isFinite(n)?Math.max(min,Math.min(max,n)):fallback}
function gridSize(c=cfg()){
  const direct=Number(c.roomSizeCells??c.gridSize??c.roomSize);
  if(Number.isFinite(direct)&&direct>0)return clamp(direct);
  if(String(c.roomGeometry||"").toLowerCase()==="random")return MIN_SIZE+Math.floor(Math.random()*(MAX_SIZE-MIN_SIZE+1));
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
  const type=types[Math.floor(Math.random()*types.length)],lane=Math.max(1,Math.min(3,Math.floor(n/5)));
  if(type==="room"||type==="arena")carve(a,n,1,1,n-2,n-2);
  else if(type==="rect"){if(Math.random()<.5)carve(a,n,1,0,n-2,n-1);else carve(a,n,0,1,n-1,n-2)}
  else if(type==="corridor"){if(Math.random()<.5)carve(a,n,m-lane,0,m+lane,n-1);else carve(a,n,0,m-lane,n-1,m+lane)}
  else if(type==="corridorL"){carve(a,n,m-lane,0,m+lane,m+lane);carve(a,n,m-lane,m-lane,n-1,m+lane)}
  else if(type==="cross"){carve(a,n,m-lane,0,m+lane,n-1);carve(a,n,0,m-lane,n-1,m+lane)}
  else {carve(a,n,1,1,n-2,m+lane);carve(a,n,m-lane,m-lane,n-2,n-2)}
  return {type,a};
}
function generate(kind,enemyQty,sizeOverride,oldObjective){
  const n=clamp(sizeOverride??gridSize()),s=shape(n);let a=s.a;
  let entry=["top","right","bottom","left"][Math.floor(Math.random()*4)],exit=opposite(entry),ei=pick(edge(a,n,entry)),xo=pick(edge(a,n,exit));
  if(ei<0||xo<0){a=Array(n*n).fill("floor");entry="left";exit="right";ei=Math.floor(n/2)*n;xo=ei+n-1}
  a[ei]="entry";a[xo]="exit";const used=new Set([ei,xo]);let hi=inward(n,ei,entry);if(a[hi]!=="floor")hi=pick(floors(a));if(hi>=0){a[hi]="hero";used.add(hi)}
  const obstacleMax=n>=13?18:n>=10?12:7,obstacleCount=Math.min(obstacleMax,Math.floor(floors(a).length*.055));
  for(let k=0;k<obstacleCount;k++){const f=floors(a).filter(i=>!used.has(i));if(!f.length)break;const i=pick(f);a[i]=Math.random()<.5?"cover":"wall";used.add(i)}
  let chestIdx=-1,trapIdx=-1;
  if(kind==="chest"){const f=floors(a).filter(i=>!used.has(i));chestIdx=pick(f);if(chestIdx>=0){a[chestIdx]="chest";used.add(chestIdx)}}
  if(kind==="trap"){const f=floors(a).filter(i=>!used.has(i));trapIdx=pick(f);if(trapIdx>=0){a[trapIdx]="trap";used.add(trapIdx)}}
  const enemies=[];for(let q=0;q<Math.max(0,Number(enemyQty)||0);q++){const f=floors(a).filter(i=>!used.has(i));if(!f.length)break;const i=pick(f);a[i]="enemy";used.add(i);enemies.push(i)}
  const objective=clone(oldObjective)||{type:"reach_exit",status:"open",title:"Atteindre la sortie",text:"La voie vers la porte suivante est libre."};
  return {version:4,size:n,width:n,height:n,cells:a,entry,exit,entryIdx:ei,exitIdx:xo,heroIdx:hi,chestIdx,trapIdx,enemies,objective,shape:s.type,environment:"dungeon",generatedAt:Date.now(),largeRoom167835:true};
}
function activeHero(x){const ids=Array.isArray(x?.participants)?x.participants:[],i=Math.max(0,Math.min(Math.max(0,ids.length-1),Number(x?.index)||0));return String(ids[i]||"")}
function roomEnemies(room){try{return (ROOT.loadActiveEnemies?.()||[]).filter(e=>!e?.removed&&!e?.defeated&&Number(e?.hp)>0&&Number(e?.dungeonRoom)===Number(room))}catch(e){return []}}
function remapEnemies(x,map){
  const ids=roomEnemies(x.room).map(e=>String(e.id)),anchors=[...(map.enemies||[])];
  if(!anchors.length){for(let i=0;i<map.cells.length;i++)if(map.cells[i]==="floor")anchors.push(i)}
  x.enemyCells={};ids.forEach((id,i)=>{if(anchors.length)x.enemyCells[id]=anchors[Math.min(i,anchors.length-1)]});
}
function remapScene(x,map){try{const all=ROOT.loadDungeonSceneElements?.()||[];let changed=false;all.forEach(el=>{if(Number(el?.room)!==Number(x.room))return;if(el.kind==="chest"&&map.chestIdx>=0&&Number(el.cellIndex)!==map.chestIdx){el.cellIndex=map.chestIdx;changed=true}if(el.kind==="trap"&&map.trapIdx>=0&&Number(el.cellIndex)!==map.trapIdx){el.cellIndex=map.trapIdx;changed=true}});if(changed)ROOT.saveDungeonSceneElements?.(all)}catch(e){}}
function persist(x){try{ROOT.DungeonSpatial313?.ensure?.(x);ROOT.DungeonSpatial313?.persist?.(x)}catch(e){}writeRt(x)}
function isAuthored(x){const l=x?.last||{},m=l.map||{};return !!(l.worldRuntime167823||l.customRoomRuntime167822||m.worldTemplate167834||m.worldTemplate167835||m.worldGeometryAuthoritative167835)}
function roomWasCreated(before,after){if(!after?.last||Number(after.room)<=0)return false;const from=Number(before?.room||0),to=Number(after.room||0),t=after.dc313LastTransition;if(to===from)return false;if(t?.created===true&&Number(t.to)===to)return true;return to>from}
function repairGenerated(before,desired){
  const x=readRt();if(!x||!roomWasCreated(before,x)||isAuthored(x))return false;const old=x.last?.map;if(!old)return false;
  const target=clamp(desired);if(Number(old.size)===target&&Number(old.width||old.size)===target&&old.cells?.length===target*target){old.largeRoom167835=true;persist(x);return false}
  const map=generate(String(x.last.kind||"mystery"),roomEnemies(x.room).length,target,old.objective||x.last.objective);x.last.map=map;x.last.objective=clone(map.objective);
  const hero=activeHero(x);x.positions=x.positions&&typeof x.positions==="object"?x.positions:{};if(hero)x.positions[hero]=Math.max(0,Number(map.entryIdx)||0);
  remapEnemies(x,map);remapScene(x,map);persist(x);return true;
}
function selectedWorld(){
  try{const p=ROOT.DungeonWorldSessionBridge167832?.primary?.();if(p?.kind==="world"&&p.id)return {id:String(p.id),primary:true}}catch(e){}
  try{const aid=String(ROOT.activeDungeonAdventureId?.()||"default"),c=ROOT.DungeonWorldRuntime167823?.getConfig?.(aid);if(c?.enabled&&c.dungeonId)return {id:String(c.dungeonId),primary:false}}catch(e){}
  return null;
}
function syncWorldSelection(sel){if(!sel?.id)return;try{const aid=String(ROOT.activeDungeonAdventureId?.()||"default");ROOT.DungeonWorldRuntime167823?.saveConfig?.({enabled:true,dungeonId:sel.id},aid)}catch(e){}}
function worldPlan(sel){if(!sel?.id)return null;syncWorldSelection(sel);try{const p=ROOT.DungeonWorldRuntime167823?.currentPlan?.();if(p?.targetNodeId)return {...p,dungeonId:sel.id}}catch(e){}return {dungeonId:sel.id,targetNodeId:""}}
function worldPack(sel,plan,after){
  const id=String(sel?.id||plan?.dungeonId||after?.last?.worldDungeonId||"");if(!id)return null;let graph=null;try{graph=ROOT.DungeonWorldBuilder167821?.findDungeon?.(id)||null}catch(e){}if(!graph)return null;
  const nodeId=String(after?.last?.worldNodeId||plan?.targetNodeId||graph.startNodeId||""),node=(graph.nodes||[]).find(n=>String(n.id)===nodeId);if(!node)return null;let room=null;try{room=ROOT.DungeonRoomCreator100?.findRoom?.(node.roomId)||null}catch(e){}return room?{graph,node,room}:null;
}
function roomMap(room){
  const width=Math.max(1,Number(room?.width)||1),height=Math.max(1,Number(room?.height)||1),cells=(room?.cells||[]).slice(0,width*height).map(c=>c?.terrain==="wall"?"wall":String(c?.object||"floor"));while(cells.length<width*height)cells.push("floor");
  const entryIdx=cells.findIndex(v=>v==="entry"),exitIdx=cells.findIndex(v=>v==="exit");return {version:4,size:width,width,height,cells,entryIdx,exitIdx,heroIdx:entryIdx,objective:{type:"reach_exit",status:"open",title:"Atteindre la sortie",text:"La sortie suit les connexions du Monde construit."},shape:String(room?.roomType||"room"),environment:String(room?.theme||"dungeon"),worldTemplate167835:true,worldGeometryAuthoritative167835:true};
}
function structuralMatch(map,exact){if(!map||!exact||Number(map.width||map.size)!==exact.width||Number(map.height||map.size)!==exact.height||map.cells?.length!==exact.cells.length)return false;for(let i=0;i<exact.cells.length;i++){const wanted=exact.cells[i];if(wanted==="wall"||wanted==="entry"||wanted==="exit")if(String(map.cells[i])!==wanted)return false}return true}
function overlayDynamic(exact,old){const dynamic=new Set(["enemy","boss","chest","trap","puzzle","npc","item","merchant","rest","trapdoor"]);if(!old?.cells)return exact;for(let i=0;i<Math.min(exact.cells.length,old.cells.length);i++){const v=String(old.cells[i]||"");if(dynamic.has(v)&&!["wall","entry","exit"].includes(exact.cells[i]))exact.cells[i]=v}return exact}
function ensureWorldState(x,sel,pack){
  const hero=activeHero(x),roomNo=Math.max(1,Number(x.room)||1);let w=x.world167823&&x.world167823.dungeonId===sel.id?x.world167823:{dungeonId:sel.id,heroNodes:{},nodeRooms:{},roomNodes:{},history:{}};
  for(const k of ["heroNodes","nodeRooms","roomNodes","history"])w[k]=w[k]&&typeof w[k]==="object"?w[k]:{};
  w.nodeRooms[String(pack.node.id)]=roomNo;w.roomNodes[String(roomNo)]=String(pack.node.id);if(hero){w.heroNodes[hero]=String(pack.node.id);w.history[hero]=Array.isArray(w.history[hero])?w.history[hero]:[];if(w.history[hero][w.history[hero].length-1]!==String(pack.node.id))w.history[hero].push(String(pack.node.id))}x.world167823=w;
  x.last.worldRuntime167823=true;x.last.worldDungeonId=sel.id;x.last.worldNodeId=String(pack.node.id);x.last.worldZoneLabel=String(pack.node.label||pack.room.name||"Zone");x.last.customRoomRuntime167822=true;x.last.customRoomId=String(pack.room.id||pack.node.roomId||"");x.last.customRoomName=String(pack.room.name||pack.node.label||"Zone");x.last.worldGeometryAuthoritative167835=true;
  return hero;
}
function repairWorld(before,sel,plan){
  let x=readRt();if(!x?.last)return false;const target=String(plan?.targetNodeId||""),reached=!!target&&String(x.last.worldNodeId||"")===target;if(!roomWasCreated(before,x)&&!reached)return false;const pack=worldPack(sel,plan,x);if(!pack)return false;let exact=roomMap(pack.room),changed=false;const old=x.last?.map;
  if(!structuralMatch(old,exact)){exact.objective=clone(old?.objective||x.last?.objective||exact.objective);exact=overlayDynamic(exact,old);x.last.map=exact;x.last.objective=clone(exact.objective);remapEnemies(x,exact);changed=true}else{x.last.map.width=exact.width;x.last.map.height=exact.height;x.last.map.size=exact.width;x.last.map.worldTemplate167835=true;x.last.map.worldGeometryAuthoritative167835=true}
  const hero=ensureWorldState(x,sel,pack),arrival=Number(plan?.edge?.toEntryIndex);x.positions=x.positions&&typeof x.positions==="object"?x.positions:{};if(hero&&(changed||!Number.isInteger(Number(x.positions[hero]))))x.positions[hero]=Number.isInteger(arrival)&&arrival>=0&&arrival<x.last.map.cells.length?arrival:Math.max(0,Number(x.last.map.entryIdx)||0);
  persist(x);
  try{if(!x.last.worldContentApplied167824)ROOT.DungeonZoneContent167824?.applyCurrentZone?.()}catch(e){console.warn("V16.78.35 zone content apply",e)}
  return changed;
}
function patchLabels(){if(!DOC)return;const text=(id,value,label)=>{const s=DOC.getElementById(id),o=s?.querySelector?.('option[value="'+value+'"]');if(o&&o.textContent!==label)o.textContent=label};text("daeGeometry","random","Taille aléatoire 6×6 à 15×15");text("daeSize","small","6×6");text("daeSize","medium","9×9");text("daeSize","large","15×15");text("dungeonCfgSize","small","Petites 6×6");text("dungeonCfgSize","medium","Moyennes 9×9");text("dungeonCfgSize","large","Grandes 15×15")}
function ensureStyle(){if(!DOC||DOC.getElementById("dlr167835Style"))return;const s=DOC.createElement("style");s.id="dlr167835Style";s.textContent=`#dc047RoomBoard{overflow:auto;-webkit-overflow-scrolling:touch}.dc047Grid{width:max-content;min-width:100%}.dc047Grid>.dc047Cell{min-width:28px;min-height:28px}.dc047Grid.dlr167835Large>.dc047Cell{font-size:clamp(11px,2.7vw,18px)}@media(max-width:620px){.dc047Grid>.dc047Cell{min-width:26px;min-height:26px}}`;DOC.head.appendChild(s)}
function markLarge(){if(!DOC)return;const map=readRt()?.last?.map;const g=DOC.querySelector?.("#dc047RoomBoard .dc047Grid");if(g)g.classList.toggle("dlr167835Large",Number(map?.width||map?.size||0)>9)}
function wrapRender(){const core=ROOT.DungeonCore01;if(!core)return false;for(const name of ["render","show"]){const old=core[name];if(typeof old!=="function"||old.__dlr167835)continue;const w=function(){const r=old.apply(this,arguments);patchLabels();markLarge();return r};w.__dlr167835=true;w.__dlr167835Original=old;core[name]=w}return true}
function wrapExplore(){
  const core=ROOT.DungeonCore01;if(!core||typeof core.explore!=="function")return false;const old=core.explore;if(old.__dlr167835)return true;
  const w=function(){if(exploreBusy)return old.apply(this,arguments);exploreBusy=true;const before=clone(readRt()),sel=selectedWorld(),plan=sel?worldPlan(sel):null,desired=sel?null:gridSize();let out;try{out=old.apply(this,arguments);const changed=sel?repairWorld(before,sel,plan):repairGenerated(before,desired);if(changed)try{core.render?.()}catch(e){}markLarge();return out}finally{exploreBusy=false}};
  w.__dlr167835=true;w.__dlr167835Original=old;core.explore=w;return true;
}
function install(){ROOT.dungeonGridSize=gridSize;ROOT.generateDungeonMap=function(kind,enemyQty){return generate(kind,enemyQty,gridSize())};ensureStyle();patchLabels();wrapRender();wrapExplore();markLarge();ROOT.GENSRPG_VERSION=APP_VERSION;return true}
ROOT.DungeonLargeRoom167834={VERSION,APP_VERSION,MIN_SIZE,MAX_SIZE,gridSize,generate,repairGenerated,repairWorld,roomMap,install};
ROOT.DungeonRoomAuthority167835=ROOT.DungeonLargeRoom167834;
install();if(typeof setTimeout==="function")for(const ms of [0,50,250,1000,2500])setTimeout(install,ms);
})();
