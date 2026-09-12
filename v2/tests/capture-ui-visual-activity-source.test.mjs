import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAPTURE_UI_VISUAL_ACTIVITY_SOURCE_CONTRACT,
  advanceCaptureUiVisualDriver,
  appendCaptureUiNotices,
  attachCaptureUiVisualActivitySource,
  createCaptureUiNoticeFeed,
  createCaptureUiVisualClockAdapterState,
  createCaptureUiVisualDriverState,
  pauseCaptureUiVisualClockAdapter,
  pauseCaptureUiVisualDriver,
  resumeCaptureUiVisualClockAdapter,
  resumeCaptureUiVisualDriver,
  sampleCaptureUiVisualClock,
  startCaptureUiVisualClockAdapter,
  startCaptureUiVisualDriver,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_UI_VISUAL_ACTIVITY_SOURCE_CONTRACT.presentationOnly,true);
assert.equal(CAPTURE_UI_VISUAL_ACTIVITY_SOURCE_CONTRACT.visibilityDriven,true);
assert.equal(CAPTURE_UI_VISUAL_ACTIVITY_SOURCE_CONTRACT.pausesVisualTimeOnly,true);
assert.equal(CAPTURE_UI_VISUAL_ACTIVITY_SOURCE_CONTRACT.resetsClockAnchorOnResume,true);
assert.equal(CAPTURE_UI_VISUAL_ACTIVITY_SOURCE_CONTRACT.ownsBrowserApi,false);
assert.equal(CAPTURE_UI_VISUAL_ACTIVITY_SOURCE_CONTRACT.mutatesGameplayState,false);

{
  let subscriber=null;
  let unsubscribed=0;
  const events=[];
  const source={
    subscribe(handler){
      subscriber=handler;
      return ()=>{unsubscribed+=1;subscriber=null;};
    },
  };
  const attachment=attachCaptureUiVisualActivitySource(source,{
    onInactive:()=>events.push('inactive'),
    onActive:()=>events.push('active'),
  });
  assert.equal(attachment.ok,true);
  subscriber?.({visible:true});
  subscriber?.({visible:true});
  subscriber?.({visible:false});
  subscriber?.({active:false});
  subscriber?.(true);
  assert.deepEqual(events,['active','inactive','active']);
  assert.equal(attachment.detach(),true);
  assert.equal(attachment.detach(),false);
  assert.equal(unsubscribed,1);
}

{
  let feed=createCaptureUiNoticeFeed({expireAfterVisualTime:10});
  feed=appendCaptureUiNotices(feed,[{type:'ko',message:'KO',blocking:false}]);
  let driver=startCaptureUiVisualDriver(createCaptureUiVisualDriverState());
  let adapter=startCaptureUiVisualClockAdapter(createCaptureUiVisualClockAdapterState());

  let sampled=sampleCaptureUiVisualClock(feed,driver,adapter,{sample:100});
  feed=sampled.feed; driver=sampled.visualDriver; adapter=sampled.adapter;
  sampled=sampleCaptureUiVisualClock(feed,driver,adapter,{sample:104});
  assert.equal(sampled.feed.visualTime,4);
  feed=sampled.feed; driver=sampled.visualDriver; adapter=sampled.adapter;

  driver=pauseCaptureUiVisualDriver(driver);
  adapter=pauseCaptureUiVisualClockAdapter(adapter);
  sampled=sampleCaptureUiVisualClock(feed,driver,adapter,{sample:1000});
  assert.equal(sampled.reason,'ui-visual-clock-paused');
  assert.equal(sampled.feed.visualTime,4);

  driver=resumeCaptureUiVisualDriver(driver);
  adapter=resumeCaptureUiVisualClockAdapter(adapter);
  sampled=sampleCaptureUiVisualClock(feed,driver,adapter,{sample:2000});
  assert.equal(sampled.reason,'ui-visual-clock-anchored');
  assert.equal(sampled.feed.visualTime,4);
  feed=sampled.feed; driver=sampled.visualDriver; adapter=sampled.adapter;
  sampled=sampleCaptureUiVisualClock(feed,driver,adapter,{sample:2003});
  assert.equal(sampled.delta,3);
  assert.equal(sampled.feed.visualTime,7);
}

{
  assert.equal(attachCaptureUiVisualActivitySource({}, {onInactive(){},onActive(){}}).reason,'ui-visual-activity-source-subscribe-missing');
  assert.equal(attachCaptureUiVisualActivitySource({subscribe(){return ()=>{};}},{}).reason,'ui-visual-activity-source-handler-missing');
  assert.equal(attachCaptureUiVisualActivitySource({subscribe(){return null;}},{onInactive(){},onActive(){}}).reason,'ui-visual-activity-source-unsubscribe-missing');
}

const sourceText=fs.readFileSync(new URL('../src/modes/capture/ui-visual-activity-source.js',import.meta.url),'utf8');
for(const forbidden of ['setInterval(','requestAnimationFrame(','Date.now(','performance.now(','advanceCaptureTime','advanceCaptureDriver']){
  assert.equal(sourceText.includes(forbidden),false,`activity source must not include ${forbidden}`);
}

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(pageSource,/visualActivitySource=null/);
assert.match(pageSource,/attachCaptureUiVisualActivitySource\(visualActivitySource/);
assert.match(pageSource,/onInactive:\(\)=>api\.pauseNoticeVisualClock\(\)/);
assert.match(pageSource,/onActive:\(\)=>api\.resumeNoticeVisualClock\(\)/);
assert.match(pageSource,/visualActivitySourceAttachment\.detach\(\)/);

console.log('capture-ui-visual-activity-source.test.mjs: ok');
