import assert from 'node:assert/strict';
import { createCombatState } from '../src/modes/rpg/combat-engine.js';
import { prepareSkillAction, resolveAndAdvance } from '../src/modes/rpg/turn-runtime.js';

const skill = {
  id:'strike', costResourceId:'stamina', costValue:2, cooldown:2, maxCharges:2, recovery:'combat',
  conditionIds:[], effectIds:['hurt'], target:'enemy', roll:{ enabled:true, die:100, statId:'agi', difficulty:50, mode:'roll-under' }
};
const defs = {
  conditions:[],
  stats:[{ id:'agi', baseValue:0 }],
  resources:[{ id:'hp', min:0, maxFormula:{kind:'fixed',value:10} }, { id:'stamina', min:0, maxFormula:{kind:'fixed',value:5} }],
  effects:[{ id:'hurt', enabled:true, kind:'resource-modifier', resourceId:'hp', operation:'subtract', value:3, chance:100 }],
};
let combat = createCombatState({ combatants:[
  { id:'hero', side:'heroes', initiative:10, state:{ stats:{agi:10}, resources:{ hp:{current:10,max:10}, stamina:{current:5,max:5} } } },
  { id:'ally', side:'heroes', initiative:7, state:{ resources:{ hp:{current:10,max:10} } } },
  { id:'enemy', side:'enemies', initiative:5, state:{ resources:{ hp:{current:10,max:10} } } },
]});

const invalid = prepareSkillAction(combat, skill, 'ally', defs, { actionId:'bad-target' });
assert.equal(invalid.ok, false);
assert.equal(invalid.reason, 'same-side');
assert.equal(invalid.combat.actors.hero.state.resources.stamina.current, 5, 'invalid manual target must not spend resource');
assert.equal(invalid.combat.actors.hero.state.skillRuntime, undefined, 'invalid target must not consume charge or start cooldown');

const selfSkill={id:'guard',conditionIds:[],effectIds:[],target:'self',roll:{enabled:false}};
const selfOk=prepareSkillAction(combat,selfSkill,'hero',defs,{actionId:'self-ok'});
assert.equal(selfOk.ok,true,'self skill must accept its actor');
const selfWrong=prepareSkillAction(combat,selfSkill,'ally',defs,{actionId:'self-wrong'});
assert.equal(selfWrong.ok,false);
assert.equal(selfWrong.reason,'self-required');
const selfDefault=prepareSkillAction(combat,selfSkill,null,defs,{actionId:'self-default'});
assert.equal(selfDefault.ok,true);
assert.equal(selfDefault.action.targetId,'hero','self skill must default to active actor');

const allySkill={id:'aid',conditionIds:[],effectIds:[],target:'ally',roll:{enabled:false}};
const allyOk=prepareSkillAction(combat,allySkill,'ally',defs,{actionId:'ally-ok'});
assert.equal(allyOk.ok,true,'ally skill must accept a living same-side actor');
const allySelf=prepareSkillAction(combat,allySkill,'hero',defs,{actionId:'ally-self'});
assert.equal(allySelf.ok,false);
assert.equal(allySelf.reason,'ally-required','ally target is intentionally distinct from self');
const allyEnemy=prepareSkillAction(combat,allySkill,'enemy',defs,{actionId:'ally-enemy'});
assert.equal(allyEnemy.ok,false);
assert.equal(allyEnemy.reason,'ally-required');
const allyDefault=prepareSkillAction(combat,allySkill,null,defs,{actionId:'ally-default'});
assert.equal(allyDefault.ok,true);
assert.equal(allyDefault.action.targetId,'ally','ally skill must default to a valid ally');

const anySkill={id:'mark',conditionIds:[],effectIds:[],target:'any',roll:{enabled:false}};
for(const targetId of ['hero','ally','enemy']){
  const out=prepareSkillAction(combat,anySkill,targetId,defs,{actionId:`any-${targetId}`});
  assert.equal(out.ok,true,`any skill must accept ${targetId}`);
}

const koCombat=structuredClone(combat);
koCombat.actors.ally.ko=true;
const koAlly=prepareSkillAction(koCombat,allySkill,'ally',defs,{actionId:'ally-ko'});
assert.equal(koAlly.ok,false);
assert.equal(koAlly.reason,'target-ko','KO targets stay invalid even for ally/any contracts');

const prep = prepareSkillAction(combat, skill, 'enemy', defs, { actionId:'a1' });
assert.equal(prep.ok, true);
assert.equal(prep.combat.actors.hero.state.resources.stamina.current, 3);
assert.equal(prep.combat.actors.hero.state.skillRuntime.strike.charges, 1);
assert.equal(prep.combat.actors.hero.state.skillRuntime.strike.cooldown, 2);

const out = resolveAndAdvance(prep.combat, { definitions:defs, checkResult:{ success:true, roll:20, threshold:60 }, randomPercent:()=>0 });
assert.equal(out.resolved, true);
assert.equal(out.combat.actors.enemy.state.resources.hp.current, 7);
assert.equal(out.combat.activeActorId, 'ally');
assert.equal(out.combat.actors.hero.state.skillRuntime.strike.cooldown, 1);

console.log('rpg-turn-runtime.test.mjs: OK');
