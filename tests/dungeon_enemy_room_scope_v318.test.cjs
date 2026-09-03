const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const patch=fs.readFileSync(path.join(__dirname,'..','assets','dungeon','dungeon-core-318.js'),'utf8');

function makeStorage(initial={}){
  const values=new Map(Object.entries(initial));
  return {
    getItem(k){return values.has(k)?values.get(k):null},
    setItem(k,v){values.set(k,String(v))},
    removeItem(k){values.delete(k)}
  };
}
function clone(v){return JSON.parse(JSON.stringify(v))}
function makeContext(options={}){
  const store=makeStorage();
  let enemies=clone(options.enemies||[]),spawnCount=0;
  const roomByHero={...(options.roomByHero||{aldren:10,lyra:9})};
  const runtime=clone(options.runtime||{
    participants:['aldren','lyra'],index:0,room:10,
    positions:{aldren:0,lyra:0},remaining:{aldren:3,lyra:3},
    last:{map:{cells:['entry','floor','exit'],entryIdx:0,exitIdx:2}},heroBranchStates:{},roomStates:{}
  });
  store.setItem('gensrpg_dungeon_runtime_v2',JSON.stringify(runtime));
  const spatial={
    ensure(){},persist(){},
    roomOf(x,id){return roomByHero[id]??x.room},
    setRoom(x,id,room){roomByHero[id]=room},
    activate(x,id){x.room=roomByHero[id]??x.room}
  };
  const ctx={
    console,localStorage:store,
    document:{querySelector(){return null}},
    isDungeonMode(){return true},
    DungeonSpatial313:spatial,
    loadDungeonState(){return {room:runtime.room}},
    loadActiveEnemies(){return clone(enemies)},
    saveActiveEnemies(next){enemies=clone(next)},
    trackSpawnedEnemyInstances(type,qty){
      const out=[];for(let i=0;i<qty;i++){const id=`spawn-${++spawnCount}`;enemies.push({id,enemyId:type,hp:3});out.push(id)}return out;
    },
    dungeonEncounter(room){ctx.trackSpawnedEnemyInstances('dng_skeleton',1);return room},
    dungeonBossRoom(room){ctx.trackSpawnedEnemyInstances('dng_minotaur',1);return room},
    dungeonEventSpawn(){ctx.trackSpawnedEnemyInstances('dng_skeleton',1)},
    dungeonMjSpawnEnemy(){ctx.trackSpawnedEnemyInstances('dng_skeleton',1)},
    applyEnemyConfiguredAbilityEffect(inst){ctx.trackSpawnedEnemyInstances('dng_skeleton',1);return inst},
    DungeonCore01:{render(){},show(){}},
    setTimeout(fn){fn();return 1}
  };
  ctx.window=ctx;
  vm.runInNewContext(patch,ctx,{filename:'dungeon-core-318.js'});
  return {ctx,store,getEnemies:()=>clone(enemies),getSpawnCount:()=>spawnCount,roomByHero};
}

(function eventSpawnBelongsToActiveHeroRoom(){
  const {ctx,getEnemies}=makeContext();
  ctx.dungeonEventSpawn();
  const spawned=getEnemies().at(-1);
  assert.equal(spawned.dungeonRoom,10,'un renfort doit être marqué dans la salle du héros actif');
})();

(function bossRoomArgumentWins(){
  const {ctx,getEnemies}=makeContext();
  ctx.dungeonBossRoom(12);
  assert.equal(getEnemies().at(-1).dungeonRoom,12,'un boss explicitement créé en salle 12 doit appartenir à la salle 12');
})();

(function selectedCombatRoomCanOwnLateSpawn(){
  const {ctx,getEnemies}=makeContext({enemies:[{id:'e1',enemyId:'dng_skeleton',hp:3,dungeonRoom:14}]});
  ctx.dungeonCombatActive=true;
  ctx.dungeonCombatSelection={enemies:['e1']};
  ctx.dungeonEventSpawn();
  assert.equal(getEnemies().at(-1).dungeonRoom,14,'un spawn tardif de combat doit rester dans la salle du combat');
})();

