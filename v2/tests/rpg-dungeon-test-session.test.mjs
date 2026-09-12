import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createDungeonTestSession,DUNGEON_TEST_SESSION_CONTRACT} from '../src/modes/rpg/dungeon-test-session.js';

assert.equal(DUNGEON_TEST_SESSION_CONTRACT.usesConfiguredWorld,true);
assert.equal(DUNGEON_TEST_SESSION_CONTRACT.usesConfiguredHeroes,true);
assert.equal(DUNGEON_TEST_SESSION_CONTRACT.persistsNothing,true);
assert.equal(DUNGEON_TEST_SESSION_CONTRACT.inventsGameplayDefinitions,false);

const worldDraft={
  world:{id:'world-1',name:'Test',startRoomId:'room-1',zones:['zone-1']},
  zones:[{id:'zone-1',name:'Zone',roomIds:['room-1']}],
  rooms:[{id:'room-1',zoneId:'zone-1',name:'Départ',kind:'room'}],
  links:[],
};

{
  const out=createDungeonTestSession({universe:{heroes:[]},worldDraft});
  assert.equal(out.ok,false);
  assert.equal(out.reason,'dungeon-test-no-heroes');
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
  const out=createDungeonTestSession({universe,worldDraft,layoutProvider:roomId=>({id:roomId,name:'Départ',interactions:[],doors:[],entities:[]})});
  assert.equal(out.ok,true);
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

const pageSource=fs.readFileSync(new URL('../src/modes/rpg/rpg-page.js',import.meta.url),'utf8');
assert.match(pageSource,/createDungeonTestSession/);
assert.match(pageSource,/data-dungeon-test-launch/);
assert.match(pageSource,/data-start-dungeon-test/);
assert.match(pageSource,/Lancer une partie test/);
assert.match(pageSource,/kind:'dungeon-test-start'/);
assert.equal(pageSource.includes('saveDungeon'),false);

console.log('rpg-dungeon-test-session.test.mjs: ok');
