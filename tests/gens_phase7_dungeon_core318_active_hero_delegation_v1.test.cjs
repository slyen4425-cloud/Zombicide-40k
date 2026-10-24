'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const core318=read('assets/dungeon/dungeon-core-318.js');
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));

assert.equal(
  (core318.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  1,
  'Core 318 must delegate active-hero selection exactly once'
);
assert.match(
  core318,
  /function activeHeroId\(x\)\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Core 318 activeHeroId must delegate directly to the canonical Dungeon movement owner'
);
assert.doesNotMatch(
  core318,
  /function activeHeroId\(x\)\{\s*const list=Array\.isArray\(x\?\.participants\)/,
  'Core 318 must no longer own the historical selection algorithm'
);

const RT='gensrpg_dungeon_runtime_v2';
const store=new Map();
const localStorage={
  getItem(k){return store.has(k)?store.get(k):null},
  setItem(k,v){store.set(k,String(v))}
};
let roomOfCalls=[];
const ctx={
  console,JSON,Math,Date,localStorage,
  document:{querySelector(){return null}},
  setTimeout(){return 1},
  isDungeonMode(){return true},
  loadDungeonState(){return {room:91}},
  DungeonSpatial313:{
    ensure(x){return x},
    roomOf(x,id){roomOfCalls.push(String(id));return x.heroRooms?.[id]??x.room},
    persist(){return true},
    activate(){return true}
  },
  loadActiveEnemies(){return []},
  saveActiveEnemies(){},
  loadDungeonSceneElements(){return []},
  gensGameplayModules(){return {movement:true}},
  currentRpgProfile(){return {rpgUniverse:{movement:{mode:'tactical'}}}},
  DungeonCore01:{render(){return true}}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(core318,ctx,{filename:'assets/dungeon/dungeon-core-318.js'});

const api=ctx.DungeonCore318;
const canonical=ctx.GensDungeonV1.movement.resolveAuthoredActiveHero;
assert.equal(typeof api?.activeRoom,'function');

for(const test of [
  {participants:['a','b'],index:'1',heroRooms:{a:2,b:7},room:4,expectedHero:'b',expectedRoom:7},
  {participants:['a','b'],index:-4,heroRooms:{a:2,b:7},room:4,expectedHero:'a',expectedRoom:2},
  {participants:['a','b'],index:99,heroRooms:{a:2,b:7},room:4,expectedHero:'b',expectedRoom:7},
  {participants:[42],index:0,heroRooms:{'42':11},room:4,expectedHero:'42',expectedRoom:11}
]){
  store.set(RT,JSON.stringify(test));roomOfCalls=[];
  assert.equal(canonical(test.participants,test.index),test.expectedHero);
  assert.equal(api.activeRoom(),test.expectedRoom);
  assert.deepEqual(roomOfCalls,[test.expectedHero]);
}

const fractional={participants:['a','b','c'],index:1.5,heroRooms:{a:2,b:7,c:9},room:13};
store.set(RT,JSON.stringify(fractional));roomOfCalls=[];
assert.equal(canonical(fractional.participants,fractional.index),'');
assert.equal(api.activeRoom(),13);
assert.deepEqual(roomOfCalls,[]);

assert.ok(
  contract.invariants.some(x=>/DungeonCore318/.test(x)&&/resolveAuthoredActiveHero/.test(x)),
  'Dungeon contract must document the Core 318 active-hero delegation boundary'
);

assert.doesNotMatch(
  entry,
  /DungeonCore318|dungeon-core-318/,
  'pure Dungeon entry must not absorb Core 318 runtime ownership'
);

console.log(JSON.stringify({
  scenario:'Phase 7 Core 318 active hero delegation guard',
  canonicalOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  privateConsumer:'Dungeon Core 3.18 activeHeroId',
  retainedConsumers:['activeRoom/runtimeRoom','installBranchGuard'],
  expected:'RED before delegation, GREEN after Core 318-only micro-diff'
},null,2));
