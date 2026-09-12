import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [index,css,gridView]=await Promise.all([
  readFile(new URL('../index.html',import.meta.url),'utf8'),
  readFile(new URL('../src/ui/dungeon-gameplay-ui.css',import.meta.url),'utf8'),
  readFile(new URL('../src/modes/rpg/dungeon-room-grid-view.js',import.meta.url),'utf8'),
]);

assert.match(index,/dungeon-gameplay-ui\.css/,'V2 entrypoint must load the dedicated Dungeon gameplay presentation');
assert.match(css,/\.dungeon-gameplay-grid>\.dungeon-hero-focus\{order:1\}/,'hero HUD must be the first gameplay block');
assert.match(css,/\.dungeon-gameplay-grid>\.dungeon-board-section\{order:2\}/,'board must be the primary scene after hero HUD');
assert.match(css,/\.dungeon-gameplay-grid>\.dungeon-combat-section\{order:5\}/,'combat must stay ahead of secondary/admin panels');
assert.match(css,/\.dungeon-gameplay-grid>\.dungeon-gameplay-status\{order:20\}/,'technical state must be demoted');
assert.match(css,/\.dungeon-board-pawn\.hero/,'hero pawn styling must remain explicit');
assert.match(css,/\.dungeon-board-pawn\.enemy/,'enemy pawn styling must remain explicit');
assert.match(css,/\.dungeon-combat-section/,'combat must have a dedicated visual surface');
assert.match(css,/@media\(max-width:620px\)/,'presentation must include a phone-specific layout');
assert.doesNotMatch(css,/localStorage|sessionStorage|executeDungeonHeroSkill|startDungeonCombat|setActorPosition/,'presentation stylesheet must not contain gameplay or persistence logic');
assert.match(gridView,/Touchez une case accessible pour déplacer le héros/,'board copy must describe the live interactive grid');
assert.doesNotMatch(gridView,/lecture seule/i,'obsolete read-only wording must not return');

console.log('rpg-dungeon-gameplay-presentation.test.mjs: OK');
