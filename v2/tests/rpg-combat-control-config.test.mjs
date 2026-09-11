import assert from 'node:assert/strict';
import { defaultCombatConfig, ensureCombatConfig, combatInteractionPolicy } from '../src/modes/rpg/combat-config.js';

const universe={stats:[{id:'initiative'}],resources:[{id:'hp'}]};
const defaults=defaultCombatConfig(universe);
assert.equal(defaults.interaction.directCombat,true);
assert.equal(defaults.interaction.gmFullControl,false);

let policy=combatInteractionPolicy(universe);
assert.deepEqual(policy,{
  directCombat:true,
  gmFullControl:false,
  automaticPlayerActions:true,
  automaticEnemyTurns:true,
  manualCombatControls:false,
});

universe.combat.interaction.directCombat=false;
policy=combatInteractionPolicy(universe);
assert.equal(policy.directCombat,false);
assert.equal(policy.automaticPlayerActions,false);
assert.equal(policy.automaticEnemyTurns,true);
assert.equal(policy.manualCombatControls,false);

universe.combat.interaction.gmFullControl=true;
policy=combatInteractionPolicy(universe);
assert.equal(policy.directCombat,false);
assert.equal(policy.gmFullControl,true);
assert.equal(policy.automaticPlayerActions,false);
assert.equal(policy.automaticEnemyTurns,false);
assert.equal(policy.manualCombatControls,true);

const legacy={combat:{initiative:{mode:'fixed'},defeatRule:{kind:'none'},checkDefaults:{die:100}}};
const migrated=ensureCombatConfig(legacy);
assert.deepEqual(migrated.interaction,{directCombat:true,gmFullControl:false});

console.log('rpg-combat-control-config.test.mjs: OK');
