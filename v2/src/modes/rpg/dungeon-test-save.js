import { createLocalStorageProvider } from '../../core/storage-provider.js';

function clone(value){return structuredClone(value);}

export const DUNGEON_TEST_SAVE_SCOPE='rpg-dungeon-test-session';
export const DUNGEON_TEST_SAVE_ID='latest';
export const DUNGEON_TEST_SAVE_VERSION=1;

export const DUNGEON_TEST_SAVE_CONTRACT=Object.freeze({
  providerBacked:true,
  versioned:true,
  testSessionOnly:true,
  includesDemoUniverse:true,
  replacesNoEditorDefinitions:true,
});

export function createDungeonTestSaveSnapshot({
  universe={},roomRuntime=null,heroRuntimes=[],spatial=null,combat=null,inventory=null,
  lootRecipients=[],eventWorld={},spatialConfig={},demo=false,savedAt=null,
}={}){
  if(!roomRuntime?.currentRoomId) return {ok:false,reason:'dungeon-test-save-runtime-missing',snapshot:null};
  return {ok:true,snapshot:{
    version:DUNGEON_TEST_SAVE_VERSION,
    savedAt:savedAt??Date.now(),
    demo:Boolean(demo),
    universe:clone(universe||{}),
    roomRuntime:clone(roomRuntime),
    heroRuntimes:clone(heroRuntimes||[]),
    spatial:spatial?clone(spatial):clone(roomRuntime?.spatial||null),
    combat:combat?clone(combat):null,
    inventory:inventory?clone(inventory):null,
    lootRecipients:clone(lootRecipients||[]),
    eventWorld:clone(eventWorld||{}),
    spatialConfig:clone(spatialConfig||{}),
  }};
}

export function validateDungeonTestSaveSnapshot(snapshot){
  if(!snapshot||Number(snapshot.version)!==DUNGEON_TEST_SAVE_VERSION) return {valid:false,reason:'dungeon-test-save-version-unsupported'};
  if(!snapshot.roomRuntime?.currentRoomId) return {valid:false,reason:'dungeon-test-save-runtime-missing'};
  if(!snapshot.universe||typeof snapshot.universe!=='object') return {valid:false,reason:'dungeon-test-save-universe-missing'};
  if(!Array.isArray(snapshot.heroRuntimes)) return {valid:false,reason:'dungeon-test-save-heroes-invalid'};
  return {valid:true,reason:null};
}

export async function saveDungeonTestSession(state,{provider=createLocalStorageProvider()}={}){
  const built=createDungeonTestSaveSnapshot(state);
  if(!built.ok) return built;
  await provider.write(DUNGEON_TEST_SAVE_SCOPE,DUNGEON_TEST_SAVE_ID,built.snapshot);
  return {ok:true,snapshot:clone(built.snapshot)};
}

export async function loadDungeonTestSession({provider=createLocalStorageProvider()}={}){
  const snapshot=await provider.read(DUNGEON_TEST_SAVE_SCOPE,DUNGEON_TEST_SAVE_ID,null);
  if(snapshot==null) return {ok:false,reason:'dungeon-test-save-missing',snapshot:null};
  const checked=validateDungeonTestSaveSnapshot(snapshot);
  if(!checked.valid) return {ok:false,reason:checked.reason,snapshot:null};
  return {ok:true,snapshot:clone(snapshot)};
}

export async function clearDungeonTestSession({provider=createLocalStorageProvider()}={}){
  await provider.remove(DUNGEON_TEST_SAVE_SCOPE,DUNGEON_TEST_SAVE_ID);
  return {ok:true};
}
