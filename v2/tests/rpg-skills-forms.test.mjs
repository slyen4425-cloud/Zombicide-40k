import assert from 'node:assert/strict';
import { resolveSkillUse, tickSkillCooldowns, recoverSkillCharges } from '../src/core/skills.js';
import { activateHeroForm, tickHeroForms, activeFormSkillIds } from '../src/core/hero-forms.js';

const stat = { id: 'force', name: 'Force', baseValue: 10, min: 0, max: 99 };
const ki = { id: 'ki', name: 'Ki', min: 0, maxFormula: { kind: 'fixed', value: 100 } };
const buff = { id: 'buff-force', enabled: true, kind: 'stat-modifier', statId: 'force', operation: 'add', value: 5, chance: 100 };
const hit = { id: 'hit', enabled: true, kind: 'resource-modifier', resourceId: 'hp', operation: 'subtract', value: 3, chance: 100 };
const hp = { id: 'hp', name: 'PV', min: 0, maxFormula: { kind: 'fixed', value: 20 } };
const definitions = { stats: [stat], resources: [ki, hp], effects: [buff, hit], conditions: [], forms: [] };

const skill = {
  id: 'slash', enabled: true, name: 'Frappe', costResourceId: 'ki', costValue: 10,
  cooldown: 2, maxCharges: 2, recovery: 'combat', effectIds: ['hit'], conditions: []
};
const actor = { stats: { force: 10 }, resources: { ki: { current: 40, max: 100 } } };
const target = { resources: { hp: { current: 20, max: 20 } } };
const skillResult = resolveSkillUse(skill, actor, target, definitions, { randomPercent: () => 0 });
assert.equal(skillResult.resolved, true);
assert.equal(skillResult.actorState.resources.ki.current, 30);
assert.equal(skillResult.actorState.skillRuntime.slash.cooldown, 2);
assert.equal(skillResult.actorState.skillRuntime.slash.charges, 1);
assert.equal(skillResult.targetState.resources.hp.current, 17);
assert.equal(tickSkillCooldowns(skillResult.actorState).skillRuntime.slash.cooldown, 1);
assert.equal(recoverSkillCharges(skillResult.actorState, [skill], 'combat').skillRuntime.slash.charges, 2);

const form = {
  id: 'awakened', enabled: true, type: 'temporary', costResourceId: 'ki', costValue: 20,
  conditionIds: [], effectIds: ['buff-force'], addedSkillIds: ['slash'], duration: { kind: 'turns', value: 2 }
};
definitions.forms = [form];
const formResult = activateHeroForm(form, actor, definitions, { randomPercent: () => 0 });
assert.equal(formResult.activated, true);
assert.equal(formResult.state.resources.ki.current, 20);
assert.equal(formResult.state.stats.force, 15);
assert.deepEqual(activeFormSkillIds(formResult.state), ['slash']);
const afterOne = tickHeroForms(formResult.state, definitions, {});
assert.equal(afterOne.activeForms[0].remaining, 1);
const afterTwo = tickHeroForms(afterOne, definitions, {});
assert.equal(afterTwo.activeForms.length, 0);

console.log('rpg-skills-forms.test.mjs: OK');
