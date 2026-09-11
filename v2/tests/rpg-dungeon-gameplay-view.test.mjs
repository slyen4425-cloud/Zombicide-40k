import assert from 'node:assert/strict';
import { createInventoryState, createItemDefinition } from '../src/modes/rpg/inventory-engine.js';
import { renderDungeonGameplayView, dungeonLootEntries, grantDungeonCreatureLoot, eventPresentationEntries } from '../src/modes/rpg/dungeon-gameplay-view.js';

const coin=createItemDefinition({id:'old-coin',name:'Vieille pièce',stackable:true});
const universe={items:[coin],quests:[{
  id:'crypt',name:'Crypte oubliée',description:'Trouver la crypte.',enabled:true,
  objectives:[{id:'enter',label:'Entrer dans la crypte',required:1,optional:false}],
}]};

const runtime={
  currentRoomId:'crypt-room',
  rooms:{'crypt-room':{
    visits:2,
    entities:[{
      id:'spawn:skeleton:1',kind:'creature',active:false,defeated:true,
      data:{creatureRuntime:{instanceId:'spawn:skeleton:1',creatureId:'skeleton',defeated:true,active:false,lootClaimed:true,lootGranted:false,lootDrops:[{itemId:'old-coin',quantity:2}]}},
    }],
  }},
  eventQueue:{pending:[{id:'event-request:1'}]},
  questRuntime:{states:{crypt:{questId:'crypt',status:'active',progress:{enter:0},startedAt:'2026-09-11T00:00:00Z'}}},
};
const recipients=[
  {kind:'hero',id:'lyra',name:'Lyra',icon:'🏹',inventory:createInventoryState()},
  {kind:'group',id:'party',name:'Sac du groupe',icon:'🎒',inventory:createInventoryState()},
];
const eventState={
  status:'completed',
  log:[
    {type:'event-text',text:'Le mur tremble et révèle un passage.'},
    {type:'event-check-resolved',success:true},
    {type:'event-reward',itemId:'old-coin',quantity:3},
    {type:'event-door-updated',doorId:'crypt-door'},
    {type:'event-choice-selected',label:'Ouvrir le passage'},
  ],
};

let html=renderDungeonGameplayView(universe,runtime,{lootRecipients:recipients,selectedLootRecipientKey:'hero:lyra',eventPresentationState:eventState});
assert.match(html,/Partie Donjon/);
assert.match(html,/Salle actuelle : crypt-room/);
assert.match(html,/Visites :<\/strong> 2/);
assert.match(html,/Événements en attente :<\/strong> 1/);
assert.match(html,/Crypte oubliée/);
assert.match(html,/Entrer dans la crypte/);
assert.match(html,/0\/1/);
assert.match(html,/Donner le butin/);
assert.match(html,/Lyra · Héros/);
assert.match(html,/Sac du groupe · Groupe/);
assert.match(html,/Le mur tremble et révèle un passage/);
assert.match(html,/Jet réussi/);
assert.match(html,/Récompense reçue : 3 × old-coin/);
assert.match(html,/Une porte a changé d’état/);
assert.match(html,/Choix : Ouvrir le passage/);
assert.equal(eventPresentationEntries(eventState).length,5);
assert.equal(dungeonLootEntries(runtime).length,1);

const granted=grantDungeonCreatureLoot(runtime,'spawn:skeleton:1',recipients,'hero:lyra',universe);
assert.equal(granted.ok,true);
assert.equal(granted.roomRuntime.rooms['crypt-room'].entities[0].data.creatureRuntime.lootGranted,true);
assert.deepEqual(granted.roomRuntime.rooms['crypt-room'].entities[0].data.creatureRuntime.lootGrantedTo,{kind:'hero',id:'lyra'});
assert.equal(granted.recipients[0].inventory.entries[0].itemId,'old-coin');
assert.equal(granted.recipients[0].inventory.entries[0].quantity,2);
assert.equal(granted.recipients[1].inventory.entries.length,0,'group inventory must stay untouched');
assert.equal(dungeonLootEntries(granted.roomRuntime).length,0,'granted loot must disappear from the gameplay list');

const duplicate=grantDungeonCreatureLoot(granted.roomRuntime,'spawn:skeleton:1',granted.recipients,'group:party',universe);
assert.equal(duplicate.ok,false);
assert.equal(duplicate.reason,'already-granted');
assert.deepEqual(duplicate.roomRuntime.rooms['crypt-room'].entities[0].data.creatureRuntime.lootGrantedTo,{kind:'hero',id:'lyra'});

runtime.questRuntime.states.crypt.progress.enter=1;
runtime.questRuntime.states.crypt.status='completed';
html=renderDungeonGameplayView(universe,runtime,{lootRecipients:recipients});
assert.match(html,/Terminée/);
assert.match(html,/1\/1/);

html=renderDungeonGameplayView(universe,null,{lootRecipients:recipients});
assert.match(html,/Aucune partie Donjon active/);
assert.match(html,/Aucune quête active pour le moment/);
assert.match(html,/Aucun butin à distribuer/);

console.log('rpg-dungeon-gameplay-view.test.mjs: OK');
