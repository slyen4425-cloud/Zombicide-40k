'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const returnPersist=read('assets/dungeon/dungeon-authored-return-persist-167862.js');
const branchNav=read('assets/dungeon/dungeon-authored-branch-nav-cleanup-167863.js');

const historical=/function activeHero\(x\)\{const a=Array\.isArray\(x\?\.participants\)\?x\.participants:\[\],i=Math\.max\(0,Math\.min\(Math\.max\(0,a\.length-1\),Number\(x\?\.index\)\|\|0\)\);return String\(a\[i\]\|\|""\)\}/;
assert.match(
  returnPersist,
  /function activeHero\(x\)\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Return Persist public activeHero must delegate only pure selection after raccord'
);
assert.equal((returnPersist.match(/resolveAuthoredActiveHero\(/g)||[]).length,1,
  'Return Persist must consume the canonical helper exactly once after raccord');
assert.match(branchNav,historical,
  'Branch Nav Cleanup must retain its historical local selector throughout this lot');
assert.equal((branchNav.match(/resolveAuthoredActiveHero\(/g)||[]).length,0,
  'Branch Nav Cleanup must stay outside this lot');

const store=new Map();
let persistCalls=0;
let ensuredHeroPosition=null;
let persistedHeroPosition=null;

const ctx={
  console,Math,Date,JSON,
  localStorage:{
    getItem(k){return store.has(k)?store.get(k):null},
    setItem(k,v){store.set(k,String(v))}
  },
  setTimeout(){return 1},
  DungeonSpatial313:{
    ensure(x){const hero=ctx.DungeonAuthoredReturnPersist167862?.activeHero?.(x);ensuredHeroPosition=hero?x?.positions?.[hero]:null},
    persist(x){persistCalls++;const hero=ctx.DungeonAuthoredReturnPersist167862?.activeHero?.(x);persistedHeroPosition=hero?x?.positions?.[hero]:null}
  },
  DungeonAuthoredRuntime167839:{
    enterNode(){return true}
  }
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(returnPersist,ctx,{filename:'assets/dungeon/dungeon-authored-return-persist-167862.js'});

const api=ctx.DungeonAuthoredReturnPersist167862;
assert.ok(api,'Return Persist API must load');
assert.equal(typeof api.activeHero,'function','public activeHero API must remain exposed');

const hero=(participants,index)=>api.activeHero({participants,index});
assert.equal(hero(['a','b'],undefined),'a');
assert.equal(hero(['a','b'],NaN),'a');
assert.equal(hero(['a','b'],'1'),'b');
assert.equal(hero(['a','b'],-4),'a');
assert.equal(hero(['a','b'],99),'b');
assert.equal(hero(['a','b'],1.5),'b',
  'fractional index above upper bound must preserve historical clamp');
assert.equal(hero(['a','b','c'],1.5),'',
  'fractional index within bounds must preserve historical fractional lookup');
assert.equal(hero([],0),'');
assert.equal(hero('not-an-array',0),'');
assert.equal(hero([0,'b'],0),'');
assert.equal(hero([42],0),'42');

const RT='gensrpg_dungeon_runtime_v2';
store.set(RT,JSON.stringify({
  room:2,index:'1',participants:['lyra','brom'],
  positions:{lyra:3,brom:7},
  last:{authoredRuntime167839:true,worldNodeId:'branch_A_cache'}
}));
assert.equal(api.persistFinalPosition(),true,
  'real Return Persist path must accept valid authored runtime and selected hero position');
assert.equal(persistCalls,1,'Return Persist must persist exactly once');
assert.equal(ensuredHeroPosition,7,'Spatial ensure must observe the selected hero final position');
assert.equal(persistedHeroPosition,7,'Spatial persist must observe the selected hero final position');
assert.equal(JSON.parse(store.get(RT)).positions.brom,7,'runtime position must remain exact');

store.set(RT,JSON.stringify({
  room:2,index:1.5,participants:['a','b','c'],
  positions:{a:1,b:2,c:3},
  last:{authoredRuntime167839:true}
}));
assert.equal(api.persistFinalPosition(),false,
  'in-range fractional selector must still resolve empty and reject spatial persistence');
assert.equal(persistCalls,1,'rejected fractional selector must not add a persist call');

assert.equal(
  ctx.GensDungeonV1.movement.resolveAuthoredActiveHero(['a','b','c'],1.5),
  api.activeHero({participants:['a','b','c'],index:1.5}),
  'Return Persist public selector must remain semantically identical to canonical owner after raccord'
);

console.log(JSON.stringify({
  scenario:'Phase 7 Return Persist active hero delegation characterization after raccord',
  publicApi:'DungeonAuthoredReturnPersist167862.activeHero',
  canonicalOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  persistPath:'DungeonAuthoredReturnPersist167862.persistFinalPosition',
  branchNavUntouched:true
},null,2));
