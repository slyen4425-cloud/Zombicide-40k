import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeAdventureEconomyV1,adventureMerchantPriceV1}
 from '../assets/gensrpg/capture-v2/adventure-economy-v1.mjs';
import {DEFAULT_ADVENTURE_RULES_V1,normalizeAdventureRulesV1,
 createAdventureSessionV1,tradeAdventureMerchantV1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';

const icon={assetId:'pack:official',file:'capture/creatures/published.webp'};
const published=[{id:'crea_nat_1',name:'Grainou',level:1,portrait:icon,icon,
 skills:[{slot:'slot-1',state:'ready',name:'Feuille'}]}];
const baseItems=[
 {id:'relique',name:'Relique',saleValue:100},
 {id:'potion',name:'Potion',saleValue:25},
 {id:'invisible',name:'Objet non proposé',saleValue:80}
];
const merchant={id:'marchand-foret',name:'Marchand de forêt',
 itemIds:['relique','potion'],sellPercent:10,buyPercent:-50};
const rules=normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,
 loot:{currencyPerVictory:6,items:baseItems,drops:[]},
 economy:{currency:{singular:'pièce',plural:'pièces'},merchants:[merchant]}});
const session=()=>createAdventureSessionV1({bestiaryCards:published,
 starterId:'crea_nat_1',rules,
 ids:{sessionId:'percent-session',instanceId:'percent-instance'},
 now:'2026-11-21T13:00:00.000Z'});
const trade=(state,kind,itemId,quantity,actionId)=>tradeAdventureMerchantV1({
 session:state,merchantId:'marchand-foret',itemId,kind,quantity,actionId,
 now:'2026-11-21T13:01:00.000Z',bestiaryCards:published
});

test('one canonical catalog, checked list and two percentages normalized without offers',()=>{
 assert.deepEqual(rules.economy.merchants[0],merchant);
 assert.equal(Object.hasOwn(rules.economy.merchants[0],'offers'),false);
 assert.equal(adventureMerchantPriceV1(100,10),110);
 assert.equal(adventureMerchantPriceV1(100,-50),50);
 assert.equal(adventureMerchantPriceV1(25,10),28,'round per unit');
 assert.throws(()=>normalizeAdventureEconomyV1({...rules.economy,
  merchants:[{...merchant,itemIds:['relique','relique']}]},baseItems),/Duplicate merchant item/);
 assert.throws(()=>normalizeAdventureEconomyV1({...rules.economy,
  merchants:[{...merchant,itemIds:['missing']}]},baseItems),/missing from loot/);
 assert.throws(()=>normalizeAdventureEconomyV1({...rules.economy,
  merchants:[{...merchant,sellPercent:201}]},baseItems),/sellPercent/);
 assert.throws(()=>normalizeAdventureEconomyV1({...rules.economy,
  merchants:[{...merchant,buyPercent:-101}]},baseItems),/buyPercent/);
});
test('buy and sell recompute prices from item baseValue, no independent stock',()=>{
 const initial={...session(),inventory:{currency:300,items:{potion:1}}};
 const purchase=trade(initial,'buy','relique',2,'buy-a');
 assert.equal(purchase.receipt.currencyAmount,220);
 assert.equal(purchase.session.inventory.currency,80);
 assert.equal(purchase.session.inventory.items.relique,2);
 assert.equal(Object.hasOwn(purchase.session,'merchantStocks'),false);
 assert.equal(trade(purchase.session,'buy','relique',2,'buy-a').applied,false,
  'same action is idempotent');
 const sold=trade(purchase.session,'sell','relique',1,'sell-a');
 assert.equal(sold.receipt.currencyAmount,50);
 assert.equal(sold.session.inventory.currency,130);
 assert.equal(sold.session.inventory.items.relique,1);
 assert.equal(initial.inventory.currency,300,'never mutate source session');
 assert.throws(()=>trade(initial,'buy','invisible',1,'not-offered'),/does not offer/);
 assert.throws(()=>trade(initial,'buy','relique',3,'too-expensive'),/Insufficient currency/);
});
test('zero discounts and edited base prices are effective without rewriting offers',()=>{
 const cheaper=normalizeAdventureRulesV1({...rules,loot:{...rules.loot,
  items:baseItems.map(item=>item.id==='relique'?{...item,saleValue:200}:item)}});
 const state={...session(),rules:cheaper,inventory:{currency:300,items:{relique:1}}};
 assert.equal(trade(state,'buy','relique',1,'new-price').receipt.currencyAmount,220);
 assert.equal(trade(state,'sell','relique',1,'new-buyback').receipt.currencyAmount,100);
 const zero=normalizeAdventureRulesV1({...rules,economy:{...rules.economy,
  merchants:[{...merchant,buyPercent:-100}]}});
 assert.throws(()=>trade({...state,rules:zero},'sell','relique',1,'no-resale'),/no resale value/i);
});
test('merchant editor and merchant play use the shared price owner and preserve old configuration',()=>{
 const read=path=>readFileSync(new URL('../assets/gensrpg/capture-v2/'+path,import.meta.url),'utf8');
 const html=read('adventure.html'),editor=read('adventure-economy-editor-v1.mjs'),
  play=read('adventure-merchant-play-v1.mjs'),contract=read('adventure-economy-v1.mjs');
 assert.match(html,/id="adventure-merchant-library"/);
 assert.match(html,/id="adventure-merchant-selected-count"/);
 assert.match(html,/id="adventure-merchant-sell-percent"/);
 assert.match(html,/id="adventure-merchant-buy-percent"/);
 assert.match(editor,/getRules\(\)\.loot\.items/);
 assert.match(editor,/adventureMerchantPriceV1/);
 assert.match(play,/adventureMerchantPriceV1/);
 assert.match(contract,/Historical merchants/);
 assert.doesNotMatch(editor,/localStorage|sessionStorage|window\.location\.assign/);
});
