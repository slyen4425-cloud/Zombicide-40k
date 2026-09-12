import {
  CAPTURE_RUNTIME_CONTRACT,
  attemptCaptureInBattle,
  clearCaptureEncounter,
  createCaptureModeState,
  createCaptureWorldIndex,
  enterCaptureRoom,
  finishCaptureBattle,
  initializeCaptureRoster,
  moveCaptureActor,
  moveCaptureBattleCreature,
  moveCaptureRosterCreature,
  runCaptureAiStep,
  setCaptureTeam,
  startCaptureBattle,
  switchCaptureBattleCreature,
  useCaptureBattleAbility,
} from './capture.js';
import {advanceCaptureModeTime,CAPTURE_TIME_RUNTIME_CONTRACT} from './time-runtime.js';
import {
  CAPTURE_SCHEDULER_CONTRACT,
  createCaptureSchedulerState,
  pushCaptureSchedulerDelta,
  setCaptureSchedulerRunning,
} from './scheduler.js';
import {
  CAPTURE_DRIVER_CONTRACT,
  createCaptureDriverState,
  pauseCaptureDriver,
  pushCaptureDriverDelta,
  resumeCaptureDriver,
  startCaptureDriver,
  stopCaptureDriver,
} from './driver.js';

export const CAPTURE_PUBLIC_RUNTIME_CONTRACT=Object.freeze({
  canonicalEntry:'capture/runtime.js',
  canonicalTimeAdvance:'advanceCaptureTime',
  canonicalSchedulerAdvance:'advanceCaptureScheduler',
  canonicalDriverAdvance:'advanceCaptureDriver',
  legacyTimingHelpers:'internal_or_regression_only',
  fixedRealtimeCadence:false,
  isolatedFromRpg:true,
});

export {
  CAPTURE_RUNTIME_CONTRACT,
  CAPTURE_TIME_RUNTIME_CONTRACT,
  CAPTURE_SCHEDULER_CONTRACT,
  CAPTURE_DRIVER_CONTRACT,
  attemptCaptureInBattle,
  clearCaptureEncounter,
  createCaptureDriverState,
  createCaptureModeState,
  createCaptureSchedulerState,
  createCaptureWorldIndex,
  enterCaptureRoom,
  finishCaptureBattle,
  initializeCaptureRoster,
  moveCaptureActor,
  moveCaptureBattleCreature,
  moveCaptureRosterCreature,
  pauseCaptureDriver,
  resumeCaptureDriver,
  runCaptureAiStep,
  setCaptureSchedulerRunning,
  setCaptureTeam,
  startCaptureBattle,
  startCaptureDriver,
  stopCaptureDriver,
  switchCaptureBattleCreature,
  useCaptureBattleAbility,
};

export function advanceCaptureTime(state,options={}){
  return advanceCaptureModeTime(state,options);
}

export function advanceCaptureScheduler(state,scheduler,options={}){
  return pushCaptureSchedulerDelta(state,scheduler,{...options,advance:advanceCaptureTime});
}

export function advanceCaptureDriver(state,scheduler,driver,options={}){
  return pushCaptureDriverDelta(state,scheduler,driver,{...options,advanceScheduler:advanceCaptureScheduler});
}
