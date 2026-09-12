import assert from 'node:assert/strict';
import {
  createCaptureModeState,
  runCaptureAiStep,
  startCaptureBattle,
  tickCaptureBattleReactionCooldowns,
} from '../src/modes/capture/capture.js';
import {initializeCreatureAbilityState} from '../src/modes/capture/abilities.js';
import {createCaptureDodgeEvaluator} from '../src/modes/capture/dodge-policy.js';
import {resolveCaptureVitalEffect} from '../src/modes/capture/vitals.js';
import {
  canUseCaptureReactionState,
  spendCaptureReactionState,
  tickCaptureReactionStateMap,
} from '../src/modes/capture/reaction-state.js';

const reaction={
  id:'player-dodge',
  type:'dodge',
  enabled:true,
  negatesEffect:true,
  cost:1,
  cooldown:2,
  metadata:{dodgePolicy:{chancePercent:100}},
};

{
  const usable=canUseCaptureReactionState({resource:2,cooldownRemaining:0},reaction);
  assert.equal(usable.ok,true);
  const spent=spendCaptureReactionState(usable.state,reaction);
  assert.deepEqual(spent.state,{resource:1,cooldownRemaining:2});
  assert.equal(canUseCaptureReactionState(spent.state,reaction).reason,'capture-reaction-cooldown');
  const ticked=tickCaptureReactionStateMap({'player-dodge':spent.state},2);
  assert.deepEqual(ticked['player-dodge'],{resource:1,cooldownRemaining:0});
}

const p1={
  instanceId:'p1',
  speciesId:'capture_braiseau',
  currentHp:20,
  maxHp:20,
  reactions:[reaction],
  reactionState:{'player-dodge':{resource:2,cooldownRemaining:0}},
};
const p2={
  instanceId:'p2',
  speciesId:'capture_voltige',
  currentHp:20,
  maxHp:20,
  reactions:[reaction],
  reactionState:{'player-dodge':{resource:7,cooldownRemaining:0}},
};
const aiAbility={id:'wild-hit',range:3,chargeMax:4,cooldown:0,effect:{type:'damage',amount:5}};

let state=createCaptureModeState({activeTeam:[p1,p2],roster:[p1,p2]});
state={...state,encounter:{type:'wild',speciesId:'capture_aquafin'}};
const started=startCaptureBattle(state,{
  opponent:{instanceId:'wild-1',speciesId:'capture_aquafin',wild:true,currentHp:20,maxHp:20,abilityIds:['wild-hit']},
  opponentPosition:{x:1,y:0,zoneId:'capture-battle'},
});
assert.equal(started.ok,true);
state=started.state;
let abilityState=initializeCreatureAbilityState(state.battle.opponent.creature,[aiAbility]);
const dodgeEvaluator=createCaptureDodgeEvaluator({rng:()=>0});

const first=runCaptureAiStep(state,{
  abilityDefs:[aiAbility],
  abilityState,
  effectResolver:resolveCaptureVitalEffect,
  reactionResolver:dodgeEvaluator,
});
assert.equal(first.ok,true);
assert.equal(first.reaction.triggered,true);
assert.equal(first.state.battle.player.vitals.currentHp,20);
assert.deepEqual(first.state.battle.player.reactionState['player-dodge'],{resource:1,cooldownRemaining:2});
assert.deepEqual(first.state.activeTeam[0].reactionState['player-dodge'],{resource:1,cooldownRemaining:2});
assert.deepEqual(first.state.activeTeam[1].reactionState['player-dodge'],{resource:7,cooldownRemaining:0});
state=first.state;
abilityState=first.abilityState;

const blocked=runCaptureAiStep(state,{
  abilityDefs:[aiAbility],
  abilityState,
  effectResolver:resolveCaptureVitalEffect,
  reactionResolver:dodgeEvaluator,
});
assert.equal(blocked.ok,true);
assert.equal(blocked.reaction.triggered,false);
assert.equal(blocked.reaction.reason,'capture-reaction-cooldown');
assert.equal(blocked.state.battle.player.vitals.currentHp,15);
state=blocked.state;
abilityState=blocked.abilityState;

const cooled=tickCaptureBattleReactionCooldowns(state,{amount:2});
assert.equal(cooled.ok,true);
assert.deepEqual(cooled.state.activeTeam[0].reactionState['player-dodge'],{resource:1,cooldownRemaining:0});
assert.deepEqual(cooled.state.activeTeam[1].reactionState['player-dodge'],{resource:7,cooldownRemaining:0});
state=cooled.state;

const second=runCaptureAiStep(state,{
  abilityDefs:[aiAbility],
  abilityState,
  effectResolver:resolveCaptureVitalEffect,
  reactionResolver:dodgeEvaluator,
});
assert.equal(second.ok,true);
assert.equal(second.reaction.triggered,true);
assert.equal(second.state.battle.player.vitals.currentHp,15);
assert.deepEqual(second.state.activeTeam[0].reactionState['player-dodge'],{resource:0,cooldownRemaining:2});

console.log('capture-reaction-state.test.mjs: ok');
