import assert from 'node:assert/strict';
import { createDemoCombat } from '../src/modes/rpg/combat-lab.js';

const universe={
  stats:[{id:'initiative',name:'Initiative',baseValue:12}],
  resources:[{id:'hp',name:'PV',maxFormula:{kind:'fixed',value:20}}],
  skills:[],
};

const combat=createDemoCombat(universe);
assert.equal(combat.phase,'turn');
assert.equal(combat.order.length,2);
assert.equal(combat.activeActorId,'demo-hero');
assert.equal(combat.actors['demo-hero'].state.resources.hp.current,20);
assert.equal(combat.actors['demo-enemy'].state.resources.hp.current,20);
assert.equal(combat.actors['demo-hero'].state.stats.initiative,12);
console.log('rpg-combat-lab.test.mjs: OK');
