'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const branchNav=read('assets/dungeon/dungeon-authored-branch-nav-cleanup-167863.js');
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));

assert.equal(
  (branchNav.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  1,
  'Branch Nav Cleanup must delegate activeHero to the canonical Dungeon movement owner exactly once'
);
assert.match(
  branchNav,
  /function activeHero\(x\)\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Branch Nav Cleanup public activeHero surface must delegate only the pure selection'
);
assert.doesNotMatch(
  branchNav,
  /function activeHero\(x\)\{const a=Array\.isArray/,
  'Branch Nav Cleanup must no longer duplicate the historical selector'
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
assert.ok(api);
assert.equal(typeof api.activeHero,'function',
  'public Branch Nav Cleanup activeHero API must remain exported after delegation');

for(const [participants,index,expected] of [
  [['a','b'],undefined,'a'],
  [['a','b'],'1','b'],
  [['a','b'],-4,'a'],
  [['a','b'],99,'b'],
  [['a','b'],1.5,'b'],
  [['a','b','c'],1.5,''],
  [[],0,''],
  ['not-an-array',0,''],
  [[0,'b'],0,''],
  [[42],0,'42']
]){
  assert.equal(api.activeHero({participants,index}),expected);
}

const RT='gensrpg_dungeon_runtime_v2';
store.set(RT,JSON.stringify({
  room:2,index:'1',participants:['a','b'],
  last:{authoredRuntime167839:true,worldNodeId:'branch_B'},
  authored167839:{roomNodes:{'2':'branch_B'},heroNodes:{a:'branch_A',b:'branch_B'}},
  authored167847ReturnStacks:{
    b:[{sourceNodeId:'root',sourceIndex:7,targetNodeId:'branch_B'}]
  }
}));
assert.equal(api.branchReturnActive(),true,
  'Branch Nav branch-return policy must remain unchanged after pure active-hero delegation');

assert.ok(
  contract.invariants.some(x=>/Branch Nav Cleanup.*active hero|active hero.*Branch Nav Cleanup/i.test(x)),
  'Dungeon contract must document the Branch Nav Cleanup active-hero delegation boundary'
);

assert.doesNotMatch(
  entry,
  /DungeonSpatial313|localStorage|sessionStorage|document|setTimeout|setInterval|MutationObserver|addEventListener/,
  'pure Dungeon entry must remain free of runtime state DOM storage timers listeners and observers'
);

console.log(JSON.stringify({
  scenario:'Phase 7 Branch Nav Cleanup active hero delegation',
  expected:'RED before delegation, GREEN after one-line public API-preserving raccord',
  owner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  consumer:'DungeonAuthoredBranchNavCleanup167863.activeHero',
  preserved:[
    'public activeHero API',
    'branchReturnActive policy',
    'currentNode',
    'DOM sync/block',
    'render/show wrappers',
    'click listener',
    'install timers'
  ]
},null,2));
