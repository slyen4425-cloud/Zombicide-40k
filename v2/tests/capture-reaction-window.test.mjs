import assert from 'node:assert/strict';
import {createCaptureBattleState,resolveCaptureAbilityAction} from '../src/modes/capture/dynamic-combat.js';
import {initializeCreatureAbilityState} from '../src/modes/capture/abilities.js';
import {resolveCaptureVitalEffect} from '../src/modes/capture/vitals.js';
import {createCaptureDodgeEvaluator} from '../src/modes/capture/dodge-policy.js';
import {evaluateCaptureReactionWindow,normalizeCaptureReactionWindow} from '../src/modes/capture/reaction-window.js';
import {setCaptureBattleReactionTime} from '../src/modes/capture/battle-timing.js';

const windowDef={opensAt:2,closesAt:4,unit:'abstract_tick'};
{
  const normalized=normalizeCaptureReactionWindow(windowDef);
  assert.equal(normalized.opensAt,2);
  assert.equal(normalized.closesAt,4);
  assert.equal(evaluateCaptureReactionWindow(windowDef,1).open,false);
  assert.equal(evaluateCaptureReactionWindow(windowDef,3).open,true);
  assert.equal(evaluateCaptureReactionWindow(windowDef,5).reason,'capture-reaction-window-closed');
  assert.equal(evaluateCaptureReactionWindow(windowDef,null).reason,'capture-reaction-window-time-required');
  assert.equal(evaluateCaptureReactionWindow({},null).open,true);
}

const team=[{instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20,abilityIds:['hit']}];
const encounter={type:'wild',speciesId:'capture_aquafin'};
const opponent={
  instanceId:'w1',speciesId:'capture_aquafin',wild:true,currentHp:20,maxHp:20,
  reactions:[{id:'dodge-window',type:'dodge',negatesEffect:true,cost:1,cooldown:2,window:windowDef,metadata:{dodgePolicy:{chancePercent:100}}}],
  reactionState:{'dodge-window':{resource:2,cooldownRemaining:0}},
};
const ability={id:'hit',range:3,chargeMax:3,cooldown:0,effect:{type:'damage',amount:6}};
const dodge=createCaptureDodgeEvaluator({rng:()=>0});

function runAt(reactionTime){
  const base=createCaptureBattleState({encounter,activeTeam:team,opponent,opponentPosition:{x:1,y:0,zoneId:'capture-battle'}});
  const timed=setCaptureBattleReactionTime(base,reactionTime);
  assert.equal(timed.ok,true);
  const abilityState=initializeCreatureAbilityState(team[0],[ability]);
  return resolveCaptureAbilityAction({battle:timed.battle,abilityDef:ability,abilityState,activeTeam:team,reactionResolver:dodge,effectResolver:resolveCaptureVitalEffect});
}

{
  const before=runAt(1);
  assert.equal(before.ok,true);
  assert.equal(before.reaction.triggered,false);
  assert.equal(before.reaction.reason,'capture-reaction-window-not-open');
  assert.equal(before.battle.opponent.vitals.currentHp,14);
  assert.equal(before.battle.opponent.reactionState['dodge-window'].resource,2);
  assert.equal(before.battle.opponent.reactionState['dodge-window'].cooldownRemaining,0);
}

{
  const open=runAt(3);
  assert.equal(open.ok,true);
  assert.equal(open.reaction.triggered,true);
  assert.equal(open.reaction.reactionWindow.open,true);
  assert.equal(open.battle.opponent.vitals.currentHp,20);
  assert.equal(open.battle.opponent.reactionState['dodge-window'].resource,1);
  assert.equal(open.battle.opponent.reactionState['dodge-window'].cooldownRemaining,2);
}

{
  const after=runAt(5);
  assert.equal(after.ok,true);
  assert.equal(after.reaction.triggered,false);
  assert.equal(after.reaction.reason,'capture-reaction-window-closed');
  assert.equal(after.battle.opponent.vitals.currentHp,14);
  assert.equal(after.battle.opponent.reactionState['dodge-window'].resource,2);
}

console.log('capture-reaction-window.test.mjs: ok');
