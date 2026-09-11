import assert from 'node:assert/strict';
import { createCombatState } from '../src/modes/rpg/combat-engine.js';
import { createInventoryState, addItem } from '../src/modes/rpg/inventory-engine.js';
import { dungeonCombatItemTargetEntries, renderDungeonCombatItemControls } from '../src/modes/rpg/dungeon-combat-item-ui.js';
import { dungeonHeroCombatItems } from '../src/modes/rpg/dungeon-combat-item-runtime.js';

const universe={
  heroes:[{id:'hero',name:'Lyra'},{id:'ally',name:'Aldren'}],
  bestiary:[{id:'skeleton',name:'Squelette'}],
  effects:[{id:'heal',enabled:true,kind:'resource-modifier',resourceId:'hp',operation:'add',value:3,chance:100}],
  items:[
    {id:'potion',name:'Potion',icon:'🧪',kind:'consumable',enabled:true,stackable:true,maxStack:9,conditionIds:[],effectIds:['heal'],skillIds:[],data:{target:'self'}},
    {id:'bandage',name:'Bandage',icon:'🩹',kind:'consumable',enabled:true,stackable:true,maxStack:9,conditionIds:[],effectIds:['heal'],skillIds:[],data:{target:'ally',consumeTurn:false}},
  ],
};
let inventory=createInventoryState();
inventory=addItem(inventory,'potion',2,universe).inventory;
inventory=addItem(inventory,'bandage',1,universe).inventory;
const heroRuntimes=[
  {instanceId:'hero',heroId:'hero',active:true,ko:false,dead:false,inventory,state:{resources:{hp:{current:4,max:10}},stats:{}}},
  {instanceId:'ally',heroId:'ally',active:true,ko:false,dead:false,inventory:createInventoryState(),state:{resources:{hp:{current:5,max:10}},stats:{}}},
];
const combat=createCombatState({combatants:[
  {id:'hero',side:'heroes',initiative:10,state:{resources:{hp:{current:4,max:10}},stats:{}},metadata:{heroId:'hero'}},
  {id:'ally',side:'heroes',initiative:7,state:{resources:{hp:{current:5,max:10}},stats:{}},metadata:{heroId:'ally'}},
  {id:'enemy',side:'enemies',initiative:5,state:{resources:{hp:{current:10,max:10}},stats:{}},metadata:{creatureId:'skeleton'}},
]});
const items=dungeonHeroCombatItems({combat,heroRuntimes,universe});
assert.equal(items.length,2);
const potion=items.find(entry=>entry.itemId==='potion');
const bandage=items.find(entry=>entry.itemId==='bandage');
assert.deepEqual(dungeonCombatItemTargetEntries({universe,combat,itemEntry:potion}).map(x=>x.id),['hero']);
assert.deepEqual(dungeonCombatItemTargetEntries({universe,combat,itemEntry:bandage}).map(x=>x.id),['ally']);
const html=renderDungeonCombatItemControls({universe,combat,heroRuntimes});
assert.match(html,/data-dungeon-combat-item/);
assert.match(html,/Potion/);
assert.match(html,/x2/);
assert.match(html,/Bandage/);
assert.match(html,/Cible de l'objet/);
assert.match(html,/Utiliser l'objet/);

console.log('rpg-dungeon-combat-item-ui.test.mjs: OK');
