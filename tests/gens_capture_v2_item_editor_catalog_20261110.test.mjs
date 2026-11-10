import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeAdventureRulesV1,SHOWCASE_ADVENTURE_RULES_V1}
 from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';
import {normalizeCaptureItemTemplatesV1,materializeCaptureItemTemplatesV1}
 from '../assets/gensrpg/capture-v2/item-templates-v1.mjs';

const root='../assets/gensrpg/capture-v2/';
const file=n=>readFileSync(new URL(root+n,import.meta.url),'utf8');
const sample={
 schema:'gensrpg-capture-item-templates-v1',version:1,
 items:[{id:'feather-ailevent',name:'Plume d’Ailevent',
  speciesId:'ailevent',iconPath:'./item-icons/feather-ailevent.png',
  saleValue:25,chancePercent:35,minQuantity:1,maxQuantity:2}]
};

test('legacy AdventureRules remains valid without any icon or extra owner',()=>{
 const legacy=normalizeAdventureRulesV1({...SHOWCASE_ADVENTURE_RULES_V1,
  loot:{currencyPerVictory:8,
   items:[{id:'item-old',name:'Ancienne relique',saleValue:14}],
   drops:[{speciesId:'ailevent',itemId:'item-old',chancePercent:20,minQuantity:1,maxQuantity:3}]}});
 assert.deepEqual(legacy.loot.items,[{id:'item-old',name:'Ancienne relique',saleValue:14}]);
 assert.equal(legacy.loot.drops.length,1);
 assert.equal(legacy.loot.drops[0].itemId,'item-old');
 const withIcon=normalizeAdventureRulesV1({...legacy,loot:{...legacy.loot,
  items:[...legacy.loot.items,{id:'feather-ailevent',name:'Plume d’Ailevent',
    saleValue:25,iconKey:'feather-ailevent'}]}});
 assert.equal(withIcon.loot.items[1].iconKey,'feather-ailevent');
 assert.equal(withIcon.loot.drops.length,1);
 assert.throws(()=>normalizeAdventureRulesV1({...legacy,loot:{...legacy.loot,
  items:[{id:'item-bad',name:'Non',saleValue:1,iconKey:'https://attacker.test/'}]}}),
 /icon key/);
});

test('official author catalog is schema-checked, species-checked and same-owner paths only',()=>{
 const approved=normalizeCaptureItemTemplatesV1(sample,[{id:'ailevent'}]);
 assert.equal(approved.items[0].iconPath,'./item-icons/feather-ailevent.png');
 assert.throws(()=>normalizeCaptureItemTemplatesV1(sample,[{id:'other'}]),/unapproved creature/);
 assert.throws(()=>normalizeCaptureItemTemplatesV1({...sample,
  items:[{...sample.items[0],iconPath:'https://untrusted.site/icon.png'}]}),/icon path/);
 assert.throws(()=>normalizeCaptureItemTemplatesV1({...sample,
  items:[sample.items[0],sample.items[0]]}),/duplicate/);
});

test('import official item templates once without rewriting custom author objects and drops',()=>{
 const rules=normalizeAdventureRulesV1({...SHOWCASE_ADVENTURE_RULES_V1,
  loot:{currencyPerVictory:11,items:[{id:'item-custom',name:'Potion créée',saleValue:9}],
   drops:[{speciesId:'ailevent',itemId:'item-custom',
     chancePercent:84,minQuantity:2,maxQuantity:4}]}});
 const a=materializeCaptureItemTemplatesV1({rules,templates:sample});
 assert.equal(a.addedItems,1);assert.equal(a.addedDrops,1);
 assert.deepEqual(a.loot.items[0],rules.loot.items[0]);
 assert.deepEqual(a.loot.drops[0],rules.loot.drops[0]);
 assert.equal(a.loot.items[1].iconKey,'feather-ailevent');
 const b=materializeCaptureItemTemplatesV1({
  rules:normalizeAdventureRulesV1({...rules,loot:a.loot}),templates:sample});
 assert.equal(b.addedItems,0);assert.equal(b.addedDrops,0);
 assert.equal(b.loot.items.length,2);assert.equal(b.loot.drops.length,2);
});

test('the official item catalogue begins empty until author uploads REAL icons',()=>{
 const catalog=JSON.parse(file('item-templates.v1.json'));
 assert.equal(normalizeCaptureItemTemplatesV1(catalog).items.length,0);
 assert.equal(materializeCaptureItemTemplatesV1({
  rules:SHOWCASE_ADVENTURE_RULES_V1,templates:catalog}).addedItems,0);
});

test('menu has one dedicated item editor view using the SAME Adventure owner',()=>{
 const shell=file('shell-entry-v1.js'),html=file('adventure.html');
 const app=file('adventure-app-v1.mjs'),view=file('adventure-play-sheet-view-v1.mjs');
 assert.match(shell,/items:\{label:"Objets et drops",path:"assets\/gensrpg\/capture-v2\/adventure\.html\?editor=items",family:"capture"\}/);
 assert.match(shell,/id:"economy",title:"Objets et économie"/);
 assert.match(app,/isItemEditor=new URLSearchParams/);
 assert.match(app,/document\.body\.dataset\.adventureItemEditor='true'/);
 assert.match(html,/id="adventure-item-search"/);
 assert.match(html,/id="adventure-item-import" disabled/);
 assert.match(html,/id="adventure-save-rules"/);
 assert.match(app,/store\.save\(\{\.\.\.current,rules/);
 assert.match(app,/draftStore\.save\(rules\)/);
 assert.match(view,/resolveItemIcon/);
 assert.doesNotMatch(shell,/localStorage\.setItem\(/);
 assert.doesNotMatch(app,/window\.open\(/);
});
