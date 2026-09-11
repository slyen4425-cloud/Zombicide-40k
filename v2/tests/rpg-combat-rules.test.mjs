import assert from 'node:assert/strict';
import { evaluateDefeatRule, processActorTurnStart } from '../src/modes/rpg/combat-rules.js';
import { addTimedStatus } from '../src/modes/rpg/status-engine.js';

const actor = { id: 'hero', state: { resources: { vitality: { current: 1, max: 10 } } }, statuses: [] };
const rule = { enabled: true, kind: 'resource', sourceId: 'vitality', operator: 'lte', threshold: 0 };
assert.equal(evaluateDefeatRule(actor, rule), false);

const vitality = { id: 'vitality', min: 0, maxFormula: { kind: 'fixed', value: 10 } };
const bleed = { id: 'bleed', enabled: true, kind: 'resource-modifier', resourceId: 'vitality', operation: 'subtract', value: 1, chance: 100 };
const definitions = { resources: [vitality], effects: [bleed] };
let poisoned = addTimedStatus(actor, { id: 'bleeding', effectId: 'bleed', duration: 2, timing: 'turn-start' });
const out = processActorTurnStart(poisoned, { definitions, defeatRule: rule, context: { randomPercent: () => 0 } });
assert.equal(out.actor.state.resources.vitality.current, 0);
assert.equal(out.defeated, true);
assert.equal(out.actor.ko, true);
assert.equal(out.actor.statuses[0].remaining, 1);

const noRule = processActorTurnStart({ ...actor, statuses: [] }, { definitions, defeatRule: { kind: 'none' } });
assert.equal(noRule.defeated, false);

console.log('rpg-combat-rules.test.mjs: OK');
