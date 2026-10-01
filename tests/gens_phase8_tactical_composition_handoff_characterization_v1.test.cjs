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

const files=[
  'assets/gensrpg/gens-rpg-tactical-combat-v2.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js'
];

assert.equal(contract.status,'contract-only-not-loaded');
assert.match(entry,/Intentionally contains no runtime code/);
assert.doesNotMatch(entry,/createElement\(["']script|GensRpgTacticalCombatV2|__gensTacticalV2Loader105|setTimeout\(/);

let cursor=-1;
for(const file of files){
  const pos=bootstrap.indexOf('"'+file+'"',cursor+1);
  assert.ok(pos>cursor,'current Core owner must preserve Tactical base order: '+file);
  cursor=pos;
}

assert.match(bootstrap,/const files=\[/,'Core RuntimeBootstrap must currently own the Tactical file list');
assert.match(bootstrap,/if\(R\.__gensTacticalV2Loader105\)return true;/,'current loader idempotency guard missing');
assert.match(bootstrap,/R\.__gensTacticalV2Loader105=true;/,'current loader must set idempotency guard before loading');
assert.match(bootstrap,/s\.src=files\[i\]\+"\?v=16\.78\.105";/,'current cache/version suffix must be preserved');
assert.match(bootstrap,/s\.async=false;/,'current sequential loading must remain explicit');
assert.match(bootstrap,/s\.onload=\(\)=>load\(i\+1\)/,'current sequential success path missing');
assert.match(bootstrap,/s\.onerror=\(\)=>\{console\.error\("GenSrpG RuntimeBootstrap V1 load failed",files\[i\]\);load\(i\+1\)\}/,
  'current sequential error continuation missing');

const finalizeStart=bootstrap.indexOf('function finalize(){');
const loadStart=bootstrap.indexOf('function load(i){');
assert.ok(finalizeStart>=0&&loadStart>finalizeStart,'finalize/load boundaries missing');
const finalize=bootstrap.slice(finalizeStart,loadStart);
assert.match(finalize,/GensRpgTacticalCombatV2Bridge\?\.install\?\.\(R\)/,'bridge final install missing');
for(const ms of [250,1200,3000]) assert.ok(finalize.includes('setTimeout(apply,'+ms+')'),'bridge retry '+ms+' missing');

assert.match(runtimeGuard,/RuntimeBootstrap is the one documented owner of base Tactical composition/,
  'historical runtime composition guard must still describe the current owner before migration');

console.log(JSON.stringify({
  scenario:'Phase 8 Tactical composition handoff characterization',
  currentOwner:'assets/gensrpg/core/runtime-bootstrap-v1.js',
  targetOwner:'assets/gensrpg/tactical/entry-v1.js',
  entryCurrentlyInert:true,
  files,
  sequentialLoading:true,
  idempotencyGuard:'__gensTacticalV2Loader105',
  bridgeRetries:[0,250,1200,3000],
  gameplayChangeExpected:false,
  indexChangeRequired:false
},null,2));
