import assert from 'node:assert/strict';
import { buildInitiativeOrder, calculateInitiative } from '../src/modes/rpg/initiative.js';
import { addTimedStatus, addPersistentStatus, processStatuses, decayStatuses } from '../src/modes/rpg/status-engine.js';

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
const speed = { id: 'speed', min: 0, max: 20, baseValue: 5 };
const poison = { id: 'poison-tick', enabled: true, kind: 'resource-modifier', resourceId: 'hp', operation: 'subtract', value: 2, chance: 100 };
const haste = { id: 'haste-buff', enabled: true, kind: 'stat-modifier', statId: 'speed', operation: 'add', value: 3, chance: 100 };
const definitions = { stats: [speed], resources: [hp], effects: [poison, haste] };
let actor = { id: 'hero', state: { stats: { speed: 5 }, resources: { hp: { current: 20, max: 20 } } }, statuses: [] };
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
actor = processed.actor;
assert.equal(actor.state.resources.hp.current, 14);

let persistent = addPersistentStatus(actor, { id: 'haste', label: 'Hâte', effectId: 'haste-buff', duration: 2 }, { definitions, context: { randomPercent: () => 0 } });
assert.equal(persistent.ok, true);
actor = persistent.actor;
assert.equal(actor.state.stats.speed, 8, 'persistent stat modifier must apply once');
assert.equal(actor.statuses.find(x => x.id === 'haste').remaining, 2);

persistent = addPersistentStatus(actor, { id: 'haste', effectId: 'haste-buff', duration: 4 }, { definitions, context: { randomPercent: () => 0 } });
assert.equal(persistent.refreshed, true);
actor = persistent.actor;
assert.equal(actor.state.stats.speed, 8, 'refresh must not stack the stat modifier again');
assert.equal(actor.statuses.find(x => x.id === 'haste').remaining, 4);

actor = decayStatuses(actor, 3);
assert.equal(actor.state.stats.speed, 8);
assert.equal(actor.statuses.find(x => x.id === 'haste').remaining, 1);
actor = decayStatuses(actor, 1);
assert.equal(actor.state.stats.speed, 5, 'expired persistent stat modifier must restore prior value');
assert.equal(actor.statuses.some(x => x.id === 'haste'), false);

console.log('rpg-initiative-status.test.mjs: OK');
