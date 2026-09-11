import assert from 'node:assert/strict';
import { buildInitiativeOrder, calculateInitiative } from '../src/modes/rpg/initiative.js';
import { addTimedStatus, processStatuses, decayStatuses } from '../src/modes/rpg/status-engine.js';

const rule = { mode: 'stat', source: { kind: 'stat', id: 'speed' }, base: 0 };
const actors = [
  { id: 'slow', side: 'heroes', state: { stats: { speed: 4 } } },
  { id: 'fast', side: 'heroes', state: { stats: { speed: 9 } } },
];
const ordered = buildInitiativeOrder(actors, rule);
assert.deepEqual(ordered.map(x => x.id), ['fast', 'slow']);

const rollInit = calculateInitiative(
  { id: 'hero', state: { stats: { speed: 5 } } },
  { mode: 'roll', die: 20, source: { kind: 'stat', id: 'speed' }, base: 2 },
  () => 0.45,
);
assert.equal(rollInit.roll, 10);
assert.equal(rollInit.total, 17);

const hp = { id: 'hp', min: 0, maxFormula: { kind: 'fixed', value: 20 } };
const poison = { id: 'poison-tick', enabled: true, kind: 'resource-modifier', resourceId: 'hp', operation: 'subtract', value: 2, chance: 100 };
const definitions = { resources: [hp], effects: [poison] };
let actor = { id: 'hero', state: { resources: { hp: { current: 20, max: 20 } } }, statuses: [] };
actor = addTimedStatus(actor, { id: 'poison', label: 'Poison', effectId: 'poison-tick', duration: 3, timing: 'turn-start' });
let processed = processStatuses(actor, 'turn-start', { definitions, context: { randomPercent: () => 0 } });
actor = processed.actor;
assert.equal(actor.state.resources.hp.current, 18);
assert.equal(processed.events[0].applied, true);
actor = decayStatuses(actor);
assert.equal(actor.statuses[0].remaining, 2);

actor = addTimedStatus(actor, { id: 'poison', effectId: 'poison-tick', duration: 3, timing: 'turn-start', stackable: true, maxStacks: 3 });
assert.equal(actor.statuses[0].stacks, 2);
processed = processStatuses(actor, 'turn-start', { definitions, context: { randomPercent: () => 0 } });
assert.equal(processed.actor.state.resources.hp.current, 14);

console.log('rpg-initiative-status.test.mjs: OK');
