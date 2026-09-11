import assert from 'node:assert/strict';
import { createWorld, createZone, createRoom, createRoomLink, buildWorldIndex } from '../src/modes/rpg/world-engine.js';
import { createRoomLayout } from '../src/modes/rpg/room-engine.js';
import { createRoomInteraction } from '../src/modes/rpg/interaction-engine.js';
import { createDungeonRuntime, transitionDungeonRoom, attemptRoomInteraction } from '../src/modes/rpg/room-runtime.js';
import { createQuestDefinition } from '../src/modes/rpg/quest-engine.js';
import { createQuestRuntime, startQuestRuntime, questRuntimeSnapshot } from '../src/modes/rpg/quest-runtime.js';

const zone=createZone({id:'z1',name:'Zone',roomIds:['inn','crypt']});
const inn=createRoom({id:'inn',zoneId:'z1',name:'Auberge'});
const crypt=createRoom({id:'crypt',zoneId:'z1',name:'Crypte'});
const link=createRoomLink({id:'to-crypt',fromRoomId:'inn',toRoomId:'crypt'});
const world=createWorld({id:'w1',name:'Monde',startRoomId:'inn',zones:['z1']});
const index=buildWorldIndex({world,zones:[zone],rooms:[inn,crypt],links:[link]});

const mayor=createRoomInteraction({id:'mayor',kind:'npc',name:'Maire',attachment:{kind:'cell',x:0,y:0}});
const lever=createRoomInteraction({id:'lever-a',kind:'switch',name:'Levier',attachment:{kind:'cell',x:0,y:0},data:{questSignals:[{kind:'flag',targetId:'secret-open'}]}});
const layouts={
  inn:{...createRoomLayout({id:'inn-layout',roomId:'inn',width:2,height:2}),interactions:[mayor]},
  crypt:{...createRoomLayout({id:'crypt-layout',roomId:'crypt',width:2,height:2}),interactions:[lever]},
};
const layoutProvider=id=>layouts[id];

const quest=createQuestDefinition({id:'help',name:'Aider le village',objectives:[
  {id:'visit-inn',kind:'visit',targetId:'inn',required:1},
  {id:'talk-mayor',kind:'npc',targetId:'mayor',required:1},
  {id:'visit-crypt',kind:'visit',targetId:'crypt',required:1},
  {id:'pull-lever',kind:'switch',targetId:'lever-a',required:1},
  {id:'secret',kind:'flag',targetId:'secret-open',required:1},
]});
let questRuntime=createQuestRuntime([quest]);
questRuntime=startQuestRuntime(questRuntime,quest,{now:'q0'}).runtime;

let started=createDungeonRuntime(index,{layoutProvider,questRuntime,quests:[quest],now:'q1'});
assert.equal(started.ok,true);
let runtime=started.runtime;
assert.equal(questRuntimeSnapshot(runtime.questRuntime,'help').progress['visit-inn'],1,'starting room visit should progress quest automatically');

let interaction=attemptRoomInteraction(runtime,'inn',mayor,{}, {quests:[quest],now:'q2'});
assert.equal(interaction.ok,true);
assert.equal(interaction.success,true);
runtime=interaction.runtime;
assert.equal(questRuntimeSnapshot(runtime.questRuntime,'help').progress['talk-mayor'],1,'successful NPC interaction should progress quest automatically');

let moved=transitionDungeonRoom(index,runtime,'to-crypt',{layoutProvider,quests:[quest],now:'q3'});
assert.equal(moved.ok,true);
runtime=moved.runtime;
assert.equal(questRuntimeSnapshot(runtime.questRuntime,'help').progress['visit-crypt'],1,'room transition should emit visit quest signal automatically');

interaction=attemptRoomInteraction(runtime,'crypt',lever,{}, {quests:[quest],now:'q4'});
assert.equal(interaction.ok,true);
runtime=interaction.runtime;
const state=questRuntimeSnapshot(runtime.questRuntime,'help');
assert.equal(state.progress['pull-lever'],1,'typed interaction quest signal should be automatic');
assert.equal(state.progress.secret,1,'custom interaction quest signal should be automatic');

console.log('rpg-room-quest-wiring.test.mjs: OK');
