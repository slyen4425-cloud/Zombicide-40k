'use strict';
// Regression of the actual Android flow: accept an encounter in Exploration
// -> the SAME-origin packaged native Combat document, not a missing iframe 404.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const site=path.resolve(process.env.GENSRPG_PAGES_SITE||'_site');
const preview=path.join(site,'preview/capture-v2-pr225');
const relative='vendor/exploration-lab/';
const read=p=>fs.readFileSync(path.join(preview,p));
const digest=buf=>crypto.createHash('sha256').update(buf).digest('hex');
const required=p=>assert.ok(fs.statSync(path.join(preview,p)).isFile(),'missing 404 transport: '+p);
test('Exploration encounter tap opens the native official Combat page physically published at its real URL',()=>{
 const native='vendor/exploration-lab/combat-preview/examples/dom-demo/';
 for(const file of ['exploration-encounter.html','exploration-encounter.js',
  'exploration-native-source-v1.js','party.preview.v1.json',
  'capture-editor-v2.html','demo.css','demo-assets.js'])required(native+file);
 for(const p of ['vendor/exploration-lab/combat-preview/src/ui/combat-2v2-test-ui.js',
  'vendor/exploration-lab/combat-preview/data/combat/skills/catalog.v1.json',
  'vendor/exploration-lab/combat-preview/data/capture/showcase/encounter-bundle.v1.json',
  'vendor/exploration-lab/capture-assets/data/assets/catalog/global-visual-assets.v1.json'])required(p);
 const navigation=read('vendor/exploration-lab/src/encounters/combat-handoff-navigation.js').toString();
 const host=read('vendor/exploration-lab/src/encounters/immersive-encounter-host-v1.js').toString();
 assert.ok(navigation.includes('./combat-preview/examples/dom-demo/exploration-encounter.html'));
 assert.ok(host.includes('/combat-preview/examples/dom-demo/exploration-encounter.html'));
 const html=read(native+'exploration-encounter.html').toString();
 assert.match(html,/\.\/exploration-encounter\.js/);
 assert.match(read(native+'exploration-encounter.js').toString(),/mountCoop2v2Test/);
});
test('packaged native encounter has a single immutable source per owner and official media catalog',()=>{
 const manifest=JSON.parse(read('bridge-transport-manifest.v1.json'));
 const release=JSON.parse(read('release-provenance.v1.json'));
 assert.equal(manifest.schema,'gensrpg-capture-v2-native-encounter-transport-v1');
 assert.equal(manifest.combat.sha,'dd15e3e2df0d36d039a554e89e094aba28b43dff');
 assert.equal(manifest.exploration.sha,'2b27339a5706fcdb436558aeebd4f8b6b0ce9d85');
 assert.match(manifest.assets.sha,/^[0-9a-f]{40}$/);
 assert.equal(release.encounterBridgeManifestSha256,digest(read('bridge-transport-manifest.v1.json')));
 const catalog=JSON.parse(read('vendor/exploration-lab/capture-assets/data/assets/catalog/global-visual-assets.v1.json'));
 const resources=new Map(catalog.assets.map(a=>[a.id,a.resource]));
 for(const id of ['pack:capture:creature-heriplante-opponent-01',
  'pack:capture:creature-heriplante-player-01',
  'pack:capture:creature-heriplante-icon-01',
  'pack:capture:sprite-fleur-defense-01']){
  const resource=resources.get(id);
  assert.ok(resource?.file,'Native Combat author transfer refers to missing official media: '+id);
  required('vendor/exploration-lab/capture-assets/assets/library/'+resource.file);
 }
 for(const audio of ['assets/runtime/audio/music-v1/battle-01-cb4ed87d.mp3',
  'assets/runtime/audio/private-v1/sanctuary-367a77dd.mp3'])
  required('vendor/exploration-lab/combat-preview/'+audio);
 const paths=new Set();
 for(const item of manifest.files){
  assert.ok(!paths.has(item.path),'duplicate authority transport '+item.path);
  paths.add(item.path);
  assert.match(item.path,/^vendor\/exploration-lab\/(combat-preview|capture-assets)\//);
  required(item.path);
  assert.equal(item.sha256,digest(read(item.path)),item.path);
 }
 assert.ok(paths.has('vendor/exploration-lab/combat-preview/examples/dom-demo/exploration-encounter.html'));
 assert.ok(manifest.assets.files>15,'a complete author-controlled media graph must be shipped');
});
