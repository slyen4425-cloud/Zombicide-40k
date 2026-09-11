import assert from 'node:assert/strict';
import { ensureTrapDefinitions, newTrapDefinition, trapCheckOptions } from '../src/modes/rpg/trap-editor.js';

const universe={};
ensureTrapDefinitions(universe);
assert.deepEqual(universe.traps,[]);

const trap=newTrapDefinition();
assert.equal(trap.detectionCheckId,null);
assert.equal(trap.disarmCheckId,null);

const html=trapCheckOptions([
  {id:'perception-check',name:'Test de Perception',die:100,enabled:true},
  {id:'agility-check',name:'Test d’Agilité',die:20,enabled:true},
  {id:'disabled-check',name:'Ancien jet',die:12,enabled:false},
],'agility-check','— Détection automatique —');

assert.match(html,/Détection automatique/);
assert.match(html,/Test de Perception/);
assert.match(html,/D100/);
assert.match(html,/Test d’Agilité/);
assert.match(html,/D20/);
assert.match(html,/value="agility-check" selected/);
assert.doesNotMatch(html,/Ancien jet/);
assert.doesNotMatch(html,/disabled-check/);

console.log('rpg-trap-editor.test.mjs: OK');
