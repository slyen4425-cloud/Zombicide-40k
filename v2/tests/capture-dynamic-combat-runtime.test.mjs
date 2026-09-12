import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAPTURE_DYNAMIC_COMBAT_RUNTIME,
  captureBattleDistance,
  createCaptureBattleState,
  endCaptureBattle,
  isCaptureTargetInRange,
  moveCaptureBattleActor,
  switchCaptureActiveCreature,
} from '../src/modes/capture/dynamic-combat.js';
import {
  createCaptureModeState,
  finishCaptureBattle,
  moveCaptureBattleCreature,
  startCaptureBattle,
  switchCaptureBattleCreature,
} from '../src/modes/capture/capture.js';

assert.equal(CAPTURE_DYNAMIC_COMBAT_RUNTIME.usesRpgTurnRuntime,false);
assert.equal(CAPTURE_DYNAMIC_COMBAT_RUNTIME.usesTurnSequence,false);
assert.equal(CAPTURE_DYNAMIC_COMBAT_RUNTIME.usesD100Timeline,false);
assert.equal(CAPTURE_DYNAMIC_COMBAT_RUNTIME.exactRealtimeTiming,'future_design_not_frozen');

const source=fs.readFileSync(new URL('../src/modes/capture/dynamic-combat.js',import.meta.url),'utf8');
assert.equal(source.includes('/modes/rpg/'),false);
assert.equal(source.includes('../rpg/'),false);
assert.equal(source.includes('turn-runtime'),false);

const team=[
  {instanceId:'owned-1',speciesId:'capture_braiseau',level:4,hp:12},
  {instanceId:'owned-2',speciesId:'capture_aquafin',level:3,hp:15},
];
const encounter={type:'wild',speciesId:'capture_moussado',status:'spotted'};

const battle=createCaptureBattleState({
  encounter,
  activeTeam:team,
  playerActiveInstanceId:'owned-1',
  playerPosition:{x:0,y:0,zoneId:'arena'},
  opponentPosition:{x:3,y:0,zoneId:'arena'},
  zoneId:'arena',
});
assert.equal(battle.runtime,'capture_dynamic');
assert.equal(battle.player.activeInstanceId,'owned-1');
assert.equal(battle.opponent.creature.speciesId,'capture_moussado');
assert.equal(captureBattleDistance(battle),3);
assert.deepEqual(isCaptureTargetInRange(battle,2),{ok:false,distance:3,range:2});
assert.deepEqual(isCaptureTargetInRange(battle,3),{ok:true,distance:3,range:3});

const moved=moveCaptureBattleActor(battle,'player',{x:1,y:0,zoneId:'arena'},{movement:1});
assert.equal(moved.ok,true);
assert.equal(captureBattleDistance(moved.battle),2);

const tooFar=moveCaptureBattleActor(battle,'player',{x:2,y:0,zoneId:'arena'},{movement:1});
assert.equal(tooFar.ok,false);
assert.equal(tooFar.reason,'out-of-range');

const switched=switchCaptureActiveCreature(moved.battle,team,'owned-2');
assert.equal(switched.ok,true);
assert.equal(switched.battle.player.activeInstanceId,'owned-2');
assert.equal(captureBattleDistance(switched.battle),2);
assert.equal(switched.battle.spatial.positions['player:owned-1'],undefined);
assert.deepEqual(switched.battle.spatial.positions['player:owned-2'],{x:1,y:0,zoneId:'arena'});
assert.equal(team[0].instanceId,'owned-1');
assert.equal(team[1].instanceId,'owned-2');

const invalidSwitch=switchCaptureActiveCreature(switched.battle,team,'reserve-only');
assert.equal(invalidSwitch.ok,false);
assert.equal(invalidSwitch.reason,'capture-active-creature-not-in-team');

for(const reason of ['opponent_ko','capture_success','flee','player_team_unavailable']){
  const ended=endCaptureBattle(battle,reason);
  assert.equal(ended.ok,true);
  assert.equal(ended.battle.status,'ended');
  assert.equal(ended.battle.endReason,reason);
}
assert.equal(endCaptureBattle(battle,'legacy_turn_end').ok,false);

let state=createCaptureModeState({activeTeam:team});
state={...state,encounter};
const started=startCaptureBattle(state,{playerActiveInstanceId:'owned-1',zoneId:'arena',playerPosition:{x:0,y:0,zoneId:'arena'},opponentPosition:{x:3,y:0,zoneId:'arena'}});
assert.equal(started.ok,true);
assert.equal(started.state.exploration.freeMovement,false);
assert.equal(started.state.encounter.speciesId,'capture_moussado');
assert.equal(started.state.battle.runtime,'capture_dynamic');

const movedState=moveCaptureBattleCreature(started.state,'player',{x:1,y:0,zoneId:'arena'},{movement:1});
assert.equal(movedState.ok,true);
const switchedState=switchCaptureBattleCreature(movedState.state,'owned-2');
assert.equal(switchedState.ok,true);
assert.equal(switchedState.state.battle.player.activeInstanceId,'owned-2');

const finished=finishCaptureBattle(switchedState.state,'capture_success');
assert.equal(finished.ok,true);
assert.equal(finished.state.battle,null);
assert.equal(finished.state.encounter,null);
assert.equal(finished.state.exploration.freeMovement,true);

const noEncounter=startCaptureBattle(createCaptureModeState({activeTeam:team}),{playerActiveInstanceId:'owned-1'});
assert.equal(noEncounter.ok,false);
assert.equal(noEncounter.reason,'capture-battle-encounter-required');

console.log('capture dynamic combat runtime: ok');
