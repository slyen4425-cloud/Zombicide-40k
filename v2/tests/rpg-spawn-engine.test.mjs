import assert from 'node:assert/strict';
import { createSpawnDefinition, createSpawnState, executeSpawn, resolveRoomCreatureDefeat, grantRoomCreatureDrops, grantRoomCreatureDropsToRecipient } from '../src/modes/rpg/spawn-engine.js';
import { createInventoryState, inventoryQuantity } from '../src/modes/rpg/inventory-engine.js';

const universe={
  stats:[],resources:[],skills:[],
  items:[
    {id:'dragon-scale',name:'Écaille de dragon',enabled:true,stackable:true,maxStack:99},
    {id:'boss-key',name:'Clé du boss',enabled:true,stackable:true,maxStack:99},
  ],
  bestiary:[
    {id:'skeleton',name:'Squelette',boss:false,statValues:{},resourceValues:{},skillIds:[],loot:[],ai:{kind:'basic'},tags:[],xp:1},
    {id:'wyvern',name:'Wyverne',boss:true,statValues:{},resourceValues:{},skillIds:[],loot:[{itemId:'dragon-scale',quantity:1,chance:100}],ai:{kind:'basic'},tags:['boss'],xp:10},
  ],
};

const room10={roomId:'room-10',entities:[],interactions:{}};
const room8={roomId:'room-8',entities:[],interactions:{}};
let spawnState=createSpawnState();

const bossSpawn=createSpawnDefinition({id:'boss-10',kind:'boss',roomId:'room-10',creatureId:'wyvern',bossKeyItemId:'boss-key'});
let out=executeSpawn(bossSpawn,{roomId:'room-8',roomRuntime:room8,spawnState,universe});
assert.equal(out.ok,false);
assert.equal(out.reason,'wrong-room');
assert.equal(out.roomRuntime.entities.length,0);

out=executeSpawn(bossSpawn,{roomId:'room-10',roomRuntime:room10,spawnState,universe});
assert.equal(out.ok,true);
assert.equal(out.instances.length,1);
assert.equal(out.instances[0].creatureId,'wyvern');
assert.equal(out.roomRuntime.entities.length,1);
assert.deepEqual(out.rewards,[],'boss key must not be granted when the boss merely spawns');
assert.deepEqual(out.roomRuntime.entities[0].data.spawn,{spawnId:'boss-10',kind:'boss',bossKeyItemId:'boss-key'});
spawnState=out.spawnState;

const repeat=executeSpawn(bossSpawn,{roomId:'room-10',roomRuntime:out.roomRuntime,spawnState,universe});
assert.equal(repeat.ok,false);
assert.equal(repeat.reason,'already-processed');
assert.equal(repeat.roomRuntime.entities.length,1);

const defeated=resolveRoomCreatureDefeat(out.roomRuntime,'spawn:boss-10:1',universe,{random:()=>0});
assert.equal(defeated.ok,true);
assert.deepEqual(defeated.drops,[{itemId:'dragon-scale',quantity:1},{itemId:'boss-key',quantity:1}]);
const defeatedEntity=defeated.roomRuntime.entities.find(e=>e.id==='spawn:boss-10:1');
assert.equal(defeatedEntity.defeated,true);
assert.equal(defeatedEntity.active,false);
assert.equal(defeatedEntity.data.creatureRuntime.lootClaimed,true);
assert.deepEqual(defeatedEntity.data.creatureRuntime.lootDrops,[{itemId:'dragon-scale',quantity:1},{itemId:'boss-key',quantity:1}]);

let rerolls=0;
const defeatedAgain=resolveRoomCreatureDefeat(structuredClone(defeated.roomRuntime),'spawn:boss-10:1',universe,{random:()=>{rerolls+=1;return 0.99;}});
assert.equal(defeatedAgain.ok,false);
assert.equal(defeatedAgain.reason,'already-claimed');
assert.deepEqual(defeatedAgain.drops,[{itemId:'dragon-scale',quantity:1},{itemId:'boss-key',quantity:1}]);
assert.equal(rerolls,0,'reopening a defeated room creature must never reroll loot or duplicate its boss key');

