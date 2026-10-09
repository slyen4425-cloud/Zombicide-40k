'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');
const returnPersist=read('assets/dungeon/dungeon-authored-return-persist-167862.js');
const actionFix=read('assets/dungeon/dungeon-authored-action-fix-167857.js');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8165398,
  'Phase 7 authored-entry movement RED must start from the micro-lot 6 runtime');
assert.equal(gitBlob,'18627cc0c5fc7945732c8a910504c59ef823b6ae',
  'Phase 7 authored-entry movement RED must start from the exact micro-lot 6 blob');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

assert.equal(
  typeof sandbox.GensDungeonV1?.movement?.planAuthoredEntryMovement,
  'function',
  'Phase 7 micro-lot 7 requires Dungeon-owned authored entry movement planner'
);

const plan=sandbox.GensDungeonV1.movement.planAuthoredEntryMovement;
const normalize=v=>JSON.parse(JSON.stringify(v));

for(const [value,movement] of [
  [2,2],[0,0],[-2,0],['2',2],[null,0],['',0],[true,1]
]){
  assert.deepEqual(
    normalize(plan(value)),
    {status:'remaining',movement},
    'stored authored entry movement parity failed for '+String(value)
  );
}
for(const value of [undefined,'abc',Infinity]){
  assert.deepEqual(
    normalize(plan(value)),
    {status:'fallback',movement:null},
    'invalid/absent authored entry movement must request fallback'
  );
}
assert.notEqual(plan(2),plan(2),'movement planner must return a fresh plain object');

assert.doesNotMatch(
  entry,
  /dungeonHeroMoveValue083|CHARS|DungeonSpatial313|localStorage|sessionStorage|document|setTimeout|setInterval|MutationObserver|addEventListener/,
  'pure Dungeon movement planner must not absorb stats, spatial persistence, DOM or storage ownership'
);

assert.equal(
  (authored.match(/GensDungeonV1\.movement\.planAuthoredEntryMovement\(/g)||[]).length,
  1,
  'Authored Runtime must consume the Dungeon movement planner exactly once'
);
assert.match(
  authored,
  /function movementForEntry\(x,hero\)\{const plan=ROOT\.GensDungeonV1\.movement\.planAuthoredEntryMovement\(x\?\.remaining\?\.\[hero\]\);return plan\.status==="remaining"\?plan\.movement:heroMoveAllowance\(hero\)\}/,
  'Authored Runtime must preserve lazy heroMoveAllowance fallback around the pure Dungeon planner'
);
assert.match(
  authored,
  /const s=ensureState\(x,g\),movement=movementForEntry\(x,hero\);try\{ROOT\.DungeonSpatial313\?\.ensure\?\.\(x\);if\(Number\(x\.room\)>0\)ROOT\.DungeonSpatial313\?\.persist\?\.\(x\)\}/,
  'movement planning must remain before authored spatial ensure/persist'
);
assert.match(
  authored,
  /x\.positions\[hero\]=arrival\(map,edge\);x\.remaining\[hero\]=movement/,
  'arrival placement and remaining write must remain Authored Runtime responsibilities'
);

assert.doesNotMatch(returnPersist,/planAuthoredEntryMovement/,
  'authored return persistence must remain outside movement planning extraction');
assert.doesNotMatch(actionFix,/planAuthoredEntryMovement/,
  'authored action fix must remain outside movement planning extraction');

console.log(JSON.stringify({
  scenario:'Phase 7 authored entry movement owner',
  expected:'RED before pure movement planner extraction, GREEN after direct Authored Runtime raccord',
  pureOwner:'GensDungeonV1.movement.planAuthoredEntryMovement',
  fallbackOwner:'DungeonAuthoredRuntime167839.heroMoveAllowance',
  spatialOwner:'DungeonSpatial313 unchanged',
  authoredDecorators:'unchanged'
},null,2));