(function movedHeroDoesNotLeakEnemyFromOtherRoom(){
  const {ctx,getEnemies}=makeContext({
    enemies:[{id:'old',enemyId:'dng_skeleton',hp:3,dungeonRoom:9}],
    runtime:{participants:['aldren','lyra'],index:0,room:10,positions:{aldren:0,lyra:0},remaining:{aldren:3,lyra:3},last:{map:{cells:['entry','floor','exit'],entryIdx:0,exitIdx:2}},heroBranchStates:{},roomStates:{}}
  });
  ctx.dungeonEncounter(10);
  const list=getEnemies();
  assert.equal(list.find(e=>e.id==='old').dungeonRoom,9,'un ancien ennemi doit conserver sa salle');
  assert.equal(list.at(-1).dungeonRoom,10,'la nouvelle rencontre doit appartenir à la nouvelle salle');
})();

function makeBranchContext(){
  const runtime={
    participants:['aldren','lyra','brom'],index:0,room:5,
    positions:{aldren:2,lyra:2,brom:2},remaining:{aldren:3,lyra:2,brom:1},
    last:{map:{cells:['entry','floor','floor','floor','exit'],entryIdx:0,exitIdx:4}},
    heroBranchStates:{},roomStates:{}
  };
  const store=makeStorage({'gensrpg_dungeon_runtime_v2':JSON.stringify(runtime)});
  let enemies=[],bossSpawns=0;
  const branchMap={cells:['entry','floor','boss','exit'],entryIdx:0,exitIdx:3};
  function currentRuntime(){return JSON.parse(store.getItem('gensrpg_dungeon_runtime_v2'))}
  function saveRuntime(x){store.setItem('gensrpg_dungeon_runtime_v2',JSON.stringify(x))}
  const spatial={
    ensure(x){x.heroBranchStates=x.heroBranchStates||{}},persist(){},
    activate(x,hero){
      const branch=x.heroBranchStates?.[hero];
      if(branch?.branch?.active){x.last=clone(branch.last);x.enemyCells=clone(branch.enemyCells||{});x.branch=clone(branch.branch);x.cell=branch.cell}
    }
  };
  const context={
    console,localStorage:store,DungeonSpatial313:spatial,
    document:{querySelector(){return null}},setTimeout(fn){fn();return 1},
    isDungeonMode(){return true},gensGameplayModules(){return {movement:true}},
    currentRpgProfile(){return {rpgUniverse:{movement:{mode:'tactical'}}}},
    loadDungeonSceneElements(){return [{id:'cache-boss',cellIndex:2}]},
    loadDungeonState(){return {room:5}},loadActiveEnemies(){return clone(enemies)},saveActiveEnemies(next){enemies=clone(next)},
    DungeonCore01:{render(){},show(){}},showToast(){},CHARS:{aldren:{name:'Aldren'},lyra:{name:'Lyra'},brom:{name:'Brom'}},
    dc200EnterBranch(sourceId){
      const x=currentRuntime(),hero=x.participants[x.index];bossSpawns++;
      const enemy={id:`branch-boss-${bossSpawns}`,enemyId:'dng_minotaur',hp:8,dc200Branch:true};enemies.push(enemy);
      x.heroBranchStates=x.heroBranchStates||{};
      x.heroBranchStates[hero]={room:5,last:{kind:'boss',map:clone(branchMap)},enemyCells:{[enemy.id]:2},branch:{active:true,heroId:hero,sourceId,parentRoom:5,sourceCell:2},cell:0};
      saveRuntime(x);return true;
    }
  };
  context.window=context;
  vm.runInNewContext(patch,context,{filename:'dungeon-core-318.js'});
  return {
    context,store,getEnemies:()=>clone(enemies),getBossSpawns:()=>bossSpawns,
    switchTo(i){const x=currentRuntime();x.index=i;saveRuntime(x)}
  };
}

