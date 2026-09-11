import assert from 'node:assert/strict';
import { createCombatState } from '../src/modes/rpg/combat-engine.js';
import { combatTargetEntriesForSkill } from '../src/modes/rpg/combat-target-ui.js';

const universe={
  heroes:[{id:'lyra',name:'Lyra'},{id:'aldren',name:'Aldren'}],
  bestiary:[{id:'skeleton',name:'Squelette'}],
};
const combat=createCombatState({combatants:[
  {id:'lyra',side:'heroes',initiative:10,state:{resources:{hp:{current:8,max:8}}},metadata:{heroId:'lyra'}},
  {id:'aldren',side:'heroes',initiative:8,state:{resources:{hp:{current:10,max:10}}},metadata:{heroId:'aldren'}},
  {id:'skeleton-1',side:'enemies',initiative:5,state:{resources:{hp:{current:6,max:6}}},metadata:{creatureId:'skeleton'}},
]});

const ids=skill=>combatTargetEntriesForSkill({universe,combat,skill}).map(entry=>entry.id);
assert.deepEqual(ids({id:'shot',target:'enemy'}),['skeleton-1']);
assert.deepEqual(ids({id:'heal',target:'ally'}),['aldren']);
assert.deepEqual(ids({id:'guard',target:'self'}),['lyra']);
assert.deepEqual(ids({id:'spell',target:'any'}),['lyra','aldren','skeleton-1']);

combat.actors.aldren.ko=true;
assert.deepEqual(ids({id:'heal',target:'ally'}),[],'KO ally must disappear from UI target choices');
assert.deepEqual(ids({id:'spell',target:'any'}),['lyra','skeleton-1'],'KO actor must disappear from any target choices');

console.log('rpg-combat-target-ui.test.mjs: OK');
