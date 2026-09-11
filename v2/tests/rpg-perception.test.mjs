import assert from 'node:assert/strict';
import { createSpatialState, setActorPosition, setBlockedCells } from '../src/modes/rpg/spatial-engine.js';
import { canDetectActor } from '../src/modes/rpg/perception-engine.js';

let spatial=createSpatialState({zoneId:'room-a'});
spatial=setActorPosition(spatial,'guard',{x:0,y:0,zoneId:'room-a'});
spatial=setActorPosition(spatial,'rogue',{x:2,y:0,zoneId:'room-a'});
const actors={guard:{state:{stats:{vision:6}}},rogue:{state:{stats:{stealth:3}}}};
let result=canDetectActor(spatial,'guard','rogue',actors,{visionStatId:'vision',stealthStatId:'stealth',distancePenaltyPerUnit:1});
assert.equal(result.detected,true);
assert.equal(result.distance,2);

actors.rogue.state.stats.stealth=5;
result=canDetectActor(spatial,'guard','rogue',actors,{visionStatId:'vision',stealthStatId:'stealth',distancePenaltyPerUnit:1});
assert.equal(result.detected,false);
assert.equal(result.reason,'stealth-wins');

spatial=setActorPosition(spatial,'rogue',{x:2,y:0,zoneId:'room-b'});
result=canDetectActor(spatial,'guard','rogue',actors,{visionStatId:'vision',stealthStatId:'stealth',requireSameZone:true});
assert.equal(result.detected,false);
assert.equal(result.reason,'different-zone');

spatial=setActorPosition(spatial,'rogue',{x:2,y:0,zoneId:'room-a'});
spatial=setBlockedCells(spatial,[{x:1,y:0}]);
result=canDetectActor(spatial,'guard','rogue',actors,{visionStatId:'vision',stealthStatId:'stealth',distancePenaltyPerUnit:0});
assert.equal(Number.isFinite(result.distance),true);
assert.equal(result.distance,4);

spatial=setBlockedCells(spatial,[]);
actors.rogue.state.stats.stealth=0;
const wallLayout={
  width:3,height:1,cells:{},doors:[],
  walls:[{x:0,y:0,edge:'east',blocksMovement:true,blocksVision:true}],
};
result=canDetectActor(spatial,'guard','rogue',actors,{
  visionStatId:'vision',stealthStatId:'stealth',distancePenaltyPerUnit:0,
  blockedLineOfSightStopsDetection:true,roomLayout:wallLayout,
});
assert.equal(result.detected,false);
assert.equal(result.reason,'line-of-sight-blocked');

const openSightLayout={...wallLayout,walls:[{x:0,y:0,edge:'east',blocksMovement:true,blocksVision:false}]};
result=canDetectActor(spatial,'guard','rogue',actors,{
  visionStatId:'vision',stealthStatId:'stealth',distancePenaltyPerUnit:0,
  blockedLineOfSightStopsDetection:true,roomLayout:openSightLayout,
});
assert.equal(result.detected,true);
assert.equal(result.reason,'detected');

console.log('rpg-perception.test.mjs: OK');
