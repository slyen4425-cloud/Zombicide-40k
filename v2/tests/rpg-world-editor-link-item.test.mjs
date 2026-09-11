import assert from 'node:assert/strict';
import { linkRequiredItemOptions } from '../src/modes/rpg/world-editor.js';

const items=[
  {id:'boss-key',name:'Clé du boss',icon:'🗝️',enabled:true},
  {id:'hidden',name:'Objet désactivé',icon:'📦',enabled:false},
];

const html=linkRequiredItemOptions(items,'boss-key');
assert.match(html,/Aucun objet requis/);
assert.match(html,/Clé du boss/);
assert.match(html,/value="boss-key" selected/);
assert.doesNotMatch(html,/Objet désactivé/);
assert.equal((html.match(/boss-key/g)||[]).length,1,'technical id should only live in the option value, not be displayed as a label');

const empty=linkRequiredItemOptions([],null);
assert.equal(empty,'<option value="">— Aucun objet requis —</option>');

console.log('rpg-world-editor-link-item.test.mjs: ok');
