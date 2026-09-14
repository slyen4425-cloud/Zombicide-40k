const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const P=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-coherence-1678112.js'));

assert.equal(P.APP_VERSION,'16.78.112');
assert.equal(P.WALL_ASSET,'assets/dungeon/creatures/dng_wall_block.jpg');
assert.equal(P.DEFAULT_PERCEPTION,3);

function state(cells=Array(25).fill('floor')){
  return {room:1,index:0,participants:['h1','h2','h3'],heroRooms:{h1:1,h2:1,h3:2},positions:{h1:6,h2:7,h3:6},enemyCells:{e1:8,e2:24},last:{map:{width:5,height:5,cells}}};
}
const enemies=[
  {id:'e1',enemyId:'goblin',hp:5,dungeonRoom:1,vision:2},
  {id:'e2',enemyId:'orc',hp:8,dungeonRoom:1,vision:1}
];
const rt={
  loadDungeonState:()=>state(),
  loadActiveEnemies:()=>enemies,
  activeEnemyDefinition:e=>({name:e,rule:{vision:e==='goblin'?2:1,range:1}}),
  dungeonEnemyDerivedForInstance:()=>({}),
  currentRpgProfile:()=>({rpgUniverse:{movement:{combatAssistRange:3}}}),
  GensCleanRpgStats167874:{runtimeDefs:()=>[]}
};

assert.deepEqual(P.cellXY(state(),6),{x:1,y:1});
assert.equal(P.pathDistance(state(),6,8,4),2);
assert.equal(P.lineOfSightCells(state(),6,8),true);
const blocked=state(Array.from({length:25},(_,i)=>i===7?'wall':'floor'));
blocked.heroRooms.h2=2;
assert.equal(P.lineOfSightCells(blocked,6,8),false,'wall must block enemy vision');

assert.deepEqual(P.detectionEnemyIds(rt,state(),enemies),['e1'],'only the enemy with range+LOS should detect a hero');
assert.deepEqual(P.detectionEnemyIds(rt,blocked,enemies),[],'detection must not pass through a wall');

{
  const sel=P.selectCombatants(rt,{enemyIds:['e1']});
  assert.equal(sel.room,1);
  assert.deepEqual(sel.heroIds.sort(),['h1','h2'],'same-room nearby hero joins, hero in another room never joins');
  assert.deepEqual(sel.enemyIds,['e1'],'unaware distant enemy must not be pulled into combat');
  assert.ok(!sel.heroIds.includes('h3'));
}

{
  const rtPerception={...rt,GensCleanRpgStats167874:{runtimeDefs:()=>[{id:'perception',name:'Perception'}],value:(id)=>id==='h2'?1:3}};
  const farState=state();farState.positions.h2=20;rtPerception.loadDungeonState=()=>farState;
  const sel=P.selectCombatants(rtPerception,{enemyIds:['e1']});
  assert.deepEqual(sel.heroIds,['h1'],'hero perception must gate joining the fight');
}

{
  const battle={grid:{width:5,height:5,blocked:[]},actors:[
    {id:'h1',side:'hero',x:0,y:0,meta:{heroId:'h1'}},
    {id:'enemy:e1',side:'enemy',x:4,y:4,meta:{instanceId:'e1'}}
  ],meta:{}};
  const moved=P.applyRuntimePositions(rt,battle,{room:1,heroIds:['h1'],enemyIds:['e1']});
  assert.equal(moved,2);
  assert.deepEqual({x:battle.actors[0].x,y:battle.actors[0].y},{x:1,y:1});
  assert.deepEqual({x:battle.actors[1].x,y:battle.actors[1].y},{x:3,y:1});
}

assert.match(P.explainAttack({hit:false,dice:1,rollHighToHit:true,hitTarget:70,roll:50}),/seuil de réussite/);
assert.match(P.explainAttack({hit:true,damage:0,damageType:'physical',rawDamage:2,armor:3}),/armure 3/i);
assert.match(P.explainAttack({hit:true,damage:0,damageType:'fire',rawDamage:4,resistance:100,resistanceKind:'percent'}),/résistance 100%/i);

const source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-coherence-1678112.js'),'utf8');
const integration=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-integration.js'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
assert.match(source,/gtv2112WallCell/,'V112 wall tagging remains explicit');
assert.match(source,/background:#171512 url\("\$\{WALL_ASSET\}"\) center\/cover no-repeat!important/,'V112 must paint the Builder wall texture directly on the cell');
assert.doesNotMatch(source,/background-image:none!important/,'V112 must never blank a wall before repaint');
assert.match(source,/::before\{content:none!important;display:none!important/,'obsolete pseudo wall layer must stay disabled');
assert.match(source,/min-height:38px/,'mobile fixed actions must be more compact');
assert.match(source,/data-v112-sheet/,'actor click detail must expose the full tactical sheet');
assert.doesNotMatch(source,/gtv2112DiceRoll/,'V112 no longer owns dice animation; base tactical UI owns the single short roll');
assert.match(source,/function patchDice\(rt=R\).*gtv2112Explain/s,'V112 must keep result explanations');
assert.match(source,/lineOfSightCells/,'detection must use real LOS');
assert.match(source,/heroPerception/,'hero combat joining must use perception');
assert.match(integration,/gens-rpg-tactical-combat-coherence-1678112\.js\?v=16\.78\.112/,'V112 must load after V111');
assert.match(sw,/gensrpg-cache-16\.78\.114\.6-consolidated-tactical-runtime/);
assert.match(sw,/gens-rpg-tactical-combat-coherence-1678112\.js/);

console.log('V16.78.112 spatial participants + LOS + sheets + explanations preserved; V114.6 owns direct walls and dice animation: OK');
