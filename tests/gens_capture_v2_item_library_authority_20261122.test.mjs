import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 SHOWCASE_ADVENTURE_RULES_V1,normalizeAdventureRulesV1,
 createAdventureSessionV1,useAdventureConsumableV1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {
 normalizeAdventureEconomyV1,tradeAdventureMerchantInventoryV1
} from '../assets/gensrpg/capture-v2/adventure-economy-v1.mjs';
import {materializeCapturePublishedMonsterDropsV1}
 from '../assets/gensrpg/capture-v2/item-templates-v1.mjs';

const catalog=JSON.parse(readFileSync(new URL(
 '../assets/gensrpg/capture-v2/item-templates.v1.json',import.meta.url),'utf8'));
const published=[
 {id:'crea_test1',name:'Fougrelle',level:1,
  skills:[{state:'ready',slot:'skill1'}]},
 {id:'crea_test2',name:'Volpic',level:1,
  skills:[{state:'ready',slot:'skill1'}]}
];
const now='2026-11-22T09:00:00.000Z';
const rules=normalizeAdventureRulesV1(SHOWCASE_ADVENTURE_RULES_V1);
const newState=()=>createAdventureSessionV1({
 bestiaryCards:published,starterId:published[0].id,now,
 rules,ids:{sessionId:'test-session',instanceId:'test-instance'}
});
const play=(hp,items={'item.potion.heal':1,'item.potion.revive':1})=>{
 const configured=newState();
 return {...configured,status:'playing',
  party:{...configured.party,active:{...configured.party.active,hp}},
  inventory:{currency:0,items}};
};
const vitals=()=>({maxHp:100});
const drink=(session,itemId,actionId='drink-action')=>useAdventureConsumableV1({
 session,itemId,instanceId:'test-instance',actionId,now,projectCombatVitals:vitals
});

test('two usable potions are V2 rules, with validated editable effects',()=>{
 const heal=rules.loot.items.find(item=>item.id==='item.potion.heal');
 const revive=rules.loot.items.find(item=>item.id==='item.potion.revive');
 assert.deepEqual(heal.useEffect,{type:'heal',amount:20});
 assert.deepEqual(revive.useEffect,{type:'revive',percent:35});
 assert.equal(heal.kind,'usable');
 assert.equal(revive.kind,'usable');
 assert.throws(()=>normalizeAdventureRulesV1({...rules,loot:{...rules.loot,
  items:[{...heal,useEffect:{type:'heal',amount:0}}]}}),/useEffect/i);
 assert.throws(()=>normalizeAdventureRulesV1({...rules,loot:{...rules.loot,
  items:[{...revive,useEffect:{type:'revive',percent:101}}]}}),/useEffect/i);
});

test('healing consumes one owned potion exactly once, without a second inventory',()=>{
 const first=drink(play(30,{'item.potion.heal':2}), 'item.potion.heal');
 assert.equal(first.applied,true);
 assert.equal(first.receipt.afterHp,50);
 assert.equal(first.session.party.active.hp,50);
 assert.equal(first.session.inventory.items['item.potion.heal'],1);
 const repeat=drink(first.session,'item.potion.heal');
 assert.equal(repeat.applied,false);
 assert.strictEqual(repeat.session,first.session);
 assert.deepEqual(first.session.processedItemActions,['drink-action']);
 assert.throws(()=>drink(play(100),'item.potion.heal'),/tous ses PV/i);
 assert.throws(()=>drink(play(0),'item.potion.heal'),/KO/i);
 assert.throws(()=>drink(play(30,{}),'item.potion.heal'),/indisponible/i);
});

test('revive only works on KO and keeps existing save/party authorities',()=>{
 const result=drink(play(0,{'item.potion.revive':1}),'item.potion.revive','revive-1');
 assert.equal(result.receipt.afterHp,35);
 assert.equal(result.session.party.active.hp,35);
 assert.equal(Object.hasOwn(result.session.inventory.items,'item.potion.revive'),false);
 assert.throws(()=>drink(play(30),'item.potion.revive','revive-2'),/KO/i);
});

test('published species receive own resource once while fragments stay virtual and independent',()=>{
 const first=materializeCapturePublishedMonsterDropsV1({rules,templates:catalog,published});
 const normalized=normalizeAdventureRulesV1({...rules,loot:first.loot});
 assert.equal(first.addedDrops,2);
 assert.ok(first.loot.drops.every(d=>d.chancePercent===50&&d.minQuantity===1));
 assert.ok(first.loot.items.filter(item=>item.kind==='usable').length===2);
 assert.deepEqual(normalized.fragmentRecruitment,rules.fragmentRecruitment);
 const second=materializeCapturePublishedMonsterDropsV1({
  rules:normalized,templates:catalog,published});
 assert.equal(second.addedItems,0);
 assert.equal(second.addedDrops,0);
 assert.ok(!second.loot.items.some(item=>item.id.startsWith('fragment:')));
});

