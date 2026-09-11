import assert from 'node:assert/strict';
import {createItemDefinition,createInventoryState,addItem,removeItem,equipItem,unequipSlot,inventoryQuantity,equippedItemIds} from '../src/modes/rpg/inventory-engine.js';

const sword=createItemDefinition({id:'sword',name:'Épée',kind:'weapon',equipSlots:['main-hand'],occupiesSlots:[]});
const greatsword=createItemDefinition({id:'greatsword',name:'Espadon',kind:'weapon',equipSlots:['main-hand'],occupiesSlots:['off-hand']});
const shield=createItemDefinition({id:'shield',name:'Bouclier',kind:'equipment',equipSlots:['off-hand'],occupiesSlots:[]});
const potion=createItemDefinition({id:'potion',name:'Potion',kind:'consumable',stackable:true,maxStack:3});
const definitions={items:[sword,greatsword,shield,potion]};
let inv=createInventoryState({slots:['main-hand','off-hand','head','body']});

let out=addItem(inv,'potion',5,definitions); assert.equal(out.ok,true); inv=out.inventory;
assert.equal(inventoryQuantity(inv,'potion'),5);
assert.equal(inv.entries.filter(e=>e.itemId==='potion').length,2);

out=addItem(inv,'sword',1,definitions); assert.equal(out.ok,true); inv=out.inventory;
const swordEntry=inv.entries.find(e=>e.itemId==='sword');
out=equipItem(inv,swordEntry.entryId,'main-hand',definitions); assert.equal(out.ok,true); inv=out.inventory;
assert.deepEqual(equippedItemIds(inv),['sword']);

out=addItem(inv,'greatsword',1,definitions); assert.equal(out.ok,true); inv=out.inventory;
const greatEntry=inv.entries.find(e=>e.itemId==='greatsword');
out=equipItem(inv,greatEntry.entryId,'main-hand',definitions); assert.equal(out.ok,true); inv=out.inventory;
assert.equal(inv.equipment['main-hand'].itemId,'greatsword');
assert.equal(inv.equipment['off-hand'].itemId,'greatsword');

// Replacing a two-slot weapon with a one-slot weapon must clear every mapping of the old item.
out=equipItem(inv,swordEntry.entryId,'main-hand',definitions); assert.equal(out.ok,true); inv=out.inventory;
assert.equal(inv.equipment['main-hand'].itemId,'sword');
assert.equal(inv.equipment['off-hand'],undefined);
assert.deepEqual(equippedItemIds(inv),['sword']);

// Equipping into one occupied slot of a multi-slot item must also remove the whole conflicting item.
out=equipItem(inv,greatEntry.entryId,'main-hand',definitions); assert.equal(out.ok,true); inv=out.inventory;
out=addItem(inv,'shield',1,definitions); assert.equal(out.ok,true); inv=out.inventory;
const shieldEntry=inv.entries.find(e=>e.itemId==='shield');
out=equipItem(inv,shieldEntry.entryId,'off-hand',definitions); assert.equal(out.ok,true); inv=out.inventory;
assert.equal(inv.equipment['off-hand'].itemId,'shield');
assert.equal(inv.equipment['main-hand'],undefined);
assert.deepEqual(equippedItemIds(inv),['shield']);

out=unequipSlot(inv,'off-hand'); assert.equal(out.ok,true); inv=out.inventory;
assert.equal(inv.equipment['main-hand'],undefined); assert.equal(inv.equipment['off-hand'],undefined);

out=removeItem(inv,'potion',4); assert.equal(out.ok,true); inv=out.inventory;
assert.equal(inventoryQuantity(inv,'potion'),1);
assert.equal(equipItem(inv,swordEntry.entryId,'head',definitions).reason,'slot-not-allowed');
console.log('rpg inventory engine ok');
