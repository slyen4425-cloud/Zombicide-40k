import assert from 'node:assert/strict';
import { renderDungeonGameplayView } from '../src/modes/rpg/dungeon-gameplay-view.js';

const universe={quests:[{
  id:'crypt',name:'Crypte oubliée',description:'Trouver la crypte.',enabled:true,
  objectives:[{id:'enter',label:'Entrer dans la crypte',required:1,optional:false}],
}]};

const runtime={
  currentRoomId:'crypt-room',
  rooms:{'crypt-room':{visits:2}},
  eventQueue:{pending:[{id:'event-request:1'}]},
  questRuntime:{states:{crypt:{questId:'crypt',status:'active',progress:{enter:0},startedAt:'2026-09-11T00:00:00Z'}}},
};

let html=renderDungeonGameplayView(universe,runtime);
assert.match(html,/Partie Donjon/);
assert.match(html,/Salle actuelle : crypt-room/);
assert.match(html,/Visites :<\/strong> 2/);
assert.match(html,/Événements en attente :<\/strong> 1/);
assert.match(html,/Crypte oubliée/);
assert.match(html,/Entrer dans la crypte/);
assert.match(html,/0\/1/);

runtime.questRuntime.states.crypt.progress.enter=1;
runtime.questRuntime.states.crypt.status='completed';
html=renderDungeonGameplayView(universe,runtime);
assert.match(html,/Terminée/);
assert.match(html,/1\/1/);

html=renderDungeonGameplayView(universe,null);
assert.match(html,/Aucune partie Donjon active/);
assert.match(html,/Aucune quête active pour le moment/);

console.log('rpg-dungeon-gameplay-view.test.mjs: OK');
