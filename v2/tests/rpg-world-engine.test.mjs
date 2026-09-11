import assert from 'node:assert/strict';
import {
  createWorld,createZone,createRoom,createRoomLink,buildWorldIndex,validateWorld,
  createWorldSession,availableRoomLinks,traverseRoomLink,returnToPreviousRoom
} from '../src/modes/rpg/world-engine.js';
import { createInventoryState, addItem } from '../src/modes/rpg/inventory-engine.js';

const zone=createZone({id:'z1',name:'Forêt',roomIds:['r1','r2','cache']});
const rooms=[
  createRoom({id:'r1',zoneId:'z1',name:'Entrée'}),
  createRoom({id:'r2',zoneId:'z1',name:'Salle 2'}),
  createRoom({id:'cache',zoneId:'z1',name:'Cache'}),
];
const links=[
  createRoomLink({id:'l12',fromRoomId:'r1',toRoomId:'r2',label:'Vers salle 2'}),
  createRoomLink({id:'l1c',fromRoomId:'r1',toRoomId:'cache',label:'Passage secret'}),
  createRoomLink({id:'lc2',fromRoomId:'cache',toRoomId:'r2',label:'Retour vers forêt',oneWay:true}),
];
const world=createWorld({id:'w1',name:'Monde test',startRoomId:'r1',zones:['z1']});
const index=buildWorldIndex({world,zones:[zone],rooms,links});

assert.equal(validateWorld(index).valid,true);
const started=createWorldSession(index);
assert.equal(started.ok,true);
assert.equal(started.session.currentRoomId,'r1');

let available=availableRoomLinks(index,started.session);
assert.deepEqual(new Set(available.map(x=>x.targetRoomId)),new Set(['r2','cache']));

const toCache=traverseRoomLink(index,started.session,'l1c');
assert.equal(toCache.ok,true);
assert.equal(toCache.session.currentRoomId,'cache');
assert.deepEqual(toCache.session.visitedRoomIds,['r1','cache']);

available=availableRoomLinks(index,toCache.session);
assert.equal(available.some(x=>x.id==='l1c'&&x.targetRoomId==='r1'&&x.traversal==='reverse'),true);
assert.equal(available.some(x=>x.id==='lc2'&&x.targetRoomId==='r2'),true);

const toRoom2=traverseRoomLink(index,toCache.session,'lc2');
assert.equal(toRoom2.ok,true);
assert.equal(toRoom2.session.currentRoomId,'r2');
assert.equal(availableRoomLinks(index,toRoom2.session).some(x=>x.id==='lc2'),false,'one-way link must not create parasite reverse navigation');

const back=returnToPreviousRoom(index,toRoom2.session);
assert.equal(back.ok,true);
assert.equal(back.session.currentRoomId,'cache');

const gated=createRoomLink({id:'gate',fromRoomId:'r1',toRoomId:'r2',conditions:['key']});
const gatedIndex=buildWorldIndex({world,zones:[zone],rooms,links:[gated]});
const gatedSession=createWorldSession(gatedIndex).session;
assert.equal(availableRoomLinks(gatedIndex,gatedSession,{conditionEvaluator:()=>false}).length,0);
assert.equal(availableRoomLinks(gatedIndex,gatedSession,{conditionEvaluator:id=>id==='key'}).length,1);

const itemGate=createRoomLink({id:'boss-exit',fromRoomId:'r1',toRoomId:'r2',requiredItemId:'boss-key'});
const itemGateIndex=buildWorldIndex({world,zones:[zone],rooms,links:[itemGate]});
const itemGateSession=createWorldSession(itemGateIndex).session;
const itemDefinitions={items:[{id:'boss-key',name:'Clé du boss',enabled:true,stackable:true,maxStack:9}]};
const emptyInventory=createInventoryState();
assert.equal(availableRoomLinks(itemGateIndex,itemGateSession,{inventory:emptyInventory}).length,0,'boss exit must stay hidden/blocked before the key exists');
const blockedByItem=traverseRoomLink(itemGateIndex,itemGateSession,'boss-exit',{inventory:emptyInventory});
assert.equal(blockedByItem.ok,false);
assert.equal(blockedByItem.reason,'link-unavailable');
const keyAdded=addItem(emptyInventory,'boss-key',1,itemDefinitions);
assert.equal(keyAdded.ok,true);
assert.equal(availableRoomLinks(itemGateIndex,itemGateSession,{inventory:keyAdded.inventory}).length,1);
const passedBossExit=traverseRoomLink(itemGateIndex,itemGateSession,'boss-exit',{inventory:keyAdded.inventory});
assert.equal(passedBossExit.ok,true);
assert.equal(passedBossExit.session.currentRoomId,'r2');

const broken=buildWorldIndex({world:createWorld({id:'bad',startRoomId:'missing'}),zones:[],rooms:[],links:[]});
assert.equal(validateWorld(broken).valid,false);
assert.equal(createWorldSession(broken).ok,false);

console.log('rpg-world-engine.test.mjs: OK');
