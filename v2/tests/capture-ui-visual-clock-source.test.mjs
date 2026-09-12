import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAPTURE_UI_VISUAL_CLOCK_SOURCE_CONTRACT,
  attachCaptureUiVisualClockSource,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_UI_VISUAL_CLOCK_SOURCE_CONTRACT.presentationOnly,true);
assert.equal(CAPTURE_UI_VISUAL_CLOCK_SOURCE_CONTRACT.sourceInjected,true);
assert.equal(CAPTURE_UI_VISUAL_CLOCK_SOURCE_CONTRACT.subscribeUnsubscribeRequired,true);
assert.equal(CAPTURE_UI_VISUAL_CLOCK_SOURCE_CONTRACT.fixedRealtimeCadence,false);
assert.equal(CAPTURE_UI_VISUAL_CLOCK_SOURCE_CONTRACT.ownsBrowserApi,false);
assert.equal(CAPTURE_UI_VISUAL_CLOCK_SOURCE_CONTRACT.mutatesGameplayState,false);

{
  const received=[];
  let subscriber=null;
  let unsubscribed=0;
  const source={
    subscribe(handler){
      subscriber=handler;
      return ()=>{unsubscribed+=1;subscriber=null;};
    },
  };
  const attachment=attachCaptureUiVisualClockSource(source,sample=>received.push(sample));
  assert.equal(attachment.ok,true);
  assert.equal(attachment.attached,true);
  subscriber?.(10);
  subscriber?.(13);
  assert.deepEqual(received,[10,13]);
  assert.equal(attachment.detach(),true);
  assert.equal(unsubscribed,1);
  assert.equal(attachment.detach(),false);
  assert.equal(unsubscribed,1);
}

{
  const missingSubscribe=attachCaptureUiVisualClockSource({},()=>{});
  assert.equal(missingSubscribe.ok,false);
  assert.equal(missingSubscribe.reason,'ui-visual-clock-source-subscribe-missing');

  const missingHandler=attachCaptureUiVisualClockSource({subscribe(){return ()=>{};}},null);
  assert.equal(missingHandler.ok,false);
  assert.equal(missingHandler.reason,'ui-visual-clock-source-handler-missing');

  const missingUnsubscribe=attachCaptureUiVisualClockSource({subscribe(){return null;}},()=>{});
  assert.equal(missingUnsubscribe.ok,false);
  assert.equal(missingUnsubscribe.reason,'ui-visual-clock-source-unsubscribe-missing');
}

const sourceText=fs.readFileSync(new URL('../src/modes/capture/ui-visual-clock-source.js',import.meta.url),'utf8');
for(const forbidden of ['setInterval(','requestAnimationFrame(','Date.now(','performance.now(','advanceCaptureTime','advanceCaptureDriver']){
  assert.equal(sourceText.includes(forbidden),false,`visual clock source must not include ${forbidden}`);
}

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(pageSource,/visualClockSource=null/);
assert.match(pageSource,/attachCaptureUiVisualClockSource\(visualClockSource/);
assert.match(pageSource,/visualClockSourceAttachment\.detach\(\)/);
assert.match(pageSource,/api\.startNoticeVisualClock\(\)/);
assert.equal(pageSource.includes('setInterval('),false);
assert.equal(pageSource.includes('requestAnimationFrame('),false);
assert.equal(pageSource.includes('Date.now('),false);
assert.equal(pageSource.includes('performance.now('),false);

console.log('capture-ui-visual-clock-source.test.mjs: ok');
