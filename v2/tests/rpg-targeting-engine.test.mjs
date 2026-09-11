import assert from 'node:assert/strict';
import { createCombatState } from '../src/modes/rpg/combat-engine.js';
import { createSpatialState, setActorPosition } from '../src/modes/rpg/spatial-engine.js';
import { validCombatTargets, validatePlayerTarget, chooseAiTarget } from '../src/modes/rpg/targeting-engine.js';

let combat=createCombatState({combatants:[
  {id:'hero-a',side:'heroes',initiative:12,state:{resources:{hp:{current:10,max:10}}}},
  {id:'hero-b',side:'heroes',initiative:11,state:{resources:{hp:{current:4,max:10}}}},
  {id:'hero-c',side:'heroes',initiative:10,state:{resources:{hp:{current:8,max:10}}}},
  {id:'goblin',side:'enemies',initiative:5,state:{resources:{hp:{current:6,max:6}}}},
]});
let spatial=createSpatialState({zoneId:'room-a'});
spatial=setActorPosition(spatial,'hero-a',{x:0,y:0,zoneId:'room-a'});
spatial=setActorPosition(spatial,'hero-b',{x:2,y:0,zoneId:'room-a'});
spatial=setActorPosition(spatial,'hero-c',{x:4,y:0,zoneId:'room-a'});
spatial=setActorPosition(spatial,'goblin',{x:1,y:0,zoneId:'room-a'});

const bow={data:{attackStyle:'ranged',rangeMin:1,rangeMax:5,requiresLineOfSight:true}};
let targets=validCombatTargets({combat,actorId:'hero-a',spatial,source:bow,config:{mode:'tactical'}});
assert.deepEqual(targets.map(x=>x.actor.id),['goblin']);

let player=validatePlayerTarget({combat,actorId:'hero-a',targetId:'goblin',spatial,source:bow,config:{mode:'tactical'}});
assert.equal(player.ok,true);
assert.equal(player.targetId,'goblin');
assert.equal(validatePlayerTarget({combat,actorId:'hero-a',targetId:'hero-b'}).reason,'same-side');

combat.activeActorId='goblin';
const melee={data:{attackStyle:'melee',rangeMax:10}};
let ai=chooseAiTarget({combat,actorId:'goblin',spatial,source:melee,config:{mode:'tactical'},ai:{targetRule:'weakest',primaryResourceId:'hp'},random:()=>0});
assert.equal(ai.ok,true);
assert.equal(ai.targetId,'hero-b');

ai=chooseAiTarget({combat,actorId:'goblin',spatial,source:melee,config:{mode:'tactical'},ai:{targetRule:'random',avoidRepeat:true},memory:{lastTargetId:'hero-a'},random:()=>0});
assert.notEqual(ai.targetId,'hero-a');

const first=chooseAiTarget({combat,actorId:'goblin',spatial,source:melee,config:{mode:'tactical'},ai:{targetRule:'varied',avoidRepeat:true,repeatPenalty:0.01},memory:{lastTargetId:'hero-a'},random:()=>0});
assert.notEqual(first.targetId,'hero-a');
assert.equal(first.memory.lastTargetId,first.targetId);

combat.actors['hero-b'].ko=true;
assert.equal(validatePlayerTarget({combat,actorId:'goblin',targetId:'hero-b'}).reason,'target-ko');

console.log('rpg-targeting-engine.test.mjs: OK');
