import assert from 'node:assert/strict';
import { createWorld, createZone, createRoom, createRoomLink, buildWorldIndex } from '../src/modes/rpg/world-engine.js';
import { createDungeonRuntime, transitionDungeonRoom, updateRoomEntity, updateRoomInteractionState, ensureRoomInstance, roomRuntimeSnapshot } from '../src/modes/rpg/room-runtime.js';

const zone=createZone({id:'z1',name:'Zone'});
const roomA=createRoom({id:'a',zoneId:'z1',name:'Salle A'});
const roomB=createRoom({id:'b',zoneId:'z1',name:'Salle B'});
zone.roomIds=['a','b'];
const link=createRoomLink({id:'ab',fromRoomId:'a',toRoomId:'b',oneWay:false});
const world=createWorld({id:'w1',name:'Test',startRoomId:'a',zones:['z1']});
const index=buildWorldIndex({world,zones:[zone],rooms:[roomA,roomB],links:[link]});

const layouts={
  a:{id:'la',roomId:'a',interactions:[{id:'chest1',enabled:true}],metadata:{entities:[{id:'enemy1',kind:'enemy',x:2,y:2}]}},
  b:{id:'lb',roomId:'b',interactions:[],metadata:{entities:[{id:'enemy2',kind:'enemy',x:1,y:1}]}},
};
const layoutProvider=id=>layouts[id]||null;

let started=createDungeonRuntime(index,{layoutProvider});
assert.equal(started.ok,true);
let runtime=started.runtime;
assert.equal(runtime.currentRoomId,'a');
assert.equal(roomRuntimeSnapshot(runtime,'a').visits,1);
assert.equal(roomRuntimeSnapshot(runtime,'a').entities.length,1);

let killed=updateRoomEntity(runtime,'a','enemy1',{defeated:true,active:false});
assert.equal(killed.ok,true); runtime=killed.runtime;
let opened=updateRoomInteractionState(runtime,'a','chest1',{opened:true,completed:true});
assert.equal(opened.ok,true); runtime=opened.runtime;

let toB=transitionDungeonRoom(index,runtime,'ab',{layoutProvider});
assert.equal(toB.ok,true); runtime=toB.runtime;
assert.equal(toB.created,true);
assert.equal(runtime.currentRoomId,'b');
assert.equal(roomRuntimeSnapshot(runtime,'b').entities.length,1);

let back=transitionDungeonRoom(index,runtime,'ab',{layoutProvider});
assert.equal(back.ok,true); runtime=back.runtime;
assert.equal(back.created,false);
assert.equal(runtime.currentRoomId,'a');
const returned=roomRuntimeSnapshot(runtime,'a');
assert.equal(returned.visits,2);
assert.equal(returned.entities.length,1,'enemy must not be duplicated when returning');
assert.equal(returned.entities[0].defeated,true,'defeated enemy state must persist');
assert.equal(returned.entities[0].active,false);
assert.equal(returned.interactions.chest1.opened,true,'opened chest state must persist');

const ensured=ensureRoomInstance(runtime,'a',layouts.a);
assert.equal(ensured.created,false);
assert.equal(ensured.room.entities.length,1,'re-instantiation must not respawn content');

console.log('rpg-room-runtime.test.mjs: ok');
