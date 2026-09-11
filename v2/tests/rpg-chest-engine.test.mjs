import assert from 'node:assert/strict';
import { createChestDefinition, createChestState, canOpenChest, openChest, syncChestInteractionState } from '../src/modes/rpg/chest-engine.js';

const chest=createChestDefinition({
  id:'chest-1',
  name:'Coffre ancien',
  rarity:'epic',
  locked:true,
  keyItemId:'key-boss',
  consumeKey:true,
  loot:[{itemId:'gold',quantity:25},{itemId:'relic',quantity:1}],
  trapInteractionId:'trap-1',
  puzzleInteractionId:'puzzle-1',
  eventId:'event-1',
  audioId:'audio-chest-open',
});

let state=createChestState(chest);
assert.equal(canOpenChest(chest,state,{inventory:{}}).ok,false);
assert.equal(canOpenChest(chest,state,{inventory:{}}).reason,'missing-key');

let opened=openChest(chest,state,{inventory:{'key-boss':1,gold:5}});
assert.equal(opened.ok,true);
assert.equal(opened.state.opened,true);
assert.equal(opened.state.openCount,1);
assert.equal(opened.state.keyConsumed,true);
assert.equal(opened.inventory['key-boss'],0);
assert.equal(opened.inventory.gold,30);
assert.equal(opened.inventory.relic,1);
assert.equal(opened.result.rarity,'epic');
assert.equal(opened.result.trapInteractionId,'trap-1');
assert.equal(opened.result.puzzleInteractionId,'puzzle-1');
assert.equal(opened.result.eventId,'event-1');
assert.equal(opened.result.audioId,'audio-chest-open');

const interaction=syncChestInteractionState({id:'chest-1',opened:false,triggered:false,completed:false,data:{}},opened.state);
assert.equal(interaction.opened,true);
assert.equal(interaction.triggered,true);
assert.equal(interaction.completed,true);
assert.equal(interaction.data.chest.lootGranted,true);

const reopened=openChest(chest,opened.state,{inventory:opened.inventory});
assert.equal(reopened.ok,true);
assert.equal(reopened.reason,'already-open');
assert.equal(reopened.inventory.gold,30);
assert.equal(reopened.inventory.relic,1);
assert.equal(reopened.inventory['key-boss'],0);
assert.equal(reopened.state.openCount,1);
assert.deepEqual(reopened.result,opened.result);

console.log('rpg-chest-engine.test.mjs: ok');
