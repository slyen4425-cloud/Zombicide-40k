import assert from 'node:assert/strict';
import { createDungeonRuntime, transitionDungeonHeroRoom } from '../src/modes/rpg/room-runtime.js';
import { createWorld, createZone, createRoom, createRoomLink, buildWorldIndex } from '../src/modes/rpg/world-engine.js';
import { createSpatialState, setActorPosition } from '../src/modes/rpg/spatial-engine.js';
import { startDungeonCombat, activeDungeonEnemies, dungeonHeroParticipants } from '../src/modes/rpg/dungeon-combat-runtime.js';

const zone=createZone({id:'z',name:'Zone',roomIds:['a','b']});
const world=createWorld({id:'w',name:'Monde',startRoomId:'a',zones:['z']});
const rooms=[createRoom({id:'a',zoneId:'z',name:'Salle A'}),createRoom({id:'b',zoneId:'z',name:'Salle B'})];
const links=[createRoomLink({id:'ab',fromRoomId:'a',toRoomId:'b',label:'Passage'})];
const index=buildWorldIndex({world,zones:[zone],rooms,links});
const layouts={
  a:{id:'la',roomId:'a',interactions:[],entities:[
    {id:'enemy-active',kind:'creature',active:true,data:{creatureRuntime:{instanceId:'enemy-active',creatureId:'skeleton',active:true,defeated:false,removed:false,state:{stats:{initiative:4},resources:{}},skillIds:['slash'],ai:{kind:'basic'}}}},
    {id:'enemy-dead',kind:'creature',active:false,defeated:true,data:{creatureRuntime:{instanceId:'enemy-dead',creatureId:'zombie',active:false,defeated:true,removed:false,state:{stats:{initiative:9},resources:{}}}}},
  ]},
  b:{id:'lb',roomId:'b',interactions:[],entities:[]},
};
const layoutProvider=id=>layouts[id]||null;
let started=createDungeonRuntime(index,{layoutProvider,heroIds:['aldren','lyra','brom'],focusedHeroId:'aldren'});
assert.equal(started.ok,true);
let runtime=started.runtime;
const moved=transitionDungeonHeroRoom(index,runtime,'brom','ab',{layoutProvider});
assert.equal(moved.ok,true);
runtime=moved.runtime;
assert.equal(runtime.heroLocations.brom.roomId,'b');

const heroRuntimes=[
  {instanceId:'aldren',heroId:'aldren',name:'Aldren',active:true,ko:false,dead:false,state:{stats:{initiative:7},resources:{hp:{current:10,max:10}}}},
  {instanceId:'lyra',heroId:'lyra',name:'Lyra',active:true,ko:false,dead:false,state:{stats:{initiative:8},resources:{hp:{current:8,max:8}}}},
  {instanceId:'brom',heroId:'brom',name:'Brom',active:true,ko:false,dead:false,state:{stats:{initiative:5},resources:{hp:{current:6,max:6}}}},
];
const universe={
  stats:[{id:'initiative',baseValue:0}],resources:[],effects:[],skills:[],
  combat:{initiative:{mode:'stat',source:{kind:'stat',id:'initiative'},base:0,modifier:0}},
};

assert.deepEqual(activeDungeonEnemies(runtime,'a').map(x=>x.entityId),['enemy-active'],'defeated/inactive enemies must never enter a new combat');
let participants=dungeonHeroParticipants({roomRuntime:runtime,heroRuntimes,engagerHeroId:'aldren'});
assert.equal(participants.ok,true);
assert.deepEqual(participants.heroIds.sort(),['aldren','lyra'],'hero in another room must stay out of combat');

let spatial=createSpatialState({zoneId:'a'});
spatial=setActorPosition(spatial,'aldren',{x:0,y:0,zoneId:'a'});
spatial=setActorPosition(spatial,'lyra',{x:5,y:0,zoneId:'a'});
participants=dungeonHeroParticipants({roomRuntime:runtime,heroRuntimes,engagerHeroId:'aldren',spatial,spatialConfig:{combatAssistRange:3}});
assert.deepEqual(participants.heroIds,['aldren'],'same-room hero outside assist range must stay out of combat');

spatial=setActorPosition(spatial,'lyra',{x:2,y:0,zoneId:'a'});
const out=startDungeonCombat({roomRuntime:runtime,heroRuntimes,engagerHeroId:'aldren',universe,spatial,spatialConfig:{combatAssistRange:3},random:()=>0});
assert.equal(out.ok,true);
assert.equal(out.roomId,'a');
assert.deepEqual(out.heroIds.sort(),['aldren','lyra']);
assert.deepEqual(out.enemyIds,['enemy-active']);
assert.equal(out.combat.metadata.kind,'dungeon-room-combat');
assert.equal(out.combat.metadata.engagerHeroId,'aldren');
assert.equal(out.combat.actors.brom,undefined,'hero in another room must not exist in combat runtime');
assert.equal(out.combat.actors['enemy-dead'],undefined,'defeated enemy must not exist in combat runtime');
assert.equal(out.combat.actors.aldren.side,'heroes');
assert.equal(out.combat.actors.lyra.side,'heroes');
assert.equal(out.combat.actors['enemy-active'].side,'enemies');
assert.equal(out.combat.activeActorId,'lyra','initiative must use the existing configured initiative rule');

const noEnemies=startDungeonCombat({roomRuntime:{...runtime,currentRoomId:'b',focusedHeroId:'brom'},heroRuntimes,engagerHeroId:'brom',universe});
assert.equal(noEnemies.ok,false);
assert.equal(noEnemies.reason,'no-active-enemies');

console.log('rpg-dungeon-combat-runtime.test.mjs: OK');
