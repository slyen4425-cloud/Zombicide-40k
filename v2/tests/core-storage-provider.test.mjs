import assert from 'node:assert/strict';
import { createMemoryStorageProvider, createRemoteStorageProvider, createStorageRouter } from '../src/core/storage-provider.js';

const local=createMemoryStorageProvider();
const remoteData=new Map();
const remote=createRemoteStorageProvider({
  name:'cloud-test',
  async read(scope,id){return remoteData.get(`${scope}::${id}`)??null;},
  async write(scope,id,value){remoteData.set(`${scope}::${id}`,structuredClone(value));return value;},
  async remove(scope,id){return remoteData.delete(`${scope}::${id}`);},
});

const router=createStorageRouter({local,remote});
assert.equal(router.mode,'local');
await router.write('rpg_world','alpha',{name:'Alpha',rooms:3});
assert.deepEqual(await router.read('rpg_world','alpha'),{name:'Alpha',rooms:3});

let copied=await router.copyLocalToRemote('rpg_world','alpha');
assert.equal(copied.ok,true);
assert.deepEqual(remoteData.get('rpg_world::alpha'),{name:'Alpha',rooms:3});

assert.equal(router.setMode('remote'),'remote');
await router.write('rpg_world','alpha',{name:'Cloud Alpha',rooms:4});
assert.deepEqual(await router.read('rpg_world','alpha'),{name:'Cloud Alpha',rooms:4});

copied=await router.copyRemoteToLocal('rpg_world','alpha');
assert.equal(copied.ok,true);
assert.equal(router.setMode('local'),'local');
assert.deepEqual(await router.read('rpg_world','alpha'),{name:'Cloud Alpha',rooms:4});

const noRemote=createStorageRouter({local:createMemoryStorageProvider(),remote:null,mode:'remote'});
assert.equal(noRemote.mode,'local');
assert.deepEqual(await noRemote.copyLocalToRemote('x','y'),{ok:false,reason:'remote-unavailable'});

console.log('core-storage-provider.test.mjs: OK');
