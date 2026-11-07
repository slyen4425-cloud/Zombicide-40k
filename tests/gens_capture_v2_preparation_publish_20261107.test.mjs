import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
const read=path=>readFileSync(new URL('../'+path,import.meta.url),'utf8');
const pinned=JSON.parse(read('tools/capture_v2_pages_preview_pin.json'));
const assembled='_'+ 'site/preview/capture-v2-pr225/';
test('the ONE published main Capture V2 candidate owns the corrected Aventure preparation',()=>{
 const html=read(assembled+'assets/gensrpg/capture-v2/adventure.html');
 assert.match(html,/id="adventure-save-summary"/);
 assert.match(html,/id="adventure-save-select"/);
 assert.match(html,/id="adventure-hero-choice"/);
 assert.doesNotMatch(html,/adventure-stat-wallet|adventure-stat-rows|adventure-stat-points-left/,
  'the published preparation must no longer expose an actionable stat wallet');
 assert.match(html,/<dialog id="adventure-play-sheet"/);
 assert.match(html,/data-adventure-sheet-tab="stats"/,
  'the in-game official character sheet still owns stat allocation');
 assert.match(html,/id="adventure-stat-points-per-level"/,
  'creator still configures the progression policy');
});
test('the deployed provenance stays pinned to the exact candidate, not a duplicate editor or a drifting branch',()=>{
 const prov=JSON.parse(read(assembled+'release-provenance.v1.json'));
 assert.equal(pinned.schema,'gensrpg-capture-v2-pages-source-pin-v1');
 assert.match(pinned.sha,/^[a-f0-9]{40}$/);
 assert.equal(prov.source.commit,pinned.sha);
 assert.equal(prov.publicPath,pinned.publicPath);
 assert.equal(prov.legacyCaptureRuntime,false);
});

test('the published preparation offers 1–6 real starter creatures without restoring the removed stat wallet',()=>{
 const html=read(assembled+'assets/gensrpg/capture-v2/adventure.html');
 const app=read(assembled+'assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 const contract=read(assembled+'assets/gensrpg/capture-v2/adventure-contract-v1.mjs');
 assert.match(html,/id="adventure-starter-count"/);
 for(let n=1;n<=6;n++)assert.ok(html.includes('<option value="'+n+'"'),'starter count '+n+' missing');
 assert.match(html,/id="adventure-starter-reserve"/);
 assert.match(html,/id="adventure-active-creature"/);
 assert.match(html,/id="adventure-select-active"/);
 assert.match(app,/getStarterSpeciesIds\(\)/);
 assert.match(app,/chooseAdventureActiveCreatureV1\(/);
 assert.match(contract,/reserveInstanceIds/);
 assert.match(contract,/new Set\(instanceIds\)\.size!==instanceIds\.length/);
 assert.doesNotMatch(html,/id="adventure-stat-wallet"/);
 assert.doesNotMatch(app,/renderStatWallet\(/);
});

test('Gorice and Gemmor are visible AND playable in the actual published PWA Bestiary with certified media',async()=>{
 const root=assembled+'vendor/exploration-lab/';
 const bundle=JSON.parse(read(root+'combat-preview/data/capture/showcase/encounter-bundle.v1.json'));
 const assets=JSON.parse(read(root+'capture-assets/data/assets/catalog/global-visual-assets.v1.json'));
 const stats=JSON.parse(read(assembled+'vendor/combat-lab/data/capture/monster-capture-stat-registry.v1.json'));
 const native=JSON.parse(read(assembled+'vendor/combat-lab/data/combat/skills/catalog.v1.json'));
 const {captureBestiaryCardsV1}=await import('../_site/preview/capture-v2-pr225/vendor/combat-lab/src/ui/capture-bestiary-cards-v1.js');
 const cards=captureBestiaryCardsV1({
  creatureTransfers:bundle.creatureTransfers,skillTransfers:bundle.skillTransfers,
  assetCatalog:assets,statRegistry:stats,nativeSkills:native.entries??[]
 });
 for(const [id,name] of [['gorice','Gorice'],['crea_crys_2','Gemmor']]){
  const card=cards.find(c=>c.id===id);
  assert.ok(card,'published Bestiary missing '+name);
  assert.equal(card.name,name);
  assert.ok(card.skills.some(sk=>sk.state==='ready'),name+' needs playable skill at starter level');
  for(const media of [card.portrait,card.icon]){
   assert.ok(media?.assetId&&media.file,name+' missing published portrait or icon');
   assert.ok(existsSync(new URL('../'+root+'capture-assets/assets/library/'+media.file,import.meta.url)),
     name+' image missing as physical Pages file '+media.file);
  }
 }
 // Gorice's current published moving animations require the newer certified
 // visual catalogue; showing just the old portrait is not enough.
 for(const id of ['pack:capture:creature-gorille-des-glaces-movement-opponent-12-v1',
  'pack:capture:creature-gorille-des-glaces-movement-player-12-v1']){
  const asset=assets.assets.find(a=>a.id===id);
  assert.ok(asset,id+' is absent from the approved published catalog');
  assert.ok(asset.resource?.file||asset.resource?.manifest,id+' has no physical media');
  const resource=asset.resource.file||asset.resource.manifest;
  assert.ok(existsSync(new URL('../'+root+'capture-assets/assets/library/'+resource,import.meta.url)),
   'Gorice movement resource missing in public Pages '+resource);
 }
 const html=read(assembled+'assets/gensrpg/capture-v2/adventure.html');
 const game=read(assembled+'assets/gensrpg/capture-v2/adventure-app-v1.mjs');
 assert.match(html,/id="adventure-creator-camera-angle"/);
 assert.match(html,/id="adventure-starter-count"/);
 assert.doesNotMatch(html,/id="adventure-stat-wallet"/);
 assert.match(game,/url\.searchParams\.set\('cameraAngle',String\(result\.session\.cameraPolicy/);
 assert.ok(existsSync(new URL('../'+assembled+'vendor/exploration-lab/src/play/exploration-creator-camera-v1.js',import.meta.url)),
  'the native Exploration camera must be present in this same published build');
});
