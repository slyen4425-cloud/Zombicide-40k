/* GenSrpG Dungeon Core 3.18 — explicit enemy room ownership (minimal stability patch) */
(function(){
"use strict";

const ROOT=typeof window!=="undefined"?window:globalThis;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="3.18";
const APP_VERSION="16.78.15";
const roomStack=[];

function dungeonMode(){
  try{return typeof ROOT.isDungeonMode==="function"&&ROOT.isDungeonMode()}catch(e){return false}
}
function normRoom(value){
  const n=Number(value);
  return Number.isFinite(n)&&n>0?Math.max(1,Math.round(n)):0;
}
function readRuntime(){
  try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}
}
function runtimeRoom(){
  const x=readRuntime();if(!x)return 0;
  try{
    const spatial=ROOT.DungeonSpatial313;
    if(spatial?.ensure)spatial.ensure(x);
    const list=Array.isArray(x.participants)?x.participants:[];
    const i=Math.max(0,Math.min(Math.max(0,list.length-1),Number(x.index)||0));
    const heroId=String(list[i]||"");
    if(heroId&&typeof spatial?.roomOf==="function"){
      const r=normRoom(spatial.roomOf(x,heroId));
      if(r)return r;
    }
  }catch(e){}
  return normRoom(x.room);
}
function legacyRoom(){
  try{return normRoom(ROOT.loadDungeonState?.()?.room)}catch(e){return 0}
}
function selectedEnemyRoom(){
  try{
    if(!ROOT.dungeonCombatActive)return 0;
    const ids=new Set((ROOT.dungeonCombatSelection?.enemies||[]).map(String));
    if(!ids.size)return 0;
    const rooms=[...new Set((ROOT.loadActiveEnemies?.()||[])
      .filter(e=>ids.has(String(e?.id))&&!e?.removed&&!e?.defeated&&Number(e?.hp)>0)
      .map(e=>normRoom(e?.dungeonRoom)).filter(Boolean))];
    return rooms.length===1?rooms[0]:0;
  }catch(e){return 0}
}
function currentContextRoom(){
  for(let i=roomStack.length-1;i>=0;i--){const r=normRoom(roomStack[i]);if(r)return r}
  return 0;
}
function activeRoom(){
  return currentContextRoom()||selectedEnemyRoom()||runtimeRoom()||legacyRoom();
}
function withRoom(room,fn){
  const r=normRoom(room)||activeRoom();
  roomStack.push(r);
  try{return fn(r)}finally{roomStack.pop()}
}
function enemyIds(){
  try{return new Set((ROOT.loadActiveEnemies?.()||[]).map(e=>String(e?.id||"")).filter(Boolean))}catch(e){return new Set()}
}
function idsAddedSince(before){
  try{return (ROOT.loadActiveEnemies?.()||[]).map(e=>String(e?.id||"")).filter(id=>id&&!before.has(id))}catch(e){return []}
}
function stamp(ids,room){
  if(!dungeonMode())return 0;
  const target=normRoom(room);if(!target)return 0;
  const wanted=new Set((ids||[]).map(String).filter(Boolean));if(!wanted.size)return 0;
  try{
    const list=ROOT.loadActiveEnemies?.()||[];let changed=0;
    list.forEach(e=>{
      if(!wanted.has(String(e?.id||"")))return;
      if(normRoom(e.dungeonRoom)!==target){e.dungeonRoom=target;changed++}
    });
    if(changed&&typeof ROOT.saveActiveEnemies==="function")ROOT.saveActiveEnemies(list);
    return changed;
  }catch(e){console.warn("Dungeon Core 3.18 room stamp",e);return 0}
}
function wrapRoomProducer(name,roomResolver){
  const old=ROOT[name];if(typeof old!=="function"||old.__dc318)return false;
  const wrapped=function(){
    if(!dungeonMode())return old.apply(this,arguments);
    const args=arguments;
    let explicit=0;
    try{explicit=normRoom(roomResolver?roomResolver.apply(this,args):args[0])}catch(e){}
    return withRoom(explicit||activeRoom(),room=>{
      const before=enemyIds();
      const out=old.apply(this,args);
      stamp(idsAddedSince(before),room);
      return out;
    });
  };
  wrapped.__dc318=true;wrapped.__dc318Original=old;ROOT[name]=wrapped;return true;
}
function installTracker(){
  const old=ROOT.trackSpawnedEnemyInstances;
  if(typeof old!=="function"||old.__dc318)return typeof old==="function";
  const wrapped=function(type,qty,explicitRoom){
    if(!dungeonMode())return old.apply(this,arguments);
    const room=normRoom(explicitRoom)||activeRoom();
    const before=enemyIds();
    const created=old.apply(this,[type,qty]);
    const ids=Array.isArray(created)&&created.length?created.map(String):idsAddedSince(before);
    stamp(ids,room);
    return created;
  };
  wrapped.__dc318=true;wrapped.__dc318Original=old;ROOT.trackSpawnedEnemyInstances=wrapped;return true;
}
function install(){
  installTracker();
  wrapRoomProducer("dungeonEncounter",function(room){return room});
  wrapRoomProducer("dungeonBossRoom",function(room){return room});
  wrapRoomProducer("dungeonEventSpawn",function(){return activeRoom()});
  wrapRoomProducer("dungeonMjSpawnEnemy",function(){return activeRoom()});
  wrapRoomProducer("applyEnemyConfiguredAbilityEffect",function(inst){return normRoom(inst?.dungeonRoom)||activeRoom()});

  ROOT.GENSRPG_VERSION=APP_VERSION;
  ROOT.DUNGEON_CORE_VERSION=VERSION;
  try{
    const b=document.querySelector(".dc01Badge");if(b)b.textContent="NOUVEAU MOTEUR · CORE "+VERSION;
    const f=document.querySelector(".dc01Footer");if(f)f.textContent="Dungeon Core "+VERSION+" · instanciation ennemie liée explicitement à la salle.";
  }catch(e){}
  return true;
}
function debug(){
  const room=activeRoom();
  let all=[];try{all=ROOT.loadActiveEnemies?.()||[]}catch(e){}
  return {
    version:VERSION,appVersion:APP_VERSION,room,
    currentRoomEnemies:all.filter(e=>!e?.removed&&!e?.defeated&&Number(e?.hp)>0&&normRoom(e?.dungeonRoom)===room).map(e=>({id:e.id,enemyId:e.enemyId,dungeonRoom:e.dungeonRoom,hp:e.hp})),
    otherRoomEnemies:all.filter(e=>!e?.removed&&!e?.defeated&&Number(e?.hp)>0&&normRoom(e?.dungeonRoom)!==room).map(e=>({id:e.id,enemyId:e.enemyId,dungeonRoom:e.dungeonRoom,hp:e.hp}))
  };
}

ROOT.DungeonCore318={VERSION,APP_VERSION,activeRoom,withRoom,stamp,install,debug};
install();
/* Garde-fou si une couche tardive remplace encore une fonction pendant le boot. */
if(typeof setTimeout==="function")setTimeout(install,0);
})();
