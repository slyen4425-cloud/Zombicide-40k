import assert from 'node:assert/strict';
import {
  createCaptureModeState,
  runCaptureAiStep,
  startCaptureBattle,
} from '../src/modes/capture/capture.js';
import {resolveCaptureVitalEffect} from '../src/modes/capture/vitals.js';

function startedState({team,opponent,opponentPosition={x:1,y:0,zoneId:'capture-battle'}}){
  let state=createCaptureModeState({activeTeam:team,roster:[...team]});
  state={...state,encounter:{type:'wild',speciesId:opponent.speciesId,status:'spotted'}};
  const started=startCaptureBattle(state,{opponent,opponentPosition});
  assert.equal(started.ok,true);
  return started.state;
}

{
  const team=[
    {instanceId:'p1',speciesId:'capture_braiseau',currentHp:5,maxHp:20},
    {instanceId:'p2',speciesId:'capture_voltige',currentHp:15,maxHp:15},
  ];
  const opponent={instanceId:'w1',speciesId:'capture_aquafin',wild:true,currentHp:20,maxHp:20};
  const state=startedState({team,opponent});
  const abilityDefs=[{id:'enemy-hit',range:1,chargeMax:1,cooldown:0,effect:{type:'damage',amount:99}}];
  const abilityState={['enemy-hit']:{charges:1,chargeMax:1,cooldownRemaining:0,cost:null}};
  const result=runCaptureAiStep(state,{abilityDefs,abilityState,effectResolver:resolveCaptureVitalEffect});
  assert.equal(result.ok,true);
  assert.equal(result.decision.type,'ability');
  assert.equal(result.koOutcome,'forced_switch');
  assert.equal(result.state.activeTeam[0].currentHp,0);
  assert.equal(result.state.roster.find(x=>x.instanceId==='p1').currentHp,0);
  assert.equal(result.state.battle.player.activeInstanceId,'p2');
  assert.equal(result.state.exploration.freeMovement,false);
}

{
  const team=[{instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20}];
  const opponent={instanceId:'w1',speciesId:'capture_aquafin',wild:true,currentHp:20,maxHp:20};
  const state=startedState({team,opponent,opponentPosition:{x:4,y:0,zoneId:'capture-battle'}});
  const abilityDefs=[{id:'enemy-hit',range:1,chargeMax:1,cooldown:0,effect:{type:'damage',amount:4}}];
  const abilityState={['enemy-hit']:{charges:1,chargeMax:1,cooldownRemaining:0,cost:null}};
  const beforeRoster=structuredClone(state.roster);
  const result=runCaptureAiStep(state,{abilityDefs,abilityState,effectResolver:resolveCaptureVitalEffect});
  assert.equal(result.ok,true);
  assert.equal(result.decision.type,'move_toward_target');
  assert.deepEqual(result.state.roster,beforeRoster);
  assert.deepEqual(result.state.activeTeam,team);
  assert.equal(result.state.battle.status,'active');
  assert.equal(result.state.exploration.freeMovement,false);
  assert.equal(result.abilityState['enemy-hit'].charges,1);
}

console.log('capture-global-ai-path.test.mjs: ok');
