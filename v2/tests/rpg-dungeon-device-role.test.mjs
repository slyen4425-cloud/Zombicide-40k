import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  DUNGEON_DEVICE_ROLE_STORAGE_KEY,
  normalizeDungeonDeviceRole,
  loadDungeonDeviceRole,
  saveDungeonDeviceRole,
  isDungeonGameMasterDevice,
  setDungeonGameMasterDeviceRole,
} from '../src/modes/rpg/dungeon-device-role.js';

function makeStorage(initial={}){
  const data=new Map(Object.entries(initial));
  return {
    getItem(key){return data.has(key)?data.get(key):null;},
    setItem(key,value){data.set(key,String(value));},
    snapshot(){return Object.fromEntries(data);},
  };
}

assert.equal(normalizeDungeonDeviceRole('gm'),'gm');
assert.equal(normalizeDungeonDeviceRole('player'),'player');
assert.equal(normalizeDungeonDeviceRole('weird'),'player');

const storage=makeStorage();
assert.equal(loadDungeonDeviceRole(storage),'player');
assert.equal(isDungeonGameMasterDevice(storage),false);
assert.equal(saveDungeonDeviceRole('gm',storage),'gm');
assert.equal(storage.snapshot()[DUNGEON_DEVICE_ROLE_STORAGE_KEY],'gm');
assert.equal(isDungeonGameMasterDevice(storage),true);
assert.equal(setDungeonGameMasterDeviceRole(false,storage),false);
assert.equal(loadDungeonDeviceRole(storage),'player');
assert.equal(setDungeonGameMasterDeviceRole(true,storage),true);
assert.equal(loadDungeonDeviceRole(storage),'gm');

const invalid=makeStorage({[DUNGEON_DEVICE_ROLE_STORAGE_KEY]:'admin'});
assert.equal(loadDungeonDeviceRole(invalid),'player');

const pageSource=fs.readFileSync(new URL('../src/modes/rpg/rpg-page.js',import.meta.url),'utf8');
assert.match(pageSource,/dungeonIsGameMasterDevice=null/);
assert.match(pageSource,/isDungeonGameMasterDevice\(\)/);
assert.match(pageSource,/setDungeonGameMasterDeviceRole/);
assert.match(pageSource,/currentDungeonIsGameMasterDevice=setDungeonGameMasterDeviceRole/);

console.log('rpg-dungeon-device-role.test.mjs: OK');
