import assert from 'node:assert/strict';
import fs from 'node:fs';
import { renderDungeonDeviceRoleLaunch } from '../src/modes/rpg/dungeon-device-role-launch-ui.js';

let html=renderDungeonDeviceRoleLaunch({role:'player'});
assert.match(html,/Choisir le rôle de ce téléphone/);
assert.match(html,/Ce téléphone est MJ/);
assert.match(html,/Ce téléphone est Joueur/);
assert.match(html,/data-dungeon-device-role="gm"/);
assert.match(html,/data-dungeon-device-role="player"/);
assert.match(html,/Joueur[\s\S]*Rôle mémorisé/);

html=renderDungeonDeviceRoleLaunch({role:'gm'});
assert.match(html,/MJ[\s\S]*Rôle mémorisé/);

const appSource=fs.readFileSync(new URL('../src/app.js',import.meta.url),'utf8');
assert.match(appSource,/mountDungeonDeviceRoleLaunch/);
assert.match(appSource,/dungeonIsGameMasterDevice:isGameMasterDevice/);
assert.doesNotMatch(appSource,/if\(modeId==='rpg'\)workspaceController=mountRpgPage\(host\)/);

console.log('rpg-dungeon-device-role-launch-ui.test.mjs: OK');
