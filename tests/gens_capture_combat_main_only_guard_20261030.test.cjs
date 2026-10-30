'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const legacy=JSON.parse(read('docs/GENSRPG_CAPTURE_LAB_STAGED_FILES_2026-10-27.json'));
const loader=read('assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs');
const pins=JSON.parse(read('assets/gensrpg/capture-v2/source-pins-v1.json'));
test('the active Pages pipeline admits only two EXACT main pins, without the old Capture payload',()=>{
 const y=read('.github/workflows/main.yml');
 assert.equal(pins.legacyCaptureRuntime,false);
 for(const owner of ['combat','exploration']){
  assert.equal(pins[owner].ref,'main');
  assert.match(pins[owner].sha,/^[a-f0-9]{40}$/);
  assert.match(y,/refs\/heads\/main/,'must check the upstream main ref');
  assert.match(y,/actual!==entry\.sha/,'must fail on upstream SHA drift');
  assert.match(y,/actual!==pins\[name\]\.sha/,'must verify checkout SHA before packaging');
 }
 assert.match(y,/source-pins-v1\.json/);
 assert.match(y,/stage_capture_v2_labs\.mjs/);
 assert.match(y,/outputs\.combat/);
 assert.match(y,/outputs\.exploration/);
 assert.doesNotMatch(y,/stage_capture_lab_delivery\.mjs|combat-assets|ref:\s*gh-pages/,
  'retired or moving Capture authority must not be shipped');
});
test('historical Capture release workflow remains pinned until retired, never silently ships a moving Combat version',()=>{
 const y=read('.github/workflows/capture-lab-delivery.yml');
 assert.match(y,/refs\/heads\/main/);
 assert.match(y,/COMBAT_LAB_SOURCE_V1\.sha!==combatMain/);
 assert.match(y,/throw Error\('Combat pin differs from approved main/);
 assert.doesNotMatch(y,/ref:\s*gh-pages/);
});
test('archive remains immutable while clean Capture V2 uses one Combat main SHA',()=>{
 assert.match(legacy.authoredSourceLabPin,/^[a-f0-9]{40}$/);
 assert.ok(loader.includes(legacy.authoredSourceLabPin));
 assert.equal(legacy.originalWildBattleButton.officialSourceSha,legacy.authoredSourceLabPin);
 assert.equal(pins.combat.sha,legacy.authoredSourceLabPin);
 assert.doesNotMatch(loader,/8318220b6a9b883aeced1d4bf693f906b0f36d3d/);
});