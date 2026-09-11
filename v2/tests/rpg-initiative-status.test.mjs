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
const blessing = { id: 'blessing-buff', enabled: true, kind: 'stat-modifier', statId: 'speed', operation: 'add', value: 2, chance: 100 };
const slow = { id: 'slow-debuff', enabled: true, kind: 'stat-modifier', statId: 'speed', operation: 'subtract', value: 1, chance: 100 };
const definitions = { stats: [speed], resources: [hp], effects: [poison, haste, blessing, slow] };
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

let persistent = addPersistentStatus(actor, { id: 'haste', sourceId: 'skill:haste', label: 'Hâte', effectId: 'haste-buff', duration: 2 }, { definitions, context: { randomPercent: () => 0 } });
assert.equal(persistent.ok, true);
actor = persistent.actor;
assert.equal(actor.state.stats.speed, 8, 'persistent stat modifier must apply once');
assert.equal(actor.statuses.find(x => x.id === 'haste').remaining, 2);
assert.equal(actor.statuses.find(x => x.id === 'haste').sourceId, 'skill:haste');
assert.equal(actor.statuses.find(x => x.id === 'haste').modifier.appliedDelta, 3);

persistent = addPersistentStatus(actor, { id: 'haste', sourceId: 'skill:haste', effectId: 'haste-buff', duration: 4 }, { definitions, context: { randomPercent: () => 0 } });
assert.equal(persistent.refreshed, true);
actor = persistent.actor;
assert.equal(actor.state.stats.speed, 8, 'refresh must not stack the stat modifier again');
assert.equal(actor.statuses.find(x => x.id === 'haste').remaining, 4);

actor = decayStatuses(actor, 3);
assert.equal(actor.state.stats.speed, 8);
assert.equal(actor.statuses.find(x => x.id === 'haste').remaining, 1);
actor = decayStatuses(actor, 1);
assert.equal(actor.state.stats.speed, 5, 'expired persistent stat modifier must remove only its own delta');
assert.equal(actor.statuses.some(x => x.id === 'haste'), false);

// Two independent sources on the same stat must coexist and expire independently.
let layered = { id: 'layered', state: { stats: { speed: 5 } }, statuses: [] };
let out = addPersistentStatus(layered, { id: 'haste-a', sourceId: 'skill:a', effectId: 'haste-buff', duration: 1 }, { definitions, context: { randomPercent: () => 0 } });
layered = out.actor;
out = addPersistentStatus(layered, { id: 'blessing-b', sourceId: 'aura:b', effectId: 'blessing-buff', duration: 3 }, { definitions, context: { randomPercent: () => 0 } });
layered = out.actor;
out = addPersistentStatus(layered, { id: 'slow-c', sourceId: 'trap:c', effectId: 'slow-debuff', duration: 2 }, { definitions, context: { randomPercent: () => 0 } });
layered = out.actor;
assert.equal(layered.state.stats.speed, 9, '5 + 3 + 2 - 1');
layered = decayStatuses(layered, 1);
assert.equal(layered.state.stats.speed, 6, 'expiring +3 must preserve +2 and -1 from other sources');
assert.equal(layered.statuses.some(x => x.id === 'haste-a'), false);
layered.state.stats.speed += 1; // unrelated progression/equipment change while statuses are active
layered = decayStatuses(layered, 1);
assert.equal(layered.state.stats.speed, 8, 'expiring -1 must preserve unrelated stat changes and the +2 source');
layered = decayStatuses(layered, 1);
assert.equal(layered.state.stats.speed, 6, 'final +2 source expires without restoring an obsolete absolute value');
assert.equal(layered.statuses.length, 0);

// Legacy serialized V2 statuses still use the old absolute rollback path.
const legacy = decayStatuses({state:{stats:{speed:8}},statuses:[{id:'legacy',persistent:true,remaining:1,revert:{kind:'stat',id:'speed',previousValue:5}}]},1);
assert.equal(legacy.state.stats.speed,5);

console.log('rpg-initiative-status.test.mjs: OK');
