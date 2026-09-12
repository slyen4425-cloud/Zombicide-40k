import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAPTURE_UI_VISUAL_CLOCK_ADAPTER_CONTRACT,
  appendCaptureUiNotices,
  captureUiNoticeFeedNotices,
  createCaptureModeState,
  createCaptureUiNoticeFeed,
  createCaptureUiVisualClockAdapterState,
  createCaptureUiVisualDriverState,
  sampleCaptureUiVisualClock,
  startCaptureUiVisualClockAdapter,
  startCaptureUiVisualDriver,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_UI_VISUAL_CLOCK_ADAPTER_CONTRACT.presentationOnly,true);
assert.equal(CAPTURE_UI_VISUAL_CLOCK_ADAPTER_CONTRACT.externalSamplesRequired,true);
assert.equal(CAPTURE_UI_VISUAL_CLOCK_ADAPTER_CONTRACT.fixedTimeUnit,false);
assert.equal(CAPTURE_UI_VISUAL_CLOCK_ADAPTER_CONTRACT.ownsRealtimeLoop,false);
assert.equal(CAPTURE_UI_VISUAL_CLOCK_ADAPTER_CONTRACT.mutatesGameplayState,false);

let feed=createCaptureUiNoticeFeed({expireAfterVisualTime:5});
feed=appendCaptureUiNotices(feed,[{type:'ko',message:'K.O.',blocking:false}]);
let driver=startCaptureUiVisualDriver(createCaptureUiVisualDriverState());
let adapter=startCaptureUiVisualClockAdapter(createCaptureUiVisualClockAdapterState());
const gameplay=createCaptureModeState();
const gameplayBefore=structuredClone(gameplay);

const anchored=sampleCaptureUiVisualClock(feed,driver,adapter,{sample:100});
assert.equal(anchored.ok,true);
assert.equal(anchored.reason,'ui-visual-clock-anchored');
assert.equal(anchored.feed.visualTime,0);
assert.equal(anchored.adapter.lastSample,100);
assert.equal(captureUiNoticeFeedNotices(anchored.feed).length,1);

const advanced=sampleCaptureUiVisualClock(anchored.feed,anchored.visualDriver,anchored.adapter,{sample:104});
assert.equal(advanced.ok,true);
assert.equal(advanced.delta,4);
assert.equal(advanced.feed.visualTime,4);
assert.equal(captureUiNoticeFeedNotices(advanced.feed).length,1);
assert.equal(advanced.adapter.totalDelta,4);

const expired=sampleCaptureUiVisualClock(advanced.feed,advanced.visualDriver,advanced.adapter,{sample:105});
assert.equal(expired.ok,true);
assert.equal(expired.feed.visualTime,5);
assert.equal(captureUiNoticeFeedNotices(expired.feed).length,0);
assert.deepEqual(gameplay,gameplayBefore);

const backwards=sampleCaptureUiVisualClock(expired.feed,expired.visualDriver,expired.adapter,{sample:104});
assert.equal(backwards.ok,false);
assert.equal(backwards.reason,'ui-visual-clock-nonmonotonic');
assert.equal(backwards.adapter.lastSample,105);

const source=fs.readFileSync(new URL('../src/modes/capture/ui-visual-clock-adapter.js',import.meta.url),'utf8');
for(const forbidden of ['setInterval(','requestAnimationFrame(','Date.now(','performance.now(','advanceCaptureTime(','advanceCaptureDriver(']){
  assert.equal(source.includes(forbidden),false,`unexpected ${forbidden}`);
}

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(pageSource,/sampleNoticeVisualClock\(sample\)/);
assert.match(pageSource,/startCaptureUiVisualClockAdapter/);
assert.match(pageSource,/pauseCaptureUiVisualClockAdapter/);
assert.match(pageSource,/resumeCaptureUiVisualClockAdapter/);
assert.match(pageSource,/stopCaptureUiVisualClockAdapter/);
assert.equal(pageSource.includes('Date.now('),false);
assert.equal(pageSource.includes('performance.now('),false);
assert.equal(pageSource.includes('requestAnimationFrame('),false);

console.log('capture-ui-visual-clock-adapter.test.mjs: ok');