test('modern merchant buy percentage keeps single Capture inventory and legacy offers',()=>{
 const item={id:'res-1',name:'Plume',saleValue:100};
 const historic=normalizeAdventureEconomyV1({currency:{singular:'pièce',plural:'pièces'},
  merchants:[{id:'merchant-old',name:'Ancien',buysItems:true,offers:[]}]},[item]);
 assert.equal(historic.merchants[0].buysItems,true);
 const economy=normalizeAdventureEconomyV1({currency:historic.currency,
  merchants:[{id:'merchant-1',name:'Marchand',itemIds:['res-1'],sellPercent:10,buyPercent:-50}]},[item]);
 const state={...play(30),rules:normalizeAdventureRulesV1({...rules,
  loot:{...rules.loot,items:[...rules.loot.items,item]},economy}),
  inventory:{currency:0,items:{'res-1':2}}};
 const result=tradeAdventureMerchantInventoryV1({session:state,merchantId:'merchant-1',
  itemId:'res-1',kind:'sell',quantity:1,actionId:'merchant-action',now});
 assert.equal(result.session.inventory.currency,50);
 assert.equal(result.session.inventory.items['res-1'],1);
 assert.equal(result.receipt.currencyAmount,50);
});

test('one native editor with three views and no extra item/merchant registry',()=>{
 const root=new URL('../assets/gensrpg/capture-v2/',import.meta.url);
 const html=readFileSync(new URL('adventure.html',root),'utf8');
 const js=readFileSync(new URL('adventure-app-v1.mjs',root),'utf8');
 const shell=readFileSync(new URL('shell-entry-v1.js',root),'utf8');
 for(const id of ['adventure-library-view','adventure-drops-view',
  'adventure-economy-panel','adventure-fragment-library-list']){
  assert.equal(html.split('id="'+id+'"').length-1,1);
 }
 for(const value of ['usable','resource','fragment'])
  assert.match(html,new RegExp('data-capture-item-category="'+value+'"'));
 assert.match(js,/setupCanonicalItemEditor\(\)/);
 assert.match(js,/useAdventureConsumableV1\(/);
 assert.match(shell,/label:"Bibliothèque d’objets"/);
 assert.match(shell,/label:"Drops \/ Ressources"/);
 assert.doesNotMatch(js,/window\.captureItemCatalog141/);
});

test('NPC shop deep link preserves the selected saved PNJ without duplicating merchant ownership',()=>{
 const root=new URL('../assets/gensrpg/capture-v2/',import.meta.url);
 const shell=readFileSync(new URL('shell-entry-v1.js',root),'utf8');
 const app=readFileSync(new URL('adventure-app-v1.mjs',root),'utf8');
 const editor=readFileSync(new URL('adventure-economy-editor-v1.mjs',root),'utf8');
 assert.match(shell,/merchantId:event\.data\?\.merchantId/);
 assert.match(shell,/npcId:event\.data\?\.npcId/);
 assert.match(shell,/url\.searchParams\.set\('npcId',npcId\)/);
 assert.match(shell,/url\.searchParams\.set\('merchantId',merchantId\)/);
 assert.match(shell,/url\.searchParams\.set\('edit',editNpcId\)/);
 assert.match(app,/const npcReturnId=returnToNpc/);
 assert.match(app,/economyEditor\?\.focusMerchant\(linkedMerchantId\)/);
 assert.match(editor,/function focusMerchant\(merchantId\)/);
 assert.doesNotMatch(shell,/merchantOffers|merchantStocks|saleValue:/);
});

test('a saved potion cannot be treated as failed when only Explorer refresh fails',()=>{
 const app=readFileSync(new URL('../assets/gensrpg/capture-v2/adventure-app-v1.mjs',
  import.meta.url),'utf8');
 const action=app.slice(app.indexOf('async function performPlayingItemUse('),
  app.indexOf('let fragmentActionPending=false;'));
 assert.match(action,/store\.save\(applied\.session\)/);
 assert.match(action,/try\{play\.refreshParty\(applied\.session\);\}/);
 assert.match(action,/catch\(error\)\{refreshWarning=/);
 assert.match(action,/Sauvegardé, mais synchronisation Exploration à vérifier/);
 assert.match(action,/receipt\.beforeHp/);
});
