import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeAdventureEconomyV1,adventureMerchantPriceV1}
 from '../assets/gensrpg/capture-v2/adventure-economy-v1.mjs';
import {DEFAULT_ADVENTURE_RULES_V1,normalizeAdventureRulesV1,
 createAdventureSessionV1,tradeAdventureMerchantV1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {DEFAULT_ADVENTURE_FRAGMENTS_V1}
 from '../assets/gensrpg/capture-v2/adventure-fragments-v1.mjs';

const species='crea_nat_1',fragment='fragment:'+species;
const image={assetId:'pack:official',file:'capture/creatures/published.webp'};
const cards=[{id:species,name:'Grainou',level:1,icon:image,portrait:image,
 skills:[{slot:'slot-1',state:'ready',name:'Feuille'}]}];
const item={id:'relique',name:'Relique',saleValue:100};
const chosen={id:'merchant-forest',name:'Marchand de forêt',
 itemIds:['relique',fragment],sellPercent:10,buyPercent:-50,
 fragmentPrices:{[fragment]:40}};
const economy={currency:{singular:'pièce',plural:'pièces'},merchants:[chosen]};
const rules=normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,
 loot:{currencyPerVictory:5,items:[item],
  drops:[{speciesId:species,itemId:'relique',chancePercent:37,minQuantity:2,maxQuantity:4}]},
 fragmentRecruitment:{...DEFAULT_ADVENTURE_FRAGMENTS_V1,
  perSpecies:{[species]:{dropChancePercent:22,dropMin:3,dropMax:5}}},
 economy});
const session=()=>createAdventureSessionV1({bestiaryCards:cards,starterId:species,
 rules,ids:{sessionId:'merchant-frag',instanceId:'hero-frag'},
 now:'2026-11-22T14:00:00.000Z'});

test('merchant uses one official item catalog + virtual fragments with editable base price',()=>{
 assert.deepEqual(rules.economy.merchants[0],chosen);
 assert.equal(adventureMerchantPriceV1(chosen.fragmentPrices[fragment],10),44);
 assert.throws(()=>normalizeAdventureEconomyV1({...economy,merchants:[
  {...chosen,fragmentPrices:{}}]},[item]),/Missing merchant fragment price/);
 assert.throws(()=>normalizeAdventureEconomyV1({...economy,merchants:[
  {...chosen,fragmentPrices:{[fragment]:0}}]},[item]),/merchant.fragment price/);
 assert.throws(()=>normalizeAdventureEconomyV1({...economy,merchants:[
  {...chosen,fragmentPrices:{[fragment]:40,'fragment:other':30}}]},[item]),
  /Unselected fragment price/);
 assert.equal(rules.loot.items.length,1,'fragment never becomes a duplicate loot item');
});

test('actual Adventure transaction purchases official fragment and keeps save inventory once',()=>{
 const state={...session(),status:'playing',inventory:{currency:100,items:{}}};
 const arg={session:state,merchantId:chosen.id,itemId:fragment,
  kind:'buy',quantity:2,actionId:'merchant-frag-buy',
  now:'2026-11-22T14:01:00.000Z',bestiaryCards:cards};
 const bought=tradeAdventureMerchantV1(arg);
 assert.equal(bought.receipt.currencyAmount,88);
 assert.equal(bought.session.inventory.currency,12);
 assert.equal(bought.session.inventory.items[fragment],2);
 assert.equal(tradeAdventureMerchantV1({...arg,session:bought.session}).applied,false);
 assert.throws(()=>tradeAdventureMerchantV1({...arg,
  bestiaryCards:[]}),/official published Bestiary/);
 assert.throws(()=>tradeAdventureMerchantV1({...arg,
  session:{...state,rules:normalizeAdventureRulesV1({...rules,
   fragmentRecruitment:{...rules.fragmentRecruitment,enabled:false}})}}),
  /disabled/);
});

test('drop selector auto-loads canonical object and the SAME fragment editor',()=>{
 const file=name=>readFileSync(new URL('../assets/gensrpg/capture-v2/'+name,import.meta.url),'utf8');
 const html=file('adventure.html'),app=file('adventure-app-v1.mjs');
 const merchant=file('adventure-economy-editor-v1.mjs');
 const play=file('adventure-merchant-play-v1.mjs');
 assert.match(html,/id="adventure-merchant-category"/);
 assert.match(html,/value="fragment">Fragments de créatures/);
 assert.match(merchant,/getPublishedSpecies\?\.\(\)/);
 assert.match(merchant,/fragmentPricesDraft/);
 assert.match(play,/merchant\.fragmentPrices/);
 assert.match(html,/id="adventure-drop-fragment-summary"/);
 assert.match(html,/id="adventure-drop-new"/);
 assert.equal((html.match(/id="adventure-monster-fragments-panel"/g)||[]).length,1);
 assert.match(app,/function focusSelectedMonsterDrop\(\)/);
 assert.match(app,/\$\('adventure-fragment-species'\)\.value=speciesId/);
 assert.match(app,/\$\('adventure-drop-fragment-settings'\)\.append\(controls\)/);
 assert.match(app,/autoFocusedDropIndex/);
 assert.equal(rules.loot.drops[0].chancePercent,37);
 assert.equal(rules.fragmentRecruitment.perSpecies[species].dropChancePercent,22);
});
