import assert from 'node:assert/strict';
import {
  CAPTURE_PLAYER_MOVE_ACTION_CONTRACT,
  createCaptureModeState,
  executeCapturePlayerMove,
  startCaptureBattle,
} from '../src/modes/capture/runtime.js';
import {getActorPosition,setBlockedCells} from '../src/core/spatial-engine.js';

assert.equal(CAPTURE_PLAYER_MOVE_ACTION_CONTRACT.usesAuthoritativeBattleMove,true);
assert.equal(CAPTURE_PLAYER_MOVE_ACTION_CONTRACT.cardinalStepOnly,true);
assert.equal(CAPTURE_PLAYER_MOVE_ACTION_CONTRACT.oneCellPerCommand,true);
assert.equal(CAPTURE_PLAYER_MOVE_ACTION_CONTRACT.diagonal,false);
assert.equal(CAPTURE_PLAYER_MOVE_ACTION_CONTRACT.neverUsesRpgRuntime,true);

const player={instanceId:'p1',speciesId:'capture_braiseau',currentHp:12,maxHp:12};
let state=createCaptureModeState({activeTeam:[player],roster:[player]});
state={...state,encounter:{type:'wild',speciesId:'capture_aquafin'}};
let started=startCaptureBattle(state,{
  opponent:{instanceId:'w1',speciesId:'capture_aquafin',wild:true,currentHp:10,maxHp:10},
  playerPosition:{x:1,y:1,zoneId:'capture-battle'},
  opponentPosition:{x:4,y:1,zoneId:'capture-battle'},
});
assert.equal(started.ok,true);
state=started.state;

const sourceBefore=structuredClone(state);
const movedRight=executeCapturePlayerMove(state,{direction:'right'});
assert.equal(movedRight.ok,true);
assert.deepEqual(movedRight.from,{x:1,y:1,zoneId:'capture-battle'});
assert.deepEqual(movedRight.to,{x:2,y:1,zoneId:'capture-battle'});
assert.deepEqual(getActorPosition(movedRight.state.battle.spatial,movedRight.state.battle.player.actorId),{x:2,y:1,zoneId:'capture-battle'});
assert.deepEqual(state,sourceBefore);

const movedUp=executeCapturePlayerMove(movedRight.state,{direction:'up'});
assert.equal(movedUp.ok,true);
assert.deepEqual(getActorPosition(movedUp.state.battle.spatial,movedUp.state.battle.player.actorId),{x:2,y:0,zoneId:'capture-battle'});

const invalid=executeCapturePlayerMove(state,{direction:'north-east'});
assert.equal(invalid.ok,false);
assert.equal(invalid.reason,'capture-move-direction-invalid');

let blockedState=structuredClone(state);
blockedState.battle.spatial=setBlockedCells(blockedState.battle.spatial,[{x:2,y:1}]);
const blocked=executeCapturePlayerMove(blockedState,{direction:'right'});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'out-of-range');
assert.deepEqual(getActorPosition(blocked.state.battle.spatial,blocked.state.battle.player.actorId),{x:1,y:1,zoneId:'capture-battle'});

let koState=structuredClone(state);
koState.battle.player.vitals.currentHp=0;
koState.battle.player.vitals.ko=true;
const ko=executeCapturePlayerMove(koState,{direction:'left'});
assert.equal(ko.ok,false);
assert.equal(ko.reason,'capture-actor-ko');

const noBattle=executeCapturePlayerMove(createCaptureModeState(),{direction:'left'});
assert.equal(noBattle.ok,false);
assert.equal(noBattle.reason,'battle-missing');

const runtimeSource=await import('node:fs/promises').then(fs=>fs.readFile(new URL('../src/modes/capture/player-move-action.js',import.meta.url),'utf8'));
assert.equal(runtimeSource.includes('../rpg/'),false);
assert.equal(runtimeSource.includes('Math.random('),false);
assert.equal(runtimeSource.includes('moveCaptureBattleCreature(state,\'player\''),true);
assert.equal(runtimeSource.includes('movement:1'),true);
assert.equal(runtimeSource.includes('diagonal:false'),true);

console.log('capture-player-move-action.test.mjs: ok');
