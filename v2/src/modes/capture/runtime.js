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
import {CAPTURE_UI_EVENT_CONTRACT,captureUiEventsFromResult,captureUiEventsFromResults} from './ui-events.js';
import {CAPTURE_UI_DISPATCHER_CONTRACT,captureUiNoticeFromEvent,dispatchCaptureUiEvents} from './ui-dispatcher.js';
import {CAPTURE_UI_NOTICE_FEED_CONTRACT,advanceCaptureUiNoticeVisualTime,appendCaptureUiNotices,captureUiNoticeFeedNotices,createCaptureUiNoticeFeed} from './ui-notice-feed.js';
import {CAPTURE_UI_VISUAL_DRIVER_CONTRACT,createCaptureUiVisualDriverState,pauseCaptureUiVisualDriver,pushCaptureUiVisualDelta,resumeCaptureUiVisualDriver,startCaptureUiVisualDriver,stopCaptureUiVisualDriver} from './ui-visual-driver.js';
import {CAPTURE_UI_VISUAL_CLOCK_ADAPTER_CONTRACT,createCaptureUiVisualClockAdapterState,pauseCaptureUiVisualClockAdapter,resumeCaptureUiVisualClockAdapter,sampleCaptureUiVisualClock as sampleCaptureUiVisualClockCore,startCaptureUiVisualClockAdapter,stopCaptureUiVisualClockAdapter} from './ui-visual-clock-adapter.js';
import {CAPTURE_UI_VISUAL_CLOCK_SOURCE_CONTRACT,attachCaptureUiVisualClockSource} from './ui-visual-clock-source.js';
import {CAPTURE_UI_VISUAL_ACTIVITY_SOURCE_CONTRACT,attachCaptureUiVisualActivitySource} from './ui-visual-activity-source.js';
import {CAPTURE_UI_VISUAL_PAUSE_CONTROLLER_CONTRACT,clearCaptureUiVisualPauseReasons,createCaptureUiVisualPauseControllerState,isCaptureUiVisualPaused,setCaptureUiVisualPauseReason} from './ui-visual-pause-controller.js';
import {CAPTURE_UI_PRESENTATION_BLOCK_CONTRACT,createCaptureUiPresentationBlockState,setCaptureUiPresentationBlocked} from './ui-presentation-block.js';
import {CAPTURE_UI_OVERLAY_CONTRACT,closeCaptureUiOverlay,createCaptureUiOverlayState,openCaptureUiOverlay} from './ui-overlay.js';
import {CAPTURE_CREATURE_INSPECTION_CONTRACT,buildCaptureCreatureInspection} from './creature-inspection.js';
import {CAPTURE_UI_ROSTER_LIST_CONTRACT,buildCaptureRosterLists,captureRosterListEntry} from './ui-roster-list.js';
import {CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT,buildCaptureOpponentInspection,buildCaptureOpponentSummary} from './ui-opponent-summary.js';
import {CAPTURE_PLAYER_ABILITY_ACTION_CONTRACT,executeCapturePlayerAbility} from './player-ability-action.js';
import {CAPTURE_PLAYER_MOVE_ACTION_CONTRACT,executeCapturePlayerMove} from './player-move-action.js';
import {CAPTURE_PLAYER_CAPTURE_ACTION_CONTRACT,executeCapturePlayerCaptureAttempt} from './player-capture-action.js';
import {CAPTURE_UI_SPATIAL_SUMMARY_CONTRACT,buildCaptureSpatialSummary} from './ui-spatial-summary.js';

export const CAPTURE_PUBLIC_RUNTIME_CONTRACT=Object.freeze({
  canonicalEntry:'capture/runtime.js',canonicalTimeAdvance:'advanceCaptureTime',canonicalSchedulerAdvance:'advanceCaptureScheduler',canonicalDriverAdvance:'advanceCaptureDriver',canonicalAppLifecycle:true,canonicalUiEvents:true,canonicalUiDispatcher:true,canonicalUiNoticeFeed:true,canonicalUiVisualDriver:true,canonicalUiVisualClockAdapter:true,canonicalUiVisualClockSource:true,canonicalUiVisualActivitySource:true,canonicalUiVisualPauseController:true,canonicalUiPresentationBlock:true,canonicalUiOverlay:true,canonicalCreatureInspection:true,canonicalUiRosterList:true,canonicalUiOpponentSummary:true,canonicalUiOpponentInspection:true,canonicalPlayerAbilityAction:true,canonicalPlayerMoveAction:true,canonicalPlayerCaptureAction:true,canonicalUiSpatialSummary:true,legacyTimingHelpers:'internal_or_regression_only',fixedRealtimeCadence:false,isolatedFromRpg:true,
});

