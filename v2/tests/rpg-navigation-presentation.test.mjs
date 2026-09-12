import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { RPG_NAV_GROUPS } from '../src/ui/rpg-navigation-ui.js';

const here=dirname(fileURLToPath(import.meta.url));
const root=join(here,'..');
const index=readFileSync(join(root,'index.html'),'utf8');
const css=readFileSync(join(root,'src/ui/rpg-navigation-ui.css'),'utf8');
const js=readFileSync(join(root,'src/ui/rpg-navigation-ui.js'),'utf8');

assert.deepEqual(RPG_NAV_GROUPS.map(group=>group.id),['play','heroes','world','settings']);
assert.deepEqual(RPG_NAV_GROUPS.find(group=>group.id==='play').tabs,['dungeon']);
assert.deepEqual(RPG_NAV_GROUPS.find(group=>group.id==='heroes').tabs,['heroes']);
assert.deepEqual(RPG_NAV_GROUPS.find(group=>group.id==='world').tabs,['world','room']);
assert.deepEqual(RPG_NAV_GROUPS.find(group=>group.id==='settings').tabs,['editor','combat']);

assert.match(js,/Que veux-tu faire \?/);
assert.match(js,/defaultToPlay=true/);
assert.match(js,/current\?\.dataset\.rpgTab==='editor'/);
assert.match(js,/dungeon\.click\(\)/);
assert.match(js,/actions\.appendChild\(button\)/);
assert.doesNotMatch(js,/mountDungeonGameplayView|startDungeonCombat|executeDungeonHeroSkill/);

assert.match(index,/rpg-navigation-ui\.css/);
assert.match(index,/rpg-navigation-ui\.js/);
assert.match(css,/\.rpg-nav-groups/);
assert.match(css,/grid-template-columns:repeat\(4/);
assert.match(css,/@media\(max-width:700px\)/);
assert.match(css,/grid-template-columns:repeat\(2/);

console.log('RPG structured navigation presentation: OK');
