const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const Bridge=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'));
const V113=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-authority-1678113.js'));

function map(){return {width:6,height:6,cells:Array(36).fill('floor')}}
function baseState(){return {
  room:1,index:0,participants:['aldren','lyra','brom'],
  heroRooms:{aldren:1,lyra:0,brom:2},
  positions:{aldren:7,lyra:-1,brom:8},heroBranchStates:{},branch:null,
  enemyCells:{gob:9},last:{map:map()}
}}
const enemy={id:'gob',enemyId:'goblin',hp:5,dungeonRoom:1,vision:3};
let currentState=baseState(),opened=null;
const rt={
  localStorage:{getItem:k=>k==='gensrpg_session_family_guard_v1'?'adventure':null},
  getActiveGameProfile:()=>({gameStyle:'dungeon',rpgUniverse:{movement:{combatAssistRange:3}}}),
  currentRpgProfile:()=>({gameStyle:'dungeon',rpgUniverse:{movement:{combatAssistRange:3}}}),
  loadDungeonState:()=>currentState,
  loadActiveEnemies:()=>[enemy],
  activeEnemyDefinition:()=>({rule:{vision:3}}),
  dungeonEnemyDerivedForInstance:()=>({}),
  GensCleanRpgStats167874:{runtimeDefs:()=>[],extraTotal:()=>0},
  GensRpgTacticalRuntimeAuthority1678113:V113,
  GensRpgTacticalCombatV2:{},
  GensRpgTacticalCombatV2Adapter:{
    participants:()=>['aldren','lyra','brom'],
    activeEnemies:()=>[enemy]
  },
  GensRpgTacticalCombatV2Ui:{
    getBattle:()=>null,
    openCurrentEncounter(opts){opened=opts;return {actors:[],winner:null}}
  },
  GensSurvivalModeIsolation1678104:{rememberFamily(){}},
  dispatchEvent(){},showToast(){},console
};

function request(reason='manual'){
  opened=null;
  const out=Bridge.requestCombat(rt,{enemyIds:['gob'],reason,entry:'test-direct'});
  return {out,opened};
}

// Party selection is not enough: Lyra has not entered and Brom is in another room.
let r=request();
assert.equal(r.out.ok,true);
assert.ok(r.opened,'direct Bridge request must open Tactical encounter');
assert.deepEqual(r.opened.heroIds,['aldren']);
assert.deepEqual(r.opened.enemyIds,['gob']);

// Same scope + within assist/path range makes Lyra eligible.
currentState=baseState();currentState.heroRooms.lyra=1;currentState.positions.lyra=8;
r=request();
assert.equal(r.out.ok,true);
assert.deepEqual(r.opened.heroIds,['aldren','lyra']);
assert.ok(!r.opened.heroIds.includes('brom'));

// Same room alone is insufficient if helper is outside configured assist range.
currentState=baseState();currentState.heroRooms.lyra=1;currentState.positions.lyra=35;
r=request();
assert.equal(r.out.ok,true);
assert.deepEqual(r.opened.heroIds,['aldren']);

// Detection requests must be filtered through V113 visibility before selection.
currentState=baseState();currentState.positions.aldren=0;currentState.enemyCells.gob=35;
r=request('detection');
assert.equal(r.out.ok,false);
assert.equal(r.out.reason,'not-detected-v113');
assert.equal(r.opened,null,'undetected enemy must not open Tactical combat');

// Bring the enemy into visible range: detection may now route and keeps scoped heroes.
currentState=baseState();currentState.positions.aldren=7;currentState.enemyCells.gob=9;
r=request('detection');
assert.equal(r.out.ok,true);
assert.deepEqual(r.opened.heroIds,['aldren']);
assert.deepEqual(r.opened.enemyIds,['gob']);

console.log('GenSrpG Bridge direct request contract OK: V113 scope/visibility protects modern entry before legacy callsite migration');
