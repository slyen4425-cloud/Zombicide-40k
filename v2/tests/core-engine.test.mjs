import assert from 'node:assert/strict';
import { compareValues, evaluateCondition, evaluateConditions } from '../src/core/conditions.js';
import { applyNumericOperation, applyEffect } from '../src/core/effects.js';

assert.equal(compareValues(10, 'gte', 10), true);
assert.equal(compareValues(9, 'gt', 10), false);
assert.equal(evaluateCondition({ sourceKind: 'stat', sourceId: 'stealth', operator: 'gte', value: 8 }, { stats: { stealth: 9 } }), true);
assert.equal(evaluateConditions([
  { sourceKind: 'level', operator: 'gte', value: 5 },
  { sourceKind: 'resource', sourceId: 'ki', operator: 'gte', value: 40 },
], { level: 8, resources: { ki: { current: 50 } } }), true);
assert.equal(applyNumericOperation(10, 'percent', 50), 15);

const definitions = {
  stats: [{ id: 'force', baseValue: 10, min: 0, max: 20 }],
  resources: [{ id: 'ki', min: 0, maxFormula: { kind: 'fixed', value: 100 } }],
};
const state = { stats: { force: 10 }, resources: { ki: { current: 80, max: 100 } } };
const statResult = applyEffect({ kind: 'stat-modifier', statId: 'force', operation: 'add', value: 15, chance: 100 }, state, definitions, { randomPercent: () => 0 });
assert.equal(statResult.applied, true);
assert.equal(statResult.state.stats.force, 20, 'stat max must clamp');
assert.equal(state.stats.force, 10, 'effect engine must not mutate input state');

const resourceResult = applyEffect({ kind: 'resource-modifier', resourceId: 'ki', operation: 'subtract', value: 40, chance: 100 }, state, definitions, { randomPercent: () => 0 });
assert.equal(resourceResult.state.resources.ki.current, 40);

console.log('GenSrpG V2 core engine tests: OK');
