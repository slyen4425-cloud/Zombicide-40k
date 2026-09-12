import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAPTURE_PUBLIC_RUNTIME_CONTRACT,
  CAPTURE_UI_SPATIAL_SUMMARY_CONTRACT,
  buildCaptureSpatialSummary,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_PUBLIC_RUNTIME_CONTRACT.canonicalUiSpatialSummary,true);
assert.equal(CAPTURE_UI_SPATIAL_SUMMARY_CONTRACT.presentationOnly,true);
assert.equal(CAPTURE_UI_SPATIAL_SUMMARY_CONTRACT.readsAuthoritativeBattleSpatial,true);
assert.equal(CAPTURE_UI_SPATIAL_SUMMARY_CONTRACT.computesDistanceWithSharedSpatialCore,true);
assert.equal(CAPTURE_UI_SPATIAL_SUMMARY_CONTRACT.mutatesBattle,false);
assert.equal(CAPTURE_UI_SPATIAL_SUMMARY_CONTRACT.mutatesGameplayState,false);
assert.equal(CAPTURE_UI_SPATIAL_SUMMARY_CONTRACT.derivesAbilityRangeRules,false);
assert.equal(CAPTURE_UI_SPATIAL_SUMMARY_CONTRACT.isolatedFromRpg,true);

const state={battle:{status:'active',player:{actorId:'player:p1'},opponent:{actorId:'opponent:w1'},spatial:{zoneId:'capture-battle',positions:{'player:p1':{x:0,y:0,zoneId:'capture-battle'},'opponent:w1':{x:3,y:0,zoneId:'capture-battle'}},blocked:[]}}};
const before=structuredClone(state);
assert.deepEqual(buildCaptureSpatialSummary(state),{
  playerPosition:{x:0,y:0,zoneId:'capture-battle'},
  opponentPosition:{x:3,y:0,zoneId:'capture-battle'},
  distance:3,
  distanceLabel:'3',
  diagonal:false,
});
assert.deepEqual(state,before);

const detour=structuredClone(state);
detour.battle.spatial.blocked=['1,0','2,0'];
assert.equal(buildCaptureSpatialSummary(detour).distance,5);

const inaccessible=structuredClone(state);
inaccessible.battle.spatial.blocked=['1,0','-1,0','0,1','0,-1'];
assert.deepEqual(buildCaptureSpatialSummary(inaccessible),{
  playerPosition:{x:0,y:0,zoneId:'capture-battle'},
  opponentPosition:{x:3,y:0,zoneId:'capture-battle'},
  distance:null,
  distanceLabel:'inaccessible',
  diagonal:false,
});

assert.equal(buildCaptureSpatialSummary({battle:null}),null);
assert.equal(buildCaptureSpatialSummary({battle:{status:'ended'}}),null);

const source=fs.readFileSync(new URL('../src/modes/capture/ui-spatial-summary.js',import.meta.url),'utf8');
assert.match(source,/shortestPathDistance/);
for(const forbidden of ['moveActor(','setActorPosition(','moveCaptureBattleCreature','useCaptureBattleAbility','attemptCaptureInBattle','../rpg/','Math.random(','Date.now(']) assert.equal(source.includes(forbidden),false,`spatial summary must not include ${forbidden}`);

console.log('capture-ui-spatial-summary.test.mjs: ok');
