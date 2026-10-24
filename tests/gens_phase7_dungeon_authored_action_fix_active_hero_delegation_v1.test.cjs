'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const actionFix=read('assets/dungeon/dungeon-authored-action-fix-167857.js');
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));

assert.equal(
  (actionFix.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  1,
  'Action Fix must delegate the pure active-hero selection exactly once'
);
assert.match(
  actionFix,
  /function activeHero\(x\)\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Action Fix public activeHero must delegate directly to the canonical Dungeon movement owner'
);
assert.doesNotMatch(
  actionFix,
  /function activeHero\(x\)\{const a=Array\.isArray\(x\?\.participants\)/,
  'Action Fix must no longer own the historical active-hero selection algorithm'
);
assert.match(
  actionFix,
  /DungeonAuthoredActionFix167857=\{[^}]*activeHero[^}]*positionKey[^}]*exactChestAtActivePosition/,
  'Action Fix must preserve its public activeHero API and downstream public helpers'
);

const store=new Map();
const localStorage={
  getItem(k){return store.has(k)?store.get(k):null},
  setItem(k,v){store.set(k,String(v))}
};
let zoneContent={mode:'fixed',chests:[]};
const ctx={
  console,JSON,Math,localStorage,
  GensStorageV1:{readJson(_storage,key,fallback){try{return JSON.parse(localStorage.getItem(key)||'null')??fallback}catch(e){return fallback}}},
  DungeonZoneContent167824:{getZoneContent(){return zoneContent}}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(actionFix,ctx,{filename:'assets/dungeon/dungeon-authored-action-fix-167857.js'});

const api=ctx.DungeonAuthoredActionFix167857;
const canonical=ctx.GensDungeonV1.movement.resolveAuthoredActiveHero;
assert.equal(typeof api?.activeHero,'function');
assert.equal(typeof api?.positionKey,'function');
assert.equal(typeof api?.exactChestAtActivePosition,'function');

for(const test of [
  {participants:['a','b'],index:undefined},
  {participants:['a','b'],index:NaN},
  {participants:['a','b'],index:'1'},
  {participants:['a','b'],index:-4},
  {participants:['a','b'],index:99},
  {participants:['a','b'],index:1.5},
  {participants:['a','b','c'],index:1.5},
  {participants:[],index:0},
  {participants:'not-an-array',index:0},
  {participants:[0,'b'],index:0},
  {participants:[42],index:0}
]){
  assert.equal(api.activeHero(test),canonical(test.participants,test.index));
}

assert.equal(
  api.positionKey({room:3,participants:['a','b'],index:'1',positions:{a:2,b:8}}),
  'b|3|8'
);
assert.equal(
  api.positionKey({room:3,participants:['a','b','c'],index:1.5,positions:{a:2,b:8,c:9}}),
  ''
);

const RT='gensrpg_dungeon_runtime_v2';
zoneContent={mode:'fixed',chests:[{id:'chest-a',cell:2},{id:'chest-b',cell:5}]};
store.set(RT,JSON.stringify({
  room:4,index:'1',participants:['a','b'],positions:{a:2,b:5},
  last:{authoredRuntime167839:true,worldDungeonId:'world-action-fix',worldNodeId:'node-B'},
  worldContentState167824:{'world-action-fix':{'node-B':{openedChests:{}}}}
}));
assert.equal(api.exactChestAtActivePosition(),true);

assert.ok(
  contract.invariants.some(x=>/DungeonAuthoredActionFix167857/.test(x)&&/resolveAuthoredActiveHero/.test(x)),
  'Dungeon contract must document the Action Fix active-hero delegation boundary'
);

assert.doesNotMatch(
  entry,
  /DungeonAuthoredActionFix167857|dungeon-authored-action-fix-167857/,
  'pure Dungeon entry must not absorb Action Fix runtime ownership'
);

console.log(JSON.stringify({
  scenario:'Phase 7 Action Fix active hero delegation guard',
  canonicalOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  publicConsumer:'DungeonAuthoredActionFix167857.activeHero',
  retainedConsumers:['positionKey','exactChestAtActivePosition'],
  expected:'RED before delegation, GREEN after Action Fix-only micro-diff'
},null,2));
