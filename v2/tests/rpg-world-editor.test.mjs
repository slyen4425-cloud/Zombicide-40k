import assert from 'node:assert/strict';
import { createDefaultWorldDraft, ensureWorldDraft } from '../src/modes/rpg/world-editor.js';
import { buildWorldIndex, validateWorld } from '../src/modes/rpg/world-engine.js';

const draft=createDefaultWorldDraft();
assert.equal(draft.zones.length,1);
assert.equal(draft.rooms.length,1);
assert.equal(draft.world.startRoomId,draft.rooms[0].id);
assert.deepEqual(draft.zones[0].roomIds,[draft.rooms[0].id]);

const second={id:'room-2',zoneId:draft.zones[0].id,name:'Cache',kind:'cache',links:[],metadata:{}};
draft.rooms.push(second);
draft.zones[0].roomIds=[];
ensureWorldDraft(draft);
assert.deepEqual(draft.zones[0].roomIds,[draft.rooms[0].id,'room-2']);

let validation=validateWorld(buildWorldIndex(draft));
assert.equal(validation.valid,true);

draft.world.startRoomId='missing-room';
ensureWorldDraft(draft);
assert.equal(draft.world.startRoomId,draft.rooms[0].id);
validation=validateWorld(buildWorldIndex(draft));
assert.equal(validation.valid,true);

console.log('rpg-world-editor.test.mjs: OK');
