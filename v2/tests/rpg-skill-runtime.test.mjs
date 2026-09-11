import assert from 'node:assert/strict';
import { skillAvailability, consumeSkillUse, tickSkillCooldowns, recoverSkillCharges, resolveSkillUse } from '../src/modes/rpg/skill-runtime.js';

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

const checkSkill={id:'precise-shot',enabled:true,checkId:'agility-test',effectIds:['hurt'],cooldown:0,maxCharges:null};
const definitions={
  checks:[{id:'agility-test',enabled:true,die:100,mode:'roll-under',statId:'agility',difficulty:40,modifier:0}],
  effects:[{id:'hurt',enabled:true,kind:'resource-modifier',resourceId:'hp',operation:'subtract',value:2,chance:100}],
  resources:[{id:'hp',min:0,maxMode:'fixed',maxValue:10}],
};
const shooter={stats:{agility:20},resources:{}};
const target={stats:{},resources:{hp:{current:10,max:10}}};
let resolved=resolveSkillUse(checkSkill,shooter,target,definitions,{roll:50});
assert.equal(resolved.resolved,true);
assert.equal(resolved.success,true);
assert.equal(resolved.check.threshold,60);
assert.equal(resolved.targetState.resources.hp.current,8);

resolved=resolveSkillUse(checkSkill,shooter,target,definitions,{roll:90});
assert.equal(resolved.resolved,true);
assert.equal(resolved.success,false);
assert.equal(resolved.targetState.resources.hp.current,10,'un jet raté ne doit pas appliquer les effets');

console.log('rpg-skill-runtime.test.mjs: OK');
