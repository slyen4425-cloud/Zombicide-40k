const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const Bridge=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'));

// Lot 4G is characterization-only: the last dc200StartCombat occurrence in index.html
// is not an active Dungeon owner. It seeds the Bridge rollback/fallback path for
// non-Dungeon contexts, while Dungeon must stay on requestCombat -> Tactical/V113.
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const aliases=html.match(/window\.dc200StartCombat\s*=\s*startCombat/g)||[];
assert.equal(aliases.length,1,'exactly one historical dc200StartCombat=startCombat compatibility alias must remain');

let family='survival';
let legacyCalls=0;
let legacyArgs=null;
let opened=null;
const enemy={id:'e1',enemyId:'goblin',hp:5};
const historicalStart=function(enemyIds,reason){
  legacyCalls++;
  legacyArgs={enemyIds,reason,thisValue:this};
  return 'legacy-non-dungeon';
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
  dc200StartCombat:historicalStart,
  openDungeonCombatSetup(){return false},
  launchCombat200(){return false},
  startCombat(){return false},
  GensSurvivalModeIsolation1678104:{rememberFamily(){}},
  dispatchEvent(){},showToast(){},console
};

assert.equal(Bridge.install(rt),true,'Bridge install must succeed over the historical alias');
assert.notEqual(rt.dc200StartCombat,historicalStart,'Bridge must own the final global combat entry');
assert.equal(rt.dc200StartCombat.__gensTacticalV2Default,true,'final global must be the Bridge adapter');
assert.equal(rt.dc200StartCombat.__legacy,historicalStart,'Bridge must retain the historical alias only as its fallback');

// Outside Dungeon, compatibility must remain exact: same args, same this, same return.
let out=rt.dc200StartCombat(['e1'],'survival-compat');
assert.equal(out,'legacy-non-dungeon');
assert.equal(legacyCalls,1,'non-Dungeon route must call the captured historical starter once');
assert.deepEqual(legacyArgs.enemyIds,['e1']);
assert.equal(legacyArgs.reason,'survival-compat');
assert.equal(legacyArgs.thisValue,rt,'legacy fallback must preserve runtime this binding');
assert.equal(opened,null,'non-Dungeon fallback must not open Dungeon Tactical V2');

// In Dungeon, the exact same public adapter must stop using the legacy fallback and
// enter the canonical Bridge request path. The historical alias is therefore a
// compatibility seed, not a second Dungeon combat authority.
family='adventure';
opened=null;
out=rt.dc200StartCombat(['e1'],'manual');
assert.equal(out.ok,true,'Dungeon route must use the canonical Tactical request');
assert.equal(legacyCalls,1,'Dungeon route must never invoke the historical fallback');
assert.ok(opened,'Dungeon Tactical encounter must open');
assert.deepEqual(opened.enemyIds,['e1']);
assert.equal(opened.entry,'dc200StartCombat');

const bridgeSource=fs.readFileSync(path.join(root,'assets','gensrpg','gens-rpg-tactical-combat-v2-bridge.js'),'utf8');
assert.match(bridgeSource,/rememberLegacy\(rt\.dc200StartCombat,"start"\)/,'Bridge must capture dc200StartCombat before replacement');
assert.match(bridgeSource,/if\(!dungeonContext\(rt\)\)return typeof legacyStart==="function"\?legacyStart\.call\(rt,enemyIds,reason\)/,'non-Dungeon start fallback contract changed');
assert.match(bridgeSource,/return requestCombat\(rt,\{enemyIds:arr\(enemyIds\)\.map\(str\),reason,entry:"dc200StartCombat"\}\)/,'Dungeon dc200 adapter must still delegate to requestCombat');

console.log('GenSrpG lot 4G characterized: one historical dc200 alias is intentionally retained as Bridge non-Dungeon fallback; Dungeon remains Bridge-owned.');
