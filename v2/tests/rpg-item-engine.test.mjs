import assert from 'node:assert/strict';
import {createItemDefinition,createInventoryState,addItem,equipItem,inventoryQuantity} from '../src/modes/rpg/inventory-engine.js';
import {validateItemDefinition,useInventoryItem,equippedItemBonuses,compatibleAmmoItems,consumeWeaponAmmo} from '../src/modes/rpg/item-engine.js';

const hp={id:'hp',name:'PV',min:0,maxFormula:{kind:'fixed',value:20}};
const heal={id:'heal',enabled:true,kind:'resource-modifier',resourceId:'hp',operation:'add',value:5,chance:100,conditions:[]};
const burn={id:'burn',enabled:true,kind:'stat-modifier',statId:'atk',operation:'add',value:2,chance:100,conditions:[]};
const condition={id:'low',enabled:true,sourceKind:'resource',sourceId:'hp',operator:'lte',value:10};
const skill={id:'slash',name:'Entaille',enabled:true};
const potion=createItemDefinition({id:'potion',name:'Potion',kind:'consumable',stackable:true,effectIds:['heal'],conditionIds:['low']});
const sword=createItemDefinition({id:'sword',name:'Épée',kind:'weapon',equipSlots:['hand'],effectIds:['burn'],skillIds:['slash']});
const bow=createItemDefinition({id:'bow',name:'Arc',kind:'weapon',equipSlots:['hand'],data:{requiresAmmo:true,ammoType:'arrow'}});
const arrows=createItemDefinition({id:'arrows',name:'Flèches',kind:'ammo',stackable:true,data:{ammoType:'arrow'}});
const fireQuiver=createItemDefinition({id:'fire-quiver',name:'Carquois incendiaire',kind:'quiver',stackable:true,data:{ammoType:'arrow'}});
const defs={items:[potion,sword,bow,arrows,fireQuiver],resources:[hp],stats:[{id:'atk',baseValue:1}],effects:[heal,burn],conditions:[condition],skills:[skill]};

assert.equal(validateItemDefinition(bow,defs).valid,true);
assert.equal(validateItemDefinition({...bow,data:{requiresAmmo:true}},defs).valid,false);

let inv=createInventoryState({slots:['hand']});
inv=addItem(inv,'potion',2,defs).inventory;
let state={stats:{atk:1},resources:{hp:{current:8,max:20}}};
let out=useInventoryItem({inventory:inv,itemId:'potion',targetState:state,definitions:defs,context:state});
assert.equal(out.ok,true); assert.equal(out.consumed,true); assert.equal(out.targetState.resources.hp.current,13); assert.equal(inventoryQuantity(out.inventory,'potion'),1); inv=out.inventory;
out=useInventoryItem({inventory:inv,itemId:'potion',targetState:out.targetState,definitions:defs,context:out.targetState});
assert.equal(out.ok,false); assert.equal(out.reason,'conditions'); assert.equal(inventoryQuantity(inv,'potion'),1);

inv=addItem(inv,'sword',1,defs).inventory;
const swordEntry=inv.entries.find(e=>e.itemId==='sword'); inv=equipItem(inv,swordEntry.entryId,'hand',defs).inventory;
assert.deepEqual(equippedItemBonuses(inv,defs),{itemIds:['sword'],effectIds:['burn'],skillIds:['slash']});

inv=addItem(inv,'bow',1,defs).inventory; inv=addItem(inv,'arrows',2,defs).inventory; inv=addItem(inv,'fire-quiver',1,defs).inventory;
assert.deepEqual(compatibleAmmoItems(bow,defs).map(x=>x.id),['arrows','fire-quiver']);
out=consumeWeaponAmmo({inventory:inv,weapon:bow,shots:2,definitions:defs});
assert.equal(out.ok,true); assert.equal(inventoryQuantity(out.inventory,'arrows'),0); assert.equal(inventoryQuantity(out.inventory,'fire-quiver'),1);
assert.equal(consumeWeaponAmmo({inventory:out.inventory,weapon:bow,shots:2,definitions:defs}).reason,'not-enough-ammo');

console.log('rpg item engine ok');
