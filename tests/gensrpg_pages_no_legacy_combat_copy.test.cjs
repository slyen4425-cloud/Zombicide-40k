'use strict';
// Pages release C2: retire the historical PASSIVE Capture V1 payload from the
// canonical public site. Keep its standalone review-only CI workflow separate.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const site=path.resolve(process.env.GENSRPG_PAGES_SITE||'_site');
const workflow=fs.readFileSync(path.join(root,'.github/workflows/main.yml'),'utf8');
test('the public publisher never repackages the old full Combat lab',()=>{
 assert.doesNotMatch(workflow,/^\s*run:\s*node tools\/stage_capture_lab_delivery\.mjs\b/m,
  'the inactive historical full Lab transport must not be copied into Pages');
 assert.doesNotMatch(workflow,/^\s*node --test tests\/gens_capture_lab_delivery_v1\.test\.cjs\s*$/m,
  'the old package-only gate must be kept only in its standalone, non-publishing CI');
 const manual=fs.readFileSync(path.join(root,'.github/workflows/capture-lab-delivery.yml'),'utf8');
 assert.match(manual,/stage_capture_lab_delivery\.mjs/);
 const triggers=manual.split(/\npermissions:/)[0];
 assert.match(triggers,/on:\s*\n  workflow_dispatch:/);
 assert.doesNotMatch(triggers,/\n  (?:push|pull_request):/,
  'retired full-Lab artifact job must not be generated automatically for PRs or pushes');
 assert.doesNotMatch(manual,/actions\/deploy-pages@|actions\/upload-pages-artifact@/,
  'manual legacy package may be audited as an artifact, never published as another site');
});
test('public site has no root-level historical vendor/author-data duplicate',()=>{
 for(const rel of ['vendor/combat-lab','assets/gensrpg/capture/runtime-data']){
  assert.equal(fs.existsSync(path.join(site,rel)),false,
   'obsolete full legacy copy shipped in Pages: '+rel);
 }
});
test('single Pages owner and isolated official V2 preview remain',()=>{
 assert.match(workflow,/node tools\/stage_capture_v2_pages_preview\.mjs/);
 assert.match(workflow,/actions\/upload-pages-artifact@v3/);
 assert.match(workflow,/actions\/deploy-pages@v4/);
 assert.match(workflow,/node --test tests\/gensrpg_pages_no_legacy_combat_copy\.test\.cjs/);
 const rel='preview/capture-v2-pr225/vendor/combat-lab/examples/dom-demo/capture-editor-v2.html';
 if(fs.existsSync(path.join(site,'preview/capture-v2-pr225')))
  assert.equal(fs.existsSync(path.join(site,rel)),true,'published V2 entry must remain intact');
});
