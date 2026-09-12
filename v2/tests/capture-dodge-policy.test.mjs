import assert from 'node:assert/strict';
import {createCaptureDodgeEvaluator,normalizeCaptureDodgePolicy} from '../src/modes/capture/dodge-policy.js';
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

{
  const normalized=normalizeCaptureDodgePolicy({chancePercent:35,tags:['agile']});
  assert.equal(normalized.chancePercent,35);
  assert.deepEqual(normalized.tags,['agile']);
  assert.equal(normalizeCaptureDodgePolicy({}).chancePercent,null);
}

{
  const evaluator=createCaptureDodgeEvaluator({rng:()=>0.2});
  const reaction={type:'dodge',metadata:{dodgePolicy:{chancePercent:35}}};
  const result=evaluator({reaction});
  assert.equal(result.ok,true);
  assert.equal(result.triggered,true);
  assert.equal(result.outcome.rollPercent,20);
}

{
  const evaluator=createCaptureDodgeEvaluator({rng:()=>0.7});
  const reaction={type:'dodge',metadata:{dodgePolicy:{chancePercent:35}}};
  const result=evaluator({reaction});
  assert.equal(result.ok,true);
  assert.equal(result.triggered,false);
}

{
  const evaluator=createCaptureDodgeEvaluator({rng:()=>0});
  const reaction={type:'dodge',metadata:{dodgePolicy:{}}};
  const result=evaluator({reaction});
  assert.equal(result.ok,true);
  assert.equal(result.triggered,false);
  assert.equal(result.outcome.reason,'dodge-chance-unconfigured');
}

function startState(player,opponentReaction){
  const initial=createCaptureModeState({activeTeam:[player],roster:[player]});
  const withEncounter={...initial,encounter:{type:'wild',speciesId:'capture_aquafin'}};
  const started=startCaptureBattle(withEncounter,{
    opponent:{instanceId:'wild-1',speciesId:'capture_aquafin',wild:true,currentHp:20,maxHp:20,abilityIds:['wild-hit'],reaction:opponentReaction},
  });
  assert.equal(started.ok,true);
  return started.state;
}

{
  const player={instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20,abilityIds:['player-hit']};
  const state=startState(player,{id:'wild-dodge',type:'dodge',metadata:{dodgePolicy:{chancePercent:40}}});
  const abilityState=initializeCreatureAbilityState(player,[playerAbility]);
  const result=useCaptureBattleAbility(state,{
    abilityDef:playerAbility,
    abilityState,
    effectResolver:resolveCaptureVitalEffect,
    reactionResolver:createCaptureDodgeEvaluator({rng:()=>0.1}),
  });
  assert.equal(result.ok,true);
  assert.equal(result.reaction.triggered,true);
  assert.equal(result.state.battle.opponent.vitals.currentHp,20);
}

{
  const player={
    instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20,abilityIds:['player-hit'],
    reaction:{id:'player-dodge',type:'dodge',metadata:{dodgePolicy:{chancePercent:25}}},
  };
  const state=startState(player,null);
  const abilityState=initializeCreatureAbilityState(state.battle.opponent.creature,[aiAbility]);
  const result=runCaptureAiStep(state,{
    abilityDefs:[aiAbility],
    abilityState,
    effectResolver:resolveCaptureVitalEffect,
    reactionResolver:createCaptureDodgeEvaluator({rng:()=>0.5}),
  });
  assert.equal(result.ok,true);
  assert.equal(result.reaction.triggered,false);
  assert.equal(result.state.battle.player.vitals.currentHp,15);
}

console.log('capture-dodge-policy.test.mjs: ok');
