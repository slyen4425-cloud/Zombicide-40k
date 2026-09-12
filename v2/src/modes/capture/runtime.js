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

export const CAPTURE_PUBLIC_RUNTIME_CONTRACT=Object.freeze({
  canonicalEntry:'capture/runtime.js',
  canonicalTimeAdvance:'advanceCaptureTime',
  legacyTimingHelpers:'internal_or_regression_only',
  fixedRealtimeCadence:false,
  isolatedFromRpg:true,
});

export {
  CAPTURE_RUNTIME_CONTRACT,
  CAPTURE_TIME_RUNTIME_CONTRACT,
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
};

export function advanceCaptureTime(state,options={}){
  return advanceCaptureModeTime(state,options);
}
