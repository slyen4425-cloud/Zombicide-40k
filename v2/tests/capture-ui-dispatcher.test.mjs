import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAPTURE_UI_DISPATCHER_CONTRACT,
  captureUiNoticeFromEvent,
  dispatchCaptureUiEvents,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_UI_DISPATCHER_CONTRACT.presentationOnly,true);
assert.equal(CAPTURE_UI_DISPATCHER_CONTRACT.blocking,false);
assert.equal(CAPTURE_UI_DISPATCHER_CONTRACT.pausesBattle,false);
assert.equal(CAPTURE_UI_DISPATCHER_CONTRACT.mutatesGameplayState,false);
assert.equal(CAPTURE_UI_DISPATCHER_CONTRACT.captureAttemptNotices,true);

{
  const dodge=captureUiNoticeFromEvent({type:'reaction_triggered',reactionType:'dodge',side:'player'});
  assert.equal(dodge.type,'reaction_triggered');
  assert.equal(dodge.blocking,false);
  assert.match(dodge.message,/Esquive/);
}

{
  const sourceEvents=[
    {type:'status_applied',statusId:'burn',side:'opponent'},
    {type:'status_periodic_effect',statusId:'burn',effectType:'damage',amount:3,side:'opponent'},
    {type:'status_expired',statusId:'burn',side:'opponent'},
    {type:'ko',side:'opponent'},
    {type:'forced_switch',side:'player',previousInstanceId:'p1',activeInstanceId:'p2'},
  ];
  const before=structuredClone(sourceEvents);
  const sink=[];
  const notices=dispatchCaptureUiEvents(sourceEvents,notice=>sink.push(notice));
  assert.equal(notices.length,5);
  assert.equal(sink.length,5);
  assert.deepEqual(sourceEvents,before);
  assert.equal(notices.every(notice=>notice.blocking===false),true);
}

{
  const success=captureUiNoticeFromEvent({type:'capture_success',speciesId:'capture_aquafin'});
  assert.equal(success.type,'capture_success');
  assert.equal(success.blocking,false);
  assert.match(success.message,/Capture réussie/);

  const failed=captureUiNoticeFromEvent({type:'capture_failed',orbId:'capture_orb_basic'});
  assert.equal(failed.blocking,false);
  assert.match(failed.message,/Capture ratée/);

  const unavailable=captureUiNoticeFromEvent({type:'capture_unavailable',reason:'pending_low_hp_multiplier'});
  assert.equal(unavailable.blocking,false);
  assert.match(unavailable.message,/30 % PV/);
}

{
  const notices=dispatchCaptureUiEvents([{type:'unknown_event'}]);
  assert.deepEqual(notices,[]);
}

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(pageSource,/data-capture-combat-feed/);
assert.match(pageSource,/aria-live="polite"/);
assert.match(pageSource,/consumeCaptureUiEvents\(session\)/);
assert.match(pageSource,/dispatchCaptureUiEvents\(consumed\.events\)/);
assert.match(pageSource,/appendCaptureUiNotices\(noticeFeed,dispatched\)/);
assert.match(pageSource,/captureUiEventsFromCaptureAttempt\(result,\{orbId\}\)/);
assert.match(pageSource,/appendResultNotices/);
const flushBody=pageSource.slice(pageSource.indexOf('function flushUiEvents'),pageSource.indexOf('return {',pageSource.indexOf('function flushUiEvents')));
assert.equal(flushBody.includes('setCaptureBattleBlocking'),false);
const captureBody=pageSource.slice(pageSource.indexOf('attemptCapture(orbId)'),pageSource.indexOf('setBlocking(blocking)',pageSource.indexOf('attemptCapture(orbId)')));
assert.equal(captureBody.includes('openOverlay'),false);
assert.equal(captureBody.includes('setCaptureBattleBlocking'),false);
assert.equal(pageSource.includes('alert('),false);
assert.equal(pageSource.includes('confirm('),false);
assert.equal(pageSource.includes('setInterval('),false);

console.log('capture-ui-dispatcher.test.mjs: ok');
