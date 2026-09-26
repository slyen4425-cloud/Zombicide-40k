'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),
  bytes
])).digest('hex');

assert.equal(bytes.length,8170150,'Phase 6 exit audit must target the validated builtin-boundary runtime');
assert.equal(gitBlob,'ca5cb0b92f4e6ff8779ebe2339bb2be32a89f8f9',
  'Phase 6 exit audit runtime blob drifted');

const entry=read('assets/gensrpg/survival/entry-v1.js');
const contract=JSON.parse(read('assets/gensrpg/survival/module-contract-v1.json'));
assert.doesNotMatch(entry,/\bDungeon\w*\b|\bdungeon\w*\b/,
  'Survival public entry must not consume private Dungeon runtime');
assert.doesNotMatch(entry,/\bTactical\w*\b|\btactical\w*\b/,
  'Survival public entry must not consume private Tactical runtime');
assert.doesNotMatch(entry,/assets\/gensrpg\/(?:dungeon|tactical)\//,
  'Survival public entry must not import a private Dungeon/Tactical file');
assert.match(entry,/root\.GensSurvivalV1=Object\.freeze\(/,
  'Survival must expose one public GensSurvivalV1 entry');

for(const forbidden of ['Dungeon private runtime','Tactical private runtime']){
  assert.ok(contract.forbidden.includes(forbidden),'Survival contract must forbid '+forbidden);
}
assert.equal(contract.publicRuntimeApi,'GensSurvivalV1');

for(const rel of [
  'assets/gensrpg/core/dice-v1.js',
  'assets/gensrpg/core/stats-snapshot-v1.js',
  'assets/gensrpg/core/inventory-equipped-view-v1.js',
  'assets/gensrpg/core/asset-resolver-v1.js'
]){
  assert.ok(fs.existsSync(path.join(root,rel)),'Phase 6 exit requires the validated Core service: '+rel);
}

const tsv=read('docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv');
const owners=new Map();
for(const line of tsv.split(/\r?\n/)){
  if(!line||line.startsWith('#'))continue;
  const [name,count,lastOwner]=line.split('\t');
  if(name&&count&&lastOwner)owners.set(name,{count:Number(count),lastOwner});
}
const loadedButInactiveDungeonOwners={
  openZombieRule:owners.get('openZombieRule'),
  enemyCardHtml:owners.get('enemyCardHtml'),
  renderActiveEnemies:owners.get('renderActiveEnemies'),
  activeEnemyDefinition:owners.get('activeEnemyDefinition')
};
assert.deepEqual(loadedButInactiveDungeonOwners.openZombieRule,{count:3,lastOwner:'dungeonDirectImageBinding166'});
assert.deepEqual(loadedButInactiveDungeonOwners.enemyCardHtml,{count:3,lastOwner:'dungeonDirectImageBinding166'});
assert.deepEqual(loadedButInactiveDungeonOwners.renderActiveEnemies,{count:3,lastOwner:'dungeonDirectImageBinding166'});
assert.deepEqual(loadedButInactiveDungeonOwners.activeEnemyDefinition,{count:2,lastOwner:'dungeonArtRenderFix165'});

const browserContract=read('tests/gens_phase6_exit_survival_runtime_browser_characterization_v1.test.cjs');
assert.match(browserContract,/tacticalOverlayVisible,false/,'Phase 6 browser contract must require Tactical UI inactive in Survival');
assert.match(browserContract,/tacticalUiBattle,false/,'Phase 6 browser contract must require no Tactical UI battle');
assert.match(browserContract,/tacticalBridgeBattle,false/,'Phase 6 browser contract must require no Tactical bridge battle');
assert.match(browserContract,/openZombieRule:0[\s\S]*enemyCardHtml:0[\s\S]*renderActiveEnemies:0[\s\S]*activeEnemyDefinition:0/,
  'Phase 6 browser contract must require residual Dungeon-owned enemy helpers to stay unused in Survival');
assert.match(browserContract,/triggerCount,0/,'Phase 6 browser contract must forbid Dungeon-owned enemy rule triggers in Survival');

const workflow=read('.github/workflows/gensrpg-architecture-sentinels.yml');
assert.match(workflow,/Caractériser le runtime de sortie Phase 6 Survie[\s\S]*gens_phase6_exit_survival_runtime_browser_characterization_v1\.test\.cjs/,
  'Phase 6 exit browser contract must stay wired to CI');
assert.match(workflow,/Auditer la sortie Phase 4 vers Phase 5[\s\S]*gens_phase4_exit_audit_v1\.test\.cjs/,
  'Phase 6 exit must keep the validated Core Phase 4 exit audit in CI');

const result={
  scenario:'Phase 6 exit audit',
  runtime:{bytes:bytes.length,blob:gitBlob},
  survival:{
    publicApi:contract.publicRuntimeApi,
    privateDungeonDependency:false,
    privateTacticalDependency:false,
    coreServices:['dice','stats','inventory','assets']
  },
  loadedButInactiveDungeonOwners,
  runtimeCriterion:{
    dungeonInactive:'browser contract',
    tacticalInactive:'browser contract',
    residualDungeonEnemyOwnersUnused:'browser contract'
  },
  phase6ExitReady:true,
  nextPhase:'Phase 7 — Dungeon exploration'
};

console.log(JSON.stringify(result,null,2));
