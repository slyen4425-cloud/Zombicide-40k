import assert from 'node:assert/strict';
import { renderDungeonGameplayView } from '../src/modes/rpg/dungeon-gameplay-view.js';

const universe={
  heroes:[{id:'lyra',name:'Lyra'}],
  bestiary:[{id:'skeleton',name:'Squelette'}],
  resources:[{id:'hp',name:'PV',icon:'❤️'}],
  effects:[{id:'hit',name:'Dégâts'}],
  skills:[{id:'arrow',name:'Tir précis',enabled:true,target:'enemy',effectIds:['hit'],roll:{enabled:false}}],
  quests:[],
};

const roomRuntime={
  currentRoomId:'crypt-room',
  focusedHeroId:'lyra',
  heroLocations:{lyra:{heroId:'lyra',roomId:'crypt-room',visitedRoomIds:['crypt-room'],history:[],sequence:0}},
  rooms:{'crypt-room':{visits:1,entities:[{id:'spawn:skeleton:1',kind:'creature',active:true,defeated:false,data:{creatureRuntime:{instanceId:'spawn:skeleton:1',creatureId:'skeleton',active:true,defeated:false,removed:false,state:{stats:{},resources:{hp:{current:4,max:6}}},skillIds:[],ai:{kind:'basic'}}}}]}},
  eventQueue:{pending:[]},
  questRuntime:{states:{}},
};
const heroRuntimes=[{instanceId:'lyra',heroId:'lyra',name:'Lyra',active:true,ko:false,dead:false,baseSkillIds:['arrow'],state:{stats:{},resources:{hp:{current:7,max:8}}}}];
const activeCombat={
  phase:'turn',round:2,turnSequence:3,activeActorId:'lyra',order:['lyra','spawn:skeleton:1'],
  metadata:{kind:'dungeon-room-combat',roomId:'crypt-room'},
  actors:{
    lyra:{id:'lyra',side:'heroes',ko:false,state:{stats:{},resources:{hp:{current:7,max:8}}},metadata:{heroId:'lyra'}},
    'spawn:skeleton:1':{id:'spawn:skeleton:1',side:'enemies',ko:true,state:{stats:{},resources:{hp:{current:0,max:6}}},metadata:{creatureId:'skeleton'}},
  },
  log:[
    {seq:1,type:'turn-begin',actorId:'lyra'},
    {seq:2,type:'action-resolved',actorId:'lyra',targetId:'spawn:skeleton:1',check:{success:true,roll:42},effects:[{effectId:'hit',applied:true}]},
    {seq:3,type:'combatant-ko',actorId:'spawn:skeleton:1'},
  ],
};

const html=renderDungeonGameplayView(universe,roomRuntime,{heroRuntimes,activeCombat});
assert.match(html,/Combat en cours/);
assert.match(html,/Ordre des tours/);
assert.match(html,/Lyra/);
assert.match(html,/Squelette · KO/);
assert.match(html,/❤️ PV <strong>7 \/ 8<\/strong>/);
assert.match(html,/❤️ PV <strong>0 \/ 6<\/strong>/);
assert.match(html,/Journal moteur/);
assert.match(html,/jet 42/);
assert.match(html,/Dégâts/);
assert.match(html,/Utiliser la compétence/,'real hero controls must remain mounted beside presentation');
assert.doesNotMatch(html,/Participants :<\/strong>/,'old minimal participant summary must be replaced by the shared presentation renderer');

console.log('rpg-dungeon-combat-presentation-integration.test.mjs: OK');
