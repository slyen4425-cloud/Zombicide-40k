import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {DEFAULT_ADVENTURE_RULES_V1,normalizeAdventureRulesV1,
 createAdventureSessionV1,tradeAdventureMerchantV1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {merchantUnitPriceV1,normalizeAdventureEconomyV1}
 from '../assets/gensrpg/capture-v2/adventure-economy-v1.mjs';

const image={assetId:'pack:official',file:'capture/creatures/published.webp'};
const published=[{id:'crea_nat_1',name:'Grainou',level:1,portrait:image,icon:image,
 skills:[{slot:'slot-1',state:'ready',name:'Feuille'}]}];
const time='2026-11-21T13:00:00.000Z';
const items=[{id:'drop-100',name:'Cristal',saleValue:100},
 {id:'drop-20',name:'Plume',saleValue:20},
 {id:'other',name:'Graine',saleValue:300}];
const newMerchant={id:'merchant-simple',name:'Boutique test',buysItems:true,
 itemIds:['drop-100','drop-20'],sellPricePercent:10,buyPricePercent:-50};
const economy={currency:{singular:'pièce',plural:'pièces'},merchants:[newMerchant]};
const rules=normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,
 loot:{...DEFAULT_ADVENTURE_RULES_V1.loot,items,drops:[]},economy});
const session=()=>{
 const base=createAdventureSessionV1({bestiaryCards:published,
  starterId:'crea_nat_1',rules,ids:{sessionId:'merchant-test-session',
   instanceId:'merchant-test-creature'},now:time});
 return {...base,status:'playing',inventory:{currency:350,items:{'drop-100':2}}};
};
const trade=(state,kind,itemId,actionId)=>tradeAdventureMerchantV1({
 session:state,merchantId:'merchant-simple',itemId,kind,quantity:1,actionId,now:time,
 bestiaryCards:published
});

test('100 base +10% merchant sale = 110; -50% buyback = 50',()=>{
 assert.equal(merchantUnitPriceV1({merchant:newMerchant,item:items[0],kind:'buy'}),110);
 assert.equal(merchantUnitPriceV1({merchant:newMerchant,item:items[0],kind:'sell'}),50);
 assert.equal(merchantUnitPriceV1({merchant:newMerchant,item:items[1],kind:'buy'}),22);
 assert.equal(merchantUnitPriceV1({merchant:newMerchant,item:items[1],kind:'sell'}),10);
 const bought=trade(session(),'buy','drop-100','simple-1');
 assert.equal(bought.applied,true);
 assert.equal(bought.receipt.currencyAmount,110);
 assert.equal(bought.session.inventory.currency,240);
 assert.equal(bought.session.inventory.items['drop-100'],3);
 assert.equal(Object.hasOwn(bought.session,'merchantStocks'),false);
 const sold=trade(bought.session,'sell','drop-100','simple-2');
 assert.equal(sold.receipt.currencyAmount,50);
 assert.equal(sold.session.inventory.currency,290);
 assert.equal(sold.session.inventory.items['drop-100'],2);
 assert.equal(trade(sold.session,'sell','drop-100','simple-2').applied,false);
});

test('only checked catalogue objects are sold; old rules and categories remain unchanged',()=>{
 const state=session();
 assert.throws(()=>trade(state,'buy','other','simple-not-listed'),/does not offer/);
 assert.deepEqual(rules.economy.merchants[0].itemIds,['drop-100','drop-20']);
 assert.deepEqual(rules.loot.items,items);
 assert.equal(Object.hasOwn(rules.economy.merchants[0],'offers'),false);
});

test('invalid percent and unknown/duplicate item selections fail before save',()=>{
 for(const field of ['sellPricePercent','buyPricePercent']){
  for(const value of [-101,201,2.5,Number.NaN]){
   assert.throws(()=>normalizeAdventureEconomyV1({...economy,
    merchants:[{...newMerchant,[field]:value}]},items));
  }
 }
 assert.throws(()=>normalizeAdventureEconomyV1({...economy,
  merchants:[{...newMerchant,itemIds:['drop-100','drop-100']}]},items),/Duplicate/);
 assert.throws(()=>normalizeAdventureEconomyV1({...economy,
  merchants:[{...newMerchant,itemIds:['not-in-library']}]},items),/missing/);
 assert.throws(()=>normalizeAdventureEconomyV1({...economy,
  merchants:[{...newMerchant,offers:[]}]},items),/fields/);
});

test('legacy merchants retain exact fixed prices, resource costs and stocks',()=>{
 const legacy={id:'legacy',name:'Ancien marchand',buysItems:true,
  offers:[{itemId:'drop-100',currencyPrice:12,resourceCosts:[],stock:1}]};
 const legacyRules=normalizeAdventureRulesV1({...rules,economy:{
  ...economy,merchants:[legacy]}});
 const state={...session(),rules:legacyRules};
 const bought=tradeAdventureMerchantV1({session:state,merchantId:'legacy',
  itemId:'drop-100',kind:'buy',quantity:1,actionId:'legacy-1',now:time,
  bestiaryCards:published});
 assert.equal(bought.receipt.currencyAmount,12);
 assert.equal(bought.session.merchantStocks.legacy['drop-100'],0);
 const sold=tradeAdventureMerchantV1({session:bought.session,merchantId:'legacy',
  itemId:'drop-100',kind:'sell',quantity:1,actionId:'legacy-2',now:time,
  bestiaryCards:published});
 assert.equal(sold.receipt.currencyAmount,100);
});

test('one merchant editor, a checked object catalogue, sliders and stable NPC bridge',()=>{
 const file=p=>readFileSync(new URL('../assets/gensrpg/capture-v2/'+p,import.meta.url),'utf8');
 const html=file('adventure.html'),editor=file('adventure-economy-editor-v1.mjs');
 const play=file('adventure-merchant-play-v1.mjs');
 assert.match(html,/id="adventure-merchant-catalogue"/);
 assert.match(html,/id="adventure-merchant-sell-pct"/);
 assert.match(html,/id="adventure-merchant-buy-pct"/);
 assert.match(editor,/type='checkbox'/);
 assert.match(editor,/resolveIconUrl/);
 assert.doesNotMatch(editor,/localStorage|sessionStorage/);
 assert.match(play,/gensrpg\.exploration\.npc\.merchant\.open\.v1/);
 assert.match(play,/merchantUnitPriceV1/);
});
