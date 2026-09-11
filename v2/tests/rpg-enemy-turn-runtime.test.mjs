import assert from 'node:assert/strict';
import { createCombatState } from '../src/modes/rpg/combat-engine.js';
import { chooseEnemyTurn } from '../src/modes/rpg/enemy-turn-runtime.js';

const universe={skills:[{id:'bite',enabled:true},{id:'roar',enabled:true}]};
const runtime={
  instanceId:'wolf',
  active:true,defeated:false,removed:false,
  skillIds:['bite','roar'],
  ai:{kind:'priority',skillPriority:['bite','roar'],targetRule:'varied',avoidRepeat:true},
};
const combat=createCombatState({combatants:[
  {id:'wolf',side:'enemies',initiative:10,state:{}},
  {id:'hero-a',side:'heroes',initiative:8,state:{}},
  {id:'hero-b',side:'heroes',initiative:7,state:{}},
]});

let turn=chooseEnemyTurn({runtime,universe,combat,actorId:'wolf',memory:{},random:()=>0});
assert.equal(turn.ok,true);
assert.equal(turn.skillId,'bite');
assert.equal(turn.targetId,'hero-a');

const second=chooseEnemyTurn({runtime,universe,combat,actorId:'wolf',memory:turn.memory,random:()=>0});
assert.equal(second.ok,true);
assert.equal(second.skillId,'bite');
assert.equal(second.targetId,'hero-b','varied AI should not immediately repeat the previous target when another valid target exists');
assert.equal(second.memory.lastTargetId,'hero-b');

const onlyOne=createCombatState({combatants:[
  {id:'wolf',side:'enemies',initiative:10,state:{}},
  {id:'hero-a',side:'heroes',initiative:8,state:{}},
  {id:'hero-b',side:'heroes',initiative:7,state:{},ko:true},
]});
const forced=chooseEnemyTurn({runtime,universe,combat:onlyOne,actorId:'wolf',memory:{lastTargetId:'hero-a'},random:()=>0});
assert.equal(forced.ok,true);
assert.equal(forced.targetId,'hero-a');

console.log('rpg-enemy-turn-runtime.test.mjs: ok');
