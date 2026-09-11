import assert from 'node:assert/strict';
import { createCombatState } from '../src/modes/rpg/combat-engine.js';
import { beginActiveTurn, endActiveTurn, reconcileCombatState, markCombatantDefeated } from '../src/modes/rpg/combat-session.js';

const hpRule = { enabled: true, kind: 'resource', sourceId: 'hp', operator: 'lte', threshold: 0 };

let combat = createCombatState({ combatants: [
  { id: 'hero1', side: 'heroes', initiative: 20, state: { resources: { hp: { current: 0, max: 10 } } } },
  { id: 'hero2', side: 'heroes', initiative: 15, state: { resources: { hp: { current: 10, max: 10 } } } },
  { id: 'enemy', side: 'enemies', initiative: 10, state: { resources: { hp: { current: 10, max: 10 } } } },
]});

combat = reconcileCombatState(combat, { defeatRule: hpRule });
assert.equal(combat.actors.hero1.ko, true);
assert.equal(combat.activeActorId, 'hero2');
assert.equal(combat.phase, 'turn');
assert.ok(combat.log.some(e => e.type === 'ko-skipped' && e.skippedActorId === 'hero1'));

let begun = beginActiveTurn(combat, { defeatRule: hpRule });
assert.equal(begun.combat.activeActorId, 'hero2');
assert.equal(begun.combat.phase, 'turn');

let ended = endActiveTurn(begun.combat, { defeatRule: hpRule });
assert.equal(ended.combat.activeActorId, 'enemy');

combat = markCombatantDefeated(ended.combat, 'enemy', 'test');
assert.equal(combat.phase, 'ended');
assert.equal(combat.winner, 'heroes');
assert.equal(combat.activeActorId, null);
assert.equal(combat.log.filter(e => e.type === 'combat-ended').length, 1);

combat = reconcileCombatState(combat, { defeatRule: hpRule });
assert.equal(combat.log.filter(e => e.type === 'combat-ended').length, 1, 'combat end must be logged exactly once');

console.log('rpg-combat-session.test.mjs: OK');
