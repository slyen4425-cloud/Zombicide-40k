import test from 'node:test';
import assert from 'node:assert/strict';
import {
 createPublishedEncounterCatalogV1
} from '../assets/gensrpg/capture-v2/adventure-encounter-catalog-v1.mjs';

// These are read-only projections for the test. The real integration injects
// the exact cards returned by Combat captureBestiaryCardsV1 and the provider
// created by the existing Exploration CaptureCreatureCatalogProvider.
const creature=(id,elements,spawnChance)=>Object.freeze({
 id,name:id,elements:Object.freeze([...elements]),spawnChance,presentation:null
});
const entries=Object.freeze([
 creature('published-fire',['fire'],40),
 creature('unpublished-fire',['fire'],99),
 creature('published-nature',['nature'],10),
 creature('visible-no-skill',['ice'],100),
 creature('published-multitype',['fire','nature'],6)
]);
const nativeProvider=Object.freeze({
 listCreatures:()=>entries,
 listElements:()=>Object.freeze([
  {id:'fire',label:'Feu'},{id:'nature',label:'Nature'}, {id:'ice',label:'Glace'}
 ]),
 resolveCreature:id=>entries.find(x=>x.id===id)??null,
 findByElement:id=>entries.filter(x=>x.elements.includes(id))
});
const card=(id,ready=true)=>Object.freeze({
 id,name:id,level:1,
 skills:[{slot:'slot-1',state:ready?'ready':'unpublished'}]
});
const cards=[card('published-fire'),card('published-nature'),
 card('visible-no-skill',false),card('published-multitype')];

test('only cards from official Combat published Bestiary WITH ready abilities can spawn',()=>{
 const c=createPublishedEncounterCatalogV1({bestiaryCards:cards,captureCatalog:nativeProvider});
 assert.deepEqual(c.listCreatures().map(x=>x.id),
  ['published-fire','published-nature','published-multitype']);
 assert.equal(c.resolveCreature('unpublished-fire'),null);
 assert.equal(c.resolveCreature('visible-no-skill'),null);
 assert.equal(c.resolveCreature('published-fire'),entries[0],
  'must retain the original owner record, no duplicated definition');
});

test('native Encounter Controller keeps real rarity, enabled elements and multi-elements',()=>{
 const c=createPublishedEncounterCatalogV1({bestiaryCards:cards,captureCatalog:nativeProvider});
 assert.deepEqual(c.findByElement('fire').map(x=>[x.id,x.spawnChance]),
  [['published-fire',40],['published-multitype',6]]);
 assert.deepEqual(c.findByElement('nature').map(x=>x.id),
  ['published-nature','published-multitype']);
 assert.deepEqual(c.listElements().map(e=>e.id),['fire','nature']);
 assert.equal(c.resolveCreature('published-multitype'),entries[4]);
});

test('empty or unready Bestiary has no wild encounters, never imports unpublished author creatures',()=>{
 const empty=createPublishedEncounterCatalogV1({bestiaryCards:[],captureCatalog:nativeProvider});
 assert.deepEqual(empty.listCreatures(),[]);
 assert.deepEqual(empty.listElements(),[]);
 assert.equal(empty.resolveCreature('unpublished-fire'),null);
 const unready=createPublishedEncounterCatalogV1({
  bestiaryCards:[card('visible-no-skill',false)],captureCatalog:nativeProvider
 });
 assert.deepEqual(unready.findByElement('ice'),[]);
});

test('reject incomplete or ambiguous native publication inputs instead of guessing',()=>{
 assert.throws(()=>createPublishedEncounterCatalogV1({bestiaryCards:null,captureCatalog:nativeProvider}),
  /Bestiaire|Bestiary|official/i);
 assert.throws(()=>createPublishedEncounterCatalogV1({bestiaryCards:cards,captureCatalog:{}}),
  /Exploration|catalog|provider/i);
 assert.throws(()=>createPublishedEncounterCatalogV1({bestiaryCards:[card('published-fire'),card('published-fire')],captureCatalog:nativeProvider}),
  /duplicate|doublon/i);
 assert.throws(()=>createPublishedEncounterCatalogV1({bestiaryCards:cards,captureCatalog:{
  ...nativeProvider,listCreatures:()=>[...entries,entries[0]]
 }}),/duplicate|doublon/i);
});
