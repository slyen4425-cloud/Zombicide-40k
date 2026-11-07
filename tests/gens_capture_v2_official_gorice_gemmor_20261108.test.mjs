import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {captureBestiaryCardsV1}
 from '../_site/vendor/combat-lab/src/ui/capture-bestiary-cards-v1.js';
import {publishedAdventureSpeciesV1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';

const read=p=>JSON.parse(readFileSync(new URL('../'+p,import.meta.url),'utf8'));
const pins=read('assets/gensrpg/capture-v2/source-pins-v1.json');

test('Gorice and Gemmor originate from the SINGLE immutable official Combat main author transfer bundle',()=>{
 const bundle=read('_site/vendor/exploration-lab/combat-preview/data/capture/showcase/encounter-bundle.v1.json');
 const delivery=read('_site/assets/gensrpg/capture-v2/delivery-manifest.json');
 assert.equal(bundle.schema,'capture-author-encounter-bundle-v1');
 assert.equal(bundle.authorSha,pins.combat.sha);
 assert.equal(bundle.engineSha,pins.combat.sha);
 assert.equal(delivery.combat.sha,pins.combat.sha);
 for(const [id,name] of [['gorice','Gorice'],['crea_crys_2','Gemmor']]){
  const transfer=bundle.creatureTransfers.find(t=>t.draft?.id===id);
  assert.ok(transfer,'missing Combat main published creature '+name);
  assert.equal(transfer.draft.displayName,name);
  assert.equal(transfer.loadout?.creatureId,id);
 }
});

test('the SAME official Bestiary predicate displays Gorice and Gemmor with real skill(s) and approved artwork',()=>{
 const bundle=read('_site/vendor/exploration-lab/combat-preview/data/capture/showcase/encounter-bundle.v1.json');
 const assetCatalog=read('_site/vendor/exploration-lab/capture-assets/data/assets/catalog/global-visual-assets.v1.json');
 const statRegistry=read('_site/vendor/combat-lab/data/capture/monster-capture-stat-registry.v1.json');
 const skills=read('_site/vendor/combat-lab/data/combat/skills/catalog.v1.json');
 const cards=publishedAdventureSpeciesV1(captureBestiaryCardsV1({
  creatureTransfers:bundle.creatureTransfers,
  skillTransfers:bundle.skillTransfers,
  assetCatalog,statRegistry,nativeSkills:skills.entries??[]
 }));
 for(const [id,name] of [['gorice','Gorice'],['crea_crys_2','Gemmor']]){
  const card=cards.find(c=>c.id===id);
  assert.ok(card,'official Bestiary excluded '+name+' from Aventure');
  assert.equal(card.name,name);
  assert.match(card.portrait?.file??'',/^capture\/creatures\//);
  assert.match(card.icon?.file??'',/^capture\/creatures\//);
  assert.ok(card.skills.some(s=>s.state==='ready'),
    name+' must be a playable starter, not only an editor draft');
 }
});

test('the published Aventure camera uses only the native certified Exploration main',()=>{
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 const native=readFileSync(new URL('../_site/vendor/exploration-lab/src/play/exploration-creator-camera-v1.js',import.meta.url),'utf8');
 assert.match(html,/id="adventure-creator-camera-angle"/);
 assert.match(html,/id="adventure-starter-count"/);
 assert.doesNotMatch(html,/id="adventure-stat-wallet"/);
 assert.match(app,/url\.searchParams\.set\('cameraAngle',String\(result\.session\.cameraPolicy/);
 assert.match(native,/cameraAngleFromAdventurePlayUrlV1/);
 assert.match(native,/SCULPT_GAME_CAMERA_ANGLE/);
 assert.equal(pins.combat.ref,'main');
 assert.equal(pins.exploration.ref,'main');
 assert.ok(pins.combat.certifiedCiRun>0&&pins.exploration.certifiedCiRun>0);
});
