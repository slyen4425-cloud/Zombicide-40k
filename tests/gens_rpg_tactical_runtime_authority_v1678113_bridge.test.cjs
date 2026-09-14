const assert=require('node:assert/strict');
const path=require('node:path');
const root=path.join(__dirname,'..');
const P=require(path.join(root,'assets','gensrpg','gens-rpg-tactical-runtime-authority-1678113.js'));

function state(){return {room:4,index:0,participants:['aldren','lyra','brom'],heroRooms:{aldren:4,lyra:4,brom:9},positions:{aldren:5,lyra:6,brom:3},heroBranchStates:{lyra:{room:4,cell:6,branch:{active:true,parentRoom:4,sourceId:'secret'}}},branch:null,enemyCells:{gob:7},last:{map:{width:5,height:5,cells:Array(25).fill('floor')}}};}
const enemy={id:'gob',enemyId:'goblin',hp:5,dungeonRoom:4,vision:3};
let opened=null;
const rt={
  loadDungeonState:()=>state(),loadActiveEnemies:()=>[enemy],activeEnemyDefinition:()=>({rule:{vision:3}}),dungeonEnemyDerivedForInstance:()=>({}),currentRpgProfile:()=>({rpgUniverse:{movement:{combatAssistRange:3}}}),GensCleanRpgStats167874:{runtimeDefs:()=>[],extraTotal:()=>0},
  GensRpgTacticalCombatV2Adapter:{
    participants:()=>['aldren','lyra','brom'],activeEnemies:()=>[enemy],
    createBattle(runtime,opts){opened=opts;return {actors:[],grid:{width:5,height:5,blocked:[]},meta:{}}}
  },
  GensRpgTacticalCombatV2Ui:{getBattle:()=>null},
  dc200StartCombat(ids,reason){return rt.GensRpgTacticalCombatV2Adapter.createBattle(rt,{heroIds:['aldren','lyra','brom'],enemyIds:ids,reason})}
};
P.hookAdapter(rt);P.hookStart(rt);
rt.dc200StartCombat(['gob'],'manual');
assert.deepEqual(opened.heroIds,['aldren'],'the final adapter seam must remove same-number sub-room and other-room heroes even if the bridge supplies all heroes');
assert.deepEqual(opened.enemyIds,['gob']);
console.log('V16.78.113 bridge-to-adapter authoritative scoping: OK');
