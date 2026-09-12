import fs from 'node:fs';
import path from 'node:path';
import assert from 'node:assert/strict';
import {
  CAPTURE_RUNTIME_CONTRACT,
  captureStorageKeys,
  createCaptureModeState,
  createCaptureWorldIndex,
  moveCaptureActor,
  setCaptureTeam,
} from '../src/modes/capture/capture.js';
import {
  createWorld,
  createZone,
  createRoom,
  createRoomLink,
} from '../src/core/world-graph.js';

const root=path.resolve(import.meta.dirname,'..');
const source=fs.readFileSync(path.join(root,'src','modes','capture','capture.js'),'utf8');
const rpgSpatial=fs.readFileSync(path.join(root,'src','modes','rpg','spatial-engine.js'),'utf8');

assert.equal(CAPTURE_RUNTIME_CONTRACT.mode,'capture');
assert.equal(CAPTURE_RUNTIME_CONTRACT.isolatedGameplayState,true);
assert.equal(CAPTURE_RUNTIME_CONTRACT.sharedSpatialCore,true);
assert.equal(CAPTURE_RUNTIME_CONTRACT.sharedWorldGraphCore,true);
assert.equal(CAPTURE_RUNTIME_CONTRACT.usesRpgTurnRuntime,false);
assert.equal(CAPTURE_RUNTIME_CONTRACT.usesRpgTimeline,false);
assert.equal(CAPTURE_RUNTIME_CONTRACT.combatModel,'dynamic_dedicated_target');

assert.ok(!source.includes("../rpg/"),'Capture must not import RPG mode files');
assert.ok(!source.includes('/modes/rpg/'),'Capture must not import RPG runtime');
assert.ok(!source.includes('turn-runtime'),'Capture must not depend on RPG turn runtime');
assert.ok(!source.includes('turnSequence:'),'Capture runtime must not create an RPG turn sequence');
assert.equal(rpgSpatial.trim(),"export * from '../../core/spatial-engine.js';",'RPG and Capture must share neutral spatial core');

for(const key of [
  captureStorageKeys.profile('p1'),
  captureStorageKeys.save('s1'),
  captureStorageKeys.roster('u1'),
  captureStorageKeys.team('u1'),
  captureStorageKeys.reserve('u1'),
]){
  assert.match(key,/^gensrpg:v2:capture:/);
  assert.ok(!key.includes(':rpg:'));
}

const world=createWorld({id:'w1',name:'Capture World',startRoomId:'r1'});
const zone=createZone({id:'z1',name:'Plaine',roomIds:['r1','r2']});
const room1=createRoom({id:'r1',zoneId:'z1',name:'Prairie'});
const room2=createRoom({id:'r2',zoneId:'z1',name:'Bosquet'});
const link=createRoomLink({id:'l1',fromRoomId:'r1',toRoomId:'r2'});
const built=createCaptureWorldIndex({world,zones:[zone],rooms:[room1,room2],links:[link]});
assert.equal(built.validation.valid,true);
assert.equal(built.index.rooms.r2.name,'Bosquet');

let state=createCaptureModeState({profileId:'p1',playerId:'u1',zoneId:'z1',actorId:'trainer',actorPosition:{x:0,y:0,zoneId:'z1'}});
assert.equal(state.mode,'capture');
assert.equal(state.exploration.freeMovement,true);
assert.equal(state.exploration.turnSequence,null);
assert.equal(state.battle,null);

const moved=moveCaptureActor(state,{x:3,y:0,zoneId:'z1'},{movement:3});
assert.equal(moved.moved,true);
state=moved.state;
assert.deepEqual(state.spatial.positions.trainer,{x:3,y:0,zoneId:'z1'});

state=setCaptureTeam(state,{activeTeam:['a','b','c','d','e','f'],reserve:['g','h']});
assert.equal(state.activeTeam.length,6);
assert.equal(state.reserve.length,2);
assert.throws(()=>setCaptureTeam(state,{activeTeam:['1','2','3','4','5','6','7']}),/capture-active-team-limit/);

console.log('capture-runtime-scaffold.test.mjs: ok');
