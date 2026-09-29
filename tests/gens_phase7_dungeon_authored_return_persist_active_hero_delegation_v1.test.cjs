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
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));

assert.equal(
  (returnPersist.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  1,
  'Return Persist must consume the canonical authored active-hero owner exactly once'
);
assert.match(
  returnPersist,
  /function activeHero\(x\)\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Return Persist public activeHero must delegate only the pure selection decision'
);
assert.equal(
  (branchNav.match(/resolveAuthoredActiveHero\(/g)||[]).length,
  0,
  'Branch Nav Cleanup must remain outside micro-lot 19'
);

assert.match(
  returnPersist,
  /function persistFinalPosition\(\)\{const x=readRt\(\);if\(!x\?\.last\?\.authoredRuntime167839\)return false;const hero=activeHero\(x\);if\(!hero\|\|!Number\.isFinite\(Number\(x\?\.positions\?\.\[hero\]\)\)\)return false;/,
  'Return Persist must retain runtime read authored guard hero-position validation and persistence ownership'
);
assert.match(
  returnPersist,
  /function wrap\(\)\{const A=ROOT\.DungeonAuthoredRuntime167839;/,
  'Return Persist wrapper ownership must stay local'
);
assert.match(
  returnPersist,
  /function install\(\)\{if\(wrap\(\)\)return true;if\(retries\+\+<30&&typeof setTimeout==="function"\)setTimeout\(install,80\);return false\}/,
  'Return Persist retry cadence must stay unchanged'
);

const ctx={
  console,Math,Date,JSON,
  localStorage:{getItem(){return null},setItem(){}},
  setTimeout(){return 1},
  DungeonAuthoredRuntime167839:{enterNode(){return true}}
};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(returnPersist,ctx,{filename:'assets/dungeon/dungeon-authored-return-persist-167862.js'});

const api=ctx.DungeonAuthoredReturnPersist167862;
assert.ok(api);
assert.equal(typeof api.activeHero,'function','public Return Persist activeHero API must remain exposed');

const hero=(participants,index)=>api.activeHero({participants,index});
assert.equal(hero(['a','b'],undefined),'a');
assert.equal(hero(['a','b'],'1'),'b');
assert.equal(hero(['a','b'],-4),'a');
assert.equal(hero(['a','b'],99),'b');
assert.equal(hero(['a','b'],1.5),'b');
assert.equal(hero(['a','b','c'],1.5),'');
assert.equal(hero([],0),'');
assert.equal(hero('not-an-array',0),'');
assert.equal(hero([0,'b'],0),'');
assert.equal(hero([42],0),'42');

assert.ok(
  contract.invariants.some(x=>/Return Persist/i.test(x)&&/resolveAuthoredActiveHero/.test(x)),
  'Dungeon contract must document Return Persist delegation while preserving its runtime/spatial ownership'
);

console.log(JSON.stringify({
  scenario:'Phase 7 Return Persist active hero delegation guard',
  canonicalOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  publicConsumer:'DungeonAuthoredReturnPersist167862.activeHero',
  branchNavUntouched:true
},null,2));
