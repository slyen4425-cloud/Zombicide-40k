const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const Bridge=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'));
const V113=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-authority-1678113.js'));

function makeState(){return {
  room:4,index:0,participants:['aldren','lyra','brom'],
  heroRooms:{aldren:4,lyra:4,brom:9},positions:{aldren:5,lyra:6,brom:3},
  heroBranchStates:{lyra:{room:4,cell:6,branch:{active:true,parentRoom:4,sourceId:'secret'}}},
  branch:null,enemyCells:{gob:7},last:{map:{width:5,height:5,cells:Array(25).fill('floor')}}
}}
const enemy={id:'gob',enemyId:'goblin',hp:5,dungeonRoom:4,vision:3};
let currentState=makeState(),opened=null;
const rt={
  localStorage:{getItem:k=>k==='gensrpg_session_family_guard_v1'?'adventure':null},
  getActiveGameProfile:()=>({gameStyle:'dungeon',rpgUniverse:{movement:{combatAssistRange:3}}}),
  currentRpgProfile:()=>({gameStyle:'dungeon',rpgUniverse:{movement:{combatAssistRange:3}}}),
  loadDungeonState:()=>currentState,
  loadActiveEnemies:()=>[enemy],
  activeEnemyDefinition:()=>({rule:{vision:3}}),dungeonEnemyDerivedForInstance:()=>({}),
  GensCleanRpgStats167874:{runtimeDefs:()=>[],extraTotal:()=>0},
  GensRpgTacticalRuntimeAuthority1678113:V113,
  GensRpgTacticalCombatV2:{},
  GensRpgTacticalCombatV2Adapter:{
    participants:()=>['aldren','lyra','brom'],
    enteredParticipants:(runtime,ids)=>ids,
    activeEnemies:()=>[enemy]
  },
  GensRpgTacticalCombatV2Ui:{getBattle:()=>null,openCurrentEncounter(opts){opened=opts;return {actors:[],winner:null}}},
  GensSurvivalModeIsolation1678104:{rememberFamily(){}},dispatchEvent(){},showToast(){},console
};

let scoped=Bridge.scopedRequest(rt,{enemyIds:['gob'],reason:'manual',entry:'explicit-contract'});
assert.equal(scoped.ok,true);
assert.deepEqual(scoped.options.heroIds,['aldren'],'explicit Bridge request must use V113 scope before opening Tactical');
assert.deepEqual(scoped.options.enemyIds,['gob']);
assert.equal(scoped.options.scope.room,4);
assert.equal(scoped.options.scope.branchSourceId,'');

let out=Bridge.requestCombat(rt,{enemyIds:['gob'],reason:'manual',entry:'explicit-contract'});
assert.equal(out.ok,true);
assert.ok(opened,'explicit Bridge request must open Tactical');
assert.deepEqual(opened.heroIds,['aldren'],'same-number sub-room and other-room heroes must stay excluded without a global start wrapper');
assert.deepEqual(opened.enemyIds,['gob']);
assert.equal(opened.entry,'explicit-contract');

currentState=makeState();currentState.heroRooms.lyra=4;currentState.positions.lyra=6;delete currentState.heroBranchStates.lyra;
opened=null;
out=Bridge.requestCombat(rt,{enemyIds:['gob'],reason:'manual',entry:'explicit-contract'});
assert.equal(out.ok,true);
assert.deepEqual(opened.heroIds,['aldren','lyra'],'same-scope nearby hero must remain eligible through the explicit contract');
assert.ok(!opened.heroIds.includes('brom'));

console.log('GenSrpG V114.11 explicit Bridge request is V113-scoped before Tactical open');
