import assert from 'node:assert/strict';
import { resolveFormula, resolveResourceMax, normalizeResourceState } from '../src/core/formulas.js';
import { applyEffect } from '../src/core/effects.js';

const defs = {
  stats:[{ id:'end', baseValue:10 }],
  resources:[{ id:'hp', min:0, maxFormula:{ kind:'stat', statId:'end', multiplier:2, add:5 } }],
};
const state = { stats:{ end:12 }, resources:{ hp:{ current:20, max:20 } } };
assert.equal(resolveFormula({ kind:'stat', statId:'end', multiplier:2, add:5 }, state, defs), 29);
assert.equal(resolveResourceMax(defs.resources[0], state, defs), 29);
assert.deepEqual(normalizeResourceState(defs.resources[0], state, defs), { current:20, max:29 });

const heal = { id:'heal', enabled:true, kind:'resource-modifier', resourceId:'hp', operation:'add', value:20, chance:100 };
const out = applyEffect(heal, state, defs, { randomPercent:()=>0 });
assert.equal(out.state.resources.hp.current, 29);
assert.equal(out.state.resources.hp.max, 29);

console.log('core-formulas.test.mjs: OK');
