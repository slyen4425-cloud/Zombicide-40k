import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  CAPTURE_UI_OVERLAY_CONTRACT,
  closeCaptureUiOverlay,
  createCaptureUiOverlayState,
  createCaptureUiVisualPauseControllerState,
  openCaptureUiOverlay,
  setCaptureUiVisualPauseReason,
} from '../src/modes/capture/runtime.js';

assert.equal(CAPTURE_UI_OVERLAY_CONTRACT.presentationOnly,true);
assert.equal(CAPTURE_UI_OVERLAY_CONTRACT.nonModal,true);
assert.equal(CAPTURE_UI_OVERLAY_CONTRACT.presentationBlocking,true);
assert.equal(CAPTURE_UI_OVERLAY_CONTRACT.mutatesGameplayState,false);
assert.equal(CAPTURE_UI_OVERLAY_CONTRACT.isolatedFromRpg,true);

{
  let overlay=createCaptureUiOverlayState();
  assert.equal(overlay.open,false);
  const opened=openCaptureUiOverlay(overlay,{kind:'help',title:'Aide',message:'Texte'});
  assert.equal(opened.ok,true);
  assert.equal(opened.presentationBlocked,true);
  assert.equal(opened.state.open,true);
  assert.equal(opened.state.kind,'help');
  assert.equal(opened.state.title,'Aide');
  assert.equal(opened.state.message,'Texte');
  const closed=closeCaptureUiOverlay(opened.state);
  assert.equal(closed.ok,true);
  assert.equal(closed.presentationBlocked,false);
  assert.equal(closed.state.open,false);
}

{
  let controller=createCaptureUiVisualPauseControllerState();
  controller=setCaptureUiVisualPauseReason(controller,'activity',true).controller;
  controller=setCaptureUiVisualPauseReason(controller,'presentation-block',true).controller;
  let result=setCaptureUiVisualPauseReason(controller,'presentation-block',false);
  assert.equal(result.transition,'none');
  assert.deepEqual(result.controller.reasons,['activity']);
  result=setCaptureUiVisualPauseReason(result.controller,'activity',false);
  assert.equal(result.transition,'resume');
  assert.deepEqual(result.controller.reasons,[]);
}

const overlaySource=fs.readFileSync(new URL('../src/modes/capture/ui-overlay.js',import.meta.url),'utf8');
for(const forbidden of ['setCaptureBattleBlocking','advanceCaptureTime','advanceCaptureDriver','setInterval(','requestAnimationFrame(','Date.now(','performance.now(']){
  assert.equal(overlaySource.includes(forbidden),false,`overlay must not include ${forbidden}`);
}

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(pageSource,/data-capture-overlay/);
assert.match(pageSource,/aria-modal="false"/);
assert.match(pageSource,/openOverlay\(options=\{\}\)/);
assert.match(pageSource,/closeOverlay\(\)/);
assert.match(pageSource,/setPresentationBlocking\(result\.presentationBlocked/);
assert.match(pageSource,/overlayClose\.addEventListener\('click',\(\)=>api\.closeOverlay\(\)\)/);
assert.equal(pageSource.includes("api.setBlocking(result.presentationBlocked"),false);

console.log('capture-ui-overlay.test.mjs: ok');