(function branchIsInitializedOnlyOnceAndShared(){
  const {context,store,switchTo,getBossSpawns,getEnemies}=makeBranchContext();
  context.dc200EnterBranch('cache-boss');
  assert.equal(getBossSpawns(),1,'le premier héros doit initialiser la sous-salle une seule fois');
  let x=JSON.parse(store.getItem('gensrpg_dungeon_runtime_v2'));
  assert.equal(x.remaining.aldren,3,'entrer dans la cache ne doit pas rendre de mouvement');
  assert.equal(x.heroBranchStates.aldren.branch.sourceId,'cache-boss');

  switchTo(1);assert.equal(context.dc200EnterBranch('cache-boss'),true);
  switchTo(2);assert.equal(context.dc200EnterBranch('cache-boss'),true);
  assert.equal(getBossSpawns(),1,'les héros suivants doivent rejoindre la même sous-salle sans nouveau boss');
  x=JSON.parse(store.getItem('gensrpg_dungeon_runtime_v2'));
  assert.equal(x.remaining.aldren,3);
  assert.equal(x.remaining.lyra,2,'rejoindre une sous-salle existante doit conserver le mouvement de Lyra');
  assert.equal(x.remaining.brom,1,'rejoindre une sous-salle existante doit conserver le mouvement de Brom');
  for(const hero of ['aldren','lyra','brom'])assert.equal(x.heroBranchStates[hero].branch.sourceId,'cache-boss');
  assert.equal(getEnemies().filter(e=>e.dc200Branch&&e.hp>0).length,1,'une seule instance de boss doit rester dans la cache');
})();

(function branchJoinStillRequiresDoorCellInTacticalMode(){
  const {context,store,switchTo,getBossSpawns}=makeBranchContext();
  context.dc200EnterBranch('cache-boss');
  switchTo(1);
  const x=JSON.parse(store.getItem('gensrpg_dungeon_runtime_v2'));
  x.positions.lyra=4;store.setItem('gensrpg_dungeon_runtime_v2',JSON.stringify(x));
  assert.equal(context.dc200EnterBranch('cache-boss'),false);
  assert.equal(getBossSpawns(),1,'un héros trop loin ne doit ni entrer ni provoquer un nouveau spawn');
})();

(function deploymentWiringIsPresent(){
  const workflow=fs.readFileSync(path.join(__dirname,'..','.github','workflows','main.yml'),'utf8');
  const sw=fs.readFileSync(path.join(__dirname,'..','service-worker.js'),'utf8');
  assert.match(workflow,/dungeon_enemy_room_scope_v318\.test\.cjs/,'le workflow doit exécuter les régressions Core 3.18.x');
  assert.match(workflow,/assets\/dungeon\/dungeon-core-318\.js/,'le build Pages doit injecter la couche Core 3.18.x');
  assert.match(sw,/const CACHE_NAME\s*=\s*"gensrpg-cache-16\.78\.16-[^"]+"/,'le cache PWA doit rester versionné et pouvoir évoluer avec les hotfix');
  assert.match(sw,/assets\/dungeon\/dungeon-core-318\.js/,'Core 3.18.x doit être pré-caché');
})();

(function patchDoesNotRewriteStableSystems(){
  assert.doesNotMatch(patch,/function\s+(?:moveTo|launchCombat200|endTurn|goBackRoom)\s*\(/,'le patch 3.18.1 ne doit pas réécrire mouvement/combat/tour');
  assert.match(patch,/const VERSION="3\.18\.1"/);
  assert.match(patch,/const APP_VERSION="16\.78\.16"/);
  assert.match(patch,/installBranchGuard/,'le correctif de sous-salle doit rester isolé dans la couche 3.18');
})();

console.log('Dungeon Core 3.18.1 room scope + shared branch regressions: OK');