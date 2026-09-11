import assert from 'node:assert/strict';
import { createCombatState, queueCombatAction, resolveQueuedAction, advanceCombatTurn, resolveCheck } from '../src/modes/rpg/combat-engine.js';

const hp = { id: 'hp', min: 0, maxFormula: { kind: 'fixed', value: 20 } };
const hit = { id: 'hit3', enabled: true, kind: 'resource-modifier', resourceId: 'hp', operation: 'subtract', value: 3, chance: 100 };
const definitions = { resources: [hp], effects: [hit] };

let combat = createCombatState({ combatants: [
  { id: 'hero', side: 'heroes', initiative: 12, state: { resources: { hp: { current: 20, max: 20 } } } },
  { id: 'enemy', side: 'enemies', initiative: 8, state: { resources: { hp: { current: 20, max: 20 } } } },
]});
assert.equal(combat.activeActorId, 'hero');
assert.equal(combat.turnSequence, 1);

const check = resolveCheck({ die: 100, roll: 30, statValue: 10, difficulty: 50, mode: 'roll-under' });
assert.equal(check.success, true);

let queued = queueCombatAction(combat, { id: 'action-1', actorId: 'hero', turnSequence: combat.turnSequence, targetId: 'enemy', check: { die: 100, statValue: 10, difficulty: 50, mode: 'roll-under' }, effectIds: ['hit3'] });
assert.equal(queued.accepted, true);
combat = queued.combat;

let resolved = resolveQueuedAction(combat, { definitions, checkResult: check, randomPercent: () => 0 });
assert.equal(resolved.resolved, true);
assert.equal(resolved.combat.actors.enemy.state.resources.hp.current, 17);
combat = resolved.combat;

const duplicate = queueCombatAction(combat, { id: 'action-1', actorId: 'hero', turnSequence: combat.turnSequence, targetId: 'enemy', effectIds: ['hit3'] });
assert.equal(duplicate.accepted, false);
assert.equal(duplicate.reason, 'duplicate-action');
assert.equal(combat.actors.enemy.state.resources.hp.current, 17);

const heroTurnSequence = combat.turnSequence;
combat = advanceCombatTurn(combat);
assert.equal(combat.activeActorId, 'enemy');
assert.equal(combat.turnSequence, heroTurnSequence + 1);

const stale = queueCombatAction(combat, { id: 'late-hero-click', actorId: 'enemy', turnSequence: heroTurnSequence, targetId: 'hero', effectIds: ['hit3'] });
assert.equal(stale.accepted, false);
assert.equal(stale.reason, 'stale-turn');
assert.equal(combat.actors.hero.state.resources.hp.current, 20);

console.log('rpg-combat-engine.test.mjs: OK');
