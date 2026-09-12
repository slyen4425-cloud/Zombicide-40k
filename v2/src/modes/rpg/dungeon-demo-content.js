import {createHeroRuntime} from './hero-engine.js';
import {createCreatureRuntime} from './bestiary-engine.js';

function clone(value){return structuredClone(value);}

export const DUNGEON_DEMO_CONTENT_CONTRACT=Object.freeze({
  inMemoryOnly:true,
  deterministicIds:true,
  persistsDefinitions:false,
  preservesConfiguredContent:true,
});

export function hasConfiguredDungeonHeroes(universe={}){
  const heroes=Array.isArray(universe?.heroes)?universe.heroes:Object.values(universe?.heroes||{});
  return heroes.some(hero=>hero&&hero.enabled!==false&&hero.id);
}

export function createDungeonDemoUniverse(){
  return {
    schemaVersion:1,
    id:'demo-rpg-runtime',
    name:'Démo Donjon V2',
    stats:[
      {id:'demo_initiative',name:'Initiative',icon:'⚡',enabled:true,visible:true,baseValue:5,min:0,max:null},
    ],
    resources:[
      {id:'demo_hp',name:'Points de vie',icon:'❤️',enabled:true,visible:true,min:0,maxFormula:{kind:'fixed',value:12}},
    ],
    conditions:[],checks:[],forms:[],items:[],sets:[],quests:[],
    effects:[
      {id:'demo_hero_damage',name:'Coup d’épée',enabled:true,kind:'resource-modifier',resourceId:'demo_hp',operation:'subtract',value:4,valueMode:'fixed',duration:0,timing:'immediate',chance:100,stackable:false,maxStacks:1},
      {id:'demo_enemy_damage',name:'Griffe',enabled:true,kind:'resource-modifier',resourceId:'demo_hp',operation:'subtract',value:2,valueMode:'fixed',duration:0,timing:'immediate',chance:100,stackable:false,maxStacks:1},
    ],
    skills:[
      {id:'demo_sword',name:'Frappe',icon:'⚔️',enabled:true,kind:'active',description:'Attaque de démonstration.',conditionIds:[],costResourceId:null,costValue:0,cooldown:0,maxCharges:null,recovery:'combat',checkId:null,roll:{enabled:false,die:100,statId:null,difficulty:50},target:'enemy',effectIds:['demo_hero_damage']},
      {id:'demo_claw',name:'Griffe',icon:'🦴',enabled:true,kind:'active',description:'Attaque ennemie de démonstration.',conditionIds:[],costResourceId:null,costValue:0,cooldown:0,maxCharges:null,recovery:'combat',checkId:null,roll:{enabled:false,die:100,statId:null,difficulty:50},target:'enemy',effectIds:['demo_enemy_damage']},
    ],
    heroes:[
      {id:'demo_hero',name:'Aventurier de test',enabled:true,icon:'🧙',artId:null,audioId:null,statValues:{demo_initiative:8},resourceValues:{demo_hp:12},skillIds:['demo_sword'],inventorySlots:[],startingItems:[],startingEquipment:[],tags:['demo'],metadata:{demo:true}},
    ],
    bestiary:[
      {id:'demo_enemy',name:'Squelette de test',enabled:true,boss:false,icon:'💀',artId:null,audioId:null,statValues:{demo_initiative:4},resourceValues:{demo_hp:8},skillIds:['demo_claw'],loot:[],ai:{kind:'basic',targetRule:'nearest'},tags:['demo'],xp:0},
    ],
    combat:{
      initiative:{mode:'stat',source:{kind:'stat',id:'demo_initiative'},base:0,die:20,modifier:0},
      defeatRule:{enabled:true,kind:'resource',sourceId:'demo_hp',operator:'lte',threshold:0},
      checkDefaults:{die:100,mode:'roll-under'},
      interaction:{directCombat:true,gmFullControl:false},
    },
    spatialRules:{unit:'cells',movementStatId:null,combatAssistRange:3},
  };
}

export function createDungeonDemoLaunch({worldDraft={},layoutProvider=null}={}){
  const universe=createDungeonDemoUniverse();
  const hero=universe.heroes[0];
  const enemy=universe.bestiary[0];
  const startRoomId=String(worldDraft?.world?.startRoomId||worldDraft?.rooms?.[0]?.id||'');
  if(!startRoomId) return {ok:false,reason:'dungeon-demo-start-room-missing'};

  const heroRuntime=createHeroRuntime(hero,universe,{instanceId:hero.id});
  const creatureRuntime=createCreatureRuntime(enemy,universe,{instanceId:'demo_enemy_instance',roomId:startRoomId});
  const demoLayoutProvider=roomId=>{
    const base=typeof layoutProvider==='function'?layoutProvider(roomId):null;
    const layout=base?clone(base):{id:`demo-layout:${String(roomId)}`,roomId:String(roomId),interactions:[],doors:[],entities:[]};
    layout.entities=Array.isArray(layout.entities)?clone(layout.entities):[];
    if(String(roomId)===startRoomId&&!layout.entities.some(entity=>String(entity?.id)==='demo_enemy_instance')){
      layout.entities.push({
        id:'demo_enemy_instance',kind:'creature',active:true,defeated:false,removed:false,x:null,y:null,
        data:{creatureRuntime:clone(creatureRuntime)},
      });
    }
    return layout;
  };

  return {ok:true,universe,heroRuntime,creatureRuntime,startRoomId,layoutProvider:demoLayoutProvider};
}
