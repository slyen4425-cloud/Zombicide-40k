'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/tactical/entry-v1.js');
const contract=JSON.parse(read('assets/gensrpg/tactical/module-contract-v1.json'));
const bootstrap=read('assets/gensrpg/core/runtime-bootstrap-v1.js');
const integration=read('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js');
const observerGuard=read('tests/gens_tactical_observer_chain_clean_v11411.test.cjs');
const runtimeGuard=read('tests/gens_runtime_composition_guard_v11411.test.cjs');

assert.equal(contract.module,'tactical');
assert.equal(contract.status,'contract-only-not-loaded');
assert.match(entry,/Intentionally contains no runtime code/,'Tactical public entry must still be inert at preaudit');
assert.doesNotMatch(entry,/GensRpgTacticalCombatV2|createElement\(["']script|setTimeout|MutationObserver/,
  'Phase 8 preaudit must not silently activate Tactical entry');

const baseTactical=[
  'gens-rpg-tactical-combat-v2.js',
  'gens-rpg-tactical-combat-v2-adapter.js',
  'gens-rpg-tactical-combat-v2-rules.js',
  'gens-rpg-tactical-combat-v2-integration.js',
  'gens-rpg-tactical-combat-v2-ui.js',
  'gens-rpg-tactical-combat-v2-bridge.js'
];
let cursor=-1;
for(const file of baseTactical){
  const pos=bootstrap.indexOf(file,cursor+1);
  assert.ok(pos>cursor,'RuntimeBootstrap must currently own ordered Tactical base composition: '+file);
  cursor=pos;
}
assert.match(bootstrap,/GensRpgTacticalCombatV2Bridge\?\.install\?\.\(R\)/,
  'RuntimeBootstrap must currently own final bridge install');
for(const ms of [250,1200,3000]){
  assert.ok(bootstrap.includes('setTimeout(apply,'+ms+')'),'RuntimeBootstrap bridge retry missing '+ms);
}

for(const layer of [
  'gens-rpg-tactical-combat-v2-polish-1678108.js',
  'gens-rpg-tactical-combat-v2-polish-1678109.js',
  'gens-rpg-tactical-combat-v2-stats-1678110.js',
  'gens-rpg-tactical-runtime-fixes-1678111.js',
  'gens-rpg-tactical-combat-coherence-1678112.js',
  'gens-rpg-tactical-runtime-authority-1678113.js',
  'gens-rpg-tactical-visual-dice-16781142.js'
]){
  assert.ok(integration.includes(layer),'active Tactical compatibility chain missing '+layer);
}
assert.doesNotMatch(integration,/gens-rpg-tactical-hotfix-1678114\.js/,
  'retired V114.1 global-observer hotfix must stay outside active chain');
assert.doesNotMatch(integration,/gens-rpg-tactical-session-guard-16781144\.js/,
  'retired V114.4 global session guard must stay outside active chain');

assert.match(observerGuard,/install must not activate its historical global observer/,
  'V108-V113 historical observer retirement guard must remain');
assert.match(runtimeGuard,/RuntimeBootstrap is the one documented owner of base Tactical composition/,
  'current composition owner must remain explicitly characterized before migration');

const result={
  scenario:'Phase 8 Tactical consolidation preaudit',
  targetArchitecture:['engine','adapter','ui','ai','dungeon-bridge'],
  currentPublicEntry:'inert',
  currentCompositionOwner:'Core RuntimeBootstrap V1',
  baseComposition:baseTactical,
  activeCompatibilityChain:['V108','V109','V110','V111','V112','V113','V114.11'],
  alreadyRetired:['active V108/V109/V111/V112/V113 global observers','V114.1 global observer hotfix','V114.4 session guard'],
  selectedFirstSeam:'handoff Tactical base composition ownership from Core RuntimeBootstrap to Tactical public entry',
  gameplayChangeExpected:false,
  indexChangeRequired:false,
  phase8PreauditReady:true
};
console.log(JSON.stringify(result,null,2));
