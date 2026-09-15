const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const Bridge=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'));
const V112=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-coherence-1678112.js'));
const V113=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-authority-1678113.js'));

function map(){return {width:6,height:6,cells:Array(36).fill('floor')}}
function state(){return {
  room:1,index:0,participants:['aldren','lyra','brom'],
  heroRooms:{aldren:1,lyra:0,brom:2},
  positions:{aldren:7,lyra:-1,brom:7},heroBranchStates:{},branch:null,
  enemyCells:{gob:9},last:{map:map()}
}}
const enemy={id:'gob',enemyId:'goblin',hp:5,dungeonRoom:1,vision:3};
let currentState=state(),opened=null;
const baseLegacy=function(){throw new Error('legacy Dungeon combat must not own Dungeon Tactical start')};
const rt={
  localStorage:{getItem:k=>k==='gensrpg_session_family_guard_v1'?'adventure':null},
  getActiveGameProfile:()=>({gameStyle:'dungeon',rpgUniverse:{movement:{combatAssistRange:3}}}),
  currentRpgProfile:()=>({gameStyle:'dungeon',rpgUniverse:{movement:{combatAssistRange:3}}}),
  loadDungeonState:()=>currentState,
  loadActiveEnemies:()=>[enemy],
  activeEnemyDefinition:()=>({rule:{vision:3}}),dungeonEnemyDerivedForInstance:()=>({}),
  GensCleanRpgStats167874:{runtimeDefs:()=>[],extraTotal:()=>0},
  GensRpgTacticalCombatV2:{},
  GensRpgTacticalCombatV2Adapter:{
    participants:()=>['aldren','lyra','brom'],
    enteredParticipants(runtime,ids,scope){return ids.filter(id=>V113.heroEntered(currentState,id)&&V113.sameScope(V113.heroScope(currentState,id,runtime),scope||V113.heroScope(currentState,'aldren',runtime)))},
    activeEnemies:()=>[enemy],
    createBattle(runtime,opts){opened=opts;return {actors:[],grid:{width:6,height:6,blocked:[]},meta:{}}}
  },
  GensRpgTacticalCombatV2Ui:{getBattle:()=>null,openCurrentEncounter(opts){opened=opts;return {actors:[],winner:null}}},
  dc200StartCombat:baseLegacy,openDungeonCombatSetup:()=>{},launchCombat200:()=>{},startCombat:()=>{},
  GensSurvivalModeIsolation1678104:{rememberFamily(){}},
  dispatchEvent(){},showToast(){},console
};

// Bridge is the historical global router and replaces the four legacy entry points.
assert.equal(Bridge.install(rt),true);
assert.equal(rt.dc200StartCombat.__gensTacticalV2Default,true);
assert.equal(rt.openDungeonCombatSetup.__gensTacticalV2Default,true);
assert.equal(rt.launchCombat200.__gensTacticalV2Default,true);
assert.equal(rt.startCombat.__gensTacticalV2Default,true);
const bridgeStart=rt.dc200StartCombat;

// V112 then wraps the bridge start entry.
assert.equal(V112.hookStart(rt),true);
assert.equal(rt.dc200StartCombat.__gensRpg112Start,true);
assert.notEqual(rt.dc200StartCombat,bridgeStart);
const v112Start=rt.dc200StartCombat;

// V113 deliberately unwraps V112 and becomes the final start authority in V114.11.
assert.equal(V113.hookStart(rt),true);
assert.equal(rt.dc200StartCombat.__gensRpg113Start,true);
assert.equal(rt.dc200StartCombat.__gensRpg112Start,true,'compatibility marker prevents V112 retry from wrapping again');
assert.equal(rt.dc200StartCombat.__original,bridgeStart,'V113 must bypass the V112 start wrapper and delegate to the bridge');
assert.notEqual(rt.dc200StartCombat,v112Start);
const finalStart=rt.dc200StartCombat;
assert.equal(V112.hookStart(rt),true);
assert.equal(rt.dc200StartCombat,finalStart,'V112 retry must not retake final start authority');

// Final participant authority is V113 scoped selection, not the bridge's broad participant list.
assert.equal(V113.hookAdapter(rt),true);
assert.equal(rt.GensRpgTacticalCombatV2Adapter.createBattle.__gensRpg113Scope,true);
assert.equal(rt.GensRpgTacticalCombatV2Adapter.createBattle.__gensRpg112Spatial,true,'marker blocks later V112 createBattle ownership');

// Regression: Lyra is selected in the party but still room 0 / no board cell.
assert.equal(V113.heroEntered(currentState,'lyra'),false,'party selection alone must never make a hero a combatant before entering the Dungeon');
assert.equal(V113.heroEntered(currentState,'aldren'),true);
assert.equal(V113.heroEntered(currentState,'brom'),true,'Brom has entered, but is in another room');
let sel=V113.selectCombatants(rt,{enemyIds:['gob'],heroIds:['aldren','lyra','brom']});
assert.deepEqual(sel.heroIds,['aldren'],'only the entered hero in the enemy scope may join');
assert.deepEqual(sel.enemyIds,['gob']);

// Moving Lyra into the same scope and within assist range makes her eligible.
currentState=state();currentState.heroRooms.lyra=1;currentState.positions.lyra=8;
sel=V113.selectCombatants(rt,{enemyIds:['gob'],heroIds:['aldren','lyra','brom']});
assert.deepEqual(sel.heroIds,['aldren','lyra']);
assert.ok(!sel.heroIds.includes('brom'),'hero in another room must remain excluded');

// A same-room hero beyond configured assist/path range must not be pulled in.
currentState=state();currentState.heroRooms.lyra=1;currentState.positions.lyra=35;
sel=V113.selectCombatants(rt,{enemyIds:['gob'],heroIds:['aldren','lyra','brom']});
assert.deepEqual(sel.heroIds,['aldren'],'same room is insufficient when the helper is outside assist range');

// The final global start must pass only scoped enemy ids to the bridge.
currentState=state();opened=null;
const result=rt.dc200StartCombat(['gob'],'manual');
assert.equal(result.ok,true);
assert.ok(opened,'Tactical encounter must open');
assert.deepEqual(opened.enemyIds,['gob']);
assert.deepEqual(opened.heroIds,['aldren'],'bridge eligibility must still reject non-entered/different-scope heroes');

console.log('GenSrpG V114.11 combat authority characterized: Bridge globals -> V112 -> final V113 scoped authority');
