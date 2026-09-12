import assert from 'node:assert/strict';
import {
  CAPTURE_ATTEMPT_CONTRACT,
  computeCaptureChance,
  resolveCaptureAttempt,
} from '../src/modes/capture/capture-attempt.js';

assert.equal(CAPTURE_ATTEMPT_CONTRACT.lowHpThresholdPercent,30);
assert.equal(CAPTURE_ATTEMPT_CONTRACT.unknownCoefficientPolicy,'block_attempt');
assert.equal(CAPTURE_ATTEMPT_CONTRACT.usesRpgCombatMath,false);

const configuredOrbs=[
  {id:'capture_orb_basic',legacyIds:['capture_orb_basic'],tier:1,captureCoefficient:1},
  {id:'capture_orb_plus',legacyIds:['capture_orb_plus'],tier:2,captureCoefficient:1.5},
];

const normal=computeCaptureChance({
  speciesCaptureRate:20,
  currentHp:50,
  maxHp:100,
  orbId:'capture_orb_plus',
  orbLibrary:configuredOrbs,
  lowHpMultiplier:2,
});
assert.equal(normal.ok,true);
assert.equal(normal.lowHp,false);
assert.equal(normal.chancePercent,30);

const low=computeCaptureChance({
  speciesCaptureRate:20,
  currentHp:29,
  maxHp:100,
  orbId:'capture_orb_plus',
  orbLibrary:configuredOrbs,
  lowHpMultiplier:2,
});
assert.equal(low.ok,true);
assert.equal(low.lowHp,true);
assert.equal(low.chancePercent,60);

const boundary=computeCaptureChance({
  speciesCaptureRate:20,
  currentHp:30,
  maxHp:100,
  orbId:'capture_orb_plus',
  orbLibrary:configuredOrbs,
  lowHpMultiplier:2,
});
assert.equal(boundary.lowHp,false);

const pendingOrb=computeCaptureChance({
  speciesCaptureRate:20,
  currentHp:20,
  maxHp:100,
  orbId:'capture_orb_basic',
  lowHpMultiplier:2,
});
assert.equal(pendingOrb.ok,false);
assert.equal(pendingOrb.reason,'pending_orb_coefficient');

const pendingHp=computeCaptureChance({
  speciesCaptureRate:20,
  currentHp:20,
  maxHp:100,
  orbId:'capture_orb_basic',
  orbLibrary:configuredOrbs,
});
assert.equal(pendingHp.ok,false);
assert.equal(pendingHp.reason,'pending_low_hp_multiplier');

const deterministicSuccess=resolveCaptureAttempt({
  speciesCaptureRate:20,
  currentHp:50,
  maxHp:100,
  orbId:'capture_orb_plus',
  orbLibrary:configuredOrbs,
  lowHpMultiplier:2,
},()=>0.2);
assert.equal(deterministicSuccess.captured,true);
assert.equal(deterministicSuccess.roll,20);

const deterministicFail=resolveCaptureAttempt({
  speciesCaptureRate:20,
  currentHp:50,
  maxHp:100,
  orbId:'capture_orb_plus',
  orbLibrary:configuredOrbs,
  lowHpMultiplier:2,
},()=>0.4);
assert.equal(deterministicFail.captured,false);
assert.equal(deterministicFail.roll,40);
