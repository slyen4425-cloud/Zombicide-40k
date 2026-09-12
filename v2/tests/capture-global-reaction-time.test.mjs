import assert from 'node:assert/strict';
import {
  advanceCaptureBattleTime,
  createCaptureModeState,
  runCaptureAiStep,
  startCaptureBattle,
  useCaptureBattleAbility,
} from '../src/modes/capture/capture.js';
import {initializeCreatureAbilityState} from '../src/modes/capture/abilities.js';
import {createCaptureDodgeEvaluator} from '../src/modes/capture/dodge-policy.js';
import {resolveCaptureVitalEffect} from '../src/modes/capture/vitals.js';

const playerAbility={id:'player-hit',range:3,chargeMax:4,cooldown:0,effect:{type:'damage',amount:5}};
const aiAbility={id:'wild-hit',range:3,chargeMax:4,cooldown:0,effect:{type:'damage',amount:4}};
const reaction={
  id:'timed-dodge',
  type:'dodge',
  enabled:true,
  negatesEffect:true,
  cooldown:2,
  metadata:{
    dodgePolicy:{chancePercent:100},
    reactionWindow:{opensAt:2,closesAt:4,unit:'tick'},
  },
};
const dodge=createCaptureDodgeEvaluator({rng:()=>0});

function buildState(){
  const player={
    instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20,
    abilityIds:['player-hit'],reactions:[reaction],reactionState:{'timed-dodge':{resource:null,cooldownRemaining:0}},
  };
  let state=createCaptureModeState({activeTeam:[player],roster:[player]});
  state={...state,encounter:{type:'wild',speciesId:'capture_aquafin'}};
  const started=startCaptureBattle(state,{
    opponent:{
      instanceId:'w1',speciesId:'capture_aquafin',wild:true,currentHp:20,maxHp:20,
      abilityIds:['wild-hit'],reactions:[reaction],reactionState:{'timed-dodge':{resource:null,cooldownRemaining:0}},
    },
    opponentPosition:{x:1,y:0,zoneId:'capture-battle'},
  });
  assert.equal(started.ok,true);
  return started.state;
}

{
  let state=buildState();
  let playerAbilityState=initializeCreatureAbilityState(state.activeTeam[0],[playerAbility]);

  const before=useCaptureBattleAbility(state,{abilityDef:playerAbility,abilityState:playerAbilityState,effectResolver:resolveCaptureVitalEffect,reactionResolver:dodge});
  assert.equal(before.ok,true);
  assert.equal(before.reaction.triggered,false);
  assert.equal(before.reaction.reason,'capture-reaction-window-time-required');
  assert.equal(before.state.battle.opponent.vitals.currentHp,15);
  state=before.state;
  playerAbilityState=before.abilityState;

  const advanced=advanceCaptureBattleTime(state,{amount:2});
  assert.equal(advanced.ok,true);
  assert.equal(advanced.reactionTime,2);
  state=advanced.state;

  const open=useCaptureBattleAbility(state,{abilityDef:playerAbility,abilityState:playerAbilityState,effectResolver:resolveCaptureVitalEffect,reactionResolver:dodge});
  assert.equal(open.ok,true);
  assert.equal(open.reaction.triggered,true);
  assert.equal(open.state.battle.opponent.vitals.currentHp,15);
  assert.equal(open.state.battle.opponent.reactionState['timed-dodge'].cooldownRemaining,2);
  state=open.state;
  playerAbilityState=open.abilityState;

  const advancedCooldown=advanceCaptureBattleTime(state,{amount:2});
  assert.equal(advancedCooldown.state.battle.timing.reactionTime,4);
  assert.equal(advancedCooldown.state.battle.opponent.reactionState['timed-dodge'].cooldownRemaining,0);
  state=advancedCooldown.state;

  const edge=useCaptureBattleAbility(state,{abilityDef:playerAbility,abilityState:playerAbilityState,effectResolver:resolveCaptureVitalEffect,reactionResolver:dodge});
  assert.equal(edge.reaction.triggered,true);
  state=edge.state;
  playerAbilityState=edge.abilityState;

  const closedTime=advanceCaptureBattleTime(state,{amount:1});
  assert.equal(closedTime.state.battle.timing.reactionTime,5);
  state=closedTime.state;
  const closed=useCaptureBattleAbility(state,{abilityDef:playerAbility,abilityState:playerAbilityState,effectResolver:resolveCaptureVitalEffect,reactionResolver:dodge});
  assert.equal(closed.ok,true);
  assert.equal(closed.reaction.triggered,false);
  assert.equal(closed.reaction.reason,'capture-reaction-window-closed');
}

{
  let state=buildState();
  const advanced=advanceCaptureBattleTime(state,{amount:2,tickReactionCooldowns:false});
  state=advanced.state;
  const aiAbilityState=initializeCreatureAbilityState(state.battle.opponent.creature,[aiAbility]);
  const ai=runCaptureAiStep(state,{abilityDefs:[aiAbility],abilityState:aiAbilityState,effectResolver:resolveCaptureVitalEffect,reactionResolver:dodge});
  assert.equal(ai.ok,true);
  assert.equal(ai.decision.type,'ability');
  assert.equal(ai.reaction.triggered,true);
  assert.equal(ai.state.battle.player.vitals.currentHp,20);
}

{
  const missing=advanceCaptureBattleTime(createCaptureModeState(),{amount:1});
  assert.equal(missing.ok,false);
  assert.equal(missing.reason,'battle-missing');
}

console.log('capture-global-reaction-time.test.mjs: ok');
