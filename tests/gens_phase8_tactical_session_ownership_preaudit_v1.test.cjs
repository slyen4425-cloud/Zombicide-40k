'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const bootstrap=read('assets/gensrpg/core/runtime-bootstrap-v1.js');
const entry=read('assets/gensrpg/tactical/entry-v1.js');
const bridge=read('assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js');
const moduleContract=JSON.parse(read('assets/gensrpg/tactical/module-contract-v1.json'));
const inventory=read('tests/gens_combat_callsite_inventory_v11411.test.cjs');
const core200=read('tests/gens_core200_startcombat_characterization_lot4i.test.cjs');
const nativeUi=read('tests/gens_combat_ui_direct_entry_migration_1.test.cjs');
const exitAudit=read('docs/GENSRPG_PHASE8_EXIT_PREAUDIT.md');

assert.match(bootstrap,/assets\/gensrpg\/tactical\/entry-v1\.js/,
  'Core bootstrap must keep one public Tactical entry boundary');
assert.doesNotMatch(bootstrap,/gens-rpg-tactical-combat-v2(?:-adapter|-rules|-integration|-ui|-bridge)?\.js/,
  'Core bootstrap must not regain private Tactical composition ownership');

for(const file of [
  'gens-rpg-tactical-combat-v2.js',
  'gens-rpg-tactical-combat-v2-adapter.js',
  'gens-rpg-tactical-combat-v2-rules.js',
  'gens-rpg-tactical-combat-v2-integration.js',
  'gens-rpg-tactical-combat-v2-ui.js',
  'gens-rpg-tactical-combat-v2-bridge.js'
]){
  assert.ok(entry.includes(file),'current public entry composition drifted: '+file);
}
assert.match(entry,/function install\(\)[\s\S]*load\(0\)/,
  'current public entry must characterize eager private-stack loading');
assert.match(entry,/R\.GensTacticalV1=Object\.freeze\([\s\S]*install[\s\S]*finalize/,
  'public Tactical entry API must remain the composition owner');
assert.match(entry,/\ninstall\(\);\n\}\)\(/,
  'current public entry must characterize eager activation at application bootstrap');
assert.match(entry,/GensRpgTacticalCombatV2Bridge\?\.install\?\.\(R\)/,
  'current entry finalize must characterize eager Bridge installation');

assert.match(bridge,/if\(root\)root\.GensRpgTacticalCombatV2Bridge=api/,
  'Bridge file must publish the canonical facade when loaded');
assert.doesNotMatch(bridge,/DOMContentLoaded/,
  'Bridge facade itself must not auto-install from DOMContentLoaded');
assert.doesNotMatch(bridge,/\}\);\s*install\(R\)/,
  'Bridge facade file must not invoke install automatically at module load');
assert.match(bridge,/function requestCombat\(rt=R,options=\{\}\)/,
  'Bridge must retain the canonical requestCombat boundary');
assert.match(bridge,/reason:"modules-missing"/,
  'current requestCombat path must characterize dependency on the already-loaded private stack');

assert.match(inventory,/final raw dc200StartCombat occurrence is an intentional compatibility[\s\S]*not an active Dungeon callsite/,
  'legacy dc200StartCombat must remain characterized as compatibility seed, not an active Dungeon trigger');
assert.match(core200,/all active Runtime 2\.00 combat actions are Bridge-backed/,
  'active Runtime 2.00 combat actions must remain Bridge-backed');
assert.match(nativeUi,/two native manual buttons -> Bridge\.requestCombat/,
  'native manual combat buttons must remain Bridge-backed');

assert.equal(moduleContract.publicRuntimeApi,'GensTacticalV1',
  'public Tactical runtime API contract must remain GensTacticalV1');
assert.match(exitAudit,/A1 — activation eager de la pile Tactical/,
  'exit preaudit must keep eager activation classified as a real Phase 8 blocker');

console.log(JSON.stringify({
  scenario:'Phase 8 Tactical session ownership preaudit',
  blockingReason:'private Tactical stack currently activates before a combat session',
  selectedSeam:{
    keepLoaded:['Core RuntimeBootstrap -> public Tactical entry','canonical Bridge facade'],
    deferUntilFirstCombat:['engine','adapter','rules','integration','UI activation','Bridge install','compatibility chain activation'],
    trigger:'Bridge.requestCombat',
    indexChangeRequired:false
  },
  evidence:{
    publicEntryAlreadyOwnsComposition:true,
    bridgeFileCanExistInert:true,
    activeDungeonCombatActionsAlreadyBridgeBacked:true,
    legacyDc200IsCompatibilitySeedOnly:true
  },
  futureRuntimeLot:'make the public entry/Bridge boundary own cold activation of the private Tactical stack on first combat request',
  explicitlyNotSelected:[
    'V108-V114 file-by-file cleanup',
    'gameplay changes',
    'AI rewrite',
    'index.html callsite migration'
  ],
  runtimeChangeInThisPreaudit:false
},null,2));
