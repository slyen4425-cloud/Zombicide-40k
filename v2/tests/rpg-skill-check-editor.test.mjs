import assert from 'node:assert/strict';
import { newSkill, reusableCheckOptions, ensureAdvancedRpgCollections } from '../src/modes/rpg/advanced-editor.js';

const universe={checks:[
  {id:'force-check',name:'Test de Force',die:100,enabled:true},
  {id:'agility-check',name:'Test d’Agilité',die:20,enabled:true},
  {id:'hidden-check',name:'Ancien jet',die:100,enabled:false},
]};
ensureAdvancedRpgCollections(universe);
assert.ok(Array.isArray(universe.checks));

const skill=newSkill();
assert.equal(skill.checkId,null);
assert.equal(skill.roll?.enabled,true,'legacy inline roll remains available as fallback');

const html=reusableCheckOptions(universe.checks,'agility-check');
assert.match(html,/Jet configuré dans la compétence/);
assert.match(html,/Test de Force/);
assert.match(html,/D100/);
assert.match(html,/Test d’Agilité/);
assert.match(html,/D20/);
assert.match(html,/value="agility-check" selected/);
assert.doesNotMatch(html,/Ancien jet/);
assert.doesNotMatch(html,/hidden-check/);

console.log('rpg-skill-check-editor.test.mjs: OK');
