import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderDungeonCombatFleeControl } from '../src/modes/rpg/dungeon-combat-flee-ui.js';

const active={phase:'turn',metadata:{kind:'dungeon-room-combat',roomId:'room-1'}};
const ended={phase:'ended',metadata:{kind:'dungeon-room-combat',roomId:'room-1'}};
const unrelated={phase:'turn',metadata:{kind:'combat-lab'}};

const html=renderDungeonCombatFleeControl({combat:active});
assert.match(html,/data-dungeon-flee-combat/);
assert.match(html,/>🏃 Fuir</);
assert.match(html,/restaure les ennemis/);
assert.equal(renderDungeonCombatFleeControl({combat:ended}),'');
assert.equal(renderDungeonCombatFleeControl({combat:unrelated}),'');

const page=fs.readFileSync(new URL('../src/modes/rpg/rpg-page.js',import.meta.url),'utf8');
assert.match(page,/mountDungeonCombatFleeControl/);
assert.match(page,/currentDungeonCombat=null/,'flee must close the live combat block instead of leaving a fled state mounted as active combat');
assert.match(page,/kind:'combat-flee'/,'flee must still bubble the fled combat result to external state listeners');
assert.match(page,/dungeonView\.setHeroRuntimes\(currentDungeonHeroRuntimes\)/,'hero damage and KO state must be resynchronized immediately after fleeing');
assert.match(page,/dungeonView\.setRoomRuntime\(currentDungeonRuntime\)/,'room runtime must remain the authoritative persistent enemy state after fleeing');

console.log('rpg-dungeon-combat-flee-ui.test.mjs: OK');
