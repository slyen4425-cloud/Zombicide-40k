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
import {
  CAPTURE_APP_LIFECYCLE_CONTRACT,
  advanceCaptureBattleSession as advanceCaptureBattleSessionCore,
  beginCaptureBattleSession as beginCaptureBattleSessionCore,
  consumeCaptureUiEvents as consumeCaptureUiEventsCore,
  createCaptureAppSession as createCaptureAppSessionCore,
  finishCaptureBattleSession as finishCaptureBattleSessionCore,
  setCaptureBattleBlocking as setCaptureBattleBlockingCore,
} from './app-lifecycle.js';
import {
  CAPTURE_UI_EVENT_CONTRACT,
  captureUiEventsFromResult,
  captureUiEventsFromResults,
} from './ui-events.js';
import {
  CAPTURE_UI_DISPATCHER_CONTRACT,
  captureUiNoticeFromEvent,
  dispatchCaptureUiEvents,
} from './ui-dispatcher.js';
import {
  CAPTURE_UI_NOTICE_FEED_CONTRACT,
  advanceCaptureUiNoticeVisualTime,
  appendCaptureUiNotices,
  captureUiNoticeFeedNotices,
  createCaptureUiNoticeFeed,
} from './ui-notice-feed.js';
import {
  CAPTURE_UI_VISUAL_DRIVER_CONTRACT,
  createCaptureUiVisualDriverState,
  pauseCaptureUiVisualDriver,
  pushCaptureUiVisualDelta,
  resumeCaptureUiVisualDriver,
  startCaptureUiVisualDriver,
  stopCaptureUiVisualDriver,
} from './ui-visual-driver.js';

export const CAPTURE_PUBLIC_RUNTIME_CONTRACT=Object.freeze({
  canonicalEntry:'capture/runtime.js',
  canonicalTimeAdvance:'advanceCaptureTime',
  canonicalSchedulerAdvance:'advanceCaptureScheduler',
  canonicalDriverAdvance:'advanceCaptureDriver',
  canonicalAppLifecycle:true,
  canonicalUiEvents:true,
  canonicalUiDispatcher:true,
  canonicalUiNoticeFeed:true,
  canonicalUiVisualDriver:true,
  legacyTimingHelpers:'internal_or_regression_only',
  fixedRealtimeCadence:false,
  isolatedFromRpg:true,
});

export {
  CAPTURE_RUNTIME_CONTRACT,
  CAPTURE_TIME_RUNTIME_CONTRACT,
  CAPTURE_SCHEDULER_CONTRACT,
  CAPTURE_DRIVER_CONTRACT,
  CAPTURE_APP_LIFECYCLE_CONTRACT,
  CAPTURE_UI_EVENT_CONTRACT,
  CAPTURE_UI_DISPATCHER_CONTRACT,
  CAPTURE_UI_NOTICE_FEED_CONTRACT,
  CAPTURE_UI_VISUAL_DRIVER_CONTRACT,
  advanceCaptureUiNoticeVisualTime,
  appendCaptureUiNotices,
  attemptCaptureInBattle,
  captureUiEventsFromResult,
  captureUiEventsFromResults,
  captureUiNoticeFeedNotices,
  captureUiNoticeFromEvent,
  clearCaptureEncounter,
  createCaptureDriverState,
  createCaptureModeState,
  createCaptureSchedulerState,
  createCaptureUiNoticeFeed,
  createCaptureUiVisualDriverState,
  createCaptureWorldIndex,
  dispatchCaptureUiEvents,
  enterCaptureRoom,
  finishCaptureBattle,
  initializeCaptureRoster,
  moveCaptureActor,
  moveCaptureBattleCreature,
  moveCaptureRosterCreature,
  pauseCaptureDriver,
  pauseCaptureUiVisualDriver,
  resumeCaptureDriver,
  resumeCaptureUiVisualDriver,
  runCaptureAiStep,
  setCaptureSchedulerRunning,
  setCaptureTeam,
  startCaptureBattle,
  startCaptureDriver,
  startCaptureUiVisualDriver,
  stopCaptureDriver,
  stopCaptureUiVisualDriver,
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

export function advanceCaptureUiVisualDriver(feed,driver,options={}){
  return pushCaptureUiVisualDelta(feed,driver,{...options,advanceVisualTime:advanceCaptureUiNoticeVisualTime});
}

export function createCaptureAppSession({state=createCaptureModeState(),scheduler=createCaptureSchedulerState(),driver=createCaptureDriverState(),uiEvents=[]}={}){
  return createCaptureAppSessionCore({state,scheduler,driver,uiEvents});
}

export function beginCaptureBattleSession(session,battleOptions={}){
  return beginCaptureBattleSessionCore(session,battleOptions,{startBattle:startCaptureBattle,startDriver:startCaptureDriver});
}

export function setCaptureBattleBlocking(session,blocking){
  return setCaptureBattleBlockingCore(session,blocking,{pauseDriver:pauseCaptureDriver,resumeDriver:resumeCaptureDriver});
}

export function advanceCaptureBattleSession(session,options={}){
  return advanceCaptureBattleSessionCore(session,{...options,advanceDriver:advanceCaptureDriver,stopDriver:stopCaptureDriver});
}

export function consumeCaptureUiEvents(session){
  return consumeCaptureUiEventsCore(session);
}

export function finishCaptureBattleSession(session,reason){
  return finishCaptureBattleSessionCore(session,reason,{finishBattle:finishCaptureBattle,stopDriver:stopCaptureDriver});
}
