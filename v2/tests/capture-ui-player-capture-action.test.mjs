import assert from 'node:assert/strict';
import fs from 'node:fs';
import * as captureRuntime from '../src/modes/capture/runtime.js';

assert.equal(captureRuntime.CAPTURE_PUBLIC_RUNTIME_CONTRACT.canonicalPlayerCaptureAction,true);
assert.equal(typeof captureRuntime.executeCapturePlayerCaptureAttempt,'function');

const source=fs.readFileSync(new URL('../src/modes/capture/capture-page.js',import.meta.url),'utf8');
assert.match(source,/captureConfig=\{\}/);
assert.match(source,/speciesCaptureRates/);
assert.match(source,/orbLibrary/);
assert.match(source,/lowHpMultiplier/);
assert.match(source,/data-capture-orb-controls/);
assert.match(source,/data-capture-use-orb/);
assert.match(source,/api\.attemptCapture\(orbId\)/);
assert.match(source,/executeCapturePlayerCaptureAttempt\(session\.state/);
assert.match(source,/captureCoefficient/);
assert.match(source,/inventory\?\.counts/);
assert.match(source,/\(current\/max\)\*100<30/);
assert.match(source,/result\.captured\?stopCaptureDriver/);
assert.equal(source.includes('CAPTURE_ORB_LIBRARY'),false);
assert.equal(source.includes('captureCoefficient:1'),false);
assert.equal(source.includes('lowHpMultiplier:2'),false);
assert.equal(source.includes('Math.random()'),false);
assert.equal(source.includes('../rpg/'),false);

console.log('capture-ui-player-capture-action.test.mjs: ok');
