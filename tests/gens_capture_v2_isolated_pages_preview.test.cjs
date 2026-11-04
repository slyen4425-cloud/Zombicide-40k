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
const previewPin=JSON.parse(fs.readFileSync(path.join(root,'tools/capture_v2_pages_preview_pin.json')));
const previewSha=previewPin.sha;
const combatSha='46b4efede522f3410778271fddec872a36f1c54b';
const explorationSha='4e7abd15d7b57909524ba697b74f63a193fce839';
const sha256=buf=>crypto.createHash('sha256').update(buf).digest('hex');
const read=(base,p)=>fs.readFileSync(path.join(base,p));
const json=(base,p)=>JSON.parse(read(base,p));
const required=(base,p)=>assert.ok(fs.statSync(path.join(base,p)).isFile(),p);
test('production root remains intact and preview exists ONLY in its isolated Pages subdirectory',()=>{
  for(const f of ['index.html','service-worker.js','manifest.webmanifest'])required(site,f);
  for(const f of ['index.html','service-worker.js','manifest.webmanifest','assets/gensrpg/capture-v2/shell-entry-v1.js',
   'assets/gensrpg/capture-v2/source-pins-v1.json','assets/gensrpg/capture-v2/adventure.html',
   'vendor/combat-lab/examples/dom-demo/capture-editor-v2.html',
   'vendor/exploration-lab/sculpt-lab.html','vendor/exploration-lab/play.html',
   'vendor/exploration-lab/src/sculpt-lab-main.js'])required(trial,f);
  const provenance=json(trial,'release-provenance.v1.json');
  assert.equal(provenance.schema,'gensrpg-capture-v2-isolated-pages-preview-v1');
  assert.equal(provenance.source.commit,previewSha);
  assert.equal(provenance.source.ref,'approved-immutable-commit');
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
test('preview PWA never shares the production cache namespace or cleanup authority',()=>{
 const production=read(site,'service-worker.js').toString('utf8');
 const candidate=read(trial,'service-worker.js').toString('utf8');
 assert.match(production,/const CACHE_NAME = "gensrpg-cache-/,
   'the existing root worker stays byte-for-byte the production owner');
 assert.match(candidate,/const CACHE_NAME = "gensrpg-preview-capture-v2-[0-9a-f]{12}";/,
   'preview has a distinct deterministic cache namespace');
 assert.match(candidate,/name\.startsWith\("gensrpg-preview-capture-v2-"\)\s*&&\s*name!==CACHE_NAME/,
   'preview worker must never delete production PWA cache names during activation');
 assert.doesNotMatch(candidate,/name\.startsWith\("gensrpg-cache-"\)/,
   'unbounded production cache cleanup is forbidden from an isolated preview');
 const manifest=json(trial,'manifest.webmanifest');
 assert.equal(manifest.start_url,'./');
 assert.equal(manifest.scope,'./');
 assert.equal(manifest.id,'./',
   'preview PWA identity must remain relative to its isolated public path');
 assert.equal(json(trial,'release-provenance.v1.json').previewServiceWorkerSha256,
   sha256(read(trial,'service-worker.js')));
 assert.equal(json(trial,'release-provenance.v1.json').productionServiceWorkerSha256,
   sha256(read(site,'service-worker.js')));
});
test('actual preview service worker activation cannot delete production caches',async()=>{
 // Execute the actual SW activate callback, not a copy of its cleanup
 // algorithm. The minimal CacheStorage fixture exposes a collision with the
 // installed stable PWA on the SAME origin.
 const vm=require('node:vm');
 const worker=read(trial,'service-worker.js').toString('utf8');
 const current='gensrpg-preview-capture-v2-'+previewSha.slice(0,12);
 const previous='gensrpg-preview-capture-v2-previous';
 const production='gensrpg-cache-16.78.118-capture-v2-scoped-cache-cleanup';
 const keys=[production,current,previous];
 let activation=null,waited=null;
 const deleted=[];
 const scope={
   self:{
     addEventListener(name,listener){if(name==='activate')activation=listener;},
     clients:{claim:async()=>{}},registration:{scope:'https://example.invalid/preview/capture-v2-pr225/'},
     skipWaiting(){}
   },
   caches:{
     keys:async()=>keys.slice(),
     delete:async name=>{deleted.push(name);return true;}
   },
   console
 };
 vm.runInNewContext(worker,scope,{filename:'actual-staged-preview-service-worker.js'});
 assert.equal(typeof activation,'function','real preview SW must install its activation listener');
 activation({waitUntil(promise){waited=promise;}});
 assert.ok(waited&&typeof waited.then==='function');
 await waited;
 assert.deepEqual(deleted,[previous],
   'preview SW may remove old preview cache versions only; installed production stays untouched');
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
  assert.ok(text.includes('ref: ${{ steps.preview_pin.outputs.sha }}'),
    'preview checkout must derive only from the canonical immutable release pin');
  assert.match(text,/node tools\/stage_capture_v2_pages_preview\.mjs/);
  assert.doesNotMatch(text,/ref: work\/gensrpg-capture-clean-replacement-/);
});

test('preview transport can include the official Jouer entry from its certified Explorer checkout',()=>{
  const flow=read(root,'.github/workflows/main.yml').toString('utf8');
  const stage=read(root,'tools/stage_capture_v2_pages_preview.mjs').toString('utf8');
  const sparse=[...flow.matchAll(/path: preview-exploration-lab\n\s+sparse-checkout: \|\n((?: {12,}\S[^\n]*\n)+)/g)];
  assert.equal(sparse.length,2);
  for(const [,files] of sparse)assert.match(files,/^\s*play\.html\s*$/m);
  assert.match(stage,/for\(const filename of \[[^\]]*'play\.html'[^\]]*\]\)/);
  assert.match(stage,/const from=path\.join\(exploration,filename\);\s*if\(fs\.existsSync\(from\)\)fs\.copyFileSync\(from,path\.join\(exploreDest,filename\)\)/);
});
