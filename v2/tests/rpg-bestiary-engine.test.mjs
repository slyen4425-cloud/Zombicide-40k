import assert from 'node:assert/strict';
import { createCreatureDefinition, validateCreatureDefinition, createCreatureRuntime, chooseCreatureAction, rollCreatureLoot, claimCreatureLoot } from '../src/modes/rpg/bestiary-engine.js';

const universe={
  stats:[{id:'force',name:'Force',baseValue:10},{id:'speed',name:'Agilité',baseValue:4}],
  resources:[{id:'life',name:'PV',min:0,maxFormula:{kind:'fixed',value:20}}],
  skills:[{id:'bite',name:'Morsure',enabled:true},{id:'roar',name:'Rugissement',enabled:true}],
};

const wyvern=createCreatureDefinition({
  id:'wyvern',name:'Wyverne',boss:true,icon:'wyvern-icon.png',artId:'wyvern-art',audioId:'wyvern-roar',
  statValues:{force:18,speed:7},resourceValues:{life:50},
  skillIds:['bite','roar'],ai:{kind:'priority',skillPriority:['roar','bite'],targetRule:'nearest'},
  loot:[{itemId:'boss-key',quantity:1,chance:100},{itemId:'scale',quantityMin:1,quantityMax:2,chance:100}],xp:25,
});

assert.equal(validateCreatureDefinition(wyvern,universe).valid,true);
const runtime=createCreatureRuntime(wyvern,universe,{instanceId:'wyvern-room10',roomId:'room10',x:3,y:2});
assert.equal(runtime.boss,true);
assert.equal(runtime.roomId,'room10');
assert.equal(runtime.icon,'wyvern-icon.png');
assert.equal(runtime.artId,'wyvern-art');
assert.equal(runtime.audioId,'wyvern-roar');
assert.equal(runtime.state.stats.force,18);
assert.equal(runtime.state.resources.life.current,20,'creature resource current must not exceed max');
assert.equal(runtime.state.resources.life.max,20);
assert.equal(runtime.lootClaimed,false);
assert.equal(runtime.lootDrops,null);
assert.deepEqual(chooseCreatureAction(runtime,universe),{ok:true,skillId:'roar',targetRule:'nearest'});

const persistedRuntime=structuredClone(runtime);
assert.equal(persistedRuntime.audioId,'wyvern-roar','creature audio binding must survive save/load');
assert.equal(persistedRuntime.artId,'wyvern-art');
assert.equal(persistedRuntime.icon,'wyvern-icon.png');

const wounded=createCreatureDefinition({id:'wounded',name:'Blessé',resourceValues:{life:-5}});
const woundedRuntime=createCreatureRuntime(wounded,universe);
assert.equal(woundedRuntime.state.resources.life.current,0,'creature resource current must respect min');

const loot=rollCreatureLoot(wyvern,{random:()=>0});
assert.deepEqual(loot,[{itemId:'boss-key',quantity:1},{itemId:'scale',quantity:1}]);
assert.equal(loot.filter(x=>x.itemId==='boss-key').length,1);

const earlyClaim=claimCreatureLoot(runtime,wyvern,{random:()=>0});
assert.equal(earlyClaim.ok,false);
assert.equal(earlyClaim.reason,'not-defeated');
assert.equal(earlyClaim.runtime.lootClaimed,false);

const defeated={...runtime,defeated:true,active:false};
const firstClaim=claimCreatureLoot(defeated,wyvern,{random:()=>0});
assert.equal(firstClaim.ok,true);
assert.deepEqual(firstClaim.drops,[{itemId:'boss-key',quantity:1},{itemId:'scale',quantity:1}]);
assert.equal(firstClaim.runtime.lootClaimed,true);
assert.deepEqual(firstClaim.runtime.lootDrops,firstClaim.drops);

let rerolls=0;
const persisted=structuredClone(firstClaim.runtime);
const secondClaim=claimCreatureLoot(persisted,wyvern,{random:()=>{rerolls+=1;return 0.99;}});
assert.equal(secondClaim.ok,false);
assert.equal(secondClaim.reason,'already-claimed');
assert.deepEqual(secondClaim.drops,firstClaim.drops);
assert.equal(rerolls,0,'already claimed loot must never roll again after save/load');

const broken=createCreatureDefinition({id:'bad',statValues:{ghost:1},skillIds:['missing']});
const validation=validateCreatureDefinition(broken,universe);
assert.equal(validation.valid,false);
assert(validation.errors.some(e=>e.code==='missing-stat'));
assert(validation.errors.some(e=>e.code==='missing-skill'));

const inactive={...runtime,defeated:true};
assert.deepEqual(chooseCreatureAction(inactive,universe),{ok:false,reason:'inactive'});

console.log('rpg-bestiary-engine.test.mjs ok');
