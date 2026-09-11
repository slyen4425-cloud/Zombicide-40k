import assert from 'node:assert/strict';
import { survivalStorageIdentity, createDefaultSurvivalUniverse } from '../src/modes/survival/survival.js';

const survival=survivalStorageIdentity();
assert.equal(survival.mode,'survival');
assert.equal(survival.key,'survival_universe');
assert.notEqual(survival.key,'rpg_universe');

const universe=createDefaultSurvivalUniverse();
assert.equal(universe.mode,'survival');
assert.deepEqual(universe.rules.threatTiers,['BLUE','YELLOW','ORANGE','RED']);
assert.equal(Object.prototype.hasOwnProperty.call(universe,'forms'),false);
assert.equal(Object.prototype.hasOwnProperty.call(universe,'combat'),false);
assert.equal(Object.prototype.hasOwnProperty.call(universe,'spatialRules'),false);

console.log('mode isolation test ok');
