import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_ADVENTURE_RULES_V1,normalizeAdventureRulesV1,
 createAdventureSessionV1,tradeAdventureMerchantV1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {normalizeAdventureEconomyV1}
 from '../assets/gensrpg/capture-v2/adventure-economy-v1.mjs';
import {readFileSync} from 'node:fs';
import {adventurePlaySheetSnapshotV1}
 from '../assets/gensrpg/capture-v2/adventure-play-sheet-v1.mjs';

const image={assetId:'pack:official',file:'capture/creatures/published.webp'};
const published=[{id:'crea_nat_1',name:'Grainou',level:1,portrait:image,icon:image,
 skills:[{slot:'slot-1',state:'ready',name:'Feuille'}]}];
const time='2026-11-10T17:30:00.000Z';
const rules=normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,
 loot:{currencyPerVictory:6,items:[
  {id:'elixir',name:'Élixir',saleValue:5},
  {id:'herb',name:'Herbe rare',saleValue:2},
  {id:'gem',name:'Gemme précieuse',saleValue:15}],
  drops:[{speciesId:'crea_nat_1',itemId:'herb',chancePercent:50,minQuantity:1,maxQuantity:2}]},
 economy:{currency:{singular:'jeton',plural:'jetons'},merchants:[
  {id:'marchand-foret',name:'Marchand de la forêt',buysItems:true,
   offers:[{itemId:'elixir',currencyPrice:3,resourceCosts:[
    {itemId:'herb',quantity:2},{itemId:'gem',quantity:1}],stock:2}]},
  {id:'marchand-rare',name:'Marchand rare',buysItems:false,
   offers:[{itemId:'gem',currencyPrice:20,resourceCosts:[],stock:null}]}
 ]}});
const session=()=>createAdventureSessionV1({
 bestiaryCards:published,starterId:'crea_nat_1',rules,
 ids:{sessionId:'session-commerce',instanceId:'instance-commerce'},now:time
});
const stocked=()=>({...session(),inventory:{
 currency:25,items:{herb:5,gem:2,elixir:2}}});
const buy=(state,actionId='trade-1',merchantId='marchand-foret',itemId='elixir',quantity=1)=>
 tradeAdventureMerchantV1({session:state,merchantId,itemId,quantity,kind:'buy',actionId,now:time});

test('optional economy: historical rules/save remain untouched, currency ledger is not duplicated',()=>{
 const old=normalizeAdventureRulesV1(DEFAULT_ADVENTURE_RULES_V1);
 assert.equal(Object.hasOwn(old,'economy'),false);
 assert.equal(Object.hasOwn(session(),'merchantStocks'),false);
 assert.equal(Object.hasOwn(session(),'processedMerchantActions'),false);
 assert.equal(rules.economy.currency.singular,'jeton');
 assert.equal(rules.economy.currency.plural,'jetons');
 assert.equal(rules.loot.currencyPerVictory,6,'reward number belongs to existing rules');
 assert.ok(!Object.hasOwn(rules.economy,'wallet'));
 assert.throws(()=>tradeAdventureMerchantV1({session:createAdventureSessionV1({
  bestiaryCards:published,starterId:'crea_nat_1',rules:old,
  ids:{sessionId:'legacy',instanceId:'legacy-member'},now:time}),
  merchantId:'marchand-foret',itemId:'elixir',kind:'buy',actionId:'legacy-trade'}),/Unknown merchant/);
});

test('author can name currency, define items as resources, merchant offers and bounded stock',()=>{
 const first=buy(stocked());
 assert.equal(first.applied,true);
 assert.equal(first.session.inventory.currency,22);
 assert.deepEqual(first.session.inventory.items,{herb:3,gem:1,elixir:3});
 assert.equal(first.session.merchantStocks['marchand-foret'].elixir,1);
 assert.equal(first.receipt.currencyAmount,3);
 assert.deepEqual(first.receipt.resourceCosts,[{itemId:'herb',quantity:2},
  {itemId:'gem',quantity:1}]);
 const duplicate=buy(first.session);
 assert.equal(duplicate.applied,false);
 assert.strictEqual(duplicate.session,first.session,'replayed action must not debit twice');
 assert.throws(()=>buy(first.session,'trade-2','marchand-foret','elixir',2),/stock/);
 const second=buy(first.session,'trade-3');
 assert.equal(second.session.merchantStocks['marchand-foret'].elixir,0);
 assert.deepEqual(second.session.inventory.items,{herb:1,elixir:4});
 assert.throws(()=>buy(second.session,'trade-4'),/stock/);
 assert.equal(stocked().merchantStocks,undefined,'do not mutate the original save');
});

test('sale pays only from canonical item saleValue and preserves shop stock',()=>{
 const state=stocked();
 const sold=tradeAdventureMerchantV1({session:state,merchantId:'marchand-foret',
  itemId:'elixir',kind:'sell',quantity:2,actionId:'sale-1',now:time});
 assert.equal(sold.session.inventory.currency,35);
 assert.equal(sold.session.inventory.items.elixir,undefined);
 assert.equal(Object.hasOwn(sold.session,'merchantStocks'),false);
 assert.throws(()=>tradeAdventureMerchantV1({session:sold.session,
  merchantId:'marchand-rare',itemId:'herb',kind:'sell',
  actionId:'sale-2',now:time}),/does not buy/);
 assert.throws(()=>tradeAdventureMerchantV1({session:sold.session,
  merchantId:'marchand-foret',itemId:'elixir',kind:'sell',quantity:1,
  actionId:'sale-3',now:time}),/Insufficient items/);
});

