import assert from 'node:assert/strict';
import { createCombatState } from '../src/modes/rpg/combat-engine.js';
import { gmSetCombatResource, gmSetCombatKo, gmRollCombatCheck, gmAdvanceCombatTurn } from '../src/modes/rpg/dungeon-combat-gm-runtime.js';

const universe={
  stats:[{id:'force'}],
  resources:[{id:'hp'}],
  combat:{
    initiative:{mode:'fixed'},
    defeatRule:{enabled:true,kind:'resource',sourceId:'hp',operator:'lte',threshold:0},
    checkDefaults:{die:100,mode:'roll-under'},
    interaction:{directCombat:false,gmFullControl:true},
  },
};
let combat=createCombatState({combatants:[
  {id:'hero',side:'heroes',initiative:10,state:{resources:{hp:{current:8,max:10}},stats:{force:20}},metadata:{heroId:'hero'}},
  {id:'enemy',side:'enemies',initiative:5,state:{resources:{hp:{current:9,max:9}},stats:{}},metadata:{creatureId:'skeleton'}},
]});
combat.metadata={kind:'dungeon-room-combat',roomId:'room-1'};

let out=gmSetCombatResource({universe,combat,actorId:'hero',resourceId:'hp',value:99});
assert.equal(out.ok,true);
assert.equal(out.combat.actors.hero.state.resources.hp.current,10);
assert.equal(out.combat.log.at(-1).type,'gm-resource-set');
combat=out.combat;

out=gmSetCombatKo({universe,combat,actorId:'enemy',ko:true});
assert.equal(out.ok,true);
assert.equal(out.combat.actors.enemy.ko,true);
assert.equal(out.combat.phase,'turn');
assert.equal(out.combat.log.at(-1).type,'gm-combatant-ko');
combat=out.combat;

out=gmSetCombatKo({universe,combat,actorId:'enemy',ko:false});
assert.equal(out.ok,true);
assert.equal(out.combat.actors.enemy.ko,false);
assert.equal(out.combat.log.at(-1).type,'gm-combatant-reactivated');
combat=out.combat;

out=gmRollCombatCheck({universe,combat,actorId:'hero',spec:{die:100,mode:'roll-under',difficulty:50,statId:'force'},roll:42});
assert.equal(out.ok,true);
assert.equal(out.check.roll,42);
assert.equal(out.check.threshold,70);
assert.equal(out.check.success,true);
assert.equal(out.combat.log.at(-1).type,'gm-check');
combat=out.combat;

out=gmAdvanceCombatTurn({universe,combat});
assert.equal(out.ok,true);
assert.equal(out.previousActorId,'hero');
assert.equal(out.nextActorId,'enemy');
assert.equal(out.combat.activeActorId,'enemy');
assert.equal(out.combat.log.at(-1).type,'gm-turn-advanced');

const disabled=structuredClone(universe);
disabled.combat.interaction.gmFullControl=false;
const denied=gmSetCombatResource({universe:disabled,combat:out.combat,actorId:'hero',resourceId:'hp',value:3});
assert.equal(denied.ok,false);
assert.equal(denied.reason,'gm-control-disabled');

console.log('rpg-dungeon-combat-gm-runtime.test.mjs: OK');
