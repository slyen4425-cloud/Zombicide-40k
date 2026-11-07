'use strict';
// Check the FINAL Pages output, after the public Shell injection and official
// delivery publisher have both run. We do not start a Combat session here.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const site=path.resolve(process.env.CAPTURE_LAB_DELIVERY_SITE||'_site');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const rel=(base,p)=>fs.readFileSync(path.join(base,p));
const data='assets/gensrpg/capture/runtime-data/';
test('final Pages build contains pinned official modules and exact signed author payload',()=>{
 const manifest=JSON.parse(rel(site,data+'delivery-manifest.json').toString('utf8'));
 assert.equal(manifest.schema,'gensrpg-capture-official-delivery-v1');
 assert.equal(manifest.productionActivated,false,'release must remain dormant');
 assert.equal(manifest.combatSha,'248f718ec924106d16999d59e5dc8310f8450180');
 assert.equal(manifest.assetsSha,'b3d46ce6f2639ebb59a2984aeff17f97cbcd7377');
 assert.deepEqual(manifest.supportedCreatureIds,["crea-loup","crea_ailevent","crea_dracendre","crea_foudrillon","crea_lumilo","crea_maraileron","crea_mossback","crea_ombre_2","crea_scar_2","crea_tox_2","crea_voltik","kitsune_lunaire"],
  'all twelve exact pinned author species must be published, none invented');
 assert.ok(manifest.transport.length>15);
 assert.equal(new Set(manifest.transport.map(f=>f.path)).size,manifest.transport.length);
 for(const entry of manifest.transport){
  assert.ok(entry.path.startsWith('vendor/combat-lab/')||entry.path.startsWith(data));
  const bytes=rel(site,entry.path);
  assert.equal(bytes.length,entry.size,entry.path+' bytes');
  assert.equal(hash(bytes),entry.sha256,entry.path+' signature');
 }
});
test('real public Shell unchanged, no alternate Combat runtime or premature PWA precache',async()=>{
 const html=rel(site,'index.html').toString('utf8');
 const source=rel(root,'index.html').toString('utf8');
 const sw=rel(site,'service-worker.js');
 // The SINGLE publisher stamps only the root cache version at build time.
 // Compare the entire worker byte-for-byte after the canonical SHA stamp;
 // this still rejects any other code change or a second Capture runtime.
 const {stampWorkerForCommit,stampShellForCommit}=await import('../tools/version_pwa_release_worker.mjs');
 const releaseSha=process.env.GITHUB_SHA;
 assert.match(releaseSha||'',/^[0-9a-f]{40}$/,'release must have an immutable build SHA');
 const expectedWorker=stampWorkerForCommit(rel(root,'service-worker.js').toString('utf8'),releaseSha);
 assert.deepEqual(sw,Buffer.from(expectedWorker,'utf8'),
   'PWA built output may change ONLY the single root cache version for this exact release');
 // Public HTML must announce its actual release rather than the old frozen
 // 16.168 marker: an installed older PWA compares those existing markers.
 const expectedRelease='gensrpg-release-'+releaseSha.slice(0,12);
 assert.equal((html.match(/<meta name="z40k-app-version" content="([^"]+)">/g)||[]).length,1);
 assert.equal((html.match(/const Z40K_APP_VERSION = "([^"]+)";/g)||[]).length,1);
 assert.ok(html.includes('<meta name="z40k-app-version" content="'+expectedRelease+'">'));
 assert.ok(html.includes('const Z40K_APP_VERSION = "'+expectedRelease+'";'));
 assert.equal(html.replaceAll(expectedRelease,
   source.match(/<meta name="z40k-app-version" content="([^"]+)">/)[1])
   .includes('const Z40K_APP_VERSION = "'+source.match(/const Z40K_APP_VERSION = "([^"]+)";/)[1]+'";'),true);

 // Exact script tags from the user-certified index (Git blob
 // 17ba8e6f1faf6f8a0be8cdec68c4515d538ff646). World and roster are
 // deliberately versioned ?v=1; the live Pages output must preserve both
 // source and order, without injecting a second Capture owner.
 const ownerTags=[
  'src="assets/gensrpg/capture/world-exploration-v1.js?v=1"',
  'src="assets/gensrpg/capture/team-roster-v1.js?v=1"',
  'src="assets/gensrpg/capture/legacy-monolith-functions-v1.js"'
 ];
 for(const tag of ownerTags){
  assert.equal(source.split(tag).length-1,1,'certified index must have one '+tag);
  assert.equal(html.split(tag).length-1,1,'Pages output must preserve one '+tag);
 }
 assert.ok(ownerTags.every((tag,i)=>i===0||html.indexOf(ownerTags[i-1])<html.indexOf(tag)),
  'Pages output must preserve Capture World → roster → unique historic owner order');
 assert.ok(!html.includes('src="vendor/combat-lab/'),'no silent engine load');
 assert.ok(!html.includes('src="assets/gensrpg/capture/runtime-data/'));
 assert.ok(!source.includes('vendor/combat-lab/'),'historical source remains pinned');
 assert.deepEqual(rel(site,'assets/gensrpg/capture/legacy-monolith-functions-v1.js'),
   rel(root,'assets/gensrpg/capture/legacy-monolith-functions-v1.js'),
   'single existing Capture button owner has not been rewritten');
 assert.ok(!sw.toString('utf8').includes('vendor/combat-lab/'),'no unstable offline engine');
});
