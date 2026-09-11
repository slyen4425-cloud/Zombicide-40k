import assert from 'node:assert/strict';
import {createItemDefinition,createInventoryState,addItem,inventoryQuantity} from '../src/modes/rpg/inventory-engine.js';
import {createMerchantDefinition,createMerchantRuntime,merchantStock,buyFromMerchant,sellToMerchant,restockMerchant} from '../src/modes/rpg/merchant-engine.js';

const sword=createItemDefinition({id:'sword',name:'Épée',kind:'weapon',value:100});
const potion=createItemDefinition({id:'potion',name:'Potion',kind:'consumable',stackable:true,maxStack:10,value:20});
const definitions={items:[sword,potion]};
const merchant=createMerchantDefinition({id:'merchant-1',name:'Marchand',currencyId:'gold',buyMultiplier:1,sellMultiplier:0.5,stock:[
  {itemId:'sword',quantity:1,maxQuantity:1,category:'Armes'},
  {itemId:'potion',quantity:2,maxQuantity:2,category:'Consommables'},
]});
let runtime=createMerchantRuntime(merchant);
let inventory=createInventoryState({slots:['main-hand']});
let wallet={gold:150};

let out=buyFromMerchant(runtime,merchant,inventory,wallet,'sword',1,definitions); assert.equal(out.ok,true);
runtime=out.runtime; inventory=out.inventory; wallet=out.wallet;
assert.equal(wallet.gold,50); assert.equal(merchantStock(runtime,'sword'),0); assert.equal(inventoryQuantity(inventory,'sword'),1);
assert.equal(buyFromMerchant(runtime,merchant,inventory,wallet,'sword',1,definitions).reason,'sold-out');

out=buyFromMerchant(runtime,merchant,inventory,wallet,'potion',2,definitions); assert.equal(out.ok,true);
runtime=out.runtime; inventory=out.inventory; wallet=out.wallet;
assert.equal(wallet.gold,10); assert.equal(merchantStock(runtime,'potion'),0); assert.equal(inventoryQuantity(inventory,'potion'),2);

out=sellToMerchant(runtime,merchant,inventory,wallet,'potion',1,definitions); assert.equal(out.ok,true);
runtime=out.runtime; inventory=out.inventory; wallet=out.wallet;
assert.equal(wallet.gold,20); assert.equal(inventoryQuantity(inventory,'potion'),1); assert.equal(merchantStock(runtime,'potion'),1);

out=restockMerchant(runtime,'potion'); assert.equal(out.ok,true); runtime=out.runtime;
assert.equal(merchantStock(runtime,'potion'),2);
assert.equal(runtime.transactions.length,3);
console.log('rpg merchant engine ok');
