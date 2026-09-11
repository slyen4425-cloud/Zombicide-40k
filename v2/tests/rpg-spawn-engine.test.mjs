import assert from 'node:assert/strict';
import { createSpawnDefinition, createSpawnState, executeSpawn, resolveRoomCreatureDefeat } from '../src/modes/rpg/spawn-engine.js';

const universe={
  stats:[],resources:[],skills:[],
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
assert.deepEqual(out.rewards,[{itemId:'boss-key',source:'boss-key'}]);
spawnState=out.spawnState;

const repeat=executeSpawn(bossSpawn,{roomId:'room-10',roomRuntime:out.roomRuntime,spawnState,universe});
assert.equal(repeat.ok,false);
assert.equal(repeat.reason,'already-processed');
assert.equal(repeat.roomRuntime.entities.length,1);

const defeated=resolveRoomCreatureDefeat(out.roomRuntime,'spawn:boss-10:1',universe,{random:()=>0});
assert.equal(defeated.ok,true);
assert.deepEqual(defeated.drops,[{itemId:'dragon-scale',quantity:1}]);
const defeatedEntity=defeated.roomRuntime.entities.find(e=>e.id==='spawn:boss-10:1');
assert.equal(defeatedEntity.defeated,true);
assert.equal(defeatedEntity.active,false);
assert.equal(defeatedEntity.data.creatureRuntime.lootClaimed,true);
assert.deepEqual(defeatedEntity.data.creatureRuntime.lootDrops,[{itemId:'dragon-scale',quantity:1}]);

let rerolls=0;
const defeatedAgain=resolveRoomCreatureDefeat(structuredClone(defeated.roomRuntime),'spawn:boss-10:1',universe,{random:()=>{rerolls+=1;return 0.99;}});
assert.equal(defeatedAgain.ok,false);
assert.equal(defeatedAgain.reason,'already-claimed');
assert.deepEqual(defeatedAgain.drops,[{itemId:'dragon-scale',quantity:1}]);
assert.equal(rerolls,0,'reopening a defeated room creature must never reroll loot');

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
