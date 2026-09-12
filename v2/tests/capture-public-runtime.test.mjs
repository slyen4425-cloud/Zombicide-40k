import assert from 'node:assert/strict';
import * as captureRuntime from '../src/modes/capture/runtime.js';

assert.equal(captureRuntime.CAPTURE_PUBLIC_RUNTIME_CONTRACT.canonicalEntry,'capture/runtime.js');
assert.equal(captureRuntime.CAPTURE_PUBLIC_RUNTIME_CONTRACT.canonicalTimeAdvance,'advanceCaptureTime');
assert.equal(captureRuntime.CAPTURE_PUBLIC_RUNTIME_CONTRACT.legacyTimingHelpers,'internal_or_regression_only');
assert.equal(typeof captureRuntime.advanceCaptureTime,'function');
assert.equal('advanceCaptureBattleTime' in captureRuntime,false);
assert.equal('tickCaptureBattleReactionCooldowns' in captureRuntime,false);

const player={
  instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20,
  reactionState:{dodge:{resource:null,cooldownRemaining:2}},
};
let state=captureRuntime.createCaptureModeState({activeTeam:[player],roster:[player]});
state={...state,encounter:{type:'wild',speciesId:'capture_aquafin'}};
const started=captureRuntime.startCaptureBattle(state,{
  opponent:{instanceId:'w1',speciesId:'capture_aquafin',wild:true,currentHp:10,maxHp:10,reactionState:{dodge:{resource:null,cooldownRemaining:2}}},
  opponentPosition:{x:1,y:0,zoneId:'capture-battle'},
});
assert.equal(started.ok,true);
state=started.state;
state.battle.opponent.statuses=[{
  id:'burn',name:'Burn',duration:2,remainingDuration:2,stacks:1,stackMode:'refresh',maxStacks:1,
  effects:[{type:'damage',amount:2}],source:'capture',
}];

const advanced=captureRuntime.advanceCaptureTime(state,{amount:1});
assert.equal(advanced.ok,true);
assert.equal(advanced.reactionTime,1);
assert.equal(advanced.state.battle.player.reactionState.dodge.cooldownRemaining,1);
assert.equal(advanced.state.battle.opponent.reactionState.dodge.cooldownRemaining,1);
assert.equal(advanced.state.battle.opponent.vitals.currentHp,8);
assert.equal(advanced.state.battle.opponent.statuses[0].remainingDuration,1);

console.log('capture-public-runtime.test.mjs: ok');
