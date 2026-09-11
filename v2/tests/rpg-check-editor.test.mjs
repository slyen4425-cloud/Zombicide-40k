import assert from 'node:assert/strict';
import { ensureCheckDefinitions, createCheckDefinition, checkStatOptions, renderCheckCard } from '../src/modes/rpg/check-editor.js';

const universe={stats:[
  {id:'force',name:'Force',icon:'💪',enabled:true},
  {id:'hidden',name:'Ancienne stat',enabled:false},
],checks:null};
ensureCheckDefinitions(universe);
assert.deepEqual(universe.checks,[]);

const check=createCheckDefinition({id:'force-test',name:'Test de Force',die:100,mode:'roll-under',statId:'force',difficulty:45,modifier:5,description:'Forcer une porte.'});
universe.checks.push(check);
ensureCheckDefinitions(universe);
assert.equal(universe.checks[0].die,100);
assert.equal(universe.checks[0].statId,'force');
assert.equal(universe.checks[0].difficulty,45);

const options=checkStatOptions(universe.stats,'force');
assert.match(options,/Force/);
assert.match(options,/value="force" selected/);
assert.doesNotMatch(options,/Ancienne stat/);

const html=renderCheckCard(check,universe.stats);
assert.match(html,/Jets|Test de Force/);
assert.match(html,/D100/);
assert.match(html,/Réussir sous le seuil/);
assert.match(html,/Forcer une porte/);
assert.doesNotMatch(html,/Ancienne stat/);

console.log('rpg-check-editor.test.mjs: OK');
