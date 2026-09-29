'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const branchNav=read('assets/dungeon/dungeon-authored-branch-nav-cleanup-167863.js');

const historical=/function activeHero\(x\)\{const a=Array\.isArray\(x\?\.participants\)\?x\.participants:\[\],i=Math\.max\(0,Math\.min\(Math\.max\(0,a\.length-1\),Number\(x\?\.index\)\|\|0\)\);return String\(a\[i\]\|\|""\)\}/;
assert.doesNotMatch(branchNav,historical,
  'Branch Nav Cleanup must no longer own the duplicated activeHero decision after delegation');
assert.equal(
  (branchNav.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  1,
  'Branch Nav Cleanup must consume the canonical helper exactly once after delegation'
);
assert.match(
  branchNav,
  /function activeHero\(x\)\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Branch Nav Cleanup must preserve its public activeHero raccord while delegating only pure selection'
);

const store=new Map();
const localStorage={
  getItem(k){return store.has(k)?store.get(k):null},
  setItem(k,v){store.set(k,String(v))}
};

const ctx={console,JSON,Math,localStorage};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(branchNav,ctx,{filename:'assets/dungeon/dungeon-authored-branch-nav-cleanup-167863.js'});

const api=ctx.DungeonAuthoredBranchNavCleanup167863;
const canonical=ctx.GensDungeonV1?.movement?.resolveAuthoredActiveHero;
assert.ok(api,'Branch Nav Cleanup API must load');
assert.equal(typeof api.activeHero,'function',
  'Branch Nav Cleanup activeHero must remain a public API surface');
assert.equal(typeof api.branchReturnActive,'function',
  'Branch Nav Cleanup branchReturnActive must remain public');
assert.equal(typeof canonical,'function',
  'canonical Dungeon active-hero owner must exist');

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
    'Branch Nav Cleanup activeHero must match the canonical historical semantics'
  );
}

const RT='gensrpg_dungeon_runtime_v2';
function setRt(x){store.set(RT,JSON.stringify(x))}
function runtime(participants,index,heroNode,stackByHero){
  return {
    room:2,index,participants,
    last:{authoredRuntime167839:true,worldNodeId:heroNode},
    authored167839:{
      roomNodes:{'2':heroNode},
      heroNodes:Object.fromEntries((Array.isArray(participants)?participants:[]).filter(Boolean).map(h=>[String(h),heroNode]))
    },
    authored167847ReturnStacks:stackByHero||{}
  };
}

setRt(runtime(
  ['a','b'],'1','branch_B',
  {b:[{sourceNodeId:'A',sourceIndex:7,targetNodeId:'branch_B'}]}
));
assert.equal(api.branchReturnActive(),true,
  'numeric-string active index must keep the matching authored return branch active');

setRt(runtime(
  ['a','b'],-4,'branch_A',
  {a:[{sourceNodeId:'root',sourceIndex:3,targetNodeId:'branch_A'}]}
));
assert.equal(api.branchReturnActive(),true,
  'negative active index must clamp to first hero before branch lookup');

setRt(runtime(
  ['a','b','c'],1.5,'branch_B',
  {b:[{sourceNodeId:'root',sourceIndex:3,targetNodeId:'branch_B'}]}
));
assert.equal(api.branchReturnActive(),false,
  'in-range fractional selector must remain fractional and therefore yield no active hero');

setRt(runtime(
  ['a','b'],99,'branch_B',
  {b:[{sourceNodeId:'root',sourceIndex:3,targetNodeId:'elsewhere'}]}
));
assert.equal(api.branchReturnActive(),false,
  'selected hero with a non-matching return target must keep branch return inactive');

const noAuthored=runtime(['a'],0,'branch_A',{a:[{targetNodeId:'branch_A'}]});
delete noAuthored.last.authoredRuntime167839;
setRt(noAuthored);
assert.equal(api.branchReturnActive(),false,
  'non-authored runtime must remain rejected before active-hero selection affects branch navigation');

console.log(JSON.stringify({
  scenario:'Phase 7 Branch Nav Cleanup active hero delegation characterization',
  publicApi:'DungeonAuthoredBranchNavCleanup167863.activeHero',
  consumer:'DungeonAuthoredBranchNavCleanup167863.branchReturnActive',
  canonicalOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  expected:'GREEN after delegation',
  preserved:[
    'currentNode',
    'authoredActive',
    'branchReturnActive branch stack policy',
    'DOM sync/block behavior',
    'render/show wrappers',
    'click listener',
    'historical install timers'
  ]
},null,2));
