'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const json=rel=>JSON.parse(read(rel));

const index=read('index.html');
const preview=read('preview.html');
const deploy=read('.github/workflows/main.yml');
const lastOwners=read('docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv');

const shell=json('assets/gensrpg/shell/module-contract-v1.json');
const launch=json('assets/gensrpg/shell/module-launch-contract-v1.json');

assert.equal(launch.version,1);
assert.equal(launch.phase,5);
assert.equal(launch.contract,'module-launch');
assert.equal(launch.owner,'shell');
assert.equal(launch.operation,'startModuleSession');
assert.deepEqual(launch.providers,['survival','dungeon','capture','pvp']);
assert.deepEqual(launch.arguments,[]);
assert.equal(launch.returns,'handled:boolean|Promise<boolean>');

for(const required of [
  'Shell selects the provider only from public active module routing state',
  'the selected module owns its launch preconditions and session initialization',
  'participants, world initialization and module-owned UI transitions remain inside the selected module',
  'no private module runtime state is read or transported through the Shell',
  'no gameplay rule or gameplay state ownership moves into the Shell',
  'the legacy startConfiguredGame chain remains frozen until a provider proves parity on the real end-to-end user paths',
  'static wrapper order or shadowing alone is never sufficient evidence for retiring a launch authority',
  'the contract remains metadata-only until an explicit Phase 5 runtime raccord is separately approved'
]){
  assert.ok(launch.invariants.includes(required),'missing module-launch invariant: '+required);
}

for(const forbidden of [
  'private module storage inspection by Shell',
  'module gameplay logic in Shell',
  'cross-module runtime mutation',
  'global compatibility wrapper',
  'observer timer retry or polling authority',
  'retiring captureFix135 from static shadowing evidence alone',
  'Tactical combat resolution'
]){
  assert.ok(launch.forbidden.includes(forbidden),'missing module-launch forbidden rule: '+forbidden);
}

assert.ok(shell.consumes.includes('module public entry contracts'));
assert.ok(shell.consumes.includes('module launch contract'));
assert.ok(shell.forbidden.includes('module gameplay rules'));
assert.ok(shell.forbidden.includes('private module runtime state'));

for(const module of ['survival','dungeon','capture','pvp']){
  const contract=json('assets/gensrpg/'+module+'/module-contract-v1.json');
  const entry=contract.publicEntries?.moduleLaunch;
  assert.ok(entry,module+' must declare the module launch public entry');
  assert.equal(entry.contract,'assets/gensrpg/shell/module-launch-contract-v1.json');
  assert.equal(entry.operation,'startModuleSession');
  assert.equal(entry.status,'declared-not-loaded');
  assert.equal(entry.ownership,'module-owned-session-start');

  const src=read('assets/gensrpg/'+module+'/entry-v1.js');
  assert.doesNotMatch(src,/window\.|document\.|localStorage|MutationObserver|setInterval|setTimeout/,
    module+' Phase 3 entry must remain inert during launch-contract preaudit');
}

// The previous user-regression rollback is now an architectural invariant.
// No future lot may remove captureFix135 merely because an outer Capture wrapper appears to shadow it.
assert.ok(fs.existsSync(path.join(root,'tests/gens_phase5_user_regression_rollback_guard_v1.test.cjs')),
  'the user-regression rollback guard must remain permanent');
const rollbackGuard=read('tests/gens_phase5_user_regression_rollback_guard_v1.test.cjs');
assert.match(rollbackGuard,/captureFix135 must retain its historical startConfiguredGame boundary until a replacement contract is proven on real user paths/);
assert.match(rollbackGuard,/assert\.equal\(assignments,4/);

const blocks=[...index.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],body:m[2]}));
const chain=[];
for(const block of blocks){
  const count=[...block.body.matchAll(/window\.startConfiguredGame\s*=(?!=)/g)].length;
  for(let i=0;i<count;i++)chain.push(block.id);
}
assert.deepEqual(chain,[
  'captureFix135',
  'captureFix138',
  'captureFix139',
  'gensDungeonCore01Js'
],'module-launch preaudit must freeze the four remaining historical startConfiguredGame global owners after Core200 retirement');
assert.match(lastOwners,/^startConfiguredGame\t4\tgensDungeonCore01Js$/m);

// Metadata-only means no new launch contract or Phase 3 entry is connected to production composition.
assert.doesNotMatch(index,/module-launch-contract-v1\.json|assets\/gensrpg\/(?:shell|survival|dungeon|capture|pvp)\/entry-v1\.js/);
assert.doesNotMatch(preview,/module-launch-contract-v1\.json|assets\/gensrpg\/(?:shell|survival|dungeon|capture|pvp)\/entry-v1\.js/);
assert.doesNotMatch(deploy,/module-launch-contract-v1\.json|assets\/gensrpg\/(?:shell|survival|dungeon|capture|pvp)\/entry-v1\.js/);

console.log(JSON.stringify({
  scenario:'Phase 5 module launch contract preaudit',
  contract:'module-launch/startModuleSession',
  providers:launch.providers,
  startConfiguredGameChain:chain,
  regressionInvariant:'captureFix135 remains until replacement contract is proven by real E2E paths',
  runtimeChanged:false,
  productionLoadGraphChanged:false
},null,2));
