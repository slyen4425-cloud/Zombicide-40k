import assert from 'node:assert/strict';
import { createCombatState } from '../src/modes/rpg/combat-engine.js';
import { renderDungeonGameplayView } from '../src/modes/rpg/dungeon-gameplay-view.js';
import { renderDungeonCombatItemControls } from '../src/modes/rpg/dungeon-combat-item-ui.js';

const baseUniverse={
  heroes:[{id:'hero',name:'Lyra'}],
  bestiary:[{id:'skeleton',name:'Squelette'}],
  skills:[{id:'shot',name:'Tir',icon:'🏹',enabled:true,target:'enemy'}],
  items:[{id:'potion',name:'Potion',icon:'🧪',kind:'consumable',enabled:true,stackable:true,maxStack:9,conditionIds:[],effectIds:[],skillIds:[],data:{target:'self'}}],
  resources:[{id:'hp',name:'PV'}],
  combat:{interaction:{directCombat:false,gmFullControl:false}},
};
const roomRuntime={
  currentRoomId:'room-1',
  focusedHeroId:'hero',
  heroLocations:{hero:{heroId:'hero',roomId:'room-1',visitedRoomIds:['room-1'],history:[],sequence:0}},
  rooms:{'room-1':{visits:1,entities:[]}},
  eventQueue:{pending:[]},
  questRuntime:{},
};
const heroRuntimes=[{instanceId:'hero',heroId:'hero',active:true,ko:false,dead:false,baseSkillIds:['shot'],inventory:{stacks:{potion:1}},state:{resources:{hp:{current:10,max:10}},stats:{}}}];

const heroCombat=createCombatState({combatants:[
  {id:'hero',side:'heroes',initiative:10,state:{resources:{hp:{current:10,max:10}},stats:{}},metadata:{heroId:'hero'}},
  {id:'enemy',side:'enemies',initiative:5,state:{resources:{hp:{current:10,max:10}},stats:{}},metadata:{creatureId:'skeleton'}},
]});
heroCombat.metadata={kind:'dungeon-room-combat',roomId:'room-1',heroIds:['hero'],enemyIds:['enemy']};

const directOffHtml=renderDungeonGameplayView(structuredClone(baseUniverse),roomRuntime,{heroRuntimes,activeCombat:heroCombat});
assert.match(directOffHtml,/Combat direct des héros désactivé/);
assert.doesNotMatch(directOffHtml,/data-dungeon-use-skill/);
assert.equal(renderDungeonCombatItemControls({universe:structuredClone(baseUniverse),combat:heroCombat,heroRuntimes}),'' ,'combat items must be hidden when direct combat is OFF');

const gmUniverse=structuredClone(baseUniverse);
gmUniverse.combat.interaction={directCombat:true,gmFullControl:true};
const enemyCombat=createCombatState({combatants:[
  {id:'enemy',side:'enemies',initiative:10,state:{resources:{hp:{current:10,max:10}},stats:{}},metadata:{creatureId:'skeleton'}},
  {id:'hero',side:'heroes',initiative:5,state:{resources:{hp:{current:10,max:10}},stats:{}},metadata:{heroId:'hero'}},
]});
enemyCombat.metadata={kind:'dungeon-room-combat',roomId:'room-1',heroIds:['hero'],enemyIds:['enemy']};
const gmHtml=renderDungeonGameplayView(gmUniverse,roomRuntime,{heroRuntimes,activeCombat:enemyCombat});
assert.match(gmHtml,/MJ contrôle total : tour ennemi en attente d’une résolution manuelle/);
assert.doesNotMatch(gmHtml,/résolution automatique sur la même timeline/);

console.log('rpg-dungeon-combat-control-view.test.mjs: OK');
