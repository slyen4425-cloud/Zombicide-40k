import assert from 'node:assert/strict';
import { createInventoryState, inventoryQuantity } from '../src/modes/rpg/inventory-engine.js';
import { lootRecipientOptions, findLootRecipient, grantCreatureLootToSelectedRecipient } from '../src/modes/rpg/loot-recipient-ui.js';

const definitions={items:[{id:'scale',name:'Écaille',enabled:true,stackable:true,maxStack:99}]};
const roomRuntime={roomId:'boss-room',entities:[{id:'boss-1',kind:'creature',data:{creatureRuntime:{lootClaimed:true,lootGranted:false,lootDrops:[{itemId:'scale',quantity:1}]}}}]};
const recipients=[
  {id:'lyra',kind:'hero',name:'Lyra',icon:'🏹',inventory:createInventoryState()},
  {id:'aldren',kind:'hero',name:'Aldren',icon:'⚔️',inventory:createInventoryState(),enabled:false},
  {id:'party',kind:'group',name:'Sac du groupe',icon:'🎒',inventory:createInventoryState()},
  {id:'broken',kind:'hero',name:'Sans inventaire'},
];

const html=lootRecipientOptions(recipients,'hero:lyra');
assert.match(html,/Lyra/);
assert.match(html,/Héros/);
assert.match(html,/Sac du groupe/);
assert.match(html,/Groupe/);
assert.match(html,/value="hero:lyra" selected/);
assert.doesNotMatch(html,/Aldren/);
assert.doesNotMatch(html,/Sans inventaire/);
assert.doesNotMatch(html,/broken/);

const selected=findLootRecipient(recipients,'group:party');
assert.equal(selected.id,'party');
assert.equal(selected.kind,'group');

const granted=grantCreatureLootToSelectedRecipient(roomRuntime,'boss-1',recipients,'hero:lyra',definitions);
assert.equal(granted.ok,true);
assert.equal(granted.recipient.id,'lyra');
assert.equal(granted.recipient.kind,'hero');
assert.equal(inventoryQuantity(granted.recipient.inventory,'scale'),1);
assert.equal(inventoryQuantity(granted.recipients.find(r=>r.id==='party').inventory,'scale'),0);
assert.deepEqual(granted.roomRuntime.entities[0].data.creatureRuntime.lootGrantedTo,{kind:'hero',id:'lyra'});

const repeat=grantCreatureLootToSelectedRecipient(granted.roomRuntime,'boss-1',granted.recipients,'group:party',definitions);
assert.equal(repeat.ok,false);
assert.equal(repeat.reason,'already-granted');
assert.deepEqual(repeat.recipient.kind,'hero','original recipient metadata must remain authoritative');
assert.deepEqual(repeat.recipient.id,'lyra');

const missing=grantCreatureLootToSelectedRecipient(roomRuntime,'boss-1',[],null,definitions);
assert.equal(missing.ok,false);
assert.equal(missing.reason,'loot-recipient-missing');

console.log('rpg-loot-recipient-ui.test.mjs: OK');
