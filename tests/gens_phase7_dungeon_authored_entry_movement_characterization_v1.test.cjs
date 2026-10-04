'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8167091,
  'Phase 7 authored-entry movement characterization must track the micro-lot 6 runtime');
assert.equal(gitBlob,'8a42d15ed218895690a3b8490bbe636d9d2d27c6',
  'Phase 7 authored-entry movement characterization must track the exact micro-lot 6 blob');

assert.match(
  authored,
  /function movementForEntry\(x,hero\)\{const plan=ROOT\.GensDungeonV1\.movement\.planAuthoredEntryMovement\(x\?\.remaining\?\.\[hero\]\);return plan\.status==="remaining"\?plan\.movement:heroMoveAllowance\(hero\)\}/,
  'post-raccord authored entry-movement decision must preserve lazy fallback around the pure Dungeon planner'
);
assert.match(
  authored,
  /const s=ensureState\(x,g\),movement=movementForEntry\(x,hero\);try\{ROOT\.DungeonSpatial313\?\.ensure\?\.\(x\);if\(Number\(x\.room\)>0\)ROOT\.DungeonSpatial313\?\.persist\?\.\(x\)\}/,
  'entry movement must still be decided before authored spatial ensure/persist'
);
assert.match(
  authored,
  /x\.positions\[hero\]=arrival\(map,edge\);x\.remaining\[hero\]=movement/,
  'authored entry must still write the planned movement after arrival placement'
);

let fallbackCalls=0;
const context={
  console,Math,Date,JSON,
  localStorage:{getItem(){return null},setItem(){}},
  dungeonHeroMoveValue083(id){fallbackCalls++;assert.equal(id,'hero');return 4},
  CHARS:{hero:{dungeonStats:{movement:9}}}
};
context.window=context;
context.globalThis=context;
vm.createContext(context);
vm.runInContext(entry,context,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(authored,context,{filename:'dungeon-authored-runtime-167839.js'});
const api=context.DungeonAuthoredRuntime167839;
assert.ok(api,'authored runtime API must load');
assert.equal(typeof api.movementForEntry,'function');

function stored(value,expected){
  fallbackCalls=0;
  assert.equal(api.movementForEntry({remaining:{hero:value}},'hero'),expected,
    'stored remaining value parity failed for '+String(value));
  assert.equal(fallbackCalls,0,
    'heroMoveAllowance fallback must stay lazy for stored value '+String(value));
}

stored(2,2);
stored(0,0);
stored(-2,0);
stored('2',2);
stored(null,0);
stored('',0);
stored(true,1);

function fallback(value){
  fallbackCalls=0;
  const remaining=value===Symbol.for('missing')?{}:{hero:value};
  assert.equal(api.movementForEntry({remaining},'hero'),4,
    'invalid/absent remaining value must use heroMoveAllowance');
  assert.equal(fallbackCalls,1,
    'heroMoveAllowance must be called exactly once on fallback');
}

fallback(Symbol.for('missing'));
fallback(undefined);
fallback('abc');
fallback(Infinity);

const dungeonSandbox={};
dungeonSandbox.window=dungeonSandbox;
dungeonSandbox.globalThis=dungeonSandbox;
vm.createContext(dungeonSandbox);
vm.runInContext(entry,dungeonSandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
assert.equal(
  typeof dungeonSandbox.GensDungeonV1?.movement?.planAuthoredEntryMovement,
  'function',
  'post-raccord characterization requires the Dungeon-owned authored entry movement planner'
);

console.log(JSON.stringify({
  scenario:'Phase 7 authored entry movement characterization',
  runtime:{bytes:bytes.length,gitBlob},
  currentOwner:'DungeonAuthoredRuntime167839.movementForEntry',
  parity:{
    stored:[2,0,-2,'2',null,'',true],
    fallback:['missing',undefined,'abc','Infinity'],
    fallbackLazy:true
  },
  spatial:'DungeonSpatial313 remains downstream and unchanged',
  decision:'characterized-not-yet-migrated'
},null,2));
