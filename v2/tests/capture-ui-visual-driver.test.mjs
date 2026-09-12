import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAPTURE_UI_VISUAL_DRIVER_CONTRACT,
  advanceCaptureUiVisualDriver,
  appendCaptureUiNotices,
  captureUiNoticeFeedNotices,
  createCaptureModeState,
  createCaptureUiNoticeFeed,
  createCaptureUiVisualDriverState,
  pauseCaptureUiVisualDriver,
  resumeCaptureUiVisualDriver,
  startCaptureUiVisualDriver,
  stopCaptureUiVisualDriver,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_UI_VISUAL_DRIVER_CONTRACT.presentationOnly,true);
assert.equal(CAPTURE_UI_VISUAL_DRIVER_CONTRACT.independentFromGameplayDriver,true);
assert.equal(CAPTURE_UI_VISUAL_DRIVER_CONTRACT.ownsRealtimeLoop,false);
assert.equal(CAPTURE_UI_VISUAL_DRIVER_CONTRACT.fixedRealtimeCadence,false);
assert.equal(CAPTURE_UI_VISUAL_DRIVER_CONTRACT.mutatesGameplayState,false);

{
  let feed=createCaptureUiNoticeFeed({expireAfterVisualTime:3});
  feed=appendCaptureUiNotices(feed,[{type:'ko',message:'Adversaire K.O.',blocking:false}]);
  let driver=createCaptureUiVisualDriverState();
  const stopped=advanceCaptureUiVisualDriver(feed,driver,{delta:3});
  assert.equal(stopped.reason,'ui-visual-driver-stopped');
  assert.equal(captureUiNoticeFeedNotices(stopped.feed).length,1);

  driver=startCaptureUiVisualDriver(driver);
  const advanced=advanceCaptureUiVisualDriver(feed,driver,{delta:2});
  assert.equal(advanced.ok,true);
  assert.equal(advanced.feed.visualTime,2);
  assert.equal(captureUiNoticeFeedNotices(advanced.feed).length,1);
  assert.equal(advanced.driver.frames,1);
  assert.equal(advanced.driver.totalVisualDelta,2);

  const expired=advanceCaptureUiVisualDriver(advanced.feed,advanced.driver,{delta:1});
  assert.equal(expired.feed.visualTime,3);
  assert.equal(captureUiNoticeFeedNotices(expired.feed).length,0);
}

{
  let driver=startCaptureUiVisualDriver(createCaptureUiVisualDriverState());
  driver=pauseCaptureUiVisualDriver(driver);
  const feed=createCaptureUiNoticeFeed({expireAfterVisualTime:1});
  const paused=advanceCaptureUiVisualDriver(feed,driver,{delta:99});
  assert.equal(paused.reason,'ui-visual-driver-paused');
  assert.equal(paused.feed.visualTime,0);
  driver=resumeCaptureUiVisualDriver(paused.driver);
  assert.equal(driver.status,'running');
  driver=stopCaptureUiVisualDriver(driver);
  assert.equal(driver.status,'stopped');
}

{
  const gameplay=createCaptureModeState();
  const before=structuredClone(gameplay);
  let feed=createCaptureUiNoticeFeed({expireAfterVisualTime:1});
  feed=appendCaptureUiNotices(feed,[{type:'status_expired',message:'Statut terminé.',blocking:false}]);
  const driver=startCaptureUiVisualDriver(createCaptureUiVisualDriverState());
  advanceCaptureUiVisualDriver(feed,driver,{delta:1});
  assert.deepEqual(gameplay,before);
}

const driverSource=fs.readFileSync(new URL('../src/modes/capture/ui-visual-driver.js',import.meta.url),'utf8');
assert.equal(driverSource.includes('setInterval('),false);
assert.equal(driverSource.includes('requestAnimationFrame('),false);
assert.equal(driverSource.includes('Date.now('),false);
assert.equal(driverSource.includes('performance.now('),false);
assert.equal(driverSource.includes('advanceCaptureDriver'),false);
assert.equal(driverSource.includes('advanceCaptureTime'),false);

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(pageSource,/startNoticeVisualClock/);
assert.match(pageSource,/pauseNoticeVisualClock/);
assert.match(pageSource,/resumeNoticeVisualClock/);
assert.match(pageSource,/stopNoticeVisualClock/);
assert.match(pageSource,/sampleCaptureUiVisualClock\(noticeFeed,visualDriver,visualClockAdapter/);
assert.equal(pageSource.includes('setInterval('),false);
assert.equal(pageSource.includes('requestAnimationFrame('),false);

console.log('capture-ui-visual-driver.test.mjs: ok');
