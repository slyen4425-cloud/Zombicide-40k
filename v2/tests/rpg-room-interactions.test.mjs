import assert from 'node:assert/strict';
import { createRoomLayout, createDoor, addDoor } from '../src/modes/rpg/room-engine.js';
import { createRoomInteraction, addRoomInteraction, updateRoomInteraction, removeRoomInteraction, interactionsAtCell, validateRoomInteractions } from '../src/modes/rpg/interaction-engine.js';

let layout=createRoomLayout({roomId:'room-1',width:4,height:4});
let doorOut=addDoor(layout,createDoor({id:'door-1',x:3,y:1,edge:'east'}));
assert.equal(doorOut.ok,true);
layout=doorOut.layout;

let chestOut=addRoomInteraction(layout,createRoomInteraction({id:'chest-1',kind:'chest',name:'Coffre ancien',attachment:{kind:'cell',x:1,y:1}}));
assert.equal(chestOut.ok,true);
layout=chestOut.layout;

let trapOut=addRoomInteraction(layout,createRoomInteraction({id:'trap-1',kind:'trap',name:'Aiguille empoisonnée',attachment:{kind:'interaction',targetId:'chest-1'}}));
assert.equal(trapOut.ok,true);
layout=trapOut.layout;

let puzzleOut=addRoomInteraction(layout,createRoomInteraction({id:'puzzle-1',kind:'puzzle',name:'Runes de la porte',attachment:{kind:'door',targetId:'door-1'}}));
assert.equal(puzzleOut.ok,true);
layout=puzzleOut.layout;

const atChest=interactionsAtCell(layout,1,1).map(x=>x.id);
assert.deepEqual(atChest,['chest-1','trap-1']);
const atDoor=interactionsAtCell(layout,3,1).map(x=>x.id);
assert.deepEqual(atDoor,['puzzle-1']);
assert.equal(validateRoomInteractions(layout).valid,true);

const missing=updateRoomInteraction(layout,'puzzle-1',{attachment:{kind:'door',targetId:'door-missing'}});
assert.equal(missing.ok,false);
assert.equal(missing.reason,'door-missing');

layout=removeRoomInteraction(layout,'chest-1');
const trap=layout.interactions.find(x=>x.id==='trap-1');
assert.equal(trap.attachment.kind,'cell');
assert.equal(trap.attachment.x,0);
assert.equal(trap.attachment.y,0);
assert.equal(validateRoomInteractions(layout).valid,true);

console.log('rpg-room-interactions: ok');
