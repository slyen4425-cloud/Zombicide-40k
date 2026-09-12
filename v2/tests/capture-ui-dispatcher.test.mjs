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
  const notices=dispatchCaptureUiEvents([{type:'unknown_event'}]);
  assert.deepEqual(notices,[]);
}

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(pageSource,/data-capture-combat-feed/);
assert.match(pageSource,/aria-live="polite"/);
assert.match(pageSource,/consumeCaptureUiEvents\(session\)/);
assert.match(pageSource,/dispatchCaptureUiEvents\(consumed\.events,renderNotice\)/);
const flushBody=pageSource.slice(pageSource.indexOf('function flushUiEvents'),pageSource.indexOf('return {',pageSource.indexOf('function flushUiEvents')));
assert.equal(flushBody.includes('setCaptureBattleBlocking'),false);
assert.equal(pageSource.includes('alert('),false);
assert.equal(pageSource.includes('confirm('),false);
assert.equal(pageSource.includes('setInterval('),false);

console.log('capture-ui-dispatcher.test.mjs: ok');
