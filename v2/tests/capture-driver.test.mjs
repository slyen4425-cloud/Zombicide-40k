import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  advanceCaptureDriver,
  CAPTURE_DRIVER_CONTRACT,
  CAPTURE_PUBLIC_RUNTIME_CONTRACT,
  createCaptureDriverState,
  createCaptureModeState,
  createCaptureSchedulerState,
  pauseCaptureDriver,
  resumeCaptureDriver,
  startCaptureBattle,
  startCaptureDriver,
  stopCaptureDriver,
} from '../src/modes/capture/runtime.js';

function buildState(){
  const player={instanceId:'p1',speciesId:'capture_braiseau',currentHp:20,maxHp:20};
  let state=createCaptureModeState({activeTeam:[player],roster:[player]});
  state={...state,encounter:{type:'wild',speciesId:'capture_aquafin'}};
  const started=startCaptureBattle(state,{
    opponent:{instanceId:'w1',speciesId:'capture_aquafin',wild:true,currentHp:20,maxHp:20},
    opponentPosition:{x:1,y:0,zoneId:'capture-battle'},
  });
  assert.equal(started.ok,true);
  return started.state;
}

assert.equal(CAPTURE_PUBLIC_RUNTIME_CONTRACT.canonicalDriverAdvance,'advanceCaptureDriver');
assert.equal(CAPTURE_DRIVER_CONTRACT.externalClockRequired,true);
assert.equal(CAPTURE_DRIVER_CONTRACT.ownsRealtimeLoop,false);
assert.equal(CAPTURE_DRIVER_CONTRACT.fixedRealtimeCadence,false);

{
  const state=buildState();
  const scheduler=createCaptureSchedulerState();
  const driver=createCaptureDriverState();
  const result=advanceCaptureDriver(state,scheduler,driver,{delta:3,schedulerOptions:{stepSize:1}});
  assert.equal(result.ok,true);
  assert.equal(result.reason,'driver-stopped');
  assert.equal(result.processedSteps,0);
  assert.equal(result.driver.totalDelta,0);
  assert.equal(result.driver.frames,0);
  assert.equal(result.scheduler.accumulated,0);
  assert.equal(result.state.battle.timing.reactionTime,null);
}

{
  let state=buildState();
  let scheduler=createCaptureSchedulerState();
  let driver=startCaptureDriver(createCaptureDriverState());
  let result=advanceCaptureDriver(state,scheduler,driver,{delta:0.4,schedulerOptions:{stepSize:1}});
  assert.equal(result.ok,true);
  assert.equal(result.processedSteps,0);
  assert.equal(result.scheduler.accumulated,0.4);
  assert.equal(result.driver.frames,1);
  assert.equal(result.driver.totalDelta,0.4);

  state=result.state;
  scheduler=result.scheduler;
  driver=pauseCaptureDriver(result.driver);
  result=advanceCaptureDriver(state,scheduler,driver,{delta:5,schedulerOptions:{stepSize:1}});
  assert.equal(result.reason,'driver-paused');
  assert.equal(result.scheduler.accumulated,0.4);
  assert.equal(result.driver.totalDelta,0.4);
  assert.equal(result.driver.frames,1);

  driver=resumeCaptureDriver(result.driver);
  result=advanceCaptureDriver(result.state,result.scheduler,driver,{delta:0.6,schedulerOptions:{stepSize:1}});
  assert.equal(result.ok,true);
  assert.equal(result.processedSteps,1);
  assert.equal(result.scheduler.accumulated,0);
  assert.equal(result.driver.frames,2);
  assert.equal(result.driver.totalDelta,1);
  assert.equal(result.state.battle.timing.reactionTime,1);

  driver=stopCaptureDriver(result.driver);
  result=advanceCaptureDriver(result.state,result.scheduler,driver,{delta:2,schedulerOptions:{stepSize:1}});
  assert.equal(result.reason,'driver-stopped');
  assert.equal(result.processedSteps,0);
  assert.equal(result.driver.totalDelta,1);
  assert.equal(result.state.battle.timing.reactionTime,1);
}

const driverSource=fs.readFileSync(new URL('../src/modes/capture/driver.js',import.meta.url),'utf8');
assert.equal(driverSource.includes('setInterval('),false);
assert.equal(driverSource.includes('requestAnimationFrame('),false);
assert.equal(driverSource.includes('Date.now('),false);
assert.equal(driverSource.includes('performance.now('),false);

console.log('capture-driver.test.mjs: ok');
