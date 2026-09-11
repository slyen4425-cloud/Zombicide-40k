import assert from 'node:assert/strict';
import { createWall } from '../src/modes/rpg/room-engine.js';
import { obstacleKindOptions, obstaclePlacementConfig } from '../src/modes/rpg/room-editor.js';

const low=obstaclePlacementConfig({kind:'low-wall',blocksMovement:true,blocksVision:false,coverModifier:-15});
assert.deepEqual(low,{kind:'low-wall',blocksMovement:true,blocksVision:false,coverModifier:-15});

const wall=createWall({id:'cover-edge',x:2,y:1,edge:'west',...low});
assert.equal(wall.kind,'low-wall');
assert.equal(wall.blocksMovement,true);
assert.equal(wall.blocksVision,false);
assert.equal(wall.coverModifier,-15);

const invalid=obstaclePlacementConfig({kind:'barricade',blocksMovement:false,blocksVision:false,coverModifier:'nope'});
assert.equal(invalid.coverModifier,0,'invalid cover values must be normalized');
assert.equal(invalid.kind,'barricade');

const html=obstacleKindOptions('low-wall');
assert.match(html,/Mur plein/);
assert.match(html,/Muret/);
assert.match(html,/Barricade/);
assert.match(html,/Barrière/);
assert.match(html,/value="low-wall" selected/);
assert.doesNotMatch(html,/id technique/i);

console.log('rpg-room-obstacle-editor.test.mjs: OK');
