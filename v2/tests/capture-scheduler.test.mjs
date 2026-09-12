import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  advanceCaptureScheduler,
  CAPTURE_PUBLIC_RUNTIME_CONTRACT,
  CAPTURE_SCHEDULER_CONTRACT,
  createCaptureModeState,
  createCaptureSchedulerState,
  setCaptureSchedulerRunning,
  startCaptureBattle,
} from '../src/modes/capture/runtime.js';

function buildState({opponentHp=20,statusAmount=2,statusDuration=5}={}){
  const player={instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20};
  let state=createCaptureModeState({activeTeam:[player],roster:[player]});
  state={...state,encounter:{type:'wild',speciesId:'capture_aquafin'}};
  const started=startCaptureBattle(state,{
    opponent:{instanceId:'w1',speciesId:'capture_aquafin',wild:true,currentHp:opponentHp,maxHp:opponentHp},
    opponentPosition:{x:1,y:0,zoneId:'capture-battle'},
  });
  assert.equal(started.ok,true);
  started.state.battle.opponent.statuses=[{
    id:'burn',name:'Burn',remainingDuration:statusDuration,duration:statusDuration,stacks:1,stackMode:'refresh',maxStacks:1,
    effects:[{type:'damage',amount:statusAmount}],source:'capture',
  }];
  return started.state;
}

assert.equal(CAPTURE_PUBLIC_RUNTIME_CONTRACT.canonicalSchedulerAdvance,'advanceCaptureScheduler');
assert.equal(CAPTURE_SCHEDULER_CONTRACT.fixedRealtimeCadence,false);
assert.equal(CAPTURE_SCHEDULER_CONTRACT.externalDriverRequired,true);

{
  const state=buildState();
  let scheduler=createCaptureSchedulerState();
  let result=advanceCaptureScheduler(state,scheduler,{delta:0.4,stepSize:1});
  assert.equal(result.ok,true);
  assert.equal(result.processedSteps,0);
  assert.equal(result.reason,'insufficient-delta');
  assert.equal(result.scheduler.accumulated,0.4);
  assert.equal(result.state.battle.opponent.vitals.currentHp,20);

  result=advanceCaptureScheduler(result.state,result.scheduler,{delta:1.6,stepSize:1});
  assert.equal(result.ok,true);
  assert.equal(result.processedSteps,2);
  assert.equal(result.scheduler.accumulated,0);
  assert.equal(result.scheduler.steps,2);
  assert.equal(result.state.battle.timing.reactionTime,2);
  assert.equal(result.state.battle.opponent.vitals.currentHp,16);
  assert.equal(result.state.battle.opponent.statuses[0].remainingDuration,3);
}

{
  const state=buildState();
  const paused=setCaptureSchedulerRunning(createCaptureSchedulerState(),false);
  const result=advanceCaptureScheduler(state,paused,{delta:5,stepSize:1});
  assert.equal(result.ok,true);
  assert.equal(result.reason,'scheduler-paused');
  assert.equal(result.processedSteps,0);
  assert.equal(result.state.battle.opponent.vitals.currentHp,20);
}

{
  const state=buildState();
  const result=advanceCaptureScheduler(state,createCaptureSchedulerState(),{delta:3,stepSize:1,maxSteps:1});
  assert.equal(result.ok,true);
  assert.equal(result.processedSteps,1);
  assert.equal(result.scheduler.accumulated,2);
  assert.equal(result.scheduler.steps,1);
  assert.equal(result.state.battle.opponent.vitals.currentHp,18);
}

{
  const state=buildState({opponentHp:2,statusAmount:2,statusDuration:4});
  const result=advanceCaptureScheduler(state,createCaptureSchedulerState(),{delta:3,stepSize:1});
  assert.equal(result.ok,true);
  assert.equal(result.processedSteps,1);
  assert.equal(result.results[0].ended,true);
  assert.equal(result.results[0].endReason,'opponent_ko');
  assert.equal(result.state.battle,null);
  assert.equal(result.state.encounter,null);
  assert.equal(result.state.exploration.freeMovement,true);
  assert.equal(result.scheduler.accumulated,2);
}

const schedulerSource=fs.readFileSync(new URL('../src/modes/capture/scheduler.js',import.meta.url),'utf8');
assert.equal(schedulerSource.includes('setInterval('),false);
assert.equal(schedulerSource.includes('requestAnimationFrame('),false);
assert.equal(schedulerSource.includes('Date.now('),false);

console.log('capture-scheduler.test.mjs: ok');
