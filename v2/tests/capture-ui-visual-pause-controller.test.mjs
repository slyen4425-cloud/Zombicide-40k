import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAPTURE_UI_VISUAL_PAUSE_CONTROLLER_CONTRACT,
  clearCaptureUiVisualPauseReasons,
  createCaptureUiVisualPauseControllerState,
  isCaptureUiVisualPaused,
  setCaptureUiVisualPauseReason,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_UI_VISUAL_PAUSE_CONTROLLER_CONTRACT.presentationOnly,true);
assert.equal(CAPTURE_UI_VISUAL_PAUSE_CONTROLLER_CONTRACT.multipleReasons,true);
assert.equal(CAPTURE_UI_VISUAL_PAUSE_CONTROLLER_CONTRACT.resumesOnlyWhenClear,true);
assert.equal(CAPTURE_UI_VISUAL_PAUSE_CONTROLLER_CONTRACT.mutatesGameplayState,false);

let controller=createCaptureUiVisualPauseControllerState();
assert.equal(isCaptureUiVisualPaused(controller),false);

let result=setCaptureUiVisualPauseReason(controller,'activity',true);
assert.equal(result.ok,true);
assert.equal(result.transition,'pause');
controller=result.controller;
assert.deepEqual(controller.reasons,['activity']);

result=setCaptureUiVisualPauseReason(controller,'manual',true);
assert.equal(result.transition,'none');
controller=result.controller;
assert.deepEqual(controller.reasons,['activity','manual']);

result=setCaptureUiVisualPauseReason(controller,'activity',false);
assert.equal(result.transition,'none');
controller=result.controller;
assert.deepEqual(controller.reasons,['manual']);
assert.equal(isCaptureUiVisualPaused(controller),true);

result=setCaptureUiVisualPauseReason(controller,'manual',false);
assert.equal(result.transition,'resume');
controller=result.controller;
assert.deepEqual(controller.reasons,[]);
assert.equal(isCaptureUiVisualPaused(controller),false);

result=setCaptureUiVisualPauseReason(controller,'',true);
assert.equal(result.ok,false);
assert.equal(result.reason,'ui-visual-pause-reason-invalid');

controller=createCaptureUiVisualPauseControllerState({reasons:['manual','manual','activity']});
assert.deepEqual(controller.reasons,['manual','activity']);
const cleared=clearCaptureUiVisualPauseReasons(controller);
assert.equal(cleared.transition,'resume');
assert.deepEqual(cleared.controller.reasons,[]);

const source=fs.readFileSync(new URL('../src/modes/capture/ui-visual-pause-controller.js',import.meta.url),'utf8');
for(const forbidden of ['setInterval(','requestAnimationFrame(','Date.now(','performance.now(','advanceCaptureTime','advanceCaptureDriver']){
  assert.equal(source.includes(forbidden),false,`pause controller must not include ${forbidden}`);
}

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(pageSource,/createCaptureUiVisualPauseControllerState/);
assert.match(pageSource,/setNoticeVisualPauseReason/);
assert.match(pageSource,/applyVisualPauseReason\('manual',true\)/);
assert.match(pageSource,/applyVisualPauseReason\('manual',false\)/);
assert.match(pageSource,/setNoticeVisualPauseReason\('activity',true\)/);
assert.match(pageSource,/setNoticeVisualPauseReason\('activity',false\)/);

console.log('capture-ui-visual-pause-controller.test.mjs: ok');
