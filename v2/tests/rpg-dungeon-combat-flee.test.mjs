import assert from 'node:assert/strict';
import { createCombatState } from '../src/modes/rpg/combat-engine.js';
import { fleeDungeonCombat } from '../src/modes/rpg/dungeon-combat-flee-runtime.js';

const roomRuntime={
  currentRoomId:'room-a',
  focusedHeroId:'hero-a',
  rooms:{
    'room-a':{
      entities:[{
        id:'enemy-entity',kind:'creature',active:true,removed:false,defeated:false,
        data:{creatureRuntime:{instanceId:'enemy-1',creatureId:'skeleton',active:true,removed:false,defeated:false,lootClaimed:false,state:{resources:{hp:{current:10,max:10}},stats:{}}}},
      }],
    },
  },
  heroLocations:{
    'hero-a':{heroId:'hero-a',roomId:'room-a'},
    'hero-b':{heroId:'hero-b',roomId:'room-b'},
  },
};

const heroRuntimes=[
  {instanceId:'hero-a',heroId:'hero-a',active:true,ko:false,dead:false,state:{resources:{hp:{current:10,max:10}},stats:{}}},
  {instanceId:'hero-b',heroId:'hero-b',active:true,ko:false,dead:false,state:{resources:{hp:{current:9,max:10}},stats:{}}},
];

let combat=createCombatState({combatants:[
  {id:'hero-a',side:'heroes',initiative:10,state:{resources:{hp:{current:4,max:10}},stats:{}},metadata:{sourceKind:'hero',heroId:'hero-a',instanceId:'hero-a',roomId:'room-a'}},
  {id:'enemy-1',side:'enemies',initiative:5,state:{resources:{hp:{current:2,max:10}},stats:{}},metadata:{sourceKind:'creature',roomEntityId:'enemy-entity',creatureId:'skeleton',roomId:'room-a'}},
]});
combat.metadata={kind:'dungeon-room-combat',roomId:'room-a',engagerHeroId:'hero-a',heroIds:['hero-a'],enemyIds:['enemy-1'],enemyEntityIds:['enemy-entity'],aiMemory:{}};

const out=fleeDungeonCombat({combat,roomRuntime,heroRuntimes});
assert.equal(out.ok,true);
assert.equal(out.combat.phase,'fled');
assert.equal(out.combat.activeActorId,null);
assert.equal(out.combat.winner,null);
assert.equal(out.combat.metadata.fled,true);
assert.equal(out.combat.log.some(event=>event.type==='combat-fled'),true);
assert.equal(out.enemyStatesRestored,true);

assert.equal(out.heroRuntimes[0].state.resources.hp.current,4,'participating hero keeps combat damage');
assert.equal(out.heroRuntimes[1].state.resources.hp.current,9,'hero in another room must stay untouched');
assert.equal(out.heroRuntimes[1].active,true);

const enemyRuntime=out.roomRuntime.rooms['room-a'].entities[0].data.creatureRuntime;
assert.equal(enemyRuntime.state.resources.hp.current,10,'flee restores enemy by keeping persistent room runtime unchanged');
assert.equal(enemyRuntime.defeated,false);
assert.equal(enemyRuntime.lootClaimed,false);
assert.equal(out.roomRuntime.rooms['room-a'].entities[0].defeated,false);

assert.equal(roomRuntime.rooms['room-a'].entities[0].data.creatureRuntime.state.resources.hp.current,10,'input runtime must not be mutated');

const second=fleeDungeonCombat({combat:out.combat,roomRuntime:out.roomRuntime,heroRuntimes:out.heroRuntimes});
assert.equal(second.ok,false);
assert.equal(second.reason,'combat-not-active');

console.log('rpg-dungeon-combat-flee.test.mjs: OK');
