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
  assert.equal(entry.status,module==='capture'?'loaded-public-provider':'declared-not-loaded');
  assert.equal(entry.ownership,'module-owned-session-start');

  const src=read('assets/gensrpg/'+module+'/entry-v1.js');
  if(module==='survival'){
    assert.match(src,/GensSurvivalV1/,'Phase 6 may activate the Survival wave-rules namespace');
    assert.doesNotMatch(src,/startModuleSession|GensShellModuleLaunchV1|moduleLaunch/,
      'active Survival wave rules must not take module-launch authority');
    assert.doesNotMatch(src,/document\.|localStorage|sessionStorage|indexedDB|MutationObserver|setInterval|setTimeout|addEventListener|Dungeon|Tactical|Capture|PvP/,
      'active Survival wave rules must remain pure and isolated');
  }else if(module==='dungeon'){
    assert.equal(contract.status,'partial-runtime-loaded',
      'Phase 7 may activate only the reviewed partial Dungeon runtime slice');
    assert.equal(contract.activatedPhase,7);
    assert.equal(contract.publicRuntimeApi,'GensDungeonV1');
    assert.match(src,/GensDungeonV1/,'Phase 7 must expose the public Dungeon namespace');
    assert.match(src,/planGeneratedAdvance/,'Phase 7 must expose only the reviewed generated-advance planner slice');
    assert.doesNotMatch(src,/startModuleSession|GensShellModuleLaunchV1|moduleLaunch/,
      'active Dungeon exploration slice must not take module-launch authority');
    assert.doesNotMatch(src,/document\.|localStorage|sessionStorage|indexedDB|MutationObserver|setInterval|setTimeout|addEventListener|Tactical|Capture|Survival|PvP/,
      'active Dungeon exploration slice must remain pure and isolated');
  }else if(module==='capture'){
    assert.equal(contract.status,'partial-runtime-loaded');
    assert.equal(contract.activatedPhase,9);
    assert.equal(contract.publicRuntimeApi,'GensCaptureV1');
    assert.match(src,/function startModuleSession\(\)/);
    assert.match(src,/function install\(owner\)/);
    assert.match(src,/sessionStartOwner/);
    assert.match(src,/shell\.register\("capture",startModuleSession\)/);
    assert.doesNotMatch(src,/document\.|localStorage|sessionStorage|indexedDB|MutationObserver|setInterval|setTimeout|addEventListener|DungeonCore|DungeonSpatial|GensTactical|CombatRuntime|WorldDocument/,
      'Capture Phase 9 public provider entry must remain routing-only');
  }else{
    assert.doesNotMatch(src,/window\.|globalThis|document\.|localStorage|MutationObserver|setInterval|setTimeout/,
      module+' Phase 3 entry must remain inert during launch-contract preaudit');
  }
}

// The previous user-regression rollback is now an architectural invariant.
// No future lot may remove captureFix135 merely because an outer Capture wrapper appears to shadow it.
assert.ok(fs.existsSync(path.join(root,'tests/gens_phase5_user_regression_rollback_guard_v1.test.cjs')),
  'the user-regression rollback guard must remain permanent');
const rollbackGuard=read('tests/gens_phase5_user_regression_rollback_guard_v1.test.cjs');
assert.match(rollbackGuard,/captureFix135 global startConfiguredGame owner must remain retired/);
assert.match(rollbackGuard,/assert\.equal\(assignments,2/);
assert.ok(fs.existsSync(path.join(root,'tests/gens_phase5_startconfiguredgame_capture135_global_retirement_v1.test.cjs')),
  'the dedicated captureFix135 retirement RED/contract must remain present');

const blocks=[...index.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],body:m[2]}));
const chain=[];
for(const block of blocks){
  const count=[...block.body.matchAll(/window\.startConfiguredGame\s*=(?!=)/g)].length;
  for(let i=0;i<count;i++)chain.push(block.id);
}
assert.deepEqual(chain,[
  'captureFix138',
  'gensDungeonCore01Js'
],'module-launch preaudit must track the reduced two-owner historical startConfiguredGame chain after Capture139 retirement');
assert.match(lastOwners,/^startConfiguredGame\t2\tgensDungeonCore01Js$/m);

// Phase 6 keeps the pure Survival wave-rules entry connected and Phase 7 additionally connects
// the reviewed pure Dungeon exploration planner. The module-launch contract itself remains metadata-only.
assert.equal((index.match(/assets\/gensrpg\/survival\/entry-v1\.js/g)||[]).length,1,
  'Phase 6 must keep the Survival entry loaded exactly once');
assert.equal((index.match(/assets\/gensrpg\/dungeon\/entry-v1\.js/g)||[]).length,1,
  'Phase 7 must load the reviewed Dungeon entry exactly once');
assert.equal((index.match(/assets\/gensrpg\/capture\/entry-v1\.js/g)||[]).length,1,
  'Phase 9 must load the Capture public entry exactly once');
assert.equal((index.match(/assets\/gensrpg\/capture\/session-start-v1\.js/g)||[]).length,1,
  'Phase 9 must load the Capture session-start owner exactly once');
assert.doesNotMatch(index,/module-launch-contract-v1\.json|assets\/gensrpg\/(?:shell|pvp)\/entry-v1\.js/,
  'Phase 9 must not activate Shell/PvP target entries or runtime-load the launch contract metadata');
assert.doesNotMatch(preview,/module-launch-contract-v1\.json|assets\/gensrpg\/(?:shell|survival|dungeon|capture|pvp)\/entry-v1\.js/,
  'preview must inherit the source index and not inject module entries independently');
assert.doesNotMatch(deploy,/module-launch-contract-v1\.json|assets\/gensrpg\/(?:shell|survival|dungeon|capture|pvp)\/entry-v1\.js/,
  'Pages composition must inherit the source index and not inject module entries independently');

console.log(JSON.stringify({
  scenario:'Phase 5 module launch contract preaudit',
  contract:'module-launch/startModuleSession',
  providers:launch.providers,
  startConfiguredGameChain:chain,
  regressionInvariant:'captureFix135 global retirement is accepted only after dedicated RED and real E2E parity; captureFix138 requires a fresh re-audit',
  runtimeChanged:true,
  productionLoadGraphChanged:'Phase 9 Capture public entry active; Shell registry contract remains public routing metadata'
},null,2));
