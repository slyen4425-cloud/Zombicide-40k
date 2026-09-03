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

function makeBranchContext(){
  let enemies=[];
  let bossSpawns=0;
  let originalEntries=0;
  const RT='gensrpg_dungeon_runtime_v2';
  const runtime={
    participants:['aldren','lyra','brom'],index:0,room:4,
    heroRooms:{aldren:4,lyra:4,brom:4},
    positions:{aldren:5,lyra:5,brom:5},remaining:{aldren:3,lyra:2,brom:1},
    roomStates:{'4':{last:{kind:'cache',map:{size:3,cells:Array(9).fill('floor')}},enemyCells:{}}},
    heroBranchStates:{},last:{kind:'cache',map:{size:3,cells:Array(9).fill('floor')}},enemyCells:{},branch:null
  };
  const store=storage({[RT]:JSON.stringify(runtime)});
  const clone=v=>v==null?v:JSON.parse(JSON.stringify(v));
  const spatial={
    ensure(x){x.heroBranchStates=x.heroBranchStates||{};x.roomStates=x.roomStates||{};return x},
    roomOf(x,id){return x.heroRooms?.[id]??x.room},
    persist(x){
      const hero=String(x.participants[x.index]||'');
      if(x.branch?.active&&hero){
        x.heroBranchStates[hero]={room:x.room,last:clone(x.last),enemyCells:clone(x.enemyCells||{}),branch:clone(x.branch),cell:Number(x.positions?.[hero])};
      }else if(x.room>0&&x.last){
        x.roomStates[String(x.room)]={last:clone(x.last),enemyCells:clone(x.enemyCells||{})};
      }
      return x;
    },
    activate(x,id){
      const branch=x.heroBranchStates?.[id];
      if(branch?.branch?.active){
        x.room=branch.room;x.last=clone(branch.last);x.enemyCells=clone(branch.enemyCells||{});x.branch=clone(branch.branch);x.positions[id]=branch.cell;return x;
      }
      const room=x.heroRooms?.[id]??x.room;
      x.room=room;x.branch=null;
      const saved=x.roomStates?.[String(room)];
      if(saved){x.last=clone(saved.last);x.enemyCells=clone(saved.enemyCells||{})}
      return x;
    }
  };
  const context={
    console,Math,Date,
    localStorage:store,
    document:{querySelector(){return null}},
    setTimeout(fn){fn();return 1},
    isDungeonMode(){return true},
    loadDungeonState(){return {room:4}},
    DungeonSpatial313:spatial,
    loadDungeonSceneElements(){return [{id:'cache-boss',cellIndex:5,branchType:'boss'}]},
    gensGameplayModules(){return {movement:true}},
    currentRpgProfile(){return {rpgUniverse:{movement:{mode:'tactical'}}}},
    loadActiveEnemies(){return enemies},
    saveActiveEnemies(next){enemies=next},
    trackSpawnedEnemyInstances(type,qty){
      const ids=[];
      for(let i=0;i<qty;i++){
        const id=`boss-${++bossSpawns}`;ids.push(id);enemies.push({id,enemyId:type,hp:10,dungeonRoom:4,dc200Branch:true});
      }
      return ids;
    },
    dungeonBossRoom(room){return context.trackSpawnedEnemyInstances('dng_necromancer',1,room)},
    CHARS:{aldren:{name:'Aldren'},lyra:{name:'Lyra'},brom:{name:'Brom'}},
    DungeonCore01:{render(){return true}},
    showToast(){}
  };
  context.dc200EnterBranch=function(sourceId){
    originalEntries++;
    const x=JSON.parse(store.getItem(RT));
    const hero=String(x.participants[x.index]||'');
    const movementLeft=Number(x.remaining?.[hero])||0;
    spatial.persist(x);
    x.branch={active:true,heroId:hero,parentRoom:x.room,sourceId:String(sourceId),sourceCell:5};
    x.enemyCells={};
    const cells=Array(25).fill('floor');cells[22]='entry';cells[2]='exit';cells[12]='enemy';
    x.last={kind:'boss',room:x.room,title:'Sous-salle secrète',map:{version:2,size:5,cells,entryIdx:22,exitIdx:2},exitLocked:false,keyEnemyId:''};
    x.positions[hero]=22;x.remaining[hero]=movementLeft;
    context.dungeonBossRoom(x.room);
    x.enemyCells={ [enemies.at(-1).id]:12 };
    spatial.persist(x);
    store.setItem(RT,JSON.stringify(x));
    return true;
  };
  context.window=context;context.globalThis=context;
  vm.createContext(context);vm.runInContext(patch,context);
  function switchTo(index){
    const x=JSON.parse(store.getItem(RT));
    spatial.persist(x);
    x.index=index;
    spatial.activate(x,x.participants[index]);
    store.setItem(RT,JSON.stringify(x));
  }
  return {context,store,getEnemies:()=>enemies,getBossSpawns:()=>bossSpawns,getOriginalEntries:()=>originalEntries,switchTo};
}

(function branchBossInitializesOnlyOnceForAllHeroes(){
  const {context,store,getEnemies,getBossSpawns,getOriginalEntries,switchTo}=makeBranchContext();
  assert.equal(context.dc200EnterBranch('cache-boss'),true);
  assert.equal(getBossSpawns(),1,'le premier héros doit générer exactement un boss');
  assert.equal(getOriginalEntries(),1);

  switchTo(1);
  assert.equal(context.dc200EnterBranch('cache-boss'),true);
  assert.equal(getBossSpawns(),1,'le deuxième héros doit rejoindre la même sous-salle sans générer un boss');
  assert.equal(getOriginalEntries(),1,'le déclencheur original de sous-salle ne doit être exécuté qu’une fois');

  switchTo(2);
  assert.equal(context.dc200EnterBranch('cache-boss'),true);
  assert.equal(getBossSpawns(),1,'le troisième héros doit rejoindre la même sous-salle sans générer un boss');
  assert.equal(getOriginalEntries(),1);

  const x=JSON.parse(store.getItem('gensrpg_dungeon_runtime_v2'));
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
