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
 assert.equal(manifest.combatSha,'65e21792ff74aea9862e528c8dbfdb22797b6693');
 assert.equal(manifest.assetsSha,'b3d46ce6f2639ebb59a2984aeff17f97cbcd7377');
 assert.deepEqual(manifest.supportedCreatureIds,["crea-loup","crea_ailevent","crea_dracendre","crea_foudrillon","crea_lumilo","crea_maraileron","crea_mossback","crea_ombre_2","crea_scar_2","crea_tox_2","crea_voltik"],
  'all eleven exact pinned author species must be published, none invented');
 assert.ok(manifest.transport.length>15);
 assert.equal(new Set(manifest.transport.map(f=>f.path)).size,manifest.transport.length);
 for(const entry of manifest.transport){
  assert.ok(entry.path.startsWith('vendor/combat-lab/')||entry.path.startsWith(data));
  const bytes=rel(site,entry.path);
  assert.equal(bytes.length,entry.size,entry.path+' bytes');
  assert.equal(hash(bytes),entry.sha256,entry.path+' signature');
 }
});
test('real public Shell unchanged, no alternate Combat runtime or premature PWA precache',()=>{
 const html=rel(site,'index.html').toString('utf8');
 const source=rel(root,'index.html').toString('utf8');
 const sw=rel(site,'service-worker.js');
 assert.deepEqual(sw,rel(root,'service-worker.js'),'never rewrite the PWA cache during dormant delivery');
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
