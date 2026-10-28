'use strict';
// Black-box release gate: exact pinned modules load from their eventual Pages
// paths, not a working directory, CDN, moving branch or synthetic runtime.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {pathToFileURL}=require('node:url');
const {execFileSync}=require('node:child_process');
const test=require('node:test');

const root=path.resolve(__dirname,'..');
const site=path.resolve(process.env.CAPTURE_LAB_DELIVERY_SITE||'_site');
const lab=path.resolve(process.env.COMBAT_LAB_ROOT||'');
const assets=path.resolve(process.env.COMBAT_ASSETS_ROOT||'');
const read=p=>fs.readFileSync(path.join(site,p));
const data='assets/gensrpg/capture/runtime-data/';
const sha256=b=>crypto.createHash('sha256').update(b).digest('hex');
const gitblob=b=>crypto.createHash('sha1').update('blob '+b.length+'\0').update(b).digest('hex');
const gitsha=p=>execFileSync('git',['-C',p,'rev-parse','HEAD'],{encoding:'utf8'}).trim();

test('Capture production-shaped static transport: real official pins and every byte accounted for',()=>{
 const manifest=JSON.parse(read(data+'delivery-manifest.json').toString());
 const pins=JSON.parse(fs.readFileSync(path.join(root,'docs/GENSRPG_CAPTURE_LAB_STAGED_FILES_2026-10-27.json')));
 assert.equal(manifest.schema,'gensrpg-capture-official-delivery-v1');
 assert.equal(manifest.version,1);
 assert.equal(manifest.productionActivated,false);
 assert.equal(manifest.combatSha,'65e21792ff74aea9862e528c8dbfdb22797b6693');
 assert.equal(manifest.combatSha,gitsha(lab));
 assert.equal(manifest.assetsSha,gitsha(assets));
 assert.equal(manifest.assetsSha,pins.authoredAssetsPin);
 assert.equal(manifest.combatRepository,'slyen4425-cloud/GenSrpg_labo_combat_dynamique');
 assert.deepEqual(manifest.supportedCreatureIds,['crea-loup','crea_voltik'],
  'only the two actual authored transfers are supported; not a fake complete catalog');
 assert.equal(manifest.vendorDirectory,'vendor/combat-lab/');
 assert.equal(manifest.dataDirectory,data);
 const paths=manifest.transport.map(x=>x.path);
 assert.equal(new Set(paths).size,paths.length,'one deterministic authority per packaged path');
 assert.ok(paths.length>15,'the package must contain official runtime, author modules and metadata');
 assert.ok(paths.every(p=>p.startsWith(manifest.vendorDirectory)||p.startsWith(data)),
  'no speculative public/game shell path');
 for(const entry of manifest.transport){
  const content=read(entry.path);
  assert.equal(content.length,entry.size,'transport length: '+entry.path);
  assert.equal(sha256(content),entry.sha256,'transport hash: '+entry.path);
  if(entry.path.startsWith(manifest.vendorDirectory) && entry.path.endsWith('.js')){
   const relative=entry.path.slice(manifest.vendorDirectory.length);
   assert.deepEqual(content,fs.readFileSync(path.join(lab,relative)),
    'packaged engine must be exact official source: '+relative);
  }
 }
 const author=JSON.parse(read(data+'author-inputs.json'));
 const provenance=JSON.parse(read(data+'source.json'));
 const exportPayload=JSON.parse(read(data+'authored-export.json'));
 assert.equal(author.sourceSha,manifest.combatSha);
 assert.equal(provenance.combatSha,manifest.combatSha);
 assert.equal(provenance.assetsSha,manifest.assetsSha);
 assert.equal(provenance.assetsRepository,manifest.assetsRepository);
 assert.equal(author.creatureTransfers.length,manifest.supportedCreatureIds.length);
 assert.ok(Array.isArray(exportPayload.creatures));
 assert.deepEqual(author.creatureTransfers.map(x=>x.draft.id),manifest.supportedCreatureIds);
 const media=JSON.parse(read(data+'global-visual-assets.json'));
 assert.equal(media.storage.repository,manifest.assetsRepository);
 assert.ok(Array.isArray(media.assets)&&media.assets.length>0);
});
test('official vendor imports under final URL-shaped directory; never rely on a fallback Combat simulator',async()=>{
 const src=await import(pathToFileURL(path.join(root,'assets/gensrpg/capture/combat-lab-engine-loader-v1.mjs')).href);
 const engine=await src.loadCombatLabEngineV1(pathToFileURL(path.join(site,'vendor/combat-lab')+path.sep));
 for(const fn of ['createCombatSession','createCombatRuntime','createRosterSession',
   'createBattleActorAiController','adaptCaptureCombatExportStackV1']){
  assert.equal(typeof engine[fn],'function','actual official module '+fn);
 }
 assert.equal(engine.source.sha,gitsha(lab));
});
test('package never edits the public entry, PWA, legacy owner or real profiles',()=>{
 const index=fs.readFileSync(path.join(root,'index.html'));
 assert.equal(gitblob(index),'17ba8e6f1faf6f8a0be8cdec68c4515d538ff646',
   'exact uploaded product source remains unchanged');
 assert.ok(!index.includes('src="vendor/combat-lab/'));
 assert.ok(!index.includes('runtime-data/'));
 const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');
 assert.ok(!sw.includes('vendor/combat-lab/'),'not PWA-cached before official activation');
 assert.ok(!sw.includes('runtime-data/'),'no orphan PWA caching');
 assert.ok(!fs.existsSync(path.join(root,'vendor/combat-lab')),
   'Lab engine must be transported into the build only, never committed as a second source');
 assert.ok(!fs.existsSync(path.join(root,'assets/gensrpg/capture/runtime-data')),
   'derived source data must remain build-only and versioned by the author');
});