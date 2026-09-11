import assert from 'node:assert/strict';
import { skillAvailability, consumeSkillUse, tickSkillCooldowns, recoverSkillCharges } from '../src/modes/rpg/skill-runtime.js';

const skill = { id:'fireball', costResourceId:'mana', costValue:3, cooldown:2, maxCharges:2, recovery:'combat' };
let actor = { resources:{ mana:{ current:5, max:5 } }, stats:{} };

let a = skillAvailability(skill, actor, { conditions:[] });
assert.equal(a.ok, true);
actor = consumeSkillUse(skill, a.actorState);
assert.equal(actor.resources.mana.current, 2);
assert.equal(actor.skillRuntime.fireball.charges, 1);
assert.equal(actor.skillRuntime.fireball.cooldown, 2);

let blocked = skillAvailability(skill, actor, { conditions:[] });
assert.equal(blocked.ok, false);
assert.equal(blocked.reason, 'cooldown');

actor = tickSkillCooldowns(actor);
assert.equal(actor.skillRuntime.fireball.cooldown, 1);
actor = tickSkillCooldowns(actor);
assert.equal(actor.skillRuntime.fireball.cooldown, 0);

blocked = skillAvailability(skill, actor, { conditions:[] });
assert.equal(blocked.ok, false);
assert.equal(blocked.reason, 'insufficient-resource');

actor.resources.mana.current = 5;
actor = consumeSkillUse(skill, actor);
assert.equal(actor.skillRuntime.fireball.charges, 0);
actor = tickSkillCooldowns(tickSkillCooldowns(actor));
blocked = skillAvailability(skill, actor, { conditions:[] });
assert.equal(blocked.ok, false);
assert.equal(blocked.reason, 'no-charges');

actor = recoverSkillCharges(actor, [skill], 'combat');
assert.equal(actor.skillRuntime.fireball.charges, 2);

console.log('rpg-skill-runtime.test.mjs: OK');
