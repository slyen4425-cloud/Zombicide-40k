import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createDungeonTestSession,DUNGEON_TEST_SESSION_CONTRACT} from '../src/modes/rpg/dungeon-test-session.js';
import {DUNGEON_DEMO_CONTENT_CONTRACT,createDungeonDemoUniverse} from '../src/modes/rpg/dungeon-demo-content.js';
import {startDungeonCombat} from '../src/modes/rpg/dungeon-combat-runtime.js';

assert.equal(DUNGEON_TEST_SESSION_CONTRACT.usesConfiguredWorld,true);
assert.equal(DUNGEON_TEST_SESSION_CONTRACT.usesConfiguredHeroes,true);
assert.equal(DUNGEON_TEST_SESSION_CONTRACT.inMemoryDemoFallback,true);
assert.equal(DUNGEON_TEST_SESSION_CONTRACT.persistsNothing,true);
assert.equal(DUNGEON_TEST_SESSION_CONTRACT.inventsGameplayDefinitions,false);
assert.equal(DUNGEON_DEMO_CONTENT_CONTRACT.inMemoryOnly,true);
assert.equal(DUNGEON_DEMO_CONTENT_CONTRACT.persistsDefinitions,false);

const worldDraft={
  world:{id:'world-1',name:'Test',startRoomId:'room-1',zones:['zone-1']},
  zones:[{id:'zone-1',name:'Zone',roomIds:['room-1']}],
  rooms:[{id:'room-1',zoneId:'zone-1',name:'Départ',kind:'room'}],
  links:[],
};
const emptyLayout=roomId=>({id:roomId,name:'Départ',interactions:[],doors:[],entities:[]});

{
  const out=createDungeonTestSession({universe:{heroes:[]},worldDraft,allowDemoFallback:false});
  assert.equal(out.ok,false);
  assert.equal(out.reason,'dungeon-test-no-heroes');
}

{
  const source={heroes:[],stats:[],resources:[]};
  const before=structuredClone({source,worldDraft});
  const out=createDungeonTestSession({universe:source,worldDraft,layoutProvider:emptyLayout});
  assert.equal(out.ok,true);
  assert.equal(out.demo,true);
  assert.equal(out.focusedHeroId,'demo_hero');
  assert.equal(out.heroRuntimes.length,1);
  assert.equal(out.heroRuntimes[0].name,'Aventurier de test');
  const room=out.roomRuntime.rooms['room-1'];
  assert.equal(room.entities.length,1);
  assert.equal(room.entities[0].id,'demo_enemy_instance');
  assert.equal(room.entities[0].data.creatureRuntime.creatureId,'demo_enemy');
  const combat=startDungeonCombat({
    roomRuntime:out.roomRuntime,
    heroRuntimes:out.heroRuntimes,
    engagerHeroId:out.focusedHeroId,
    universe:out.universe,
    random:()=>0,
  });
  assert.equal(combat.ok,true,'the in-memory demo must reach the real Dungeon combat runtime');
  assert.deepEqual(combat.heroIds,['demo_hero']);
  assert.deepEqual(combat.enemyIds,['demo_enemy_instance']);
  assert.deepEqual({source,worldDraft},before,'demo creation must not mutate configured data');
}

{
  const a=createDungeonDemoUniverse();
  const b=createDungeonDemoUniverse();
  assert.deepEqual(a,b,'demo ids/content must be deterministic');
}

{
  const universe={
    stats:[{id:'str',name:'Force',baseValue:10,min:0,enabled:true,visible:true}],
    resources:[{id:'hp',name:'PV',min:0,maxFormula:{kind:'fixed',value:12},enabled:true,visible:true}],
    heroes:[
      {id:'aldren',name:'Aldren',enabled:true,statValues:{str:12},resourceValues:{hp:12},skillIds:[],inventorySlots:[],startingItems:[],startingEquipment:[]},
      {id:'disabled',name:'Absent',enabled:false,statValues:{},resourceValues:{},skillIds:[],inventorySlots:[],startingItems:[],startingEquipment:[]},
    ],
    quests:[],items:[],skills:[],effects:[],forms:[],sets:[],
  };
  const before=structuredClone({universe,worldDraft});
  const out=createDungeonTestSession({universe,worldDraft,layoutProvider:emptyLayout});
  assert.equal(out.ok,true);
  assert.equal(out.demo,false,'configured heroes must always win over demo fallback');
  assert.equal(out.startRoomId,'room-1');
  assert.equal(out.focusedHeroId,'aldren');
  assert.equal(out.roomRuntime.currentRoomId,'room-1');
  assert.equal(out.roomRuntime.focusedHeroId,'aldren');
  assert.deepEqual(Object.keys(out.roomRuntime.heroLocations),['aldren']);
  assert.equal(out.heroRuntimes.length,1);
  assert.equal(out.heroRuntimes[0].heroId,'aldren');
  assert.equal(out.heroRuntimes[0].state.stats.str,12);
  assert.equal(out.heroRuntimes[0].state.resources.hp.current,12);
  assert.deepEqual({universe,worldDraft},before);
}

const demoSource=fs.readFileSync(new URL('../src/modes/rpg/dungeon-demo-content.js',import.meta.url),'utf8');
for(const forbidden of ['saveRpgUniverse','saveWorldDraft','saveRoomLayout','writeJson','localStorage']) assert.equal(demoSource.includes(forbidden),false,`demo helper must not persist through ${forbidden}`);

const pageSource=fs.readFileSync(new URL('../src/modes/rpg/rpg-page.js',import.meta.url),'utf8');
assert.match(pageSource,/createDungeonTestSession/);
assert.match(pageSource,/data-dungeon-test-launch/);
assert.match(pageSource,/data-start-dungeon-test/);
assert.match(pageSource,/Lancer une partie test/);
assert.match(pageSource,/Démo prête/);
assert.match(pageSource,/currentDungeonUniverse=structuredClone\(out\.universe/);
assert.match(pageSource,/universe:currentDungeonUniverse/);
assert.match(pageSource,/data-dungeon-demo-banner/);
assert.match(pageSource,/kind:'dungeon-test-start'/);
assert.equal(pageSource.includes('saveDungeon'),false);

console.log('rpg-dungeon-test-session.test.mjs: ok');
