const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const patch=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-core-318.js'),'utf8');

function storage(initial={}){
  const m=new Map(Object.entries(initial));
  return {getItem(k){return m.has(k)?m.get(k):null},setItem(k,v){m.set(k,String(v))},removeItem(k){m.delete(k)}};
}
function makeContext({dungeon=true,runtimeRoom=3,legacyRoom=8}={}){
  let seq=0;
  let enemies=[{id:'old-room2',enemyId:'dng_skeleton',hp:2,dungeonRoom:2}];
  const runtime={participants:['aldren'],index:0,room:runtimeRoom,heroRooms:{aldren:runtimeRoom},positions:{},remaining:{},roomStates:{},heroBranchStates:{}};
  const context={
    console,Math,Date,
    localStorage:storage({gensrpg_dungeon_runtime_v2:JSON.stringify(runtime)}),
    document:{querySelector(){return null}},
    setTimeout(fn){fn();return 1},
    isDungeonMode(){return dungeon},
    loadDungeonState(){return {room:legacyRoom}},
    DungeonSpatial313:{ensure(x){return x},roomOf(x,id){return x.heroRooms?.[id]??x.room}},
    loadActiveEnemies(){return enemies},
    saveActiveEnemies(next){enemies=next},
    trackSpawnedEnemyInstances(type,qty){
      const created=[];
      for(let i=0;i<qty;i++){
        const id='new-'+(++seq);created.push(id);
        enemies.push({id,enemyId:type,hp:5,dungeonRoom:dungeon?legacyRoom:null});
      }
      return created;
    }
  };
  context.dungeonEncounter=function(room){
    const ids=context.trackSpawnedEnemyInstances('dng_skeleton',1);
    return {title:'encounter',room,ids};
  };
  context.dungeonBossRoom=function(room){
    const ids=context.trackSpawnedEnemyInstances('dng_necromancer',1);
    return {title:'boss',room,ids};
  };
  context.dungeonEventSpawn=function(){
    const ids=context.trackSpawnedEnemyInstances('dng_ghoul',1);
    return {spawned:1,ids};
  };
  context.applyEnemyConfiguredAbilityEffect=function(inst){
    const ids=context.trackSpawnedEnemyInstances('dng_skeleton',1);
    return {inst,ids};
  };
  context.dungeonMjSpawnEnemy=function(){return context.trackSpawnedEnemyInstances('dng_orc',1)};
  context.window=context;context.globalThis=context;
  vm.createContext(context);vm.runInContext(patch,context);
  return {context,getEnemies:()=>enemies};
}

(function bossUsesExplicitTargetRoom(){
  const {context,getEnemies}=makeContext({runtimeRoom:8,legacyRoom:8});
  const out=context.dungeonBossRoom(10);
  const boss=getEnemies().find(e=>out.ids.includes(e.id));
  assert.equal(boss.dungeonRoom,10,'le boss doit appartenir à la salle demandée, pas à la salle legacy');
  const liveIn10=getEnemies().filter(e=>e.hp>0&&e.dungeonRoom===10);
  assert.equal(liveIn10.length,1,'le boss doit être retrouvable par le verrouillage/clé de la salle 10');
})();

(function normalEncounterUsesExplicitTargetRoom(){
  const {context,getEnemies}=makeContext({runtimeRoom:4,legacyRoom:3});
  const out=context.dungeonEncounter(6);
  assert.equal(getEnemies().find(e=>out.ids.includes(e.id)).dungeonRoom,6);
})();

(function existingEnemiesNeverMove(){
  const {context,getEnemies}=makeContext({runtimeRoom:5,legacyRoom:2});
  context.dungeonEncounter(5);
  assert.equal(getEnemies().find(e=>e.id==='old-room2').dungeonRoom,2,'une instance existante ne doit jamais être déplacée par le correctif');
})();

(function eventUsesActiveHeroRuntimeRoom(){
  const {context,getEnemies}=makeContext({runtimeRoom:4,legacyRoom:2});
  const out=context.dungeonEventSpawn(1,3);
  assert.equal(getEnemies().find(e=>out.ids.includes(e.id)).dungeonRoom,4,'un événement doit apparaître dans la salle du héros actif');
})();

(function summonUsesSourceEnemyRoom(){
  const {context,getEnemies}=makeContext({runtimeRoom:3,legacyRoom:2});
  const out=context.applyEnemyConfiguredAbilityEffect({id:'summoner',dungeonRoom:7});
  assert.equal(getEnemies().find(e=>out.ids.includes(e.id)).dungeonRoom,7,'une invocation doit rester dans la salle de sa source');
})();

(function directTrackerFallsBackToRuntimeRoom(){
  const {context,getEnemies}=makeContext({runtimeRoom:9,legacyRoom:1});
  const ids=context.trackSpawnedEnemyInstances('dng_skeleton',1);
  assert.equal(getEnemies().find(e=>ids.includes(e.id)).dungeonRoom,9);
})();

(function survivalModeIsUntouched(){
  const {context,getEnemies}=makeContext({dungeon:false,runtimeRoom:9,legacyRoom:4});
  const ids=context.trackSpawnedEnemyInstances('zombie',1);
  const e=getEnemies().find(x=>ids.includes(x.id));
  assert.equal(e.dungeonRoom,null,'hors Dungeon, le tracker original doit rester inchangé');
})();

(function deploymentWiringIsPresent(){
  const workflow=fs.readFileSync(path.join(__dirname,'..','.github','workflows','main.yml'),'utf8');
  const sw=fs.readFileSync(path.join(__dirname,'..','service-worker.js'),'utf8');
  assert.match(workflow,/dungeon_enemy_room_scope_v318\.test\.cjs/,'le workflow doit exécuter le test 3.18');
  assert.match(workflow,/assets\/dungeon\/dungeon-core-318\.js/,'le build Pages doit injecter Core 3.18');
  assert.match(sw,/gensrpg-cache-16\.78\.15-dungeon-room-scope/,'le cache PWA doit être incrémenté');
  assert.match(sw,/assets\/dungeon\/dungeon-core-318\.js/,'Core 3.18 doit être pré-caché');
})();

(function patchDoesNotRewriteStableSystems(){
  assert.doesNotMatch(patch,/function\s+(?:moveTo|launchCombat200|endTurn|goBackRoom)\s*\(/,'le patch 3.18 ne doit pas réécrire mouvement/combat/tour');
  assert.match(patch,/const VERSION="3\.18"/);
  assert.match(patch,/const APP_VERSION="16\.78\.15"/);
})();

console.log('Dungeon Core 3.18 enemy room scope regressions: OK');
