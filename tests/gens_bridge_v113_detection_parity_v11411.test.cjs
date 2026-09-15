const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const Bridge=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'));
const V113=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-authority-1678113.js'));

function state(){return {
  room:4,index:0,participants:['aldren','lyra','brom'],
  heroRooms:{aldren:4,lyra:4,brom:9},positions:{aldren:24,lyra:6,brom:3},heroBranchStates:{},branch:null,
  enemyCells:{gob:7,hidden:0},last:{map:{width:5,height:5,cells:Array(25).fill('floor')}}
}}
const enemies=[
  {id:'gob',enemyId:'goblin',hp:5,dungeonRoom:4,vision:2},
  {id:'hidden',enemyId:'rat',hp:3,dungeonRoom:4,vision:1}
];
let opened=null;
const rt={
  localStorage:{getItem:k=>k==='gensrpg_session_family_guard_v1'?'adventure':null},
  getActiveGameProfile:()=>({gameStyle:'dungeon',rpgUniverse:{movement:{combatAssistRange:3}}}),
  currentRpgProfile:()=>({gameStyle:'dungeon',rpgUniverse:{movement:{combatAssistRange:3}}}),
  loadDungeonState:()=>state(),loadActiveEnemies:()=>enemies,
  activeEnemyDefinition:id=>({rule:{vision:id==='goblin'?2:1}}),dungeonEnemyDerivedForInstance:()=>({}),
  GensCleanRpgStats167874:{runtimeDefs:()=>[],extraTotal:()=>0},
  GensRpgTacticalRuntimeAuthority1678113:V113,
  GensRpgTacticalCombatV2:{},
  GensRpgTacticalCombatV2Adapter:{participants:()=>['aldren','lyra','brom'],enteredParticipants:(runtime,ids)=>ids,activeEnemies:()=>enemies},
  GensRpgTacticalCombatV2Ui:{getBattle:()=>null,openCurrentEncounter(opts){opened=opts;return {actors:[],winner:null}}},
  GensSurvivalModeIsolation1678104:{rememberFamily(){}},dispatchEvent(){},showToast(){},console
};

const pairs=V113.detectionPairs(rt,state(),enemies);
assert.deepEqual(pairs.filter(p=>p.enemyId==='gob').map(p=>p.heroId),['lyra'],'Lyra alone must actually detect/trigger the nearby goblin');
assert.equal(pairs.some(p=>p.heroId==='aldren'&&p.enemyId==='gob'),false,'active Aldren is too far to be the detection source');

const prepared=Bridge.prepareV113Detection(rt,V113,{enemyIds:['gob'],reason:'detection',entry:'explicit-detection'});
assert.equal(prepared.ok,true);
assert.deepEqual(prepared.options.sourceHeroIds,['lyra'],'explicit Bridge detection must preserve the real detecting hero');
assert.deepEqual(prepared.options.enemyIds,['gob']);
assert.deepEqual(rt.__gensTacticalV113Context.sourceHeroIds,['lyra'],'V113 selection context must receive the detection source before scoping');

opened=null;
const out=Bridge.requestCombat(rt,{enemyIds:['gob'],reason:'detection',entry:'explicit-detection'});
assert.equal(out.ok,true);
assert.ok(opened,'visible detection must open Tactical combat');
assert.deepEqual(opened.heroIds,['lyra'],'explicit detection route must not substitute the active but distant hero');
assert.deepEqual(opened.enemyIds,['gob']);
assert.equal(opened.reason,'detection');

opened=null;
const blocked=Bridge.requestCombat(rt,{enemyIds:['hidden'],reason:'detection',entry:'explicit-detection'});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'not-detected-v113','an enemy outside V113 detection must be rejected before Tactical open');
assert.equal(opened,null);

console.log('GenSrpG V114.11 explicit Bridge detection matches V113 visibility/source semantics without relying on global start routing');
