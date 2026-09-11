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
  { id:'enemy', side:'enemies', initiative:5, state:{ resources:{ hp:{current:10,max:10} } } },
]});

const prep = prepareSkillAction(combat, skill, 'enemy', defs, { actionId:'a1' });
assert.equal(prep.ok, true);
assert.equal(prep.combat.actors.hero.state.resources.stamina.current, 3);
assert.equal(prep.combat.actors.hero.state.skillRuntime.strike.charges, 1);
assert.equal(prep.combat.actors.hero.state.skillRuntime.strike.cooldown, 2);

const out = resolveAndAdvance(prep.combat, { definitions:defs, checkResult:{ success:true, roll:20, threshold:60 }, randomPercent:()=>0 });
assert.equal(out.resolved, true);
assert.equal(out.combat.actors.enemy.state.resources.hp.current, 7);
assert.equal(out.combat.activeActorId, 'enemy');
assert.equal(out.combat.actors.hero.state.skillRuntime.strike.cooldown, 1);

console.log('rpg-turn-runtime.test.mjs: OK');
