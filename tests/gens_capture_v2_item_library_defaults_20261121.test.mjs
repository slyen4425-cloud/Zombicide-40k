import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SHOWCASE_ADVENTURE_RULES_V1,normalizeAdventureRulesV1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {materializeCapturePublishedMonsterDropsV1,normalizeCaptureItemTemplatesV1}
 from '../assets/gensrpg/capture-v2/item-templates-v1.mjs';
const base=new URL('../assets/gensrpg/capture-v2/',import.meta.url);
const file=path=>readFileSync(new URL(path,base),'utf8');
const templates=JSON.parse(file('item-templates.v1.json'));
const official=[{id:'crea_ailevent',name:'Ailevent'},
 {id:'crea_crys_2',name:'Gemmor'},
 {id:'nouveau-monstre',name:'Nouveau monstre'}];

test('twelve existing PNGs are in the visual library; only published owners are auto-linked',()=>{
 const collection=normalizeCaptureItemTemplatesV1(templates);
 assert.equal(collection.items.length,8);assert.equal(collection.icons.length,4);
 for(const item of collection.items){
  assert.equal(item.saleValue,100);
  assert.equal(item.chancePercent,50);
  assert.equal(item.minQuantity,1);
  assert.equal(item.maxQuantity,1);
 }
 assert.ok(collection.icons.every(x=>!Object.hasOwn(x,'speciesId')));
});
test('each published monster starts with ONE own 50% drop, 100 sale, no borrowed illustration',()=>{
 const original=normalizeAdventureRulesV1(SHOWCASE_ADVENTURE_RULES_V1);
 const result=materializeCapturePublishedMonsterDropsV1({
  rules:original,templates,published:official});
 assert.equal(result.addedItems,3);assert.equal(result.addedDrops,3);
 assert.equal(result.withoutIllustrations,1);
 assert.deepEqual(result.loot.drops.map(x=>x.speciesId),official.map(x=>x.id));
 for(const drop of result.loot.drops){
  assert.equal(drop.chancePercent,50);
  assert.equal(drop.minQuantity,1);
  assert.equal(drop.maxQuantity,1);
  const item=result.loot.items.find(x=>x.id===drop.itemId);
  assert.ok(item);
  assert.equal(item.saleValue,100);
  if(drop.speciesId==='nouveau-monstre')assert.equal(item.iconKey,undefined);
  else assert.ok(item.iconKey,'owned icon must be linked');
 }
 assert.deepEqual(original.fragmentRecruitment,SHOWCASE_ADVENTURE_RULES_V1.fragmentRecruitment);
 const normalized=normalizeAdventureRulesV1({...original,loot:result.loot});
 assert.deepEqual(normalized.fragmentRecruitment,original.fragmentRecruitment);
});
test('re-running defaults is idempotent and leaves custom drops, prices and fragment overrides unchanged',()=>{
 const baseRules=normalizeAdventureRulesV1({
  ...SHOWCASE_ADVENTURE_RULES_V1,
  loot:{...SHOWCASE_ADVENTURE_RULES_V1.loot,
   items:[{id:'user-relic',name:'Relique locale',saleValue:777}],
   drops:[{speciesId:'crea_ailevent',itemId:'user-relic',
    chancePercent:19,minQuantity:2,maxQuantity:3}]},
  fragmentRecruitment:{...SHOWCASE_ADVENTURE_RULES_V1.fragmentRecruitment,
   perSpecies:{'crea_ailevent':{
    dropChancePercent:7,dropMin:4,dropMax:5}}}
 });
 const one=materializeCapturePublishedMonsterDropsV1({
  rules:baseRules,templates,published:official});
 assert.equal(one.addedDrops,2);
 assert.deepEqual(one.loot.drops[0],baseRules.loot.drops[0]);
 assert.equal(one.loot.items[0].saleValue,777);
 const next=normalizeAdventureRulesV1({...baseRules,loot:one.loot});
 assert.deepEqual(next.fragmentRecruitment,baseRules.fragmentRecruitment);
 const again=materializeCapturePublishedMonsterDropsV1({
  rules:next,templates,published:official});
 assert.equal(again.addedDrops,0);
 assert.equal(again.addedItems,0);
 assert.deepEqual(again.loot,next.loot);
});
test('a conflicting custom item ID cannot be silently attached to an official monster',()=>{
 const candidate={id:'plume-ailevent',name:'Objet privé',saleValue:1};
 const rules=normalizeAdventureRulesV1({...SHOWCASE_ADVENTURE_RULES_V1,
  loot:{...SHOWCASE_ADVENTURE_RULES_V1.loot,items:[candidate]}});
 const result=materializeCapturePublishedMonsterDropsV1({
  rules,templates,published:[official[0]]});
 assert.equal(result.skippedConflicts,1);
 assert.deepEqual(result.loot.items[0],candidate);
 assert.equal(result.loot.drops.length,1);
 assert.notEqual(result.loot.drops[0].itemId,candidate.id);
});
test('the original item editor remains sole owner; compact gallery and explicit defaults are additive',()=>{
 const html=file('adventure.html'),app=file('adventure-app-v1.mjs');
 assert.match(html,/id="adventure-item-library-gallery"/);
 assert.match(html,/id="adventure-item-defaults" disabled/);
 assert.match(html,/<details id="adventure-item-library"/);
 assert.match(app,/function renderItemLibrary\(\)/);
 assert.match(app,/materializeCapturePublishedMonsterDropsV1\(/);
 assert.match(app,/const prepared=guest\?null:materializeCapturePublishedMonsterDropsV1/);
 assert.match(app,/rules=guest\?setup\.rules:normalizeAdventureRulesV1/);
 assert.match(app,/adventure-item-import/);
 assert.doesNotMatch(app,/new Audio\(/);
});
