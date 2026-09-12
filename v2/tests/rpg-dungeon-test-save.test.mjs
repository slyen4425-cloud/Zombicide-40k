import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createMemoryStorageProvider } from '../src/core/storage-provider.js';
import {
  createDungeonTestSaveSnapshot,saveDungeonTestSession,loadDungeonTestSession,clearDungeonTestSession,
  DUNGEON_TEST_SAVE_CONTRACT,DUNGEON_TEST_SAVE_VERSION,
} from '../src/modes/rpg/dungeon-test-save.js';

assert.equal(DUNGEON_TEST_SAVE_CONTRACT.providerBacked,true);
assert.equal(DUNGEON_TEST_SAVE_CONTRACT.versioned,true);
assert.equal(DUNGEON_TEST_SAVE_CONTRACT.testSessionOnly,true);
assert.equal(DUNGEON_TEST_SAVE_CONTRACT.includesDemoUniverse,true);
assert.equal(DUNGEON_TEST_SAVE_CONTRACT.replacesNoEditorDefinitions,true);

const source={
  universe:{heroes:[{id:'demo_hero',name:'Aventurier'}],bestiary:[{id:'demo_enemy'}]},
  roomRuntime:{currentRoomId:'room-1',focusedHeroId:'demo_hero',spatial:{zoneId:'room-1',positions:{demo_hero:{x:2,y:3,zoneId:'room-1'}}},rooms:{'room-1':{visits:2}}},
  heroRuntimes:[{instanceId:'demo_hero',state:{resources:{hp:{current:7,max:12}}}}],
  spatial:{zoneId:'room-1',positions:{demo_hero:{x:2,y:3,zoneId:'room-1'}}},
  combat:{phase:'turn',round:2,activeActorId:'demo_hero'},
  inventory:{entries:[{entryId:'e1',itemId:'demo_bone',quantity:1}],equipment:{},slots:[],sequence:1},
  lootRecipients:[{key:'hero:demo_hero'}],
  eventWorld:{flags:{door:true}},
  spatialConfig:{movementStatId:'move',diagonal:false},
  demo:true,
};
const built=createDungeonTestSaveSnapshot({...source,savedAt:123});
assert.equal(built.ok,true);
assert.equal(built.snapshot.version,DUNGEON_TEST_SAVE_VERSION);
assert.equal(built.snapshot.savedAt,123);
assert.equal(built.snapshot.demo,true);
assert.deepEqual(built.snapshot.spatial.positions.demo_hero,{x:2,y:3,zoneId:'room-1'});
assert.equal(built.snapshot.heroRuntimes[0].state.resources.hp.current,7);
assert.equal(built.snapshot.combat.round,2);
assert.equal(built.snapshot.inventory.entries[0].itemId,'demo_bone');
assert.equal(built.snapshot.universe.heroes[0].id,'demo_hero');

const provider=createMemoryStorageProvider();
const saved=await saveDungeonTestSession(source,{provider});
assert.equal(saved.ok,true);
source.roomRuntime.currentRoomId='mutated-after-save';
source.heroRuntimes[0].state.resources.hp.current=1;
const loaded=await loadDungeonTestSession({provider});
assert.equal(loaded.ok,true);
assert.equal(loaded.snapshot.roomRuntime.currentRoomId,'room-1','save must be detached from later source mutation');
assert.equal(loaded.snapshot.heroRuntimes[0].state.resources.hp.current,7);
assert.equal(loaded.snapshot.demo,true);
assert.equal(loaded.snapshot.universe.heroes[0].id,'demo_hero','demo universe must survive close/reopen');
loaded.snapshot.roomRuntime.currentRoomId='mutated-loaded-copy';
const loadedAgain=await loadDungeonTestSession({provider});
assert.equal(loadedAgain.snapshot.roomRuntime.currentRoomId,'room-1','read must return a detached copy');
const cleared=await clearDungeonTestSession({provider});
assert.equal(cleared.ok,true);
const missing=await loadDungeonTestSession({provider});
assert.equal(missing.ok,false);
assert.equal(missing.reason,'dungeon-test-save-missing');

const invalid=await saveDungeonTestSession({universe:{}},{provider});
assert.equal(invalid.ok,false);
assert.equal(invalid.reason,'dungeon-test-save-runtime-missing');

const pageSource=fs.readFileSync(new URL('../src/modes/rpg/rpg-page.js',import.meta.url),'utf8');
const uiSource=fs.readFileSync(new URL('../src/modes/rpg/dungeon-test-save-ui.js',import.meta.url),'utf8');
assert.match(pageSource,/mountDungeonTestSaveControls/);
assert.match(pageSource,/dungeonTestStorageProvider/);
assert.match(pageSource,/kind:'dungeon-test-resume'/);
assert.match(pageSource,/currentDungeonUniverse=structuredClone\(snapshot\.universe/);
assert.match(pageSource,/currentDungeonHeroRuntimes=structuredClone\(snapshot\.heroRuntimes/);
assert.match(pageSource,/currentDungeonSpatial=snapshot\.spatial/);
assert.match(pageSource,/currentDungeonCombat=snapshot\.combat/);
assert.match(pageSource,/currentDungeonInventory=snapshot\.inventory/);
assert.match(uiSource,/data-save-dungeon-test/);
assert.match(uiSource,/data-resume-dungeon-test/);
assert.match(uiSource,/saveDungeonTestSession/);
assert.match(uiSource,/loadDungeonTestSession/);

console.log('rpg-dungeon-test-save.test.mjs: ok');
