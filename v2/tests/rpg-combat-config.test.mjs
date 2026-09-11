import assert from 'node:assert/strict';
import { defaultCombatConfig, ensureCombatConfig } from '../src/modes/rpg/combat-config.js';
import { calculateInitiative } from '../src/modes/rpg/initiative.js';
import { evaluateDefeatRule } from '../src/modes/rpg/combat-rules.js';
import { createDemoCombat } from '../src/modes/rpg/combat-lab.js';

const universe={stats:[{id:'speed',name:'Vitesse',baseValue:7}],resources:[{id:'life',name:'Vie',min:0,maxFormula:{kind:'fixed',value:12}}]};
const cfg=defaultCombatConfig(universe);
assert.equal(cfg.initiative.source.id,'speed');
assert.equal(cfg.defeatRule.sourceId,'life');

ensureCombatConfig(universe);
universe.combat.initiative={mode:'roll',source:{kind:'stat',id:'speed'},base:2,die:20,modifier:1};
const init=calculateInitiative({state:{stats:{speed:7}}},universe.combat.initiative,()=>0);
assert.equal(init.roll,1);
assert.equal(init.total,11);

universe.combat.defeatRule={enabled:true,kind:'resource',sourceId:'life',operator:'lte',threshold:0};
assert.equal(evaluateDefeatRule({state:{resources:{life:{current:0,max:12}}}},universe.combat.defeatRule),true);
assert.equal(evaluateDefeatRule({state:{resources:{life:{current:1,max:12}}}},universe.combat.defeatRule),false);

const combat=createDemoCombat(universe,()=>0);
assert.equal(combat.order[0],'demo-hero');
assert.equal(combat.actors['demo-hero'].initiative,11);
assert.equal(combat.actors['demo-enemy'].initiative,9);
console.log('rpg-combat-config.test.mjs: OK');
