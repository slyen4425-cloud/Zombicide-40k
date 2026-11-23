import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
 DEFAULT_ADVENTURE_RULES_V1,SHOWCASE_ADVENTURE_RULES_V1,
 normalizeAdventureRulesV1,materializeAdventureMissingConsumablesV1
} from '../assets/gensrpg/capture-v2/adventure-contract-v1.mjs';

const src=name=>readFileSync(new URL('../assets/gensrpg/capture-v2/'+name,import.meta.url),'utf8');

test('opt-in alone adds missing official potions to existing AdventureRules catalog',()=>{
 const old=normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,loot:{
  currencyPerVictory:42,items:[{id:'custom.wood',name:'Bûche',saleValue:100,kind:'resource'}],
  drops:[{speciesId:'published-1',itemId:'custom.wood',
   chancePercent:50,minQuantity:1,maxQuantity:1}]
 }});
 const originalJson=JSON.stringify(old);
 const preview=materializeAdventureMissingConsumablesV1(old);
 assert.equal(preview.addedItems,2);
 assert.equal(preview.existingItems,0);
 const imported=normalizeAdventureRulesV1({...old,loot:preview.loot});
 assert.equal(imported.loot.items.length,3);
 assert.deepEqual(imported.loot.items.slice(0,1),old.loot.items);
 assert.deepEqual(imported.loot.drops,old.loot.drops);
 assert.equal(imported.loot.currencyPerVictory,42);
 for(const item of SHOWCASE_ADVENTURE_RULES_V1.loot.items)
  assert.deepEqual(imported.loot.items.find(x=>x.id===item.id),item);
 assert.equal(JSON.stringify(old),originalJson,'legacy save and rules input are immutable');
 const repeat=materializeAdventureMissingConsumablesV1(imported);
 assert.equal(repeat.addedItems,0);
 assert.deepEqual(repeat.loot,imported.loot,'repeated import is idempotent');
});

test('authored name/effect with a colliding potion ID remains authoritative',()=>{
 const custom={id:'item.potion.heal',name:'Tonique créé',saleValue:997,kind:'usable',
  useEffect:{type:'heal',amount:3}};
 const source=normalizeAdventureRulesV1({...DEFAULT_ADVENTURE_RULES_V1,
  loot:{currencyPerVictory:0,items:[custom],drops:[]}});
 const next=materializeAdventureMissingConsumablesV1(source);
 assert.equal(next.addedItems,1);
 assert.deepEqual(next.loot.items[0],custom);
 assert.equal(next.loot.items[1].id,'item.potion.revive');
 assert.equal(next.loot.drops.length,0);
 assert.equal(source.loot.items.length,1);
});

test('library reuses existing item owner; no automatic old-save migration or extra catalogue',()=>{
 const html=src('adventure.html'),app=src('adventure-app-v1.mjs');
 assert.match(html,/id="adventure-item-import-potions"/);
 assert.match(html,/Ajouter les potions manquantes/);
 assert.match(app,/materializeAdventureMissingConsumablesV1\(authored\)/);
 assert.match(app,/adventure-item-import-potions'\)\.addEventListener\('click'/);
 assert.match(app,/rules=normalizeAdventureRulesV1\(\{\.\.\.authored,loot:staged\.loot\}\)/);
 assert.doesNotMatch(app,/localStorage\.setItem\(.*potion|new Map\(.*potion/);
});
