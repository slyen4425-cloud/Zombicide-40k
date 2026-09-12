import assert from 'node:assert/strict';
import { addPersistentStatus, decayStatuses } from '../src/modes/rpg/status-engine.js';

const definitions = {
  stats: [{ id: 'power', baseValue: 100, min: 0, max: 9999 }],
  effects: [
    { id: 'double', kind: 'stat-modifier', statId: 'power', operation: 'multiply', value: 2 },
    { id: 'plus10', kind: 'stat-modifier', statId: 'power', operation: 'add', value: 10 },
    { id: 'plus50pct', kind: 'stat-modifier', statId: 'power', operation: 'percent', value: 50 },
    { id: 'force80', kind: 'stat-modifier', statId: 'power', operation: 'set', value: 80 },
    { id: 'plus5', kind: 'stat-modifier', statId: 'power', operation: 'add', value: 5 },
  ],
};

function add(actor, id, effectId, duration) {
  const result = addPersistentStatus(actor, { id, effectId, duration }, { definitions });
  assert.equal(result.ok, true);
  return result.actor;
}

{
  let actor = { state: { stats: { power: 100 } }, statuses: [] };
  actor = add(actor, 'double-status', 'double', 3);
  actor = add(actor, 'plus-status', 'plus10', 1);
  actor = add(actor, 'percent-status', 'plus50pct', 2);
  assert.equal(actor.state.stats.power, 315);

  actor = decayStatuses(actor, 1, { definitions });
  assert.equal(actor.state.stats.power, 300, 'expiring +10 must recompose multiply then percent from the stable base');

  actor = decayStatuses(actor, 1, { definitions });
  assert.equal(actor.state.stats.power, 200, 'expiring percent must preserve the earlier multiply source');

  actor = decayStatuses(actor, 1, { definitions });
  assert.equal(actor.state.stats.power, 100, 'last persistent source must restore the original base');
  assert.deepEqual(actor.statusModifierBases || {}, {});
}

{
  let actor = { state: { stats: { power: 100 } }, statuses: [] };
  actor = add(actor, 'set-status', 'force80', 1);
  actor = add(actor, 'plus5-status', 'plus5', 2);
  assert.equal(actor.state.stats.power, 85);

  actor = decayStatuses(actor, 1, { definitions });
  assert.equal(actor.state.stats.power, 105, 'removing set must reveal the base before replaying later sources');

  actor = decayStatuses(actor, 1, { definitions });
  assert.equal(actor.state.stats.power, 100);
}

{
  const legacyActor = {
    state: { stats: { power: 115 } },
    statuses: [
      {
        id: 'legacy-a', persistent: true, timing: 'persistent', remaining: 1,
        modifier: { kind: 'stat', id: 'power', operation: 'add', value: 10, appliedDelta: 10 },
        revert: { kind: 'stat-delta', id: 'power', delta: 10 },
      },
      {
        id: 'legacy-b', persistent: true, timing: 'persistent', remaining: 2,
        modifier: { kind: 'stat', id: 'power', operation: 'add', value: 5, appliedDelta: 5 },
        revert: { kind: 'stat-delta', id: 'power', delta: 5 },
      },
    ],
  };

  const migrated = decayStatuses(legacyActor, 1, { definitions });
  assert.equal(migrated.state.stats.power, 105, 'old source-layered V2 statuses must recover their common base from stored deltas');
}

console.log('rpg-status-nonadditive: ok');
