'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

const plan=sandbox.GensDungeonV1?.movement?.planAuthoredArrivalCell;
assert.equal(
  typeof plan,
  'function',
  'Phase 7 micro-lot 8 requires Dungeon-owned authored arrival cell planner'
);

assert.equal(plan(16,5,12),5,'valid edge entry must win');
assert.equal(plan(16,'5',12),5,'numeric-string edge entry must preserve historical coercion');
assert.equal(plan(16,-1,12),12,'negative edge entry must fall back');
assert.equal(plan(16,16,12),12,'out-of-bounds edge entry must fall back');
assert.equal(plan(16,1.5,12),12,'fractional edge entry must fall back');
assert.equal(plan(16,undefined,12),12,'missing edge entry must fall back');
assert.equal(plan(16,undefined,-4),0,'negative map entry fallback must clamp to zero');
assert.equal(plan(16,undefined,undefined),0,'missing map entry fallback must resolve to zero');

assert.doesNotMatch(
  entry,
  /document|localStorage|sessionStorage|setTimeout|setInterval|MutationObserver|addEventListener|DungeonSpatial313|Math\.random|Tactical/,
  'Dungeon movement planner module must stay pure and side-effect free'
);

const arrivalMatch=authored.match(/function arrival\(map,edge\)\{[^\n]+\}/);
assert.ok(arrivalMatch,'Authored Runtime arrival seam must remain explicit');
const arrivalSource=arrivalMatch[0];

assert.equal(
  (arrivalSource.match(/GensDungeonV1\.movement\.planAuthoredArrivalCell\(/g)||[]).length,
  1,
  'Authored Runtime arrival seam must consume the Dungeon planner exactly once'
);
assert.match(
  arrivalSource,
  /planAuthoredArrivalCell\(map\?\.cells\?\.length,edge\?\.toEntryIndex,map\?\.entryIdx\)/,
  'arrival seam must pass only explicit primitive inputs to the pure Dungeon planner'
);
assert.doesNotMatch(
  arrivalSource,
  /Number\.isInteger|Math\.max/,
  'Authored Runtime must retire the duplicated arrival-cell decision'
);

assert.equal((authored.match(/x\.positions\[hero\]=arrival\(map,edge\)/g)||[]).length,2,
  'Authored Runtime must retain both position writes through the arrival seam');
assert.match(authored,/DungeonSpatial313\?\.ensure\?\.\(x\)/,
  'DungeonSpatial313 ensure must remain in Authored Runtime');
assert.match(authored,/DungeonSpatial313\?\.persist\?\.\(x\)/,
  'DungeonSpatial313 persist must remain in Authored Runtime');

console.log(JSON.stringify({
  scenario:'Phase 7 authored arrival cell owner',
  expected:'RED before planner extraction, GREEN after direct Dungeon raccord',
  pureOwner:'GensDungeonV1.movement.planAuthoredArrivalCell',
  consumer:'DungeonAuthoredRuntime167839.arrival',
  positionWrites:'Authored Runtime unchanged',
  spatialOwner:'DungeonSpatial313 unchanged'
},null,2));
