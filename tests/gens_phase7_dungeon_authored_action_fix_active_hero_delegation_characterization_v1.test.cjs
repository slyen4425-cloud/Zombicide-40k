'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const actionFix=read('assets/dungeon/dungeon-authored-action-fix-167857.js');

const historical=/function activeHero\(x\)\{const a=Array\.isArray\(x\?\.participants\)\?x\.participants:\[\],i=Math\.max\(0,Math\.min\(Math\.max\(0,a\.length-1\),Number\(x\?\.index\)\|\|0\)\);return String\(a\[i\]\|\|""\)\}/;
assert.doesNotMatch(actionFix,historical,
  'Action Fix must no longer own the historical activeHero selection after delegation');
assert.equal(
  (actionFix.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  1,
  'Action Fix must consume the canonical helper exactly once after delegation'
);
assert.match(
  actionFix,
  /function activeHero\(x\)\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Action Fix activeHero must retain its public surface while delegating only the pure selection'
);

const store=new Map();
const localStorage={
  getItem(k){return store.has(k)?store.get(k):null},
  setItem(k,v){store.set(k,String(v))}
};
let zoneContent={mode:'fixed',chests:[]};
const ctx={
  console,JSON,Math,localStorage,
  DungeonZoneContent167824:{
    getZoneContent(){return zoneContent}
  }
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(actionFix,ctx,{filename:'assets/dungeon/dungeon-authored-action-fix-167857.js'});

const api=ctx.DungeonAuthoredActionFix167857;
const canonical=ctx.GensDungeonV1?.movement?.resolveAuthoredActiveHero;
assert.ok(api,'Action Fix API must load');
assert.equal(typeof api.activeHero,'function','Action Fix activeHero public API must remain exposed');
assert.equal(typeof api.positionKey,'function','Action Fix positionKey must remain exposed');
assert.equal(typeof api.exactChestAtActivePosition,'function','Action Fix exact chest path must remain exposed');
assert.equal(typeof canonical,'function','canonical Dungeon active-hero owner must exist');

const cases=[
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
];
for(const test of cases){
  assert.equal(
    api.activeHero(test),
    canonical(test.participants,test.index),
    'Action Fix activeHero must preserve the canonical historical semantics'
  );
}

assert.equal(
  api.positionKey({room:3,participants:['a','b'],index:'1',positions:{a:2,b:8}}),
  'b|3|8',
  'positionKey must continue to use the selected active hero room and position'
);
assert.equal(
  api.positionKey({room:3,participants:['a','b','c'],index:1.5,positions:{a:2,b:8,c:9}}),
  '',
  'in-range fractional selector must still produce no position key'
);

const RT='gensrpg_dungeon_runtime_v2';
function setRt(x){store.set(RT,JSON.stringify(x))}

zoneContent={
  mode:'fixed',
  chests:[
    {id:'chest-a',cell:2},
    {id:'chest-b',cell:5}
  ]
};
setRt({
  room:4,index:'1',participants:['a','b'],
  positions:{a:2,b:5},
  last:{
    authoredRuntime167839:true,
    worldDungeonId:'world-action-fix',
    worldNodeId:'node-B'
  },
  worldContentState167824:{
    'world-action-fix':{
      'node-B':{openedChests:{}}
    }
  }
});
assert.equal(api.exactChestAtActivePosition(),true,
  'exact chest path must use the selected active hero cell');

setRt({
  room:4,index:'1',participants:['a','b'],
  positions:{a:2,b:5},
  last:{
    authoredRuntime167839:true,
    worldDungeonId:'world-action-fix',
    worldNodeId:'node-B'
  },
  worldContentState167824:{
    'world-action-fix':{
      'node-B':{openedChests:{'chest-b':true}}
    }
  }
});
assert.equal(api.exactChestAtActivePosition(),false,
  'opened exact chest must remain rejected');

setRt({
  room:4,index:1.5,participants:['a','b','c'],
  positions:{a:2,b:5,c:7},
  last:{
    authoredRuntime167839:true,
    worldDungeonId:'world-action-fix',
    worldNodeId:'node-B'
  }
});
assert.equal(api.exactChestAtActivePosition(),false,
  'in-range fractional active index must still yield no exact chest interaction');

setRt({
  room:4,index:0,participants:['a'],
  positions:{a:2},
  last:{worldDungeonId:'world-action-fix',worldNodeId:'node-A'}
});
assert.equal(api.exactChestAtActivePosition(),false,
  'non-authored runtime must remain rejected');

console.log(JSON.stringify({
  scenario:'Phase 7 Action Fix active hero delegation characterization',
  publicApi:'DungeonAuthoredActionFix167857.activeHero',
  consumers:[
    'DungeonAuthoredActionFix167857.positionKey',
    'DungeonAuthoredActionFix167857.exactChestAtActivePosition'
  ],
  canonicalOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  expected:'GREEN after delegation with historical behavior preserved',
  deferred:[
    'DungeonExactTrapRuntime167845.activeHero',
    'DungeonZoneLinks167846.activeHero',
    'DungeonWorldRuntime167823.activeHeroId',
    'DungeonRoomRuntime167822.activeHeroId',
    'DungeonLargeRoomSupport167834.activeHero',
    'Core317/Core318 activeHeroId',
    'DungeonSourceRenderStability167877 inline selection'
  ]
},null,2));
