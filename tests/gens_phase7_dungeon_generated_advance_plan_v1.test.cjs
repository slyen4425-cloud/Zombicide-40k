'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));
const index=read('index.html');
const sw=read('service-worker.js');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

assert.equal(typeof sandbox.GensDungeonV1,'object',
  'Phase 7 must activate the public Dungeon runtime entry');
assert.equal(typeof sandbox.GensDungeonV1?.exploration?.planGeneratedAdvance,'function',
  'Dungeon entry must own the pure generated advance planner');

const plan=sandbox.GensDungeonV1.exploration.planGeneratedAdvance;
const plain=value=>JSON.parse(JSON.stringify(value));

const emptyStates={};
assert.deepEqual(plain(plan(0,10,emptyStates)),{status:'create',targetRoom:1},
  'entry -> first generated room must request creation');

const states={'2':{last:{kind:'chest',room:2}}};
const before=JSON.stringify(states);
assert.deepEqual(plain(plan(1,10,states)),{status:'existing',targetRoom:2},
  'advance toward a snapshotted room must rejoin the existing room');
assert.equal(JSON.stringify(states),before,
  'generated advance planning must not mutate room state');

assert.deepEqual(plain(plan(10,10,{})),{status:'complete',targetRoom:null},
  'generated advance at the configured limit must be complete');

assert.doesNotMatch(entry,/document|localStorage|sessionStorage|setTimeout|setInterval|MutationObserver|addEventListener/,
  'the first active Dungeon slice must remain pure and side-effect free');
assert.doesNotMatch(entry,/Tactical|GensRpgTactical|Capture|GensSurvival|PvP/i,
  'the generated advance planner must not consume private runtime from other modules');

assert.equal(contract.status,'partial-runtime-loaded',
  'Dungeon contract must declare its first active runtime slice');
assert.equal(contract.activatedPhase,7,
  'Dungeon contract must record Phase 7 activation');
assert.equal(contract.publicRuntimeApi,'GensDungeonV1',
  'Dungeon contract must expose one public runtime namespace');

const tag='<script src="assets/gensrpg/dungeon/entry-v1.js?v=1"></script>';
assert.equal(index.split(tag).length-1,1,
  'Dungeon entry must be loaded exactly once by the source index');
assert.ok(index.indexOf(tag)<index.indexOf('<script id="dungeonCore200Rebuild">'),
  'Dungeon entry must load before the generated exploration owner Core 2.00');

assert.match(index,/GensDungeonV1\.exploration\.planGeneratedAdvance\(/,
  'Core 2.00 generated exploration must delegate its destination plan to Dungeon entry');
assert.doesNotMatch(index,/const targetRoom=Math\.max\(1,Number\(x\.room\|\|0\)\+1\);/,
  'Core 2.00 must no longer own the generated target-room calculation directly');

assert.match(sw,/\.\/assets\/gensrpg\/dungeon\/entry-v1\.js/,
  'PWA cache must include the connected Dungeon entry');

assert.doesNotMatch(authored,/GensDungeonV1/,
  'Authored travel must remain untouched in this generated-only micro-lot');
assert.match(authored,/btn\.onclick=travel/,
  'Authored World Builder must keep direct travel button authority');

console.log(JSON.stringify({
  scenario:'Phase 7 Dungeon generated advance plan owner',
  owner:'GensDungeonV1.exploration.planGeneratedAdvance',
  statuses:['create','existing','complete'],
  authored:'unchanged',
  tactical:'not-consumed'
},null,2));
