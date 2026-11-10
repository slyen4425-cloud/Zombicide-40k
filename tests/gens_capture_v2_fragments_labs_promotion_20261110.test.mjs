// Publish gate for the ONE immutable Capture V2 source and current Lab main pins.
// This reads ACTUAL assembled Pages files; no invented Bestiary or copied Lab.
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const root='_site/preview/capture-v2-pr225';
const read=rel=>readFileSync(join(root,rel),'utf8');
const json=rel=>JSON.parse(read(rel));
const publisher=JSON.parse(readFileSync('tools/capture_v2_pages_preview_pin.json','utf8'));
const source=json('assets/gensrpg/capture-v2/source-pins-v1.json');
const release=json('release-provenance.v1.json');
test('real Pages physically carries ONLY the approved Capture source and current two Lab main pins',()=>{
 assert.equal(publisher.schema,'gensrpg-capture-v2-pages-source-pin-v1');
 assert.equal(publisher.publicPath,'/preview/capture-v2-pr225/');
 assert.equal(release.source.commit,publisher.sha);
 assert.equal(release.combat.sha,source.combat.sha);
 assert.equal(release.exploration.sha,source.exploration.sha);
 assert.equal(source.combat.ref,'main');
 assert.equal(source.exploration.ref,'main');
 assert.match(source.combat.sha,/^[a-f0-9]{40}$/);
 assert.match(source.exploration.sha,/^[a-f0-9]{40}$/);
 assert.equal(release.legacyCaptureRuntime,false);
 assert.equal(release.productionRootSha256.length,64);
 assert.equal(release.productionServiceWorkerSha256.length,64);
 assert.equal(release.productionManifestSha256.length,64);
});
test('real artifact includes exact fragment contract, drop receipt and the existing owned Sac UI',()=>{
 const dir='assets/gensrpg/capture-v2/';
 for(const name of [
  'adventure-fragments-v1.mjs','adventure-contract-v1.mjs',
  'adventure-app-v1.mjs','adventure-play-sheet-v1.mjs',
  'adventure-play-sheet-view-v1.mjs','adventure-result-presentation-v1.mjs',
  'adventure-style-v1.css','adventure.html'
 ])assert.ok(existsSync(join(root,dir,name)),name);
 const rules=read(dir+'adventure-contract-v1.mjs');
 const fragments=read(dir+'adventure-fragments-v1.mjs');
 const model=read(dir+'adventure-play-sheet-v1.mjs');
 const view=read(dir+'adventure-play-sheet-view-v1.mjs');
 const app=read(dir+'adventure-app-v1.mjs');
 const result=read(dir+'adventure-result-presentation-v1.mjs');
 const html=read(dir+'adventure.html');
 assert.match(rules,/rollAdventureFragmentDropV1/);
 assert.match(rules,/processedEncounterKeys:\[\.\.\.state\.processedEncounterKeys,key\]/);
 assert.match(fragments,/required:10,summonLevel:1/);
 assert.match(fragments,/session\.inventory\.items/);
 assert.match(fragments,/storedCreatures/);
 assert.match(model,/fragment:/);
 assert.match(model,/canSummon/);
 assert.match(view,/Invoquer/);
 assert.match(view,/Convertir en XP/);
 assert.match(app,/navigator\.locks/);
 assert.match(app,/store\.save\(receipt\.session\)/);
 assert.match(result,/Éclat de/);
 assert.match(html,/id="adventure-fragments-enabled"/);
 assert.match(html,/id="adventure-fragments-summon-level"/);
 assert.match(html,/id="adventure-fragments-storage-capacity"/);
});
test('release keeps the same official visual owner, no second item atlas or parallel engine',()=>{
 assert.equal(publisher.officialVisuals.repository,source.combat.repository);
 assert.equal(publisher.officialVisuals.ref,'global-assets');
 assert.ok(Number.isInteger(publisher.officialVisuals.certifiedCiRun));
 assert.equal(json('bridge-transport-manifest.v1.json').assets.sha,
  publisher.officialVisuals.sha);
 assert.equal(existsSync(join(root,'assets/gensrpg/capture')),false);
});