test('unlimited stock, insufficient money/resources and replay are safe',()=>{
 const state=stocked();
 const gem=buy(state,'gem-1','marchand-rare','gem',1);
 assert.equal(gem.session.inventory.currency,5);
 assert.equal(gem.session.inventory.items.gem,3);
 assert.equal(Object.hasOwn(gem.session,'merchantStocks'),false);
 assert.throws(()=>buy(gem.session,'gem-2','marchand-rare','gem',1),/Insufficient currency/);
 const noResources={...state,inventory:{...state.inventory,items:{gem:2,herb:1}}};
 assert.throws(()=>buy(noResources,'bad-resource'),/Insufficient resource/);
 assert.equal(noResources.inventory.currency,25);
 assert.deepEqual(noResources.inventory.items,{gem:2,herb:1});
});

test('reject invalid merchant configurations, unknown or circular resources',()=>{
 const base=rules.economy;
 assert.throws(()=>normalizeAdventureEconomyV1({...base,
  currency:{singular:'',plural:'jetons'}},rules.loot.items),/singular/);
 assert.throws(()=>normalizeAdventureEconomyV1({...base,
  merchants:[base.merchants[0],base.merchants[0]]},rules.loot.items),/Duplicate merchant/);
 const first=base.merchants[0],offer=first.offers[0];
 assert.throws(()=>normalizeAdventureEconomyV1({...base,merchants:[
  {...first,offers:[{...offer,itemId:'non-publie'}]}]},rules.loot.items),/missing/);
 assert.throws(()=>normalizeAdventureEconomyV1({...base,merchants:[
  {...first,offers:[{...offer,resourceCosts:[{itemId:'elixir',quantity:1}]}]}]},
  rules.loot.items),/cannot pay for itself/);
 assert.throws(()=>normalizeAdventureEconomyV1({...base,merchants:[
  {...first,offers:[{...offer,currencyPrice:0,resourceCosts:[]}]}]},
  rules.loot.items),/must have/);
 assert.throws(()=>normalizeAdventureRulesV1({...rules,
  loot:{...rules.loot,items:rules.loot.items.filter(x=>x.id!=='gem')}}),/Unknown resource/);
});


test('retiring an offer or changing stock never destroys an already played adventure',()=>{
 const first=buy(stocked());
 const retired=normalizeAdventureRulesV1({...rules,economy:{
  ...rules.economy,merchants:rules.economy.merchants.map(m=>
   m.id==='marchand-foret'?{...m,offers:[]}:m)}});
 const oldState={...first.session,rules:retired};
 assert.throws(()=>buy(oldState,'after-remove'),/does not offer/,
  'removed author offers remain inactive even if old stock receipts are kept');
 const limited=normalizeAdventureRulesV1({...rules,economy:{
  ...rules.economy,merchants:rules.economy.merchants.map(m=>
   m.id==='marchand-foret'?{...m,offers:[{...m.offers[0],stock:0}]}:m)}});
 const changed={...first.session,rules:limited};
 assert.throws(()=>buy(changed,'after-stock'),/out of stock/,
  'lowering the author stock must not revive unsold inventory');
 const unlimited=normalizeAdventureRulesV1({...rules,economy:{
  ...rules.economy,merchants:rules.economy.merchants.map(m=>
   m.id==='marchand-foret'?{...m,offers:[{...m.offers[0],stock:null}]}:m)}});
 const noLimit={...first.session,rules:unlimited};
 const next=buy(noLimit,'after-unlimited');
 assert.equal(next.applied,true,'a removed stock cap is no longer binding');
 assert.equal(Object.hasOwn(next.session,'merchantStocks'),true,
  'old receipt may be retained safely; active unlimited rule is authoritative');
});

test('in-game Bag displays creator-defined currency without altering item values',()=>{
 const active={...stocked(),status:'playing'};
 const snapshot=adventurePlaySheetSnapshotV1({session:active,bestiaryCards:published,
  statRegistry:{schema:'capture-stat-registry-v1',stats:[{id:'health',label:'Santé'}]}});
 assert.equal(snapshot.inventory.currency,25);
 assert.equal(snapshot.inventory.currencyLabel,'jetons');
 assert.equal(snapshot.inventory.items.find(x=>x.id==='elixir').saleValue,5);
 const view=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-play-sheet-view-v1.mjs',import.meta.url),'utf8');
 assert.match(view,/snapshot\.inventory\.currencyLabel/);
});

test('merchant editor only configures the canonical rules and never embeds an NPC/map authority',()=>{
 const html=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure.html',import.meta.url),'utf8');
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',import.meta.url),'utf8');
 const editor=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-economy-editor-v1.mjs',import.meta.url),'utf8');
 assert.match(html,/id="adventure-economy-panel"/);
 assert.match(html,/id="adventure-money-singular"/);
 assert.match(html,/id="adventure-merchant-resource-add"/);
 assert.match(html,/id="adventure-merchant-offer-add"/);
 assert.match(app,/installAdventureEconomyEditorV1/);
 assert.match(app,/rules=normalizeAdventureRulesV1\(\{\.\.\.fromFields\(\),economy/);
 assert.doesNotMatch(editor,/localStorage|sessionStorage|new Map\(|window\.location\.assign/);
});
