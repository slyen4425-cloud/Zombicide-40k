import assert from 'node:assert/strict';
import { interactionCheckOptions } from '../src/modes/rpg/room-editor.js';

const html=interactionCheckOptions([
  {id:'force-check',name:'Test de Force',die:100,enabled:true},
  {id:'agility-check',name:'Test d’Agilité',die:20,enabled:true},
  {id:'legacy-hidden',name:'Ancien test',die:100,enabled:false},
],'agility-check');

assert.match(html,/Aucun jet requis/);
assert.match(html,/Test de Force/);
assert.match(html,/D100/);
assert.match(html,/Test d’Agilité/);
assert.match(html,/D20/);
assert.match(html,/value="agility-check" selected/);
assert.doesNotMatch(html,/Ancien test/);
assert.doesNotMatch(html,/legacy-hidden/);

console.log('rpg-room-interaction-check-editor.test.mjs: OK');
