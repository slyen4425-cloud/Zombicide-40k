import assert from 'node:assert/strict';
import { createTrapDefinition, createTrapState, detectTrap, disarmTrap, triggerTrap } from '../src/modes/rpg/trap-engine.js';

const definitions={
  effects:[{
    id:'hurt',kind:'resource-modifier',resourceId:'hp',operation:'subtract',value:3,enabled:true,chance:100,
  }],
  resources:[{id:'hp',min:0,maxMode:'fixed',maxValue:10}],
};

const trap=createTrapDefinition({
  id:'trap1',name:'Dalle piégée',hidden:true,
  detectionCheck:{statId:'perception',die:100,difficulty:50,mode:'roll-under'},
  disarmCheck:{statId:'agility',die:100,difficulty:40,mode:'roll-under'},
  effectIds:['hurt'],eventId:'alarm',audioId:'trap_click',
});

let state=createTrapState(trap);
let actor={stats:{perception:20,agility:10},resources:{hp:{current:10,max:10}}};

let out=detectTrap(trap,state,actor,{random:()=>0.1});
assert.equal(out.detected,true);
assert.equal(out.state.revealed,true);
state=out.state;

out=disarmTrap(trap,state,actor,{random:()=>0.9,definitions});
assert.equal(out.disarmed,false);
assert.equal(out.triggered,true);
assert.equal(out.state.triggered,true);
assert.equal(out.state.triggerCount,1);
assert.equal(out.actor.resources.hp.current,7);
assert.equal(out.eventId,'alarm');
assert.equal(out.audioId,'trap_click');
state=out.state; actor=out.actor;

const repeat=triggerTrap(trap,state,actor,{definitions});
assert.equal(repeat.already,true);
assert.equal(repeat.actor.resources.hp.current,7);
assert.equal(repeat.state.triggerCount,1);

const safeTrap=createTrapDefinition({
  id:'trap2',hidden:false,
  disarmCheck:{statId:'agility',die:20,difficulty:10,mode:'roll-under'},
  effectIds:['hurt'],
});
let safeState=createTrapState(safeTrap);
const safeActor={stats:{agility:10},resources:{hp:{current:10,max:10}}};
const safe=disarmTrap(safeTrap,safeState,safeActor,{random:()=>0,definitions});
assert.equal(safe.disarmed,true);
assert.equal(safe.triggered,false);
assert.equal(safe.state.disarmed,true);
assert.equal(safe.actor.resources.hp.current,10);
const blocked=triggerTrap(safeTrap,safe.state,safe.actor,{definitions});
assert.equal(blocked.ok,false);
assert.equal(blocked.reason,'disarmed');

console.log('rpg-trap-engine: ok');
