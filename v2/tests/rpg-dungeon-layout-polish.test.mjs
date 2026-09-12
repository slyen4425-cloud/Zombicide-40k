import assert from 'node:assert/strict';
import fs from 'node:fs';

const index=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const js=fs.readFileSync(new URL('../src/ui/dungeon-layout-polish.js',import.meta.url),'utf8');
const css=fs.readFileSync(new URL('../src/ui/dungeon-layout-polish.css',import.meta.url),'utf8');

assert.match(index,/dungeon-layout-polish\.css/,'index must load Dungeon layout CSS');
assert.match(index,/dungeon-layout-polish\.js/,'index must load Dungeon layout JS');

for(const selector of ['.dungeon-hero-focus','.dungeon-board-section','.dungeon-event-choice','.dungeon-combat-section']){
  assert.ok(js.includes(selector),`${selector} must remain in the primary play surface`);
}
assert.match(js,/dungeon-play-surface/,'gameplay must create a primary play surface');
assert.match(js,/dungeon-secondary-drawer/,'gameplay must create a secondary drawer');
assert.match(js,/Journal & détails/,'secondary drawer must be clearly labelled');
assert.match(js,/MutationObserver/,'layout must survive gameplay rerenders');
assert.doesNotMatch(js,/innerHTML\s*=\s*renderDungeonGameplayView/,'presentation layer must not replace the RPG renderer');

assert.match(css,/\.dungeon-secondary-drawer/,'drawer styles must exist');
assert.match(css,/\.dungeon-secondary-content/,'secondary content styles must exist');
assert.match(css,/max-height:min\(62vh,620px\)/,'board must stay viewport-oriented on larger screens');
assert.match(css,/@media\(max-width:620px\)/,'mobile layout rules must exist');

console.log('RPG Dungeon gameplay layout hierarchy: OK');
