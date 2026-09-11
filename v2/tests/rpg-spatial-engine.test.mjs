import assert from 'node:assert/strict';
import { createSpatialState,setBlockedCells,setActorPosition,shortestPathDistance,moveActor,combatParticipants } from '../src/modes/rpg/spatial-engine.js';

let spatial=createSpatialState();
spatial=setActorPosition(spatial,'h1',{x:0,y:0,zoneId:'room-a'});
spatial=setActorPosition(spatial,'h2',{x:2,y:0,zoneId:'room-a'});
spatial=setActorPosition(spatial,'h3',{x:8,y:0,zoneId:'room-a'});
spatial=setActorPosition(spatial,'h4',{x:0,y:0,zoneId:'room-b'});

assert.equal(shortestPathDistance(spatial,spatial.positions.h1,spatial.positions.h2),2);
assert.deepEqual(combatParticipants(spatial,'h1',['h1','h2','h3','h4'],{combatAssistRange:3,requireSameZone:true}),['h1','h2']);

const moved=moveActor(spatial,'h1',{x:3,y:0,zoneId:'room-a'},{defaultMovement:3,actor:{state:{stats:{}}}});
assert.equal(moved.moved,true);
assert.equal(moved.distance,3);
const tooFar=moveActor(spatial,'h1',{x:4,y:0,zoneId:'room-a'},{defaultMovement:3,actor:{state:{stats:{}}}});
assert.equal(tooFar.moved,false);

spatial=setBlockedCells(spatial,[{x:1,y:0},{x:1,y:1},{x:1,y:-1}]);
assert.equal(shortestPathDistance(spatial,{x:0,y:0,zoneId:'room-a'},{x:2,y:0,zoneId:'room-a'},{maxDistance:3}),Infinity);
assert.equal(shortestPathDistance(spatial,{x:0,y:0,zoneId:'room-a'},{x:2,y:0,zoneId:'room-a'},{maxDistance:10}),6);

const statMove=moveActor(createSpatialState({positions:{h1:{x:0,y:0,zoneId:'z'}}}),'h1',{x:5,y:0,zoneId:'z'},{movementStatId:'move',defaultMovement:2,actor:{state:{stats:{move:5}}}});
assert.equal(statMove.moved,true);
assert.equal(statMove.allowance,5);

console.log('rpg-spatial-engine.test.mjs: OK');
