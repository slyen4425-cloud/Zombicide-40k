import assert from 'node:assert/strict';
import {
  createCaptureModeState,
  runCaptureAiStep,
  startCaptureBattle,
  useCaptureBattleAbility,
} from '../src/modes/capture/capture.js';
import {initializeCreatureAbilityState} from '../src/modes/capture/abilities.js';
import {resolveCaptureVitalEffect} from '../src/modes/capture/vitals.js';

const playerAbility={id:'player-hit',range:3,chargeMax:2,cooldown:0,effect:{type:'damage',amount:6}};
const aiAbility={id:'wild-hit',range:3,chargeMax:2,cooldown:0,effect:{type:'damage',amount:5}};

function baseState(player){
  const initial=createCaptureModeState({activeTeam:[player],roster:[player]});
  const withEncounter={...initial,encounter:{type:'wild',speciesId:'capture_aquafin'}};
  const started=startCaptureBattle(withEncounter,{
    opponent:{
      instanceId:'wild-1',
      speciesId:'capture_aquafin',
      wild:true,
      currentHp:20,
      maxHp:20,
      abilityIds:['wild-hit'],
      reactions:[{id:'wild-dodge',type:'dodge',enabled:true,negatesEffect:true}],
    },
  });
  assert.equal(started.ok,true);
  return started.state;
}

{
  const player={instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20,abilityIds:['player-hit']};
  const state=baseState(player);
  const abilityState=initializeCreatureAbilityState(player,[playerAbility]);
  const result=useCaptureBattleAbility(state,{
    abilityDef:playerAbility,
    abilityState,
    effectResolver:resolveCaptureVitalEffect,
    reactionResolver:({reaction})=>({ok:true,triggered:reaction.id==='wild-dodge',outcome:{source:'global-player-path'}}),
  });
  assert.equal(result.ok,true);
  assert.equal(result.reaction.triggered,true);
  assert.equal(result.state.battle.opponent.vitals.currentHp,20);
  assert.equal(result.abilityState['player-hit'].charges,1);
}

{
  const player={
    instanceId:'p1',
    speciesId:'capture_braiseau',
    currentHp:20,
    maxHp:20,
    abilityIds:['player-hit'],
    reactions:[{id:'player-dodge',type:'dodge',enabled:true,negatesEffect:true}],
  };
  const state=baseState(player);
  const opponentCreature=state.battle.opponent.creature;
  const abilityState=initializeCreatureAbilityState(opponentCreature,[aiAbility]);
  const result=runCaptureAiStep(state,{
    abilityDefs:[aiAbility],
    abilityState,
    effectResolver:resolveCaptureVitalEffect,
    reactionResolver:({reaction})=>({ok:true,triggered:reaction.id==='player-dodge',outcome:{source:'global-ai-path'}}),
  });
  assert.equal(result.ok,true);
  assert.equal(result.decision.type,'ability');
  assert.equal(result.reaction.triggered,true);
  assert.equal(result.state.battle.player.vitals.currentHp,20);
  assert.equal(result.abilityState['wild-hit'].charges,1);
}

{
  const player={instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20,abilityIds:['player-hit']};
  const state=baseState(player);
  const abilityState=initializeCreatureAbilityState(player,[playerAbility]);
  const result=useCaptureBattleAbility(state,{
    abilityDef:playerAbility,
    abilityState,
    effectResolver:resolveCaptureVitalEffect,
  });
  assert.equal(result.ok,true);
  assert.equal(result.reaction.triggered,false);
  assert.equal(result.reaction.reason,'capture-reaction-evaluator-missing');
  assert.equal(result.state.battle.opponent.vitals.currentHp,14);
}

console.log('capture-global-reactions.test.mjs: ok');
