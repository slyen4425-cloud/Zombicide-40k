import assert from 'node:assert/strict';
import { createCombatState } from '../src/modes/rpg/combat-engine.js';
import { createSpatialState,setActorPosition } from '../src/modes/rpg/spatial-engine.js';
import { createRoomLayout,createDoor,addDoor,createWall,addWall } from '../src/modes/rpg/room-engine.js';
import { shortestRoomPathDistance,hasRoomLineOfSight } from '../src/modes/rpg/room-tactical-bridge.js';
import { evaluateAttackPosition,createCombatMovementState,moveCombatActor,resolveEquippedAttackSource } from '../src/modes/rpg/tactical-combat.js';

let room=createRoomLayout({roomId:'corridor',width:3,height:1});
let added=addDoor(room,createDoor({id:'gate',x:0,y:0,edge:'east',state:'closed'}));
assert.equal(added.ok,true); room=added.layout;

const from={x:0,y:0,zoneId:'corridor'},to={x:2,y:0,zoneId:'corridor'};
assert.equal(shortestRoomPathDistance(room,from,to),Infinity);
assert.equal(hasRoomLineOfSight(room,from,to),false);

room.doors[0].state='open';
assert.equal(shortestRoomPathDistance(room,from,to),2);
assert.equal(hasRoomLineOfSight(room,from,to),true);

let wallRoom=createRoomLayout({roomId:'wall-room',width:2,height:1});
added=addWall(wallRoom,createWall({id:'wall',x:0,y:0,edge:'east',blocksMovement:true,blocksVision:true}));
assert.equal(added.ok,true); wallRoom=added.layout;
assert.equal(shortestRoomPathDistance(wallRoom,{x:0,y:0,zoneId:'wall-room'},{x:1,y:0,zoneId:'wall-room'}),Infinity);
assert.equal(hasRoomLineOfSight(wallRoom,{x:0,y:0,zoneId:'wall-room'},{x:1,y:0,zoneId:'wall-room'}),false);

const bow={id:'bow',name:'Arc long',enabled:true,kind:'weapon',data:{attackStyle:'ranged',rangeMin:1,rangeMax:5,requiresLineOfSight:true}};
const sword={id:'sword',name:'Épée',enabled:true,kind:'weapon',data:{attackStyle:'melee',rangeMax:1}};
const inventory={equipment:{'main-hand':{entryId:'bow-entry',itemId:'bow',primarySlot:'main-hand'}},entries:[]};
const definitions={items:[bow,sword]};
assert.equal(resolveEquippedAttackSource(inventory,definitions)?.id,'bow');

let spatial=createSpatialState({zoneId:'corridor'});
spatial=setActorPosition(spatial,'lyra',from);
spatial=setActorPosition(spatial,'skeleton',to);
const combat=createCombatState({combatants:[
  {id:'lyra',side:'heroes',initiative:20,state:{stats:{movement:3}}},
  {id:'skeleton',side:'enemies',initiative:10,state:{}},
]});

room.doors[0].state='closed';
let shot=evaluateAttackPosition({spatial,combat,actorId:'lyra',targetId:'skeleton',source:resolveEquippedAttackSource(inventory,definitions),config:{mode:'tactical',roomLayout:room}});
assert.equal(shot.ok,false);
assert.equal(shot.reason,'target-unreachable');

room.doors[0].state='open';
shot=evaluateAttackPosition({spatial,combat,actorId:'lyra',targetId:'skeleton',source:resolveEquippedAttackSource(inventory,definitions),config:{mode:'tactical',roomLayout:room}});
assert.equal(shot.ok,true);
assert.equal(shot.distance,2);
assert.equal(shot.lineOfSight,true);

let moveState=createCombatMovementState(combat,{mode:'tactical',defaultMovement:3});
room.doors[0].state='closed';
let moved=moveCombatActor({spatial,combat,actorId:'lyra',target:{x:1,y:0,zoneId:'corridor'},moveState,config:{mode:'tactical',roomLayout:room,defaultMovement:3}});
assert.equal(moved.ok,false);
room.doors[0].state='open';
moved=moveCombatActor({spatial,combat,actorId:'lyra',target:{x:1,y:0,zoneId:'corridor'},moveState,config:{mode:'tactical',roomLayout:room,defaultMovement:3}});
assert.equal(moved.ok,true);
assert.equal(moved.distance,1);

console.log('rpg-room-tactical-bridge.test.mjs: ok');
