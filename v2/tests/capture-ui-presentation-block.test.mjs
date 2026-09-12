import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAPTURE_PUBLIC_RUNTIME_CONTRACT,
  CAPTURE_UI_PRESENTATION_BLOCK_CONTRACT,
  createCaptureModeState,
  createCaptureUiPresentationBlockState,
  createCaptureUiVisualPauseControllerState,
  setCaptureUiPresentationBlocked,
  setCaptureUiVisualPauseReason,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_PUBLIC_RUNTIME_CONTRACT.canonicalUiPresentationBlock,true);
assert.equal(CAPTURE_UI_PRESENTATION_BLOCK_CONTRACT.presentationOnly,true);
assert.equal(CAPTURE_UI_PRESENTATION_BLOCK_CONTRACT.pausesVisualTimeOnly,true);
assert.equal(CAPTURE_UI_PRESENTATION_BLOCK_CONTRACT.doesNotBlockGameplay,true);
assert.equal(CAPTURE_UI_PRESENTATION_BLOCK_CONTRACT.reason,'presentation-block');
assert.equal(CAPTURE_UI_PRESENTATION_BLOCK_CONTRACT.mutatesGameplayState,false);

{
  let block=createCaptureUiPresentationBlockState();
  const gameplay=createCaptureModeState();
  const before=structuredClone(gameplay);
  const opened=setCaptureUiPresentationBlocked(block,true,{kind:'details',metadata:{entityId:'capture_braiseau'}});
  assert.equal(opened.ok,true);
  assert.equal(opened.state.blocked,true);
  assert.equal(opened.state.kind,'details');
  assert.equal(opened.pauseReason,'presentation-block');
  assert.equal(opened.paused,true);
  assert.deepEqual(gameplay,before);

  block=opened.state;
  const closed=setCaptureUiPresentationBlocked(block,false);
  assert.equal(closed.state.blocked,false);
  assert.equal(closed.state.kind,null);
  assert.deepEqual(closed.state.metadata,{});
  assert.equal(closed.paused,false);
  assert.deepEqual(gameplay,before);
}

{
  let controller=createCaptureUiVisualPauseControllerState();
  let result=setCaptureUiVisualPauseReason(controller,'activity',true);
  controller=result.controller;
  assert.equal(result.transition,'pause');

  const block=setCaptureUiPresentationBlocked(createCaptureUiPresentationBlockState(),true,{kind:'overlay'});
  result=setCaptureUiVisualPauseReason(controller,block.pauseReason,block.paused);
  controller=result.controller;
  assert.equal(result.transition,'none');
  assert.deepEqual(controller.reasons,['activity','presentation-block']);

  const close=setCaptureUiPresentationBlocked(block.state,false);
  result=setCaptureUiVisualPauseReason(controller,close.pauseReason,close.paused);
  controller=result.controller;
  assert.equal(result.transition,'none');
  assert.deepEqual(controller.reasons,['activity']);

  result=setCaptureUiVisualPauseReason(controller,'activity',false);
  assert.equal(result.transition,'resume');
  assert.deepEqual(result.controller.reasons,[]);
}

const moduleSource=fs.readFileSync(new URL('../src/modes/capture/ui-presentation-block.js',import.meta.url),'utf8');
for(const forbidden of ['setCaptureBattleBlocking','advanceCaptureDriver','advanceCaptureTime','setInterval(','requestAnimationFrame(','Date.now(','performance.now(']){
  assert.equal(moduleSource.includes(forbidden),false,`presentation block must not include ${forbidden}`);
}

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(pageSource,/setPresentationBlocking\(blocking,options=\{\}\)/);
assert.match(pageSource,/setCaptureUiPresentationBlocked\(presentationBlock,blocking,options\)/);
assert.match(pageSource,/applyVisualPauseReason\(result\.pauseReason,result\.paused\)/);
assert.match(pageSource,/gameplayDriverStatus:session\.driver\?\.status\?\?null/);
assert.equal(pageSource.includes("applyVisualPauseReason('presentation-block',true)"),true);

console.log('capture-ui-presentation-block.test.mjs: ok');
