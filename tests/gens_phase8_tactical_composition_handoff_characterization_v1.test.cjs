'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const bootstrap=read('assets/gensrpg/core/runtime-bootstrap-v1.js');
const entry=read('assets/gensrpg/tactical/entry-v1.js');
const contract=JSON.parse(read('assets/gensrpg/tactical/module-contract-v1.json'));
const runtimeGuard=read('tests/gens_runtime_composition_guard_v11411.test.cjs');
const characterizationDoc=read('docs/GENSRPG_PHASE8_TACTICAL_COMPOSITION_HANDOFF_CHARACTERIZATION.md');

const files=[
  'assets/gensrpg/gens-rpg-tactical-combat-v2.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js'
];

assert.equal(contract.status,'partial-runtime-loaded');
assert.equal(contract.activatedPhase,8);
assert.equal(contract.publicRuntimeApi,'GensTacticalV1');
assert.match(characterizationDoc,/Propriétaire actuel[\s\S]*runtime-bootstrap-v1\.js/,'characterization document must preserve the original Core owner');
assert.match(characterizationDoc,/entry-v1\.js[\s\S]*encore inert/,'characterization document must preserve the original inert-entry observation');

let cursor=-1;
for(const file of files){
  const pos=entry.indexOf('"'+file+'"',cursor+1);
  assert.ok(pos>cursor,'migrated Tactical entry must preserve characterized order: '+file);
  cursor=pos;
}
assert.match(entry,/if\(R\.__gensTacticalV2Loader105\)return true;/,'migrated entry must preserve characterized idempotency guard');
assert.match(entry,/R\.__gensTacticalV2Loader105=true;/,'migrated entry must set characterized idempotency guard');
assert.match(entry,/s\.src=files\[i\]\+"\?v=16\.78\.105";/,'migrated entry must preserve characterized cache suffix');
assert.match(entry,/s\.async=false;/,'migrated entry must preserve characterized sequential loading');
assert.match(entry,/s\.onload=\(\)=>load\(i\+1\)/,'migrated entry must preserve characterized success continuation');
const finalizeStart=entry.indexOf('function finalize(){');
const loadStart=entry.indexOf('function load(i){');
assert.ok(finalizeStart>=0&&loadStart>finalizeStart,'migrated entry finalize/load boundaries missing');
const finalize=entry.slice(finalizeStart,loadStart);
assert.match(finalize,/GensRpgTacticalCombatV2Bridge\?\.install\?\.\(R\)/,'migrated entry must preserve bridge final install');
assert.equal((finalize.match(/setTimeout\(apply,/g)||[]).length,0,
  'migrated entry must not retain delayed Bridge reinstalls after lifecycle cleanup');
assert.match(bootstrap,/assets\/gensrpg\/tactical\/entry-v1\.js/,'Core must delegate to public Tactical entry after handoff');
for(const file of files)assert.equal(bootstrap.includes(file),false,'Core must not retain characterized private file '+file);
assert.match(runtimeGuard,/Tactical public entry is the sole owner of base Tactical composition/,
  'runtime composition guard must name the new sole owner');

console.log(JSON.stringify({
  scenario:'Phase 8 Tactical composition handoff characterization',
  baselineOwner:'assets/gensrpg/core/runtime-bootstrap-v1.js',
  targetOwner:'assets/gensrpg/tactical/entry-v1.js',
  entryBaselineInert:true,
  currentOwner:'assets/gensrpg/tactical/entry-v1.js',
  files,
  sequentialLoading:true,
  idempotencyGuard:'__gensTacticalV2Loader105',
  bridgeRetries:[0],
  gameplayChangeExpected:false,
  indexChangeRequired:false
},null,2));
