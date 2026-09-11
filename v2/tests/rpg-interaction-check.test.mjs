import assert from 'node:assert/strict';
import { createRoomInteraction, resolveRoomInteractionCheck } from '../src/modes/rpg/interaction-engine.js';

const definitions={checks:[
  {id:'force-test',name:'Test de Force',enabled:true,die:100,mode:'roll-under',statId:'strength',difficulty:50,modifier:0},
  {id:'disabled-test',name:'Ancien test',enabled:false,die:100,mode:'roll-under',statId:'strength',difficulty:50,modifier:0},
]};
const actor={stats:{strength:15}};

const lever=createRoomInteraction({id:'lever',kind:'switch',name:'Levier grippé',attachment:{kind:'cell',x:1,y:1},checkId:'force-test'});
assert.equal(lever.checkId,'force-test');
let out=resolveRoomInteractionCheck(lever,actor,{definitions,roll:40});
assert.equal(out.ok,true);
assert.equal(out.success,true);
assert.equal(out.outcome,'success');
assert.equal(out.check.threshold,65);
assert.equal(out.definition.name,'Test de Force');

out=resolveRoomInteractionCheck(lever,actor,{definitions,roll:90});
assert.equal(out.ok,true);
assert.equal(out.success,false);
assert.equal(out.outcome,'failure');

const legacy=createRoomInteraction({id:'old-door',kind:'object',attachment:{kind:'cell',x:0,y:0},check:{die:20,mode:'roll-over',statId:'strength',difficulty:15,modifier:0}});
out=resolveRoomInteractionCheck(legacy,actor,{definitions,roll:5});
assert.equal(out.ok,true);
assert.equal(out.success,true);
assert.equal(out.check.die,20);

const blocked=createRoomInteraction({id:'blocked',kind:'object',attachment:{kind:'cell',x:0,y:0},checkId:'disabled-test'});
out=resolveRoomInteractionCheck(blocked,actor,{definitions,roll:1});
assert.equal(out.ok,false);
assert.equal(out.reason,'check-disabled');

const free=createRoomInteraction({id:'free',kind:'chest',attachment:{kind:'cell',x:0,y:0}});
out=resolveRoomInteractionCheck(free,actor,{definitions});
assert.equal(out.ok,true);
assert.equal(out.success,true);

console.log('rpg-interaction-check.test.mjs: OK');
