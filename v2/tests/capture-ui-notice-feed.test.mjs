import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  advanceCaptureUiNoticeVisualTime,
  appendCaptureUiNotices,
  CAPTURE_UI_NOTICE_FEED_CONTRACT,
  captureUiNoticeFeedNotices,
  createCaptureUiNoticeFeed,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_UI_NOTICE_FEED_CONTRACT.presentationOnly,true);
assert.equal(CAPTURE_UI_NOTICE_FEED_CONTRACT.independentFromGameplayTime,true);
assert.equal(CAPTURE_UI_NOTICE_FEED_CONTRACT.fixedRealtimeCadence,false);

{
  let feed=createCaptureUiNoticeFeed({maxVisible:3});
  feed=appendCaptureUiNotices(feed,[
    {type:'a',message:'A'},
    {type:'b',message:'B'},
    {type:'c',message:'C'},
    {type:'d',message:'D'},
  ]);
  assert.deepEqual(captureUiNoticeFeedNotices(feed).map(entry=>entry.type),['b','c','d']);
  assert.equal(feed.items.length,3);
}

{
  let feed=createCaptureUiNoticeFeed({maxVisible:5,expireAfterVisualTime:3});
  feed=appendCaptureUiNotices(feed,[{type:'a',message:'A'}]);
  feed=advanceCaptureUiNoticeVisualTime(feed,2);
  assert.equal(feed.items.length,1);
  feed=appendCaptureUiNotices(feed,[{type:'b',message:'B'}]);
  feed=advanceCaptureUiNoticeVisualTime(feed,1);
  assert.deepEqual(captureUiNoticeFeedNotices(feed).map(entry=>entry.type),['b']);
  assert.equal(feed.visualTime,3);
}

{
  let feed=createCaptureUiNoticeFeed({maxVisible:2,expireAfterVisualTime:null});
  feed=appendCaptureUiNotices(feed,[{type:'a',message:'A'}]);
  feed=advanceCaptureUiNoticeVisualTime(feed,999);
  assert.equal(feed.items.length,1);
  assert.equal(feed.items[0].notice.type,'a');
}

const source=fs.readFileSync(new URL('../src/modes/capture/ui-notice-feed.js',import.meta.url),'utf8');
assert.equal(source.includes('advanceCaptureTime'),false);
assert.equal(source.includes('advanceCaptureDriver'),false);
assert.equal(source.includes('setInterval('),false);
assert.equal(source.includes('requestAnimationFrame('),false);
assert.equal(source.includes('Date.now('),false);
assert.equal(source.includes('performance.now('),false);

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.equal(pageSource.includes('sampleNoticeVisualClock(sample)'),true);
assert.equal(pageSource.includes('noticeMaxVisible=6'),true);
assert.equal(pageSource.includes('noticeExpireAfterVisualTime=null'),true);
assert.equal(pageSource.includes('sampleCaptureUiVisualClock'),true);

console.log('capture-ui-notice-feed.test.mjs: ok');
