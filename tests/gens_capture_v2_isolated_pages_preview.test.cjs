'use strict';
// Release gate for one physically isolated HTTPS preview from the EXISTING
// GitHub Pages publisher. Never substitute html-preview or the old Capture.
// All checks read the assembled _site produced by the real publisher.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const site=path.resolve(process.env.GENSRPG_PAGES_SITE||'_site');
const rel='preview/capture-v2-pr225';
const trial=path.join(site,rel);
const previewSha='4015c36321fe090558c9933cc7c4e548ebbd81e7';
const combatSha='81ad362a401b7b2eb9faa811528aced9f2d6384a';
const explorationSha='ba0701224b764f4c60d4294c9729a49ade5869ad';
const sha256=buf=>crypto.createHash('sha256').update(buf).digest('hex');
const read=(base,p)=>fs.readFileSync(path.join(base,p));
const json=(base,p)=>JSON.parse(read(base,p));
const required=(base,p)=>assert.ok(fs.statSync(path.join(base,p)).isFile(),p);
test('production root remains intact and preview exists ONLY in its isolated Pages subdirectory',()=>{
  for(const f of ['index.html','service-worker.js','manifest.webmanifest'])required(site,f);
  for(const f of ['index.html','service-worker.js','manifest.webmanifest','assets/gensrpg/capture-v2/shell-entry-v1.js',
   'assets/gensrpg/capture-v2/source-pins-v1.json',
   'vendor/combat-lab/examples/dom-demo/capture-editor-v2.html',
   'vendor/exploration-lab/sculpt-lab.html',
   'vendor/exploration-lab/src/sculpt-lab-main.js'])required(trial,f);
  const provenance=json(trial,'release-provenance.v1.json');
  assert.equal(provenance.schema,'gensrpg-capture-v2-isolated-pages-preview-v1');
  assert.equal(provenance.source.commit,previewSha);
  assert.equal(provenance.source.ref,'pr-225-immutable-commit');
  assert.equal(provenance.publicPath,'/'+rel+'/');
  assert.equal(provenance.productionRootSha256,sha256(read(site,'index.html')),
    'publisher must never replace production root with the draft Capture app');
  assert.equal(provenance.previewIndexSha256,sha256(read(trial,'index.html')));
  assert.notEqual(provenance.productionRootSha256,provenance.previewIndexSha256);
  assert.equal(provenance.legacyCaptureRuntime,false);
  const html=read(trial,'index.html').toString('utf8');
  assert.match(html,/assets\/gensrpg\/capture-v2\/shell-entry-v1\.js/);
  assert.doesNotMatch(html,/<script[^>]+src=["']assets\/gensrpg\/capture\//);
  assert.equal(fs.existsSync(path.join(trial,'assets/gensrpg/capture/runtime-data')),false);
});
test('exact official Lab main files and derived Showcase have one owner and verified checksums',()=>{
  const source=json(trial,'assets/gensrpg/capture-v2/source-pins-v1.json');
  const delivery=json(trial,'assets/gensrpg/capture-v2/delivery-manifest.json');
  const provenance=json(trial,'release-provenance.v1.json');
  assert.equal(source.combat.sha,combatSha);
  assert.equal(source.exploration.sha,explorationSha);
  assert.equal(delivery.combat.sha,combatSha);
  assert.equal(delivery.exploration.sha,explorationSha);
  assert.equal(provenance.combat.sha,combatSha);
  assert.equal(provenance.exploration.sha,explorationSha);
  assert.equal(delivery.legacyCaptureRuntime,false);
  assert.equal(delivery.combatEncounterBundle.owner,'combat');
  const bundle=delivery.combatEncounterBundle;
  const bytes=read(trial,bundle.path);
  assert.equal(bundle.sourceSha,combatSha);
  assert.equal(bundle.sha256,sha256(bytes));
  const payload=JSON.parse(bytes.toString('utf8'));
  assert.equal(payload.authorSha,combatSha);
  assert.equal(payload.engineSha,combatSha);
  const recorded=new Set();
  for(const record of delivery.transport){
    assert.match(record.path,/^vendor\/(combat-lab|exploration-lab)\//);
    assert.ok(!record.path.includes('..'));
    assert.ok(!recorded.has(record.path),'duplicate native owner transport');
    recorded.add(record.path);
    assert.equal(record.sha256,sha256(read(trial,record.path)),record.path);
  }
  assert.ok(delivery.transport.length>=8);
});
test('the existing single Pages publisher remains the only deployment authority',()=>{
  const text=read(root,'.github/workflows/main.yml').toString('utf8');
  assert.match(text,/name: Deploy GenSrpG to GitHub Pages/);
  assert.match(text,/uses: actions\/deploy-pages@v4/);
  assert.match(text,/github\.ref == 'refs\/heads\/main'/);
  assert.match(text,/ref: 4015c36321fe090558c9933cc7c4e548ebbd81e7/);
  assert.match(text,/node tools\/stage_capture_v2_pages_preview\.mjs/);
  assert.doesNotMatch(text,/ref: work\/gensrpg-capture-clean-replacement-/);
});
