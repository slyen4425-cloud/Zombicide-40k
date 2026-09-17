const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');

// Lot 4H is characterization-only. launchCombat200 is still a legacy compatibility
// seed captured by the Bridge for non-Dungeon contexts; Dungeon must route through
// requestCombat -> V113/Tactical and never re-enter the historical launcher.
const bridgePath=path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js');
delete require.cache[require.resolve(bridgePath)];
const Bridge=require(bridgePath);

let family='survival';
let legacyCalls=0;
let legacyArgs=null;
let opened=null;
const enemy={id:'e1',enemyId:'goblin',hp:5};
const historicalLaunch=function(x,chosen){
  legacyCalls++;
  legacyArgs={x,chosen,thisValue:this};
  return 'legacy-launch-non-dungeon';
};
const rt={
  localStorage:{getItem:key=>key==='gensrpg_session_family_guard_v1'?family:null},
  getActiveGameProfile:()=>({gameStyle:family==='adventure'?'dungeon':'survival'}),
  GensRpgTacticalCombatV2:{},
  GensRpgTacticalCombatV2Adapter:{
    participants:()=>['h1'],
    enteredParticipants:(runtime,ids)=>ids,
    activeEnemies:()=>[enemy]
  },
  GensRpgTacticalCombatV2Ui:{
    getBattle:()=>null,
    openCurrentEncounter(opts){opened=opts;return {actors:[],winner:null}}
  },
  dc200StartCombat(){return false},
  openDungeonCombatSetup(){return false},
  launchCombat200:historicalLaunch,
  startCombat(){return false},
  GensSurvivalModeIsolation1678104:{rememberFamily(){}},
  dispatchEvent(){},showToast(){},console
};

assert.equal(Bridge.install(rt),true,'Bridge install must succeed over the historical launchCombat200');
assert.notEqual(rt.launchCombat200,historicalLaunch,'Bridge must own the final launchCombat200 global');
assert.equal(rt.launchCombat200.__gensTacticalV2Default,true,'final launchCombat200 global must be the Bridge adapter');
assert.equal(rt.launchCombat200.__legacy,historicalLaunch,'Bridge must retain historical launchCombat200 only as fallback');

// Outside Dungeon compatibility must be exact: same two arguments, same object
// identities, same this binding and same return value.
const marker={source:'survival'};
const chosen=[{id:'e1'}];
let out=rt.launchCombat200(marker,chosen);
assert.equal(out,'legacy-launch-non-dungeon');
assert.equal(legacyCalls,1,'non-Dungeon route must call the captured historical launcher once');
assert.equal(legacyArgs.x,marker,'first launch argument identity must be preserved');
assert.equal(legacyArgs.chosen,chosen,'chosen array identity must be preserved');
assert.equal(legacyArgs.thisValue,rt,'legacy launch fallback must preserve runtime this binding');
assert.equal(opened,null,'non-Dungeon fallback must not open Dungeon Tactical V2');

// In Dungeon the same public compatibility name must bypass the historical launcher
// and enter the canonical Bridge request path.
family='adventure';
opened=null;
out=rt.launchCombat200(marker,[{id:'e1'}]);
assert.equal(out,true,'Dungeon launch adapter must return the canonical request success boolean');
assert.equal(legacyCalls,1,'Dungeon route must never invoke historical launchCombat200');
assert.ok(opened,'Dungeon Tactical encounter must open');
assert.deepEqual(opened.enemyIds,['e1']);
assert.equal(opened.reason,'legacy-launch');
assert.equal(opened.entry,'launchCombat200');

const source=fs.readFileSync(bridgePath,'utf8');
assert.match(source,/rememberLegacy\(rt\.launchCombat200,"launch"\)/,'Bridge must capture launchCombat200 before replacement');
assert.match(source,/if\(!dungeonContext\(rt\)\)return typeof legacyLaunch==="function"\?legacyLaunch\.apply\(rt,\[x,chosen\]\):false/,'non-Dungeon launch fallback contract changed');
assert.match(source,/requestCombat\(rt,\{enemyIds:ids,reason:"legacy-launch",entry:"launchCombat200"\}\)/,'Dungeon launch adapter must still delegate to requestCombat');

console.log('GenSrpG lot 4H characterized: launchCombat200 is an intentional Bridge compatibility adapter outside Dungeon; Dungeon remains requestCombat-owned.');
