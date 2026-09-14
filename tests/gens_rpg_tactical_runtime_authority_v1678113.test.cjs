const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const P=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-authority-1678113.js'));

assert.equal(P.APP_VERSION,'16.78.114.10');
assert.equal(P.WALL_ASSET,'assets/dungeon/creatures/dng_wall_block.jpg');
assert.equal(P.ROLL_DURATION,680,'historical constant may remain exported but V113 no longer owns dice animation');

function baseState(){
  return {
    room:1,index:0,participants:['h1','h2','h3'],
    heroRooms:{h1:1,h2:1,h3:2},positions:{h1:6,h2:7,h3:6},
    heroBranchStates:{h2:{room:1,cell:7,branch:{active:true,parentRoom:1,sourceId:'cache'}}},
    branch:null,enemyCells:{ep:8,eb:9},
    last:{map:{width:5,height:5,cells:Array(25).fill('floor')}}
  };
}
const enemies=[
  {id:'ep',enemyId:'goblin',hp:5,dungeonRoom:1,vision:2},
  {id:'eb',enemyId:'boss',hp:9,dungeonRoom:1,vision:3,dc200Branch:true,dc318BranchSourceId:'cache'}
];
const rt={
  loadDungeonState:()=>baseState(),loadActiveEnemies:()=>enemies,
  activeEnemyDefinition:e=>({rule:{vision:e==='goblin'?2:3}}),
  dungeonEnemyDerivedForInstance:()=>({}),
  currentRpgProfile:()=>({rpgUniverse:{movement:{combatAssistRange:3}}}),
  GensCleanRpgStats167874:{runtimeDefs:()=>[],extraTotal:()=>0}
};

const outside=baseState();outside.heroRooms.h2=0;outside.positions.h2=0;delete outside.heroBranchStates.h2;
assert.equal(P.heroEntered(outside,'h1'),true);
assert.equal(P.heroEntered(outside,'h2'),false,'a selected hero still at the dungeon entrance room 0 is not a combatant');

assert.deepEqual(P.heroScope(baseState(),'h1',rt),{room:1,branchSourceId:''});
assert.deepEqual(P.heroScope(baseState(),'h2',rt),{room:1,branchSourceId:'cache'});
assert.deepEqual(P.enemyScope(baseState(),enemies[1]),{room:1,branchSourceId:'cache'});
assert.deepEqual(P.detectionEnemyIds(rt,baseState(),enemies),['ep'],'active parent room must not see branch enemies');

{
  const sel=P.selectCombatants(rt,{enemyIds:['ep'],heroIds:['h1','h2','h3']});
  assert.deepEqual(sel.heroIds,['h1'],'hero in a sub-room and hero in another room must not be pulled into parent-room combat');
  assert.deepEqual(sel.enemyIds,['ep']);
}
{
  const sel=P.selectCombatants(rt,{enemyIds:['eb'],heroIds:['h1','h2','h3']});
  assert.deepEqual(sel.heroIds,['h2'],'branch combat must select only heroes saved in the same branch source');
  assert.deepEqual(sel.enemyIds,['eb']);
}

{
  const blocked=baseState();blocked.last.map.cells[7]='wall';const rtBlocked={...rt,loadDungeonState:()=>blocked};
  assert.deepEqual(P.detectionEnemyIds(rtBlocked,blocked,enemies),[],'wall must block enemy vision');
}

{
  const far=baseState();far.positions.h1=5;far.enemyCells.ep=9;enemies[0].vision=1;
  const rtVision={...rt,loadDungeonState:()=>far,GensCleanRpgStats167874:{runtimeDefs:()=>[],extraTotal:(target,id)=>target==='enemy_vision'&&id==='h1'?3:0}};
  assert.equal(P.enemyVision(rtVision,enemies[0],'h1'),4,'configured canonical enemy_vision modifier must be honored');
  assert.deepEqual(P.detectionEnemyIds(rtVision,far,[enemies[0]]),['ep']);
  enemies[0].vision=2;
}

{
  let received=null,canonicalDecorations=0;
  function base(runtime,opts){
    received=opts;
    return {grid:{width:5,height:5,blocked:[]},actors:[
      ...opts.heroIds.map(id=>({id,side:'hero',x:0,y:0,meta:{heroId:id}})),
      ...opts.enemyIds.map(id=>({id:'enemy:'+id,side:'enemy',x:4,y:4,meta:{instanceId:id}}))
    ],meta:{}};
  }
  function old112(){throw new Error('V112 numeric selector must be bypassed by V113');}
  old112.__gensRpg112Spatial=true;old112.__original=base;
  const local={...rt,GensRpgTacticalCombatV2Adapter:{createBattle:old112},GensRpgTacticalCombatV2Ui:{getBattle:()=>null},GensRpgTacticalStats1678110:{decorateBattle(runtime,battle,opts){canonicalDecorations++;assert.equal(opts.force,true);battle.meta.canonical='v110';return battle}}};
  assert.equal(P.hookAdapter(local),true);
  assert.equal(local.GensRpgTacticalCombatV2Adapter.createBattle.__gensRpg113Scope,true);
  assert.equal(local.GensRpgTacticalCombatV2Adapter.createBattle.__gensRpg112Spatial,true,'marker prevents V112 retry from wrapping V113 again');
  const battle=local.GensRpgTacticalCombatV2Adapter.createBattle(local,{enemyIds:['ep'],heroIds:['h1','h2','h3']});
  assert.deepEqual(received.heroIds,['h1']);
  assert.deepEqual(received.enemyIds,['ep']);
  assert.equal(canonicalDecorations,1,'final scoped battle must receive exactly one final canonical V110 snapshot pass');
  assert.equal(battle.meta.canonical,'v110');
}

assert.deepEqual(P.rowRolls({rollsDisplay:[12,88]}),[12,88]);
assert.deepEqual(P.rowRolls({roll:42}),[42]);
assert.equal(P.animateDiceOverlay(rt),false,'V113 no longer owns visual dice animation');

const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-authority-1678113.js'),'utf8');
const integration=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.match(source,/dng_wall_block\.jpg/,'V113 must agree with the Builder wall asset');
assert.doesNotMatch(source,/const WALL_ASSET="assets\/dungeon\/creatures\/dungeon_wall\.png"/);
assert.match(source,/function animateDiceOverlay\(rt=R\)\{return false\}/,'V113 must not start a second dice animation');
assert.doesNotMatch(source,/setInterval\(tick,55\)/);
assert.match(source,/#dc047RoomBoard \.dc047Cell/,'real board cell interactions must schedule detection');
assert.match(source,/dc318BranchSourceId/,'sub-room scope must use Core 3.18 branch ownership');
assert.match(source,/__gensRpg112Spatial=true/,'V113 must prevent V112 retry from re-wrapping combat creation');
assert.match(source,/GensRpgTacticalStats1678110\?\.decorateBattle/,'V113 must reassert V110 canonical snapshots after final spatial scoping');
assert.match(integration,/gens-rpg-tactical-runtime-authority-1678113\.js\?v=16\.78\.114\.10/,'V113 must load after V112');
assert.match(sw,/gensrpg-cache-16\.78\.114\.6-consolidated-tactical-runtime/);
assert.match(sw,/gens-rpg-tactical-runtime-authority-1678113\.js/);

console.log('V16.78.113 scope/detection preserved; V114.6 owns final wall/dice presentation and reasserts V110 stats: OK');
