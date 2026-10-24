'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const worldRuntime=read('assets/dungeon/dungeon-world-runtime-167823.js');
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));

assert.equal(
  (worldRuntime.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  1,
  'World Runtime must delegate its pure active-hero selection exactly once'
);
assert.match(
  worldRuntime,
  /function activeHeroId\(x\)\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'World Runtime private activeHeroId must delegate directly to the canonical Dungeon movement owner'
);
assert.doesNotMatch(
  worldRuntime,
  /function activeHeroId\(x\)\{const list=Array\.isArray\(x\?\.participants\)/,
  'World Runtime must no longer own the historical active-hero selection algorithm'
);

assert.ok(
  contract.invariants.some(x=>/DungeonWorldRuntime167823/.test(x)&&/resolveAuthoredActiveHero/.test(x)),
  'Dungeon contract must document the World Runtime active-hero delegation boundary'
);

assert.doesNotMatch(
  entry,
  /DungeonWorldRuntime167823|dungeon-world-runtime-167823/,
  'pure Dungeon entry must not absorb World Runtime runtime ownership'
);

console.log(JSON.stringify({
  scenario:'Phase 7 World Runtime active hero delegation guard',
  canonicalOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  privateConsumer:'DungeonWorldRuntime167823.activeHeroId',
  retainedConsumers:['currentPlan','installed DungeonCore01.explore wrapper'],
  expected:'RED before delegation, GREEN after World Runtime-only micro-diff'
},null,2));
