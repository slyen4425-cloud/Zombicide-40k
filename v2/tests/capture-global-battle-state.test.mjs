import assert from 'node:assert/strict';
import {
  createCaptureModeState,
  startCaptureBattle,
  useCaptureBattleAbility,
} from '../src/modes/capture/capture.js';
import {resolveCaptureVitalEffect} from '../src/modes/capture/vitals.js';
import {initializeCreatureAbilityState} from '../src/modes/capture/abilities.js';

function startedState({team,opponent}){
  let state=createCaptureModeState({activeTeam:team,roster:[...team]});
  state={...state,encounter:{type:'wild',speciesId:opponent.speciesId,status:'spotted'}};
  const started=startCaptureBattle(state,{opponent,opponentPosition:{x:1,y:0,zoneId:'capture-battle'}});
  assert.equal(started.ok,true);
  return started.state;
}

{
  const team=[{instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20}];
  let state=startedState({team,opponent:{instanceId:'w1',speciesId:'capture_aquafin',wild:true,currentHp:20,maxHp:20}});
  const ability={id:'hit',range:1,chargeMax:2,cooldown:0,effect:{type:'damage',amount:5}};
  const abilityState=initializeCreatureAbilityState(team[0],[ability]);
  const result=useCaptureBattleAbility(state,{abilityDef:ability,abilityState,effectResolver:resolveCaptureVitalEffect});
  assert.equal(result.ok,true);
  assert.equal(result.ended,false);
  assert.notEqual(result.state.battle,null);
  assert.equal(result.state.battle.opponent.vitals.currentHp,15);
  assert.equal(result.state.exploration.freeMovement,false);
}

{
  const team=[
    {instanceId:'p1',speciesId:'capture_braiseau',currentHp:4,maxHp:20},
    {instanceId:'p2',speciesId:'capture_voltige',currentHp:15,maxHp:15},
  ];
  let state=startedState({team,opponent:{instanceId:'w1',speciesId:'capture_aquafin',wild:true,currentHp:20,maxHp:20}});
  const ability={id:'enemy-hit',range:1,chargeMax:1,cooldown:0,effect:{type:'damage',amount:99}};
  const abilityState={['enemy-hit']:{charges:1,chargeMax:1,cooldownRemaining:0,cost:null}};
  const result=useCaptureBattleAbility(state,{side:'opponent',targetSide:'player',abilityDef:ability,abilityState,effectResolver:resolveCaptureVitalEffect});
  assert.equal(result.ok,true);
  assert.equal(result.koOutcome,'forced_switch');
  assert.equal(result.ended,false);
  assert.equal(result.state.activeTeam[0].currentHp,0);
  assert.equal(result.state.battle.player.activeInstanceId,'p2');
  assert.equal(result.state.roster.find(x=>x.instanceId==='p1').currentHp,0);
  assert.equal(result.state.exploration.freeMovement,false);
}

{
  const team=[{instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20}];
  let state=startedState({team,opponent:{instanceId:'w1',speciesId:'capture_aquafin',wild:true,currentHp:6,maxHp:20}});
  const ability={id:'finish',range:1,chargeMax:1,cooldown:0,effect:{type:'damage',amount:99}};
  const abilityState=initializeCreatureAbilityState(team[0],[ability]);
  const result=useCaptureBattleAbility(state,{abilityDef:ability,abilityState,effectResolver:resolveCaptureVitalEffect});
  assert.equal(result.ok,true);
  assert.equal(result.koOutcome,'opponent_ko');
  assert.equal(result.ended,true);
  assert.equal(result.endReason,'opponent_ko');
  assert.equal(result.state.battle,null);
  assert.equal(result.state.encounter,null);
  assert.equal(result.state.exploration.freeMovement,true);
}

console.log('capture-global-battle-state.test.mjs: ok');
