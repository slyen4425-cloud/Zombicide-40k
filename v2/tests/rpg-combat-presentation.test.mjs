import assert from 'node:assert/strict';
import { createPresentationState, syncPresentationFromCombat, takeNextPresentation, acknowledgePresentation, drainPresentation } from '../src/modes/rpg/combat-presentation.js';

let ui = createPresentationState();
const combat = {
  log: [
    { seq: 1, type: 'turn-begin', actorId: 'hero' },
    { seq: 2, type: 'action-resolved', actorId: 'hero', targetId: 'enemy', check: { success: true, roll: 27 } },
    { seq: 3, type: 'combatant-ko', actorId: 'enemy', side: 'enemies' },
    { seq: 4, type: 'combat-ended', winner: 'heroes' },
  ],
};

ui = syncPresentationFromCombat(ui, combat);
assert.equal(ui.queue.length, 4);
assert.equal(ui.consumedSeq, 4);

const syncedAgain = syncPresentationFromCombat(ui, combat);
assert.equal(syncedAgain.queue.length, 4, 'same engine events must not be duplicated in UI queue');

let taken = takeNextPresentation(ui);
assert.equal(taken.item.type, 'turn-begin');
ui = acknowledgePresentation(taken.presentation);

taken = takeNextPresentation(ui);
assert.equal(taken.item.type, 'action-resolved');
assert.match(taken.item.text, /27/);
ui = acknowledgePresentation(taken.presentation);

const drained = drainPresentation(ui);
assert.equal(drained.items.length, 2);
assert.equal(drained.items.at(-1).type, 'combat-ended');
assert.equal(drained.presentation.queue.length, 0);
assert.equal(drained.presentation.current, null);

console.log('rpg-combat-presentation.test.mjs: OK');
