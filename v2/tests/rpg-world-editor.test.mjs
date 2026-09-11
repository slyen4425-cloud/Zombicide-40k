import assert from 'node:assert/strict';
import { createDefaultWorldDraft, ensureWorldDraft, linkConditionOptions } from '../src/modes/rpg/world-editor.js';
import { buildWorldIndex, validateWorld } from '../src/modes/rpg/world-engine.js';

const draft=createDefaultWorldDraft();
assert.equal(draft.zones.length,1);
assert.equal(draft.rooms.length,1);
assert.equal(draft.world.startRoomId,draft.rooms[0].id);
assert.deepEqual(draft.zones[0].roomIds,[draft.rooms[0].id]);

const second={id:'room-2',zoneId:draft.zones[0].id,name:'Cache',kind:'cache',links:[],metadata:{}};
draft.rooms.push(second);
draft.zones[0].roomIds=[];
draft.links.push({id:'gate',fromRoomId:draft.rooms[0].id,toRoomId:'room-2',label:'Passage secret',conditionIds:['level-5',7],enabled:true,oneWay:false});
ensureWorldDraft(draft);
assert.deepEqual(draft.zones[0].roomIds,[draft.rooms[0].id,'room-2']);
assert.deepEqual(draft.links[0].conditionIds,['level-5','7']);

const conditionHtml=linkConditionOptions([
  {id:'level-5',name:'Niveau 5 atteint',enabled:true},
  {id:'quest-done',name:'Quête terminée',enabled:true},
  {id:'hidden',name:'Ancienne condition',enabled:false},
],['quest-done']);
assert.match(conditionHtml,/Niveau 5 atteint/);
assert.match(conditionHtml,/Quête terminée/);
assert.match(conditionHtml,/value="quest-done" selected/);
assert.doesNotMatch(conditionHtml,/Ancienne condition/);
assert.doesNotMatch(conditionHtml,/hidden/);

let validation=validateWorld(buildWorldIndex(draft));
assert.equal(validation.valid,true);

draft.world.startRoomId='missing-room';
ensureWorldDraft(draft);
assert.equal(draft.world.startRoomId,draft.rooms[0].id);
validation=validateWorld(buildWorldIndex(draft));
assert.equal(validation.valid,true);

console.log('rpg-world-editor.test.mjs: OK');
