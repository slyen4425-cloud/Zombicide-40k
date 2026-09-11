import assert from 'node:assert/strict';
import { createEventDefinition, createEventState, runEvent, chooseEventOption } from '../src/modes/rpg/event-engine.js';

const definitions={
  stats:[],
  resources:[{id:'hp',min:0,maxFormula:{kind:'fixed',value:10}}],
  effects:[{id:'hurt',kind:'resource-modifier',resourceId:'hp',operation:'subtract',value:2,chance:100,conditions:[]}],
  checks:[{id:'agility-test',name:'Test Agilité',enabled:true,die:100,mode:'roll-under',statId:'agility',difficulty:40,modifier:0}],
};

const event=createEventDefinition({
  id:'ambush',
  name:'Embuscade',
  actions:[
    {kind:'text',text:'Une grille tombe derrière le groupe.'},
    {kind:'door',doorId:'gate',patch:{state:'closed',locked:true}},
    {kind:'spawn',entity:{id:'goblin-1',kind:'enemy',x:2,y:2}},
    {kind:'effect',effectId:'hurt',targetId:'hero'},
    {kind:'choice',id:'ambush-choice',choices:[
      {id:'fight',label:'Combattre',actions:[{kind:'flag',flagId:'fight_chosen',value:true},{kind:'reward',itemId:'old_coin',quantity:2}]},
      {id:'flee',label:'Fuir',actions:[{kind:'transition',linkId:'back-link'}]},
    ]},
  ],
});

const initialWorld={
  actors:{hero:{resources:{hp:{current:10,max:10}},stats:{agility:10}}},
  inventory:{},flags:{},doors:{gate:{id:'gate',state:'open',locked:false}},
  rooms:{roomA:{entities:[]}},
};

let state=createEventState(event,{runId:'run-1',roomId:'roomA'});
let result=runEvent(state,{world:initialWorld,definitions,defaultTargetId:'hero',effectContext:{randomPercent:()=>0}});
assert.equal(result.state.status,'waiting-choice');
assert.equal(result.world.doors.gate.state,'closed');
assert.equal(result.world.doors.gate.locked,true);
assert.equal(result.world.rooms.roomA.entities.length,1);
assert.equal(result.world.actors.hero.resources.hp.current,8);
assert.equal(result.state.processedActionIds.length,5);

const resumed=chooseEventOption(result.state,'fight',{world:result.world,definitions,defaultTargetId:'hero',effectContext:{randomPercent:()=>0}});
assert.equal(resumed.ok,true);
assert.equal(resumed.state.status,'completed');
assert.equal(resumed.world.flags.fight_chosen,true);
assert.equal(resumed.world.inventory.old_coin,2);
assert.equal(resumed.world.rooms.roomA.entities.length,1);

const rerun=runEvent(resumed.state,{world:resumed.world,definitions,defaultTargetId:'hero',effectContext:{randomPercent:()=>0}});
assert.equal(rerun.world.rooms.roomA.entities.length,1);
assert.equal(rerun.world.actors.hero.resources.hp.current,8);
assert.equal(rerun.world.inventory.old_coin,2);
assert.equal(rerun.state.log.filter(x=>x.type==='event-completed').length,1);

const invalidChoice=chooseEventOption(result.state,'missing',{world:result.world,definitions});
assert.equal(invalidChoice.ok,false);
assert.equal(invalidChoice.reason,'choice-missing');

const checkedEvent=createEventDefinition({
  id:'agility-door',
  actions:[{
    kind:'check',id:'jump-check',checkId:'agility-test',actorId:'hero',
    successActions:[{kind:'flag',flagId:'jump_success',value:true}],
    failureActions:[{kind:'effect',effectId:'hurt',targetId:'hero'},{kind:'flag',flagId:'jump_failed',value:true}],
  }],
});

let checked=createEventState(checkedEvent,{runId:'run-check-success',roomId:'roomA'});
let checkedResult=runEvent(checked,{world:initialWorld,definitions,defaultTargetId:'hero',checkRandom:()=>0.1,effectContext:{randomPercent:()=>0}});
assert.equal(checkedResult.state.status,'completed');
assert.equal(checkedResult.world.flags.jump_success,true);
assert.equal(checkedResult.world.flags.jump_failed,undefined);
assert.equal(checkedResult.world.actors.hero.resources.hp.current,10);
const successLog=checkedResult.state.log.find(x=>x.type==='event-check-resolved');
assert.equal(successLog.checkId,'agility-test');
assert.equal(successLog.success,true);

checked=createEventState(checkedEvent,{runId:'run-check-failure',roomId:'roomA'});
checkedResult=runEvent(checked,{world:initialWorld,definitions,defaultTargetId:'hero',checkRandom:()=>0.95,effectContext:{randomPercent:()=>0}});
assert.equal(checkedResult.world.flags.jump_success,undefined);
assert.equal(checkedResult.world.flags.jump_failed,true);
assert.equal(checkedResult.world.actors.hero.resources.hp.current,8);
assert.equal(checkedResult.state.log.find(x=>x.type==='event-check-resolved')?.success,false);

console.log('rpg-event-engine: ok');
