import assert from 'node:assert/strict';
import { createCreatureDefinition, validateCreatureDefinition, createCreatureRuntime, chooseCreatureAction, rollCreatureLoot } from '../src/modes/rpg/bestiary-engine.js';

const universe={
  stats:[{id:'force',name:'Force',baseValue:10},{id:'speed',name:'Agilité',baseValue:4}],
  resources:[{id:'life',name:'PV',min:0,maxFormula:{kind:'fixed',value:20}}],
  skills:[{id:'bite',name:'Morsure',enabled:true},{id:'roar',name:'Rugissement',enabled:true}],
};

const wyvern=createCreatureDefinition({
  id:'wyvern',name:'Wyverne',boss:true,statValues:{force:18,speed:7},resourceValues:{life:50},
  skillIds:['bite','roar'],ai:{kind:'priority',skillPriority:['roar','bite'],targetRule:'nearest'},
  loot:[{itemId:'boss-key',quantity:1,chance:100},{itemId:'scale',quantityMin:1,quantityMax:2,chance:100}],xp:25,
});

assert.equal(validateCreatureDefinition(wyvern,universe).valid,true);
const runtime=createCreatureRuntime(wyvern,universe,{instanceId:'wyvern-room10',roomId:'room10',x:3,y:2});
assert.equal(runtime.boss,true);
assert.equal(runtime.roomId,'room10');
assert.equal(runtime.state.stats.force,18);
assert.equal(runtime.state.resources.life.current,20,'creature resource current must not exceed max');
assert.equal(runtime.state.resources.life.max,20);
assert.deepEqual(chooseCreatureAction(runtime,universe),{ok:true,skillId:'roar',targetRule:'nearest'});

const wounded=createCreatureDefinition({id:'wounded',name:'Blessé',resourceValues:{life:-5}});
const woundedRuntime=createCreatureRuntime(wounded,universe);
assert.equal(woundedRuntime.state.resources.life.current,0,'creature resource current must respect min');

const loot=rollCreatureLoot(wyvern,{random:()=>0});
assert.deepEqual(loot,[{itemId:'boss-key',quantity:1},{itemId:'scale',quantity:1}]);
assert.equal(loot.filter(x=>x.itemId==='boss-key').length,1);

const broken=createCreatureDefinition({id:'bad',statValues:{ghost:1},skillIds:['missing']});
const validation=validateCreatureDefinition(broken,universe);
assert.equal(validation.valid,false);
assert(validation.errors.some(e=>e.code==='missing-stat'));
assert(validation.errors.some(e=>e.code==='missing-skill'));

const inactive={...runtime,defeated:true};
assert.deepEqual(chooseCreatureAction(inactive,universe),{ok:false,reason:'inactive'});

console.log('rpg-bestiary-engine.test.mjs ok');