const emptyInventory=createInventoryState();
const granted=grantRoomCreatureDrops(defeated.roomRuntime,'spawn:boss-10:1',emptyInventory,universe);
assert.equal(granted.ok,true);
assert.equal(inventoryQuantity(granted.inventory,'dragon-scale'),1);
assert.equal(inventoryQuantity(granted.inventory,'boss-key'),1,'boss key must enter inventory only after the boss is defeated and loot is granted');
const grantedEntity=granted.roomRuntime.entities.find(e=>e.id==='spawn:boss-10:1');
assert.equal(grantedEntity.data.creatureRuntime.lootGranted,true);
assert.deepEqual(grantedEntity.data.creatureRuntime.lootGrantedTo,{kind:'inventory',id:null});

const grantedAgain=grantRoomCreatureDrops(structuredClone(granted.roomRuntime),'spawn:boss-10:1',structuredClone(granted.inventory),universe);
assert.equal(grantedAgain.ok,false);
assert.equal(grantedAgain.reason,'already-granted');
assert.equal(inventoryQuantity(grantedAgain.inventory,'dragon-scale'),1,'reopening the room must not grant creature loot twice');
assert.equal(inventoryQuantity(grantedAgain.inventory,'boss-key'),1,'reopening the room must not grant the boss key twice');
assert.deepEqual(grantedAgain.recipient,{kind:'inventory',id:null});

const freshSpawn=executeSpawn(createSpawnDefinition({id:'boss-recipient',kind:'boss',roomId:'room-10',creatureId:'wyvern'}),{roomId:'room-10',roomRuntime:{roomId:'room-10',entities:[],interactions:{}},spawnState:createSpawnState(),universe});
assert.equal(freshSpawn.ok,true);
const freshDefeat=resolveRoomCreatureDefeat(freshSpawn.roomRuntime,'spawn:boss-recipient:1',universe,{random:()=>0});
const heroRecipient={id:'hero-lyra',kind:'hero',name:'Lyra',inventory:createInventoryState()};
const heroGrant=grantRoomCreatureDropsToRecipient(freshDefeat.roomRuntime,'spawn:boss-recipient:1',heroRecipient,universe);
assert.equal(heroGrant.ok,true);
assert.equal(heroGrant.recipient.id,'hero-lyra');
assert.equal(heroGrant.recipient.kind,'hero');
assert.equal(inventoryQuantity(heroGrant.recipient.inventory,'dragon-scale'),1);
const recipientRuntime=heroGrant.roomRuntime.entities[0].data.creatureRuntime;
assert.deepEqual(recipientRuntime.lootGrantedTo,{kind:'hero',id:'hero-lyra'});

const heroGrantAgain=grantRoomCreatureDropsToRecipient(structuredClone(heroGrant.roomRuntime),'spawn:boss-recipient:1',structuredClone(heroGrant.recipient),universe);
assert.equal(heroGrantAgain.ok,false);
assert.equal(heroGrantAgain.reason,'already-granted');
assert.equal(inventoryQuantity(heroGrantAgain.recipient.inventory,'dragon-scale'),1);
assert.equal(heroGrantAgain.recipient.id,'hero-lyra');

const missingRecipientInventory=grantRoomCreatureDropsToRecipient(freshDefeat.roomRuntime,'spawn:boss-recipient:1',{id:'hero-brom',kind:'hero'},universe);
assert.equal(missingRecipientInventory.ok,false);
assert.equal(missingRecipientInventory.reason,'recipient-inventory-missing');

const illegalBoss=createSpawnDefinition({id:'bad-boss',kind:'normal',roomId:'room-8',creatureId:'wyvern'});
const blocked=executeSpawn(illegalBoss,{roomId:'room-8',roomRuntime:room8,spawnState:createSpawnState(),universe});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'boss-requires-boss-spawn');

const reinforce=createSpawnDefinition({id:'reinforce-8',kind:'reinforcement',roomId:'room-8',creatureId:'skeleton',count:2});
const reinf=executeSpawn(reinforce,{roomId:'room-8',roomRuntime:room8,spawnState:createSpawnState(),universe});
assert.equal(reinf.ok,true);
assert.equal(reinf.instances.length,2);
assert.equal(reinf.roomRuntime.entities.length,2);
assert.equal(new Set(reinf.roomRuntime.entities.map(e=>e.id)).size,2);

console.log('rpg-spawn-engine.test.mjs ok');
