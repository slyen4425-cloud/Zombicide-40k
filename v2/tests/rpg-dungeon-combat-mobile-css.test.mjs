import assert from 'node:assert/strict';
import fs from 'node:fs';

const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/ui/dungeon-combat-mobile.css',import.meta.url),'utf8');

assert.match(index,/dungeon-combat-mobile\.css/);
assert.match(css,/\.dungeon-combat-section \.combat-timeline/);
assert.match(css,/scroll-snap-type:x proximity/);
assert.match(css,/\.dungeon-combat-section \.combat-turn/);
assert.match(css,/min-height:44px/);
assert.match(css,/\.dungeon-combat-section \.combatant-card\.active/);
assert.match(css,/\.dungeon-combat-section \.dungeon-combat-gm-controls/);
assert.match(css,/\.dungeon-combat-section \.dungeon-combat-flee-actions/);
assert.match(css,/@media\(max-width:620px\)/);
assert.match(css,/min-height:48px/);
assert.match(css,/grid-template-columns:1fr 1fr/);
assert.match(css,/@media\(max-width:390px\)/);

console.log('rpg-dungeon-combat-mobile-css.test.mjs: OK');
