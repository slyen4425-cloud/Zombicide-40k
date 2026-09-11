import assert from 'node:assert/strict';
import { createDungeonRuntime, transitionDungeonHeroRoom } from '../src/modes/rpg/room-runtime.js';
import { createWorld, createZone, createRoom, createRoomLink, buildWorldIndex } from '../src/modes/rpg/world-engine.js';
import { createSpatialState, setActorPosition } from '../src/modes/rpg/spatial-engine.js';
import { startDungeonCombat, activeDungeonEnemies, dungeonHeroParticipants, dungeonHeroCombatSkills, executeDungeonHeroSkill, reconcileDungeonCombatResult } from '../src/modes/rpg/dungeon-combat-runtime.js';

const zone=createZone({id:'z',name:'Zone',roomIds:['a','b']});
const world=createWorld({id:'w',name:'Monde',startRoomId:'a',zones:['z']});
const rooms=[createRoom({id:'a',zoneId:'z',name:'Salle A'}),createRoom({id:'b',zoneId:'z',name:'Salle B'})];
const links=[createRoomLink({id:'ab',fromRoomId:'a',toRoomId:'b',label:'Passage'})];
const index=buildWorldIndex({world,zones:[zone],rooms,links});
const layouts={
  a:{id:'la',roomId:'a',interactions:[],entities:[
    {id:'enemy-active',kind:'creature',active:true,data:{creatureRuntime:{instanceId:'enemy-active',creatureId:'skeleton',active:true,defeated:false,removed:false,state:{stats:{initiative:4},resources:{hp:{current:5,max:5}}},skillIds:['slash'],ai:{kind:'basic'}}}},
    {id:'enemy-dead',kind:'creature',active:false,defeated:true,data:{creatureRuntime:{instanceId:'enemy-dead',creatureId:'zombie',active:false,defeated:true,removed:false,state:{stats:{initiative:9},resources:{hp:{current:0,max:5}}}}}},
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
  {instanceId:'aldren',heroId:'aldren',name:'Aldren',active:true,ko:false,dead:false,baseSkillIds:[],state:{stats:{initiative:7},resources:{hp:{current:10,max:10}}}},
  {instanceId:'lyra',heroId:'lyra',name:'Lyra',active:true,ko:false,dead:false,baseSkillIds:['arrow'],state:{stats:{initiative:8},resources:{hp:{current:8,max:8}}}},
  {instanceId:'brom',heroId:'brom',name:'Brom',active:true,ko:false,dead:false,baseSkillIds:[],state:{stats:{initiative:5},resources:{hp:{current:6,max:6}}}},
];
const universe={
  stats:[{id:'initiative',baseValue:0}],
  resources:[{id:'hp',name:'PV',min:0,maxFormula:'10'}],
  effects:[{id:'arrow-damage',name:'Flèche',enabled:true,kind:'resource-modifier',resourceId:'hp',operation:'subtract',value:10,chance:100,conditions:[]}],
  skills:[{id:'arrow',name:'Tir précis',enabled:true,target:'enemy',effectIds:['arrow-damage'],conditionIds:[],roll:{enabled:false}}],
  items:[{id:'bone',name:'Os'}],
  bestiary:[
    {id:'skeleton',name:'Squelette',loot:[{itemId:'bone',quantityMin:1,quantityMax:1,chance:100}]},
    {id:'zombie',name:'Zombie',loot:[]},
  ],
  combat:{
    initiative:{mode:'stat',source:{kind:'stat',id:'initiative'},base:0,modifier:0},
    defeatRule:{enabled:true,kind:'resource',sourceId:'hp',operator:'lte',threshold:0},
  },
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
assert.deepEqual(dungeonHeroCombatSkills({combat:out.combat,heroRuntimes,universe}).map(skill=>skill.id),['arrow'],'active hero must only receive skills owned by his real runtime');

const used=executeDungeonHeroSkill({combat:out.combat,heroRuntimes,universe,skillId:'arrow',targetId:'enemy-active',actionId:'dungeon-action-1',randomPercent:()=>0});
assert.equal(used.ok,true);
assert.equal(used.skillId,'arrow');
assert.equal(used.targetId,'enemy-active');
assert.equal(used.combat.actors['enemy-active'].state.resources.hp.current,0,'real skill effect must mutate the real combat state');
assert.equal(used.combat.actors['enemy-active'].ko,true,'configured defeat rule must mark the enemy KO after the action');
assert.equal(used.combat.phase,'ended','last enemy KO must end the same combat state');
assert.equal(used.combat.winner,'heroes');
assert.equal(used.combat.processedActionIds.filter(id=>id==='dungeon-action-1').length,1,'action must resolve exactly once');

const wrongTurn=executeDungeonHeroSkill({combat:{...out.combat,activeActorId:'enemy-active'},heroRuntimes,universe,skillId:'arrow',targetId:'lyra'});
assert.equal(wrongTurn.ok,false);
assert.equal(wrongTurn.reason,'not-hero-turn');

const unfinished=reconcileDungeonCombatResult({combat:out.combat,roomRuntime:runtime,heroRuntimes,universe});
assert.equal(unfinished.ok,false);
assert.equal(unfinished.reason,'combat-not-ended');

const reconciledFromSkill=reconcileDungeonCombatResult({combat:used.combat,roomRuntime:runtime,heroRuntimes,universe,random:()=>0});
assert.equal(reconciledFromSkill.ok,true);
assert.equal(reconciledFromSkill.roomCleared,true);
assert.deepEqual(reconciledFromSkill.defeatedEnemyIds,['enemy-active']);

const ended=structuredClone(out.combat);
ended.phase='ended';
ended.winner='heroes';
ended.activeActorId=null;
ended.actors['enemy-active'].ko=true;
ended.actors.aldren.state.resources.hp.current=6;
ended.actors.lyra.ko=true;
ended.actors.lyra.state.resources.hp.current=0;
const reconciled=reconcileDungeonCombatResult({combat:ended,roomRuntime:runtime,heroRuntimes,universe,random:()=>0});
assert.equal(reconciled.ok,true);
assert.equal(reconciled.outcome,'victory');
assert.equal(reconciled.roomCleared,true);
assert.equal(reconciled.heroesStillAlive,true,'Brom alive in another room must prevent false global game over');
assert.deepEqual(reconciled.defeatedEnemyIds,['enemy-active']);
assert.equal(reconciled.roomRuntime.rooms.a.entities.find(x=>x.id==='enemy-active').defeated,true);
assert.equal(reconciled.roomRuntime.rooms.a.entities.find(x=>x.id==='enemy-active').data.creatureRuntime.lootClaimed,true);
assert.deepEqual(reconciled.roomRuntime.rooms.a.entities.find(x=>x.id==='enemy-active').data.creatureRuntime.lootDrops,[{itemId:'bone',quantity:1}]);
assert.equal(reconciled.heroRuntimes.find(x=>x.instanceId==='aldren').state.resources.hp.current,6);
assert.equal(reconciled.heroRuntimes.find(x=>x.instanceId==='lyra').ko,true);
assert.equal(reconciled.heroRuntimes.find(x=>x.instanceId==='lyra').active,false);
assert.equal(reconciled.heroRuntimes.find(x=>x.instanceId==='brom').active,true,'hero outside combat must remain untouched');
assert.equal(activeDungeonEnemies(reconciled.roomRuntime,'a').length,0,'reconciled defeated enemy must not respawn into the next combat');

const noEnemies=startDungeonCombat({roomRuntime:{...runtime,currentRoomId:'b',focusedHeroId:'brom'},heroRuntimes,engagerHeroId:'brom',universe});
assert.equal(noEnemies.ok,false);
assert.equal(noEnemies.reason,'no-active-enemies');

console.log('rpg-dungeon-combat-runtime.test.mjs: OK');
