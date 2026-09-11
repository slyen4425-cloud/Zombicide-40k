import assert from 'node:assert/strict';
import { createInventoryState, createItemDefinition, addItem } from '../src/modes/rpg/inventory-engine.js';
import { buildWorldIndex, createWorld, createZone, createRoom, createRoomLink } from '../src/modes/rpg/world-engine.js';
import { renderDungeonGameplayView, dungeonLootEntries, grantDungeonCreatureLoot, eventPresentationEntries, dungeonTransitionEntries } from '../src/modes/rpg/dungeon-gameplay-view.js';

const coin=createItemDefinition({id:'old-coin',name:'Vieille pièce',stackable:true});
const key=createItemDefinition({id:'crypt-key',name:'Clé de crypte',stackable:false});
const universe={
  items:[coin,key],
  heroes:[{id:'aldren',name:'Aldren',icon:'⚔️'},{id:'lyra',name:'Lyra',icon:'🏹'}],
  quests:[{
    id:'crypt',name:'Crypte oubliée',description:'Trouver la crypte.',enabled:true,
    objectives:[{id:'enter',label:'Entrer dans la crypte',required:1,optional:false}],
  }],
};

const zone=createZone({id:'zone',name:'Sous-sol',roomIds:['crypt-room','hall-room','boss-room']});
const world=createWorld({id:'world',name:'Crypte',startRoomId:'crypt-room',zones:['zone']});
const rooms=[
  createRoom({id:'crypt-room',zoneId:'zone',name:'Crypte oubliée'}),
  createRoom({id:'hall-room',zoneId:'zone',name:'Galerie sombre'}),
  createRoom({id:'boss-room',zoneId:'zone',name:'Sanctuaire scellé'}),
];
const links=[
  createRoomLink({id:'hall-link',fromRoomId:'crypt-room',toRoomId:'hall-room',label:'Passage vers la galerie'}),
  createRoomLink({id:'boss-link',fromRoomId:'crypt-room',toRoomId:'boss-room',label:'Porte du sanctuaire',requiredItemId:'crypt-key'}),
];
const worldIndex=buildWorldIndex({world,zones:[zone],rooms,links});

const runtime={
  currentRoomId:'crypt-room',
  focusedHeroId:'lyra',
  heroLocations:{
    aldren:{heroId:'aldren',roomId:'hall-room',visitedRoomIds:['crypt-room','hall-room'],history:[{fromRoomId:'crypt-room',toRoomId:'hall-room',linkId:'hall-link',traversal:'forward'}],sequence:1,x:null,y:null},
    lyra:{heroId:'lyra',roomId:'crypt-room',visitedRoomIds:['crypt-room'],history:[],sequence:0,x:null,y:null},
  },
  worldSession:{worldId:'world',currentRoomId:'crypt-room',visitedRoomIds:['crypt-room'],history:[],flags:{},openedLinks:[],sequence:0},
  rooms:{
    'crypt-room':{
      visits:2,
      entities:[{
        id:'spawn:skeleton:1',kind:'creature',active:false,defeated:true,
        data:{creatureRuntime:{instanceId:'spawn:skeleton:1',creatureId:'skeleton',defeated:true,active:false,lootClaimed:true,lootGranted:false,lootDrops:[{itemId:'old-coin',quantity:2}]}},
      }],
    },
    'hall-room':{visits:1,entities:[]},
  },
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

let transitions=dungeonTransitionEntries(worldIndex,runtime);
assert.deepEqual(transitions.map(x=>x.id),['hall-link'],'required item must hide locked authored passage');
assert.equal(transitions[0].targetRoomName,'Galerie sombre');
let inventory=addItem(createInventoryState(),'crypt-key',1,universe).inventory;
transitions=dungeonTransitionEntries(worldIndex,runtime,{inventory});
assert.deepEqual(transitions.map(x=>x.id).sort(),['boss-link','hall-link']);

let html=renderDungeonGameplayView(universe,runtime,{lootRecipients:recipients,selectedLootRecipientKey:'hero:lyra',eventPresentationState:eventState,worldIndex,inventory});
assert.match(html,/Partie Donjon/);
assert.match(html,/Lyra · Salle actuelle : Crypte oubliée/);
assert.match(html,/Héros actif/);
assert.match(html,/Lyra · Crypte oubliée/);
assert.match(html,/Aldren · Galerie sombre/);
assert.match(html,/Lyra se déplace seul/);
assert.match(html,/Visites :<\/strong> 2/);
assert.match(html,/Événements en attente :<\/strong> 1/);
assert.match(html,/Passages/);
assert.match(html,/Passage vers la galerie · Galerie sombre/);
assert.match(html,/Porte du sanctuaire · Sanctuaire scellé/);
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

const aldrenFocused=structuredClone(runtime);
aldrenFocused.focusedHeroId='aldren';
aldrenFocused.currentRoomId='hall-room';
aldrenFocused.worldSession={...aldrenFocused.worldSession,currentRoomId:'hall-room',visitedRoomIds:['crypt-room','hall-room'],history:[{fromRoomId:'crypt-room',toRoomId:'hall-room',linkId:'hall-link',traversal:'forward'}],sequence:1};
const aldrenTransitions=dungeonTransitionEntries(worldIndex,aldrenFocused);
assert.deepEqual(aldrenTransitions.map(x=>x.id),['hall-link'],'focused hero in hall must receive reverse passage from his own room');
assert.equal(aldrenTransitions[0].traversal,'reverse');
html=renderDungeonGameplayView(universe,aldrenFocused,{worldIndex});
assert.match(html,/Aldren · Salle actuelle : Galerie sombre/);
assert.match(html,/↩️ Passage vers la galerie · Crypte oubliée/);

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
html=renderDungeonGameplayView(universe,runtime,{lootRecipients:recipients,worldIndex});
assert.match(html,/Terminée/);
assert.match(html,/1\/1/);
assert.doesNotMatch(html,/Porte du sanctuaire/,'required item passage must not render without inventory item');

html=renderDungeonGameplayView(universe,null,{lootRecipients:recipients,worldIndex});
assert.match(html,/Aucune partie Donjon active/);
assert.match(html,/Aucune quête active pour le moment/);
assert.match(html,/Aucun butin à distribuer/);

console.log('rpg-dungeon-gameplay-view.test.mjs: OK');
