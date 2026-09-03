/* GenSrpG Dungeon Core 3.18.1 — explicit enemy room ownership + shared branch initialization */
(function(){
"use strict";

const ROOT=typeof window!=="undefined"?window:globalThis;
const RT_KEY="gensrpg_dungeon_runtime_v2";
const VERSION="3.18.1";
const APP_VERSION="16.78.16";
const roomStack=[];

function dungeonMode(){
  try{return typeof ROOT.isDungeonMode==="function"&&ROOT.isDungeonMode()}catch(e){return false}
}
function normRoom(value){
  const n=Number(value);
  return Number.isFinite(n)&&n>0?Math.max(1,Math.round(n)):0;
}
function clone(value){
  try{return value==null?value:JSON.parse(JSON.stringify(value))}catch(e){return value}
}
function readRuntime(){
  try{const x=JSON.parse(localStorage.getItem(RT_KEY)||"null");return x&&typeof x==="object"?x:null}catch(e){return null}
}
function writeRuntime(x){
  try{localStorage.setItem(RT_KEY,JSON.stringify(x||{}));return true}catch(e){return false}
}
function activeHeroId(x){
  const list=Array.isArray(x?.participants)?x.participants:[];
  const i=Math.max(0,Math.min(Math.max(0,list.length-1),Number(x?.index)||0));
  return String(list[i]||"");
}
function runtimeRoom(){
  const x=readRuntime();if(!x)return 0;
  try{
    const spatial=ROOT.DungeonSpatial313;
    if(spatial?.ensure)spatial.ensure(x);
    const heroId=activeHeroId(x);
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

function movementIsTactical(){
  try{
    const mods=typeof ROOT.gensGameplayModules==="function"?ROOT.gensGameplayModules():null;
    const p=typeof ROOT.currentRpgProfile==="function"?ROOT.currentRpgProfile():null;
    const mv=p?.rpgUniverse?.movement||{};
    return !!mods?.movement&&String(mv.mode||"").toLowerCase()==="tactical";
  }catch(e){return false}
}
function sceneElement(sourceId){
  try{return (ROOT.loadDungeonSceneElements?.()||[]).find(e=>String(e?.id)===String(sourceId))||null}catch(e){return null}
}
function branchStateForSource(x,sourceId,excludeHero){
  const source=String(sourceId||"");
  if(!source||!x?.heroBranchStates||typeof x.heroBranchStates!=="object")return null;
  const parentRoom=normRoom(x.room);
  for(const [heroId,state] of Object.entries(x.heroBranchStates)){
    if(String(heroId)===String(excludeHero||""))continue;
    if(!state?.branch?.active)continue;
    if(String(state.branch.sourceId||"")!==source)continue;
    const stateRoom=normRoom(state.branch.parentRoom??state.room);
    if(parentRoom&&stateRoom&&stateRoom!==parentRoom)continue;
    return state;
  }
  return null;
}
function entryIndex(state){
  const map=state?.last?.map||{};
  const direct=Number(map.entryIdx);
  if(Number.isInteger(direct)&&direct>=0)return direct;
  const cells=Array.isArray(map.cells)?map.cells:[];
  const i=cells.findIndex(c=>String(c||"").toLowerCase()==="entry");
  return i>=0?i:Number(state?.cell)||0;
}
function heroName(id){
  try{return ROOT.CHARS?.[id]?.name||ROOT.findCustomHero?.(id)?.name||String(id||"Héros")}catch(e){return String(id||"Héros")}
}
function branchNotice(hero){
  const text=heroName(hero)+" rejoint la sous-salle déjà découverte. Aucun nouvel ennemi ni événement n'est généré.";
  try{if(typeof ROOT.showToast==="function"){ROOT.showToast("🕳️ "+text);return}}catch(e){}
  try{if(typeof ROOT.modal==="function"){ROOT.modal("🕳️ Sous-salle",text);return}}catch(e){}
}
function tagNewBranchEnemies(before,sourceId){
  try{
    const list=ROOT.loadActiveEnemies?.()||[];let changed=false;
    list.forEach(e=>{
      const id=String(e?.id||"");
      if(!id||before.has(id)||e?.dc200Branch!==true)return;
      if(String(e.dc318BranchSourceId||"")!==String(sourceId||"")){e.dc318BranchSourceId=String(sourceId||"");changed=true}
    });
    if(changed&&typeof ROOT.saveActiveEnemies==="function")ROOT.saveActiveEnemies(list);
  }catch(e){console.warn("Dungeon Core 3.18.1 branch tag",e)}
}
function installBranchGuard(){
  const old=ROOT.dc200EnterBranch;
  if(typeof old!=="function"||old.__dc318BranchGuard)return typeof old==="function";
  const wrapped=function(sourceId){
    if(!dungeonMode())return old.apply(this,arguments);
    const x=readRuntime();
    if(!x)return old.apply(this,arguments);
    const hero=activeHeroId(x);
    if(!hero||x.branch?.active)return old.apply(this,arguments);
    const existing=branchStateForSource(x,sourceId,hero);
    if(!existing){
      const before=enemyIds();
      const out=old.apply(this,arguments);
      tagNewBranchEnemies(before,sourceId);
      return out;
    }

    const el=sceneElement(sourceId),sourceCell=Number(el?.cellIndex??existing?.branch?.sourceCell);
    if(movementIsTactical()&&Number.isFinite(sourceCell)&&Number(x.positions?.[hero])!==sourceCell){
      try{if(typeof ROOT.modal==="function")return ROOT.modal("🕳️ Passage","📍 Place le héros actif sur la case du passage.")}catch(e){}
      return false;
    }

    const movementLeft=Number.isFinite(Number(x.remaining?.[hero]))?Math.max(0,Number(x.remaining[hero])):0;
    const spatial=ROOT.DungeonSpatial313;
    try{spatial?.ensure?.(x);spatial?.persist?.(x)}catch(e){console.warn("Dungeon Core 3.18.1 branch persist",e)}
    x.heroBranchStates=x.heroBranchStates&&typeof x.heroBranchStates==="object"?x.heroBranchStates:{};
    const joined=clone(existing)||{};
    joined.branch={...(clone(existing.branch)||{}),active:true,heroId:hero,sourceId:String(sourceId)};
    joined.cell=entryIndex(existing);
    x.heroBranchStates[hero]=joined;
    x.positions=x.positions&&typeof x.positions==="object"?x.positions:{};
    x.remaining=x.remaining&&typeof x.remaining==="object"?x.remaining:{};
    x.positions[hero]=joined.cell;
    x.remaining[hero]=movementLeft;
    try{spatial?.activate?.(x,hero)}catch(e){
      x.room=Number(joined.room??joined.branch?.parentRoom??x.room)||0;
      x.last=clone(joined.last)||null;
      x.enemyCells=clone(joined.enemyCells||{});
      x.branch=clone(joined.branch)||null;
    }
    x.remaining[hero]=movementLeft;
    writeRuntime(x);
    try{ROOT.DungeonCore01?.render?.()}catch(e){}
    branchNotice(hero);
    return true;
  };
  wrapped.__dc318=true;
  wrapped.__dc318BranchGuard=true;
  wrapped.__dc318Original=old;
  ROOT.dc200EnterBranch=wrapped;
  try{
    if(ROOT.DungeonCore01&&typeof ROOT.DungeonCore01.enterBranch==="function")ROOT.DungeonCore01.enterBranch=wrapped;
  }catch(e){}
  return true;
}

function install(){
  installTracker();
  wrapRoomProducer("dungeonEncounter",function(room){return room});
  wrapRoomProducer("dungeonBossRoom",function(room){return room});
  wrapRoomProducer("dungeonEventSpawn",function(){return activeRoom()});
  wrapRoomProducer("dungeonMjSpawnEnemy",function(){return activeRoom()});
  wrapRoomProducer("applyEnemyConfiguredAbilityEffect",function(inst){return normRoom(inst?.dungeonRoom)||activeRoom()});
  installBranchGuard();

  ROOT.GENSRPG_VERSION=APP_VERSION;
  ROOT.DUNGEON_CORE_VERSION=VERSION;
  try{
    const b=document.querySelector(".dc01Badge");if(b)b.textContent="NOUVEAU MOTEUR · CORE "+VERSION;
    const f=document.querySelector(".dc01Footer");if(f)f.textContent="Dungeon Core "+VERSION+" · ennemis liés à leur salle et sous-salles initialisées une seule fois.";
  }catch(e){}
  return true;
}
function debug(){
  const room=activeRoom();
  let all=[];try{all=ROOT.loadActiveEnemies?.()||[]}catch(e){}
  const x=readRuntime();
  return {
    version:VERSION,appVersion:APP_VERSION,room,
    branchSources:Object.values(x?.heroBranchStates||{}).filter(s=>s?.branch?.active).map(s=>String(s.branch.sourceId||"")),
    currentRoomEnemies:all.filter(e=>!e?.removed&&!e?.defeated&&Number(e?.hp)>0&&normRoom(e?.dungeonRoom)===room).map(e=>({id:e.id,enemyId:e.enemyId,dungeonRoom:e.dungeonRoom,hp:e.hp,branchSource:e.dc318BranchSourceId||""})),
    otherRoomEnemies:all.filter(e=>!e?.removed&&!e?.defeated&&Number(e?.hp)>0&&normRoom(e?.dungeonRoom)!==room).map(e=>({id:e.id,enemyId:e.enemyId,dungeonRoom:e.dungeonRoom,hp:e.hp,branchSource:e.dc318BranchSourceId||""}))
  };
}

ROOT.DungeonCore318={VERSION,APP_VERSION,activeRoom,withRoom,stamp,install,debug,branchStateForSource};
install();
/* Garde-fou si une couche tardive remplace encore une fonction pendant le boot. */
if(typeof setTimeout==="function")setTimeout(install,0);
})();
