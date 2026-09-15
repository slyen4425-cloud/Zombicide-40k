const assert=require('node:assert/strict');
const fs=require('node:fs');
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

// Bridge remains the compatibility router for the four historical global entry points.
assert.equal(Bridge.install(rt),true);
assert.equal(rt.dc200StartCombat.__gensTacticalV2Default,true);
assert.equal(rt.openDungeonCombatSetup.__gensTacticalV2Default,true);
assert.equal(rt.launchCombat200.__gensTacticalV2Default,true);
assert.equal(rt.startCombat.__gensTacticalV2Default,true);
const bridgeStart=rt.dc200StartCombat;

// Architectural cleanup: V112 keeps spatial selection but must no longer install a
// second global dc200StartCombat owner. Its hookStart remains exported only as rollback
// compatibility while the active chain goes directly Bridge -> V113.
const v112Source=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-coherence-1678112.js'),'utf8');
const v112Install=(v112Source.match(/function install\(rt=R\)\{[^\n]+/)||[''])[0];
assert.ok(v112Install,'V112 install function missing');
assert.doesNotMatch(v112Install,/hookStart\(rt\)/,'V112 install must not take global combat-start authority');
assert.doesNotMatch(v112Install,/adapterHooked&&startHooked&&resultHooked/,'V112 readiness must not depend on start ownership');
assert.equal(typeof V112.hookStart,'function','V112 historical start hook remains available for rollback characterization');

// V113 is now the only active spatial start wrapper after the bridge.
assert.equal(V113.hookStart(rt),true);
assert.equal(rt.dc200StartCombat.__gensRpg113Start,true);
assert.equal(rt.dc200StartCombat.__gensRpg112Start,true,'compatibility marker prevents any historical V112 retry from wrapping V113');
assert.equal(rt.dc200StartCombat.__original,bridgeStart,'V113 must delegate directly to the bridge');
const finalStart=rt.dc200StartCombat;
assert.equal(V112.hookStart(rt),true);
assert.equal(rt.dc200StartCombat,finalStart,'even an explicit historical V112 retry must not retake final start authority');

// V112 still owns its older createBattle spatial safety until V113 replaces that seam.
assert.equal(V112.hookAdapter(rt),true);
assert.equal(rt.GensRpgTacticalCombatV2Adapter.createBattle.__gensRpg112Spatial,true);
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

console.log('GenSrpG V114.11 combat authority clean path: Bridge -> final V113; V112 remains spatial createBattle safety only');
