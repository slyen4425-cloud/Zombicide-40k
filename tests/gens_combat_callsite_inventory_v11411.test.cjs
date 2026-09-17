const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const doc=fs.readFileSync(path.join(root,'docs','GENSRPG_COMBAT_CALLSITE_INVENTORY.md'),'utf8');

function countWord(name){return (html.match(new RegExp('\\b'+name+'\\b','g'))||[]).length;}
const expected={dc200StartCombat:1,openDungeonCombatSetup:1,launchCombat200:2,startCombat:4};
for(const [name,count] of Object.entries(expected)){
  assert.equal(countWord(name),count,`${name} callsite debt changed: migrate deliberately and lower the inventory instead of adding/replacing hidden entry points`);
  assert.match(doc,new RegExp('`'+name+'`\\s*\\|\\s*'+count+'\\b'),`${name} documentation count must match source inventory`);
}

assert.match(doc,/requestCombat\(runtime, options\)/,'inventory must name the target single-entry contract');
assert.match(doc,/Aucune suppression en masse/,'inventory must keep the progressive monolith migration rule');

// Lot 4G: the final raw dc200StartCombat occurrence is an intentional compatibility
// seed for the Bridge non-Dungeon fallback, not an active Dungeon callsite. Keep this
// behavioral contract permanently coupled to the inventory sentinel.
require('./gens_legacy_dc200_fallback_contract_lot4g.test.cjs');

// Lot 4H: launchCombat200 is likewise captured by the Bridge for exact non-Dungeon
// compatibility while Dungeon routing stays on requestCombat. Keep that distinction
// locked before any later extraction from the monolith.
require('./gens_legacy_launch200_fallback_contract_lot4h.test.cjs');

// Lot 4I: Runtime 2.00 stealth failure enters through the canonical Bridge. Lot 4K
// then migrates manual, leaving only cell/ambush plus the legacy definition/alias.
require('./gens_core200_startcombat_characterization_lot4i.test.cjs');

// Lot 4K: lock the sole non-positional manual action on requestCombat and keep its
// original guards, live-enemy source, enemyIds and reason while cell/ambush stay separate.
require('./gens_core200_manual_entry_characterization_lot4k.test.cjs');

// Lot 4L characterization: Runtime 2.00 ambush currently asks for the complete live
// enemy set, while requestCombat(reason:'ambush') activates V113 detection preparation
// and can narrow that set. Keep this proof coupled to the inventory until a deliberate
// compatibility contract is introduced; never replace the callsite mechanically.
require('./gens_core200_ambush_entry_characterization_lot4l.test.cjs');

console.log('GenSrpG V114.11 legacy combat callsite inventory OK',expected);
