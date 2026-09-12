import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createCaptureModeState,startCaptureBattle} from '../src/modes/capture/capture.js';
import {executeCapturePlayerAbility,CAPTURE_PLAYER_ABILITY_ACTION_CONTRACT} from '../src/modes/capture/player-ability-action.js';

assert.equal(CAPTURE_PLAYER_ABILITY_ACTION_CONTRACT.usesAuthoritativeBattleAbility,true);
assert.equal(CAPTURE_PLAYER_ABILITY_ACTION_CONTRACT.persistsOwnedCreatureAbilityState,true);
assert.equal(CAPTURE_PLAYER_ABILITY_ACTION_CONTRACT.defaultsToCaptureVitalEffectResolver,true);
assert.equal(CAPTURE_PLAYER_ABILITY_ACTION_CONTRACT.neverInitializesMissingAbilityState,true);
assert.equal(CAPTURE_PLAYER_ABILITY_ACTION_CONTRACT.neverUsesRpgRuntime,true);

function startedState(){
  const team=[{
    instanceId:'p1',
    speciesId:'capture_braiseau',
    currentHp:20,
    maxHp:20,
    abilityState:{ember:{charges:2,chargeMax:2,cooldownRemaining:0,cost:null}},
  }];
  let state=createCaptureModeState({activeTeam:team,roster:structuredClone(team)});
  state={...state,encounter:{type:'wild',speciesId:'capture_aquafin',status:'spotted'}};
  const started=startCaptureBattle(state,{
    opponent:{instanceId:'wild-1',speciesId:'capture_aquafin',wild:true,currentHp:12,maxHp:12},
    opponentPosition:{x:1,y:0,zoneId:'capture-battle'},
  });
  assert.equal(started.ok,true);
  return started.state;
}

{
  const state=startedState();
  const before=structuredClone(state);
  const result=executeCapturePlayerAbility(state,{
    abilityDef:{id:'ember',name:'Braise',range:1,chargeMax:2,cooldown:3,effect:{type:'damage',amount:4}},
  });
  assert.equal(result.ok,true);
  assert.equal(result.ended,false);
  assert.equal(result.state.battle.opponent.vitals.currentHp,8);
  assert.equal(result.state.activeTeam[0].abilityState.ember.charges,1);
  assert.equal(result.state.activeTeam[0].abilityState.ember.cooldownRemaining,3);
  assert.equal(result.state.roster[0].abilityState.ember.charges,1);
  assert.equal(result.state.roster[0].abilityState.ember.cooldownRemaining,3);
  assert.equal(result.state.battle.player.creature.abilityState.ember.charges,1);
  assert.equal(result.state.battle.player.creature.abilityState.ember.cooldownRemaining,3);
  assert.equal(state.activeTeam[0].abilityState.ember.charges,before.activeTeam[0].abilityState.ember.charges);
  assert.equal(state.battle.opponent.vitals.currentHp,before.battle.opponent.vitals.currentHp);
}

{
  const state=startedState();
  state.activeTeam[0].abilityState.ember.cooldownRemaining=2;
  const result=executeCapturePlayerAbility(state,{
    abilityDef:{id:'ember',range:1,cooldown:3,effect:{type:'damage',amount:4}},
  });
  assert.equal(result.ok,false);
  assert.equal(result.reason,'capture_ability_cooldown');
  assert.equal(result.state.activeTeam[0].abilityState.ember.charges,2);
}

{
  const state=startedState();
  delete state.activeTeam[0].abilityState;
  const before=structuredClone(state);
  const result=executeCapturePlayerAbility(state,{abilityDef:{id:'ember',range:1,effect:{type:'damage',amount:4}}});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'capture-player-ability-state-missing');
  assert.deepEqual(result.state,before);
}

{
  const result=executeCapturePlayerAbility(createCaptureModeState(),{abilityDef:{id:'ember'}});
  assert.equal(result.ok,false);
  assert.equal(result.reason,'battle-missing');
}

const source=fs.readFileSync(new URL('../src/modes/capture/player-ability-action.js',import.meta.url),'utf8');
assert.equal(source.includes('../rpg/'),false);
assert.equal(source.includes('initializeCreatureAbilityState'),false);
assert.equal(source.includes('Math.random('),false);
assert.equal(source.includes('Date.now('),false);
assert.match(source,/useCaptureBattleAbility/);
assert.match(source,/resolveCaptureVitalEffect/);

console.log('capture-player-ability-action.test.mjs: ok');
