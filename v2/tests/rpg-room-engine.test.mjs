import assert from 'node:assert/strict';
import {createRoomLayout,setRoomCell,getRoomCell,createWall,addWall,createDoor,addDoor,createMarker,addMarker,resizeRoomLayout,validateRoomLayout} from '../src/modes/rpg/room-engine.js';
import {doorRequiredItemOptions} from '../src/modes/rpg/room-editor.js';

let layout=createRoomLayout({id:'layout-1',roomId:'room-1',name:'Crypte',width:6,height:4});
assert.equal(layout.width,6);
assert.equal(layout.height,4);

let out=setRoomCell(layout,2,1,{terrain:'lava',blocked:true});
assert.equal(out.ok,true);
layout=out.layout;
assert.equal(getRoomCell(layout,2,1).terrain,'lava');
assert.equal(getRoomCell(layout,2,1).blocked,true);

out=setRoomCell(layout,3,1,{terrain:'floor',blocked:false,coverModifier:-25});
assert.equal(out.ok,true);
layout=out.layout;
assert.equal(getRoomCell(layout,3,1).coverModifier,-25,'la couverture tactique configurée dans l’éditeur doit rester dans la case');

out=setRoomCell(layout,8,8,{terrain:'water'});
assert.equal(out.ok,false);
assert.equal(out.reason,'out-of-bounds');

out=addWall(layout,createWall({id:'wall-1',x:1,y:1,edge:'east'}));
assert.equal(out.ok,true);
layout=out.layout;
assert.equal(addWall(layout,createWall({id:'wall-2',x:1,y:1,edge:'east'})).reason,'wall-exists');

out=addDoor(layout,createDoor({id:'door-entry',x:0,y:2,edge:'west',entry:true,linkId:'link-start',locked:true,keyItemId:'boss-key'}));
assert.equal(out.ok,true);
layout=out.layout;
assert.equal(layout.doors[0].entry,true);
assert.equal(layout.doors[0].linkId,'link-start');
assert.equal(layout.doors[0].locked,true);
assert.equal(layout.doors[0].keyItemId,'boss-key');

const keyOptions=doorRequiredItemOptions([
  {id:'boss-key',name:'Clé du boss',icon:'🗝️',enabled:true},
  {id:'disabled-key',name:'Clé désactivée',enabled:false},
],'boss-key');
assert.equal(keyOptions.includes('Clé du boss'),true);
assert.equal(keyOptions.includes('value="boss-key" selected'),true);
assert.equal(keyOptions.includes('Clé désactivée'),false);
assert.equal(keyOptions.includes('— Aucune clé / objet —'),true);

out=addMarker(layout,createMarker({id:'rock-1',x:4,y:3,kind:'rock'}));
assert.equal(out.ok,true);
layout=out.layout;

assert.equal(validateRoomLayout(layout).valid,true);

const smaller=resizeRoomLayout(layout,{width:3,height:3});
assert.equal(smaller.width,3);
assert.equal(smaller.height,3);
assert.equal(smaller.markers.length,0,'les éléments hors grille doivent être retirés au redimensionnement');
assert.equal(smaller.doors.length,1,'la porte encore dans la grille doit rester');
assert.equal(validateRoomLayout(smaller).valid,true);

console.log('rpg-room-engine.test.mjs: OK');
