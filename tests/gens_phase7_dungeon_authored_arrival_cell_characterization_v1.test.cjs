'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');

const arrivalMatch=authored.match(/function arrival\(map,edge\)\{[^\n]+\}/);
assert.ok(arrivalMatch,'authored arrival(map, edge) seam must remain directly characterizable');
const arrivalSource=arrivalMatch[0];

const sandbox={};
vm.createContext(sandbox);
vm.runInContext(arrivalSource+'\nthis.__arrival=arrival;',sandbox,{filename:'arrival-characterization.js'});
const arrival=sandbox.__arrival;
assert.equal(typeof arrival,'function');

function map(count,entryIdx){
  return {cells:Array(Math.max(0,count)).fill('floor'),entryIdx};
}

assert.equal(arrival(map(16,12),{toEntryIndex:5}),5,'valid authored edge entry must win');
assert.equal(arrival(map(16,12),{toEntryIndex:'5'}),5,'numeric-string edge entry must preserve historical coercion');
assert.equal(arrival(map(16,12),{toEntryIndex:-1}),12,'negative edge entry must fall back to map entry');
assert.equal(arrival(map(16,12),{toEntryIndex:16}),12,'out-of-bounds edge entry must fall back to map entry');
assert.equal(arrival(map(16,12),{toEntryIndex:1.5}),12,'fractional edge entry must fall back to map entry');
assert.equal(arrival(map(16,12),{}),12,'missing edge entry must fall back to map entry');
assert.equal(arrival(map(16,-4),{}),0,'negative map entry fallback must clamp to zero');
assert.equal(arrival(map(16,undefined),{}),0,'missing map entry fallback must resolve to zero');

assert.equal((authored.match(/x\.positions\[hero\]=arrival\(map,edge\)/g)||[]).length,2,
  'Authored Runtime must retain exactly two position writes through the arrival seam');
assert.match(authored,/DungeonSpatial313\?\.ensure\?\.\(x\)/,
  'DungeonSpatial313 ensure must remain in Authored Runtime');
assert.match(authored,/DungeonSpatial313\?\.persist\?\.\(x\)/,
  'DungeonSpatial313 persist must remain in Authored Runtime');
assert.doesNotMatch(arrivalSource,/DungeonSpatial313|localStorage|document|Math\.random|Tactical|positions|remaining/,
  'arrival seam must stay pure and side-effect free');

const entrySandbox={};
entrySandbox.window=entrySandbox;
entrySandbox.globalThis=entrySandbox;
vm.createContext(entrySandbox);
vm.runInContext(entry,entrySandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
assert.equal(
  typeof entrySandbox.GensDungeonV1?.movement?.planAuthoredArrivalCell,
  'undefined',
  'characterization must remain GREEN before authored arrival planner extraction'
);

console.log(JSON.stringify({
  scenario:'Phase 7 authored arrival cell characterization',
  historicalOwner:'DungeonAuthoredRuntime167839.arrival',
  validEdge:'uses edge.toEntryIndex',
  invalidEdge:'falls back to map.entryIdx clamped at zero',
  positionWrites:2,
  spatialOwner:'DungeonSpatial313 remains outside seam'
},null,2));
