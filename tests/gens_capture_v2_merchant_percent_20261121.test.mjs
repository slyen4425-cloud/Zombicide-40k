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

test('simple merchants: per-item stock is bounded and transaction-ledger owned, unlimited remains legacy default',()=>{
 const edited=normalizeAdventureRulesV1({...rules,economy:{...rules.economy,
  merchants:[{...merchant,itemStocks:{relique:2,potion:0}}]}});
 assert.deepEqual(edited.economy.merchants[0].itemStocks,{relique:2,potion:0});
 const initial={...session(),rules:edited,inventory:{currency:1000,items:{}}};
 const first=trade(initial,'buy','relique',1,'stock-buy-1');
 assert.equal(first.session.merchantStocks['marchand-foret'].relique,1);
 assert.equal(first.session.inventory.currency,890);
 assert.equal(initial.merchantStocks,undefined,'no mutation of old save');
 assert.throws(()=>trade(first.session,'buy','relique',2,'stock-buy-2'),/stock/i);
 assert.throws(()=>trade(initial,'buy','potion',1,'stock-potion-zero'),/stock/i);
 const second=trade(first.session,'buy','relique',1,'stock-buy-3');
 assert.equal(second.session.merchantStocks['marchand-foret'].relique,0);
 assert.equal(trade(second.session,'buy','relique',1,'stock-buy-3').applied,false);
 assert.throws(()=>trade(second.session,'buy','relique',1,'stock-buy-4'),/stock/i);
 assert.throws(()=>normalizeAdventureEconomyV1({...edited.economy,
  merchants:[{...merchant,itemStocks:{invisible:1}}]},baseItems),/unselected/i);
 assert.throws(()=>normalizeAdventureEconomyV1({...edited.economy,
  merchants:[{...merchant,itemStocks:{relique:-1}}]},baseItems),/stock/i);
 assert.throws(()=>normalizeAdventureEconomyV1({...edited.economy,
  merchants:[{...merchant,itemStocks:{relique:1.5}}]},baseItems),/stock/i);
 const loose={...session(),inventory:{currency:300,items:{}}};
 assert.equal(Object.hasOwn(trade(loose,'buy','relique',1,'unlimited-1').session,'merchantStocks'),false,
  'historical simple merchants still have unlimited stock');
});

test('merchant stock editor reuses the canonical selection and session stock owner',()=>{
 const read=path=>readFileSync(new URL('../assets/gensrpg/capture-v2/'+path,import.meta.url),'utf8');
 const editor=read('adventure-economy-editor-v1.mjs');
 const game=read('adventure-merchant-play-v1.mjs');
 const economy=read('adventure-economy-v1.mjs');
 assert.match(editor,/shownItems\(all\)/);
 assert.match(editor,/affiché\(s\) dans cette catégorie/);
 assert.match(editor,/itemStocksDraft/);
 assert.match(editor,/Stock du /);
 assert.match(game,/merchant\.itemStocks\?\.\[itemId\]/);
 assert.match(economy,/stock:merchant\.itemStocks\?\.\[target\]/);
 assert.doesNotMatch(editor,/localStorage|sessionStorage|new Map\(|window\.location\.assign/);
});

test('direct PNJ editor: first save and repeat save upsert the exact same merchant, never expose another shop',async()=>{
 const {installAdventureEconomyEditorV1}=await import('../assets/gensrpg/capture-v2/adventure-economy-editor-v1.mjs');
 function element(){
  return {value:'',hidden:false,disabled:false,children:[],handlers:{},dataset:{},
   append(...nodes){this.children.push(...nodes);},replaceChildren(...nodes){this.children=nodes;},
   addEventListener(type,fn){this.handlers[type]=fn;},
   setAttribute(){},scrollIntoView(){},fire(type='click'){this.handlers[type]?.();}};
 }
 const nodes={};
 const document={getElementById:id=>nodes[id]??=element(),createElement:()=>element(),
  defaultView:{confirm:()=>false,crypto:{randomUUID(){throw Error('A scoped NPC must not mint another shop ID');}}}};
 const $=document.getElementById;
 let state=rules,commits=[],errors=[];
 $('adventure-money-singular').value='pièce';$('adventure-money-plural').value='pièces';
 $('adventure-merchant-category').value='resource';
 const scope={id:'merchant-'+ 'n'.repeat(121),name:'PNJ neuf'};
 assert.equal(scope.id.length,130);
 const editor=installAdventureEconomyEditorV1({document,merchantScope:scope,getRules:()=>state,
  commitEconomy:economy=>{state=normalizeAdventureRulesV1({...state,economy});},
  notify:m=>errors.push(m),onMerchantCommitted:id=>commits.push(id)});
 editor.sync(state);
 assert.equal($('adventure-merchants').hidden,true);
 assert.equal($('adventure-merchants').children.length,0);
 assert.equal($('adventure-merchant-name').value,'PNJ neuf');
 $('adventure-merchant-all').fire();
 $('adventure-merchant-sell-percent').value='20';
 $('adventure-merchant-add').fire();
 assert.deepEqual(commits,[scope.id]);
 assert.equal(state.economy.merchants.length,2);
 assert.deepEqual(state.economy.merchants[0],merchant);
 assert.equal(state.economy.merchants[1].id,scope.id);
 assert.ok(state.economy.merchants[1].itemIds.includes('relique'));
 $('adventure-merchant-sell-percent').value='35';
 $('adventure-merchant-add').fire();
 assert.equal(state.economy.merchants.length,2);
 assert.equal(state.economy.merchants[1].sellPercent,35);
 assert.deepEqual(commits,[scope.id,scope.id]);
 assert.equal(editor.focusMerchant(merchant.id),false);
 assert.deepEqual(errors,[]);
 const existing={...session(),rules:state,inventory:{currency:500,items:{}}};
 const bought=tradeAdventureMerchantV1({session:existing,merchantId:scope.id,
  itemId:'relique',kind:'buy',quantity:1,actionId:'direct-npc-buy',
  now:'2026-11-21T13:01:00.000Z',bestiaryCards:published});
 assert.equal(bought.receipt.currencyAmount,135);
 assert.equal(bought.session.inventory.items.relique,1);
});
