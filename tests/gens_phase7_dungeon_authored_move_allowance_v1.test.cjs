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
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));
const returnPersist=read('assets/dungeon/dungeon-authored-return-persist-167862.js');
const actionFix=read('assets/dungeon/dungeon-authored-action-fix-167857.js');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8169990,
  'Phase 7 authored move-allowance RED must start from the micro-lot 7 runtime');
assert.equal(gitBlob,'1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082',
  'Phase 7 authored move-allowance RED must start from the exact micro-lot 7 blob');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

assert.equal(
  typeof sandbox.GensDungeonV1?.movement?.resolveAuthoredHeroMoveAllowance,
  'function',
  'Phase 7 micro-lot 8 requires Dungeon-owned authored hero move-allowance normalization'
);

const resolve=sandbox.GensDungeonV1.movement.resolveAuthoredHeroMoveAllowance;
for(const [runtimeValue,statValue,expected] of [
  [4,9,4],
  ['4',9,4],
  [-2,9,0],
  [0,9,9],
  [null,5,5],
  [undefined,0,3],
  ['abc',7,7],
  [Infinity,7,Infinity],
  [0,-2,0],
  [undefined,undefined,3]
]){
  assert.equal(resolve(runtimeValue,statValue),expected,
    'pure authored hero move allowance parity failed for runtime='+String(runtimeValue)+' stat='+String(statValue));
}

assert.doesNotMatch(
  entry,
  /dungeonHeroMoveValue083|CHARS|DungeonSpatial313|localStorage|sessionStorage|document|setTimeout|setInterval|MutationObserver|addEventListener/,
  'pure Dungeon move-allowance helper must not absorb authored reads, spatial state, DOM or storage ownership'
);

assert.equal(
  (authored.match(/GensDungeonV1\.movement\.resolveAuthoredHeroMoveAllowance\(/g)||[]).length,
  1,
  'Authored Runtime must consume the pure move-allowance helper exactly once'
);
assert.match(
  authored,
  /function heroMoveAllowance\(id\)\{try\{return ROOT\.GensDungeonV1\.movement\.resolveAuthoredHeroMoveAllowance\(ROOT\.dungeonHeroMoveValue083\?\.\(id\),ROOT\.CHARS\?\.\[id\]\?\.dungeonStats\?\.movement\)\}catch\(e\)\{return 3\}\}/,
  'Authored Runtime must retain the global reads and historical catch fallback around the pure helper'
);
assert.match(
  authored,
  /function movementForEntry\(x,hero\)\{const plan=ROOT\.GensDungeonV1\.movement\.planAuthoredEntryMovement\(x\?\.remaining\?\.\[hero\]\);return plan\.status==="remaining"\?plan\.movement:heroMoveAllowance\(hero\)\}/,
  'movementForEntry lazy fallback boundary must remain unchanged'
);

assert.doesNotMatch(returnPersist,/resolveAuthoredHeroMoveAllowance/,
  'authored return persistence must remain outside move-allowance extraction');
assert.doesNotMatch(actionFix,/resolveAuthoredHeroMoveAllowance/,
  'authored action fix must remain outside move-allowance extraction');

assert.ok(
  contract.invariants.some(x=>/move allowance|movement allowance|normalization/i.test(x)),
  'Dungeon contract must document the pure authored move-allowance normalization boundary'
);

console.log(JSON.stringify({
  scenario:'Phase 7 authored hero move allowance owner',
  expected:'RED before pure normalization extraction, GREEN after direct Authored Runtime raccord',
  pureOwner:'GensDungeonV1.movement.resolveAuthoredHeroMoveAllowance',
  readOwner:'DungeonAuthoredRuntime167839.heroMoveAllowance',
  catchFallbackOwner:'DungeonAuthoredRuntime167839',
  spatialOwner:'DungeonSpatial313 unchanged'
},null,2));
