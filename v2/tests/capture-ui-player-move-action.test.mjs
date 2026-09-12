import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as captureRuntime from '../src/modes/capture/runtime.js';

assert.equal(captureRuntime.CAPTURE_PUBLIC_RUNTIME_CONTRACT.canonicalPlayerMoveAction,true);
assert.equal(typeof captureRuntime.executeCapturePlayerMove,'function');
assert.equal(captureRuntime.CAPTURE_PLAYER_MOVE_ACTION_CONTRACT.cardinalStepOnly,true);
assert.equal(captureRuntime.CAPTURE_PLAYER_MOVE_ACTION_CONTRACT.oneCellPerCommand,true);
assert.equal(captureRuntime.CAPTURE_PLAYER_MOVE_ACTION_CONTRACT.diagonal,false);

const pageSource=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(pageSource,/executeCapturePlayerMove/);
assert.match(pageSource,/data-capture-player-move-controls/);
assert.match(pageSource,/data-capture-move-direction="up"/);
assert.match(pageSource,/data-capture-move-direction="down"/);
assert.match(pageSource,/data-capture-move-direction="left"/);
assert.match(pageSource,/data-capture-move-direction="right"/);
assert.match(pageSource,/battleActive&&entry\.location==='active'&&entry\.activeInBattle&&!entry\.ko/);
assert.match(pageSource,/executeCapturePlayerMove\(session\.state,\{direction\}\)/);
assert.match(pageSource,/api\.movePlayer\(direction\)/);
assert.match(pageSource,/activeList\.addEventListener\('click',handlePlayerMoveClick\)/);
assert.match(pageSource,/activeList\.removeEventListener\('click',handlePlayerMoveClick\)/);
assert.doesNotMatch(pageSource,/moveCaptureBattleCreature\(/);
assert.doesNotMatch(pageSource,/getActorPosition\(/);
assert.doesNotMatch(pageSource,/setActorPosition\(/);
assert.doesNotMatch(pageSource,/Math\.random\(/);
assert.doesNotMatch(pageSource,/\.\.\/rpg\//);

console.log('capture-ui-player-move-action.test.mjs: ok');