export {
  CAPTURE_RUNTIME_CONTRACT,CAPTURE_TIME_RUNTIME_CONTRACT,CAPTURE_SCHEDULER_CONTRACT,CAPTURE_DRIVER_CONTRACT,CAPTURE_APP_LIFECYCLE_CONTRACT,CAPTURE_UI_EVENT_CONTRACT,CAPTURE_UI_DISPATCHER_CONTRACT,CAPTURE_UI_NOTICE_FEED_CONTRACT,CAPTURE_UI_VISUAL_DRIVER_CONTRACT,CAPTURE_UI_VISUAL_CLOCK_ADAPTER_CONTRACT,CAPTURE_UI_VISUAL_CLOCK_SOURCE_CONTRACT,CAPTURE_UI_VISUAL_ACTIVITY_SOURCE_CONTRACT,CAPTURE_UI_VISUAL_PAUSE_CONTROLLER_CONTRACT,CAPTURE_UI_PRESENTATION_BLOCK_CONTRACT,CAPTURE_UI_OVERLAY_CONTRACT,CAPTURE_CREATURE_INSPECTION_CONTRACT,CAPTURE_UI_ROSTER_LIST_CONTRACT,CAPTURE_UI_OPPONENT_SUMMARY_CONTRACT,CAPTURE_PLAYER_ABILITY_ACTION_CONTRACT,CAPTURE_PLAYER_MOVE_ACTION_CONTRACT,CAPTURE_PLAYER_CAPTURE_ACTION_CONTRACT,CAPTURE_UI_SPATIAL_SUMMARY_CONTRACT,
  advanceCaptureUiNoticeVisualTime,appendCaptureUiNotices,attachCaptureUiVisualActivitySource,attachCaptureUiVisualClockSource,attemptCaptureInBattle,buildCaptureCreatureInspection,buildCaptureOpponentInspection,buildCaptureOpponentSummary,buildCaptureRosterLists,buildCaptureSpatialSummary,captureRosterListEntry,captureUiEventsFromResult,captureUiEventsFromResults,captureUiNoticeFeedNotices,captureUiNoticeFromEvent,clearCaptureEncounter,clearCaptureUiVisualPauseReasons,closeCaptureUiOverlay,createCaptureDriverState,createCaptureModeState,createCaptureSchedulerState,createCaptureUiNoticeFeed,createCaptureUiOverlayState,createCaptureUiPresentationBlockState,createCaptureUiVisualClockAdapterState,createCaptureUiVisualDriverState,createCaptureUiVisualPauseControllerState,createCaptureWorldIndex,dispatchCaptureUiEvents,enterCaptureRoom,executeCapturePlayerAbility,executeCapturePlayerMove,executeCapturePlayerCaptureAttempt,finishCaptureBattle,initializeCaptureRoster,isCaptureUiVisualPaused,moveCaptureActor,moveCaptureBattleCreature,moveCaptureRosterCreature,openCaptureUiOverlay,pauseCaptureDriver,pauseCaptureUiVisualClockAdapter,pauseCaptureUiVisualDriver,resumeCaptureDriver,resumeCaptureUiVisualClockAdapter,resumeCaptureUiVisualDriver,runCaptureAiStep,setCaptureSchedulerRunning,setCaptureTeam,setCaptureUiPresentationBlocked,setCaptureUiVisualPauseReason,startCaptureBattle,startCaptureDriver,startCaptureUiVisualClockAdapter,startCaptureUiVisualDriver,stopCaptureDriver,stopCaptureUiVisualClockAdapter,stopCaptureUiVisualDriver,switchCaptureBattleCreature,useCaptureBattleAbility,
};

export function advanceCaptureTime(state,options={}){return advanceCaptureModeTime(state,options);}
export function advanceCaptureScheduler(state,scheduler,options={}){return pushCaptureSchedulerDelta(state,scheduler,{...options,advance:advanceCaptureTime});}
export function advanceCaptureDriver(state,scheduler,driver,options={}){return pushCaptureDriverDelta(state,scheduler,driver,{...options,advanceScheduler:advanceCaptureScheduler});}
export function advanceCaptureUiVisualDriver(feed,driver,options={}){return pushCaptureUiVisualDelta(feed,driver,{...options,advanceVisualTime:advanceCaptureUiNoticeVisualTime});}
export function sampleCaptureUiVisualClock(feed,visualDriver,adapter,options={}){return sampleCaptureUiVisualClockCore(feed,visualDriver,adapter,{...options,advanceVisualDriver:advanceCaptureUiVisualDriver});}
export function createCaptureAppSession({state=createCaptureModeState(),scheduler=createCaptureSchedulerState(),driver=createCaptureDriverState(),uiEvents=[]}={}){return createCaptureAppSessionCore({state,scheduler,driver,uiEvents});}
export function beginCaptureBattleSession(session,battleOptions={}){return beginCaptureBattleSessionCore(session,battleOptions,{startBattle:startCaptureBattle,startDriver:startCaptureDriver});}
export function setCaptureBattleBlocking(session,blocking){return setCaptureBattleBlockingCore(session,blocking,{pauseDriver:pauseCaptureDriver,resumeDriver:resumeCaptureDriver});}
export function advanceCaptureBattleSession(session,options={}){return advanceCaptureBattleSessionCore(session,{...options,advanceDriver:advanceCaptureDriver,stopDriver:stopCaptureDriver});}
export function consumeCaptureUiEvents(session){return consumeCaptureUiEventsCore(session);}
export function finishCaptureBattleSession(session,reason){return finishCaptureBattleSessionCore(session,reason,{finishBattle:finishCaptureBattle,stopDriver:stopCaptureDriver});}
