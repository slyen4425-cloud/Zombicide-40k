import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createDefaultWorldDraft, ensureWorldDraft } from '../src/modes/rpg/world-editor.js';

const here=path.dirname(fileURLToPath(import.meta.url));
const root=path.resolve(here,'..');
const ui=fs.readFileSync(path.join(root,'src/ui/rpg-world-builder-ui.js'),'utf8');
const css=fs.readFileSync(path.join(root,'src/ui/rpg-world-builder-ui.css'),'utf8');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const worldSource=fs.readFileSync(path.join(root,'src/modes/rpg/world-editor.js'),'utf8');
const roomSource=fs.readFileSync(path.join(root,'src/modes/rpg/room-editor.js'),'utf8');

const draft=ensureWorldDraft(createDefaultWorldDraft());
assert.equal(draft.zones.length,1);
assert.equal(draft.rooms.length,1);
assert.equal(draft.world.startRoomId,draft.rooms[0].id);

assert.match(ui,/Vue du monde/);
assert.match(ui,/Zones & salles/);
assert.match(ui,/Passages/);
assert.match(ui,/room-builder-stage/);
assert.match(ui,/Réglages de la salle/);
assert.match(ui,/append\(tools\)/);
assert.match(ui,/append\(grid\)/);
assert.match(ui,/append\(settings,obstacles\)/);
assert.match(ui,/append\(interactions\)/);
assert.match(ui,/MutationObserver/);

assert.match(css,/world-builder-local-nav/);
assert.match(css,/room-grid-primary/);
assert.match(css,/room-tools-gamebar/);
assert.match(css,/room-builder-settings/);
assert.match(index,/rpg-world-builder-ui\.css/);
assert.match(index,/rpg-world-builder-ui\.js/);

// Presentation layer must preserve the existing editor controls/listeners as the source of truth.
assert.match(worldSource,/addWorldZone/);
assert.match(worldSource,/addWorldRoom/);
assert.match(worldSource,/addWorldLink/);
assert.match(worldSource,/data-room-field/);
assert.match(roomSource,/data-room-tool/);
assert.match(roomSource,/data-cell-x/);
assert.match(roomSource,/addRoomInteraction/);
assert.doesNotMatch(ui,/saveWorldDraft|saveRoomLayout|setRoomCell|addRoomInteraction/);

console.log('rpg-world-builder-presentation: ok');
