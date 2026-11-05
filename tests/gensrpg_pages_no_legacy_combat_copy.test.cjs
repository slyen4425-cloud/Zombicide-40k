'use strict';
// Pages dedupe + compatibility guard. The legacy 2v2 demo must not silently
// break while its verified author source is migrated to the official V2 entry.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const site=path.resolve(process.env.GENSRPG_PAGES_SITE||'_site');
const read=name=>fs.readFileSync(path.join(root,name),'utf8');
const workflow=read('.github/workflows/main.yml');
test('publisher has exactly one live legacy 2v2 compatibility package and one official V2 preview',()=>{
 const legacy='node tools/stage_capture_lab_delivery.mjs combat-lab combat-assets _site';
 const native='node tools/stage_capture_v2_pages_preview.mjs';
 assert.equal(workflow.split(legacy).length,2,'the original 2v2 active transport may appear only once');
 assert.equal(workflow.split(native).length,2,'official V2 preview should be assembled once');
 assert.ok(workflow.indexOf(legacy)<workflow.indexOf(native),
  'the legacy test should be validated before staging the current V2 subsite');
 assert.match(workflow,/node --test tests\/gensrpg_pages_release_budget\.test\.cjs/);
 const manual=read('.github/workflows/capture-lab-delivery.yml');
 assert.match(manual,/stage_capture_lab_delivery\.mjs/);
 const triggers=manual.split(/\npermissions:/)[0];
 assert.match(triggers,/on:\s*\n  workflow_dispatch:/);
 assert.doesNotMatch(triggers,/\n  (?:push|pull_request):/,
  'full historical artifact must not be produced twice on every PR');
 assert.doesNotMatch(manual,/actions\/deploy-pages@|actions\/upload-pages-artifact@/);
});
test('published original 2v2 button still has its tested owner transport until migrated',()=>{
 const html=read('capture-world-2v2-test.html');
 assert.match(html,/prepareCapture2v2Preview/);
 assert.match(html,/vendor\/combat-lab\//);
 assert.match(html,/runtime-data\/author-inputs\.json/);
 const smoke=read('.github/workflows/capture-2v2-pages-public-smoke.yml');
 assert.match(smoke,/capture-world-2v2-test\.html/);
 assert.match(smoke,/runtime-data\/author-inputs\.json/);
});
test('assembled site retains both explicitly owned live experiences without 2v2 404s',()=>{
 if(!fs.existsSync(site)){
  if(process.env.GENSRPG_REQUIRE_PAGES_SITE==='1')throw Error('Pages site missing in release');
  return;
 }
 for(const rel of ['capture-world-2v2-test.html',
  'assets/gensrpg/capture/runtime-data/author-inputs.json',
  'vendor/combat-lab/src/contracts/capture-creature-transfer-v1.js',
  'preview/capture-v2-pr225/vendor/combat-lab/examples/dom-demo/capture-editor-v2.html']){
  assert.ok(fs.statSync(path.join(site,rel)).isFile(),rel+' must remain served');
 }
});
