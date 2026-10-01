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
const preauditDoc=read('docs/GENSRPG_PHASE8_TACTICAL_CONSOLIDATION_PREAUDIT.md');

assert.equal(contract.module,'tactical');
assert.equal(contract.status,'partial-runtime-loaded');
assert.equal(contract.activatedPhase,8);
assert.equal(contract.publicRuntimeApi,'GensTacticalV1');
assert.match(preauditDoc,/entry-v1\.js` existe mais reste inert/,'preaudit document must preserve the observed inert-entry baseline');
assert.match(preauditDoc,/Le propriétaire actuel de la composition de base Tactical est encore :[\s\S]*runtime-bootstrap-v1\.js/,'preaudit document must preserve the former Core composition owner');

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
  const pos=entry.indexOf(file,cursor+1);
  assert.ok(pos>cursor,'Tactical public entry must own ordered base composition: '+file);
  cursor=pos;
}
assert.match(bootstrap,/assets\/gensrpg\/tactical\/entry-v1\.js/,'Core RuntimeBootstrap must delegate to the Tactical public entry');
for(const file of baseTactical)assert.equal(bootstrap.includes(file),false,'Core must not know Tactical private file '+file);
assert.match(entry,/GensRpgTacticalCombatV2Bridge\?\.install\?\.\(R\)/,
  'Tactical entry must own final bridge install');
assert.equal((entry.match(/setTimeout\(apply,/g)||[]).length,0,
  'Tactical public entry must not regain delayed Bridge reinstalls');

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
assert.match(runtimeGuard,/Tactical public entry is the sole owner of base Tactical composition/,
  'runtime guard must preserve the selected Phase 8 ownership target');

const result={
  scenario:'Phase 8 Tactical consolidation preaudit',
  targetArchitecture:['engine','adapter','ui','ai','dungeon-bridge'],
  currentPublicEntry:'GensTacticalV1',
  currentCompositionOwner:'Tactical public entry',
  baseComposition:baseTactical,
  activeCompatibilityChain:['V108','V109','V110','V111','V112','V113','V114.11'],
  alreadyRetired:['active V108/V109/V111/V112/V113 global observers','V114.1 global observer hotfix','V114.4 session guard'],
  selectedFirstSeam:'handoff Tactical base composition ownership from Core RuntimeBootstrap to Tactical public entry',
  gameplayChangeExpected:false,
  indexChangeRequired:false,
  phase8PreauditReady:true
};
console.log(JSON.stringify(result,null,2));
