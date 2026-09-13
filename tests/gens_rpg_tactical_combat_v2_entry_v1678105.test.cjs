const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..','assets','gensrpg');
const B=require(path.join(root,'gens-rpg-tactical-combat-v2-bridge.js'));

let opened=0,legacyStart=0,legacySetup=0,legacyLaunch=0,legacyDirect=0,remembered='';
let family='survival';
const activeEnemies=[{id:'e1'},{id:'e2'}];
const rt={
  console,
  localStorage:{getItem:k=>k==='gensrpg_session_family_guard_v1'?family:null},
  getActiveGameProfile:()=>({id:'dungeon',gameStyle:'dungeon'}),
  isDungeonMode:()=>false,
  GensSurvivalModeIsolation1678104:{rememberFamily:v=>{remembered=v;family=v}},
  GensRpgTacticalCombatV2:{createBattle(){}},
  GensRpgTacticalCombatV2Adapter:{participants:()=>['dungeon_aldren'],activeEnemies:()=>activeEnemies},
  GensRpgTacticalCombatV2Ui:{getBattle:()=>null,openCurrentEncounter:o=>{opened++;return {id:'battle-'+opened,opts:o}}},
  dc200StartCombat(){legacyStart++},
  openDungeonCombatSetup(){legacySetup++},
  launchCombat200(){legacyLaunch++;return true},
  startCombat(){legacyDirect++;return true},
  dispatchEvent(){},showToast(){}
};

assert.equal(B.install(rt),true);
assert.equal(B.status(rt).dungeon,false,'explicit Survival family must block stale Dungeon profile state');
assert.equal(rt.GENS_TACTICAL_V2_ROUTER_VERSION,'16.78.106');

family='adventure';
assert.equal(B.dungeonContext(rt),true);
let r=rt.dc200StartCombat(['e2'],'detection');
assert.equal(r.ok,true);assert.equal(opened,1);assert.equal(legacyStart,0);assert.equal(remembered,'adventure');

r=rt.openDungeonCombatSetup();
assert.equal(r.ok,true);assert.equal(opened,2);assert.equal(legacySetup,0);

assert.equal(rt.launchCombat200({},[{id:'e1'}]),true);
assert.equal(opened,3);assert.equal(legacyLaunch,0,'direct global legacy launch must be intercepted');

r=rt.startCombat(['e1'],'cell');
assert.equal(r.ok,true);assert.equal(opened,4);assert.equal(legacyDirect,0,'direct global startCombat binding must be intercepted');

// Reinstall must re-assert routing after another wrapper overwrites a global entry.
rt.dc200StartCombat=function overwritten(){legacyStart++};
assert.equal(B.install(rt),true);
r=rt.dc200StartCombat(['e1'],'manual');
assert.equal(r.ok,true);assert.equal(opened,5);assert.equal(legacyStart,0);

// Survival context still delegates to native/legacy behavior even if active profile is stale Dungeon.
family='survival';
assert.equal(B.dungeonContext(rt),false);
rt.dc200StartCombat(['z1'],'survival');
assert.equal(legacyStart,1,'non-Dungeon context must keep its native route');

console.log('V16.78.106 Tactical V2 global entry routing OK');
