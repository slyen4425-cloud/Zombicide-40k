import assert from 'node:assert/strict';
import { createCombatState } from '../src/modes/rpg/combat-engine.js';
import { createInventoryState, addItem, inventoryQuantity } from '../src/modes/rpg/inventory-engine.js';
import { dungeonHeroCombatItems, useDungeonHeroCombatItem } from '../src/modes/rpg/dungeon-combat-item-runtime.js';

const universe={
  resources:[{id:'hp',name:'PV',min:0,maxFormula:{kind:'fixed',value:10}}],
  effects:[
    {id:'heal4',enabled:true,kind:'resource-modifier',resourceId:'hp',operation:'add',value:4,chance:100},
    {id:'heal3',enabled:true,kind:'resource-modifier',resourceId:'hp',operation:'add',value:3,chance:100},
  ],
  items:[
    {id:'potion',name:'Potion',kind:'consumable',enabled:true,stackable:true,maxStack:9,conditionIds:[],effectIds:['heal4'],skillIds:[],data:{target:'self'}},
    {id:'bandage',name:'Bandage',kind:'consumable',enabled:true,stackable:true,maxStack:9,conditionIds:[],effectIds:['heal3'],skillIds:[],data:{target:'ally',consumeTurn:false}},
    {id:'stone',name:'Pierre',kind:'material',enabled:true,stackable:true,maxStack:99,conditionIds:[],effectIds:[],skillIds:[],data:{}},
  ],
  combat:{
    initiative:{mode:'fixed',source:{kind:'fixed',id:null},base:0,die:20,modifier:0},
    defeatRule:{enabled:true,kind:'resource',sourceId:'hp',operator:'lte',threshold:0},
    checkDefaults:{die:100,mode:'roll-under'},
  },
};

let inventory=createInventoryState();
inventory=addItem(inventory,'potion',2,universe).inventory;
inventory=addItem(inventory,'bandage',1,universe).inventory;
inventory=addItem(inventory,'stone',1,universe).inventory;
const heroRuntimes=[
  {instanceId:'hero',heroId:'hero',active:true,ko:false,dead:false,inventory,state:{resources:{hp:{current:4,max:10}},stats:{}}},
  {instanceId:'ally',heroId:'ally',active:true,ko:false,dead:false,inventory:createInventoryState(),state:{resources:{hp:{current:2,max:10}},stats:{}}},
];

let combat=createCombatState({combatants:[
  {id:'hero',side:'heroes',initiative:10,state:{resources:{hp:{current:4,max:10}},stats:{}}},
  {id:'ally',side:'heroes',initiative:7,state:{resources:{hp:{current:2,max:10}},stats:{}}},
  {id:'enemy',side:'enemies',initiative:5,state:{resources:{hp:{current:10,max:10}},stats:{}}},
]});

const available=dungeonHeroCombatItems({combat,heroRuntimes,universe});
assert.deepEqual(available.map(entry=>entry.itemId).sort(),['bandage','potion']);
assert.equal(available.find(entry=>entry.itemId==='potion').quantity,2);
assert.equal(available.find(entry=>entry.itemId==='potion').targetKind,'self');
assert.equal(available.find(entry=>entry.itemId==='bandage').targetKind,'ally');
assert.equal(available.some(entry=>entry.itemId==='stone'),false,'materials must not become combat actions implicitly');

const invalid=useDungeonHeroCombatItem({combat,heroRuntimes,universe,itemId:'potion',targetId:'ally'});
assert.equal(invalid.ok,false);
assert.equal(invalid.reason,'self-required');
assert.equal(inventoryQuantity(invalid.heroRuntimes[0].inventory,'potion'),2,'invalid target must not consume item');
assert.equal(invalid.combat.actors.hero.state.resources.hp.current,4);

const potion=useDungeonHeroCombatItem({combat,heroRuntimes,universe,itemId:'potion',targetId:'hero'});
assert.equal(potion.ok,true);
assert.equal(potion.combat.actors.hero.state.resources.hp.current,8);
assert.equal(inventoryQuantity(potion.heroRuntimes[0].inventory,'potion'),1);
assert.equal(potion.quantityRemaining,1);
assert.equal(potion.consumeTurn,true);
assert.equal(potion.combat.activeActorId,'ally','normal combat consumable must advance the same real timeline');
assert.equal(potion.combat.log.some(event=>event.type==='item-used'&&event.itemId==='potion'&&event.targetId==='hero'),true);

combat=createCombatState({combatants:[
  {id:'hero',side:'heroes',initiative:10,state:{resources:{hp:{current:4,max:10}},stats:{}}},
  {id:'ally',side:'heroes',initiative:7,state:{resources:{hp:{current:2,max:10}},stats:{}}},
  {id:'enemy',side:'enemies',initiative:5,state:{resources:{hp:{current:10,max:10}},stats:{}}},
]});
const bandage=useDungeonHeroCombatItem({combat,heroRuntimes,universe,itemId:'bandage',targetId:'ally'});
assert.equal(bandage.ok,true);
assert.equal(bandage.combat.actors.ally.state.resources.hp.current,5);
assert.equal(inventoryQuantity(bandage.heroRuntimes[0].inventory,'bandage'),0);
assert.equal(bandage.consumeTurn,false);
assert.equal(bandage.combat.activeActorId,'hero','data-driven non-turn item must preserve the active turn');

console.log('rpg-dungeon-combat-items.test.mjs: OK');
