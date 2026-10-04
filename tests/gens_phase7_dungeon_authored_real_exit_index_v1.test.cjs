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
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8167187,
  'Phase 7 authored real-exit RED must start from the exit-edge GREEN runtime');
assert.equal(gitBlob,'99d7784676669b629cae6070df8c02606d67002f',
  'Phase 7 authored real-exit RED must start from the exact exit-edge GREEN blob');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

assert.equal(
  typeof sandbox.GensDungeonV1?.movement?.resolveAuthoredRealExitIndex,
  'function',
  'Phase 7 micro-lot 11 requires Dungeon-owned authored real-exit resolution'
);

const resolve=sandbox.GensDungeonV1.movement.resolveAuthoredRealExitIndex;
assert.equal(resolve(['floor','exit'],1),1);
assert.equal(resolve(['floor','exit'],'1'),1);
assert.equal(resolve(['exit','floor','exit'],2),2);
assert.equal(resolve(['floor','EXIT'],1),1);
assert.equal(resolve(['floor','exit'],0),1);
assert.equal(resolve(['floor','exit'],-1),1);
assert.equal(resolve(['floor','exit'],1.5),1);
assert.equal(resolve(['floor','exit'],99),1);
assert.equal(resolve(['EXIT','floor'],undefined),0);
assert.equal(resolve(['floor','door'],1),-1);
assert.equal(resolve([],0),-1);

assert.doesNotMatch(
  entry,
  /DungeonSpatial313|localStorage|sessionStorage|document|setTimeout|setInterval|MutationObserver|addEventListener/,
  'pure authored real-exit resolver must not absorb runtime state, spatial state, DOM or storage'
);

assert.equal(
  (authored.match(/GensDungeonV1\.movement\.resolveAuthoredRealExitIndex\(/g)||[]).length,
  1,
  'Authored Runtime must consume the pure real-exit resolver exactly once'
);
assert.match(
  authored,
  /function realExitIndex\(x\)\{const map=x\?\.last\?\.map\|\|\{\},cells=Array\.isArray\(map\.cells\)\?map\.cells:\[\];return ROOT\.GensDungeonV1\.movement\.resolveAuthoredRealExitIndex\(cells,map\.exitIdx\)\}/,
  'Authored Runtime must retain map read and cells normalization around the pure resolver'
);
assert.match(
  authored,
  /function atTerminalExit\(x\)\{const hero=activeHero\(x\),exitIdx=realExitIndex\(x\);return ROOT\.GensDungeonV1\.movement\.isAuthoredTerminalExit\(hero,exitIdx,positional\(\),x\?\.positions\?\.\[hero\]\)\}/,
  'terminal-exit policy must remain outside real-exit resolution after its later dedicated extraction'
);

assert.ok(
  contract.invariants.some(x=>/real exit|real-exit|exit index|exit-index/i.test(x)),
  'Dungeon contract must document the pure authored real-exit resolution boundary'
);

console.log(JSON.stringify({
  scenario:'Phase 7 authored real exit index owner',
  expected:'RED before pure resolver extraction, GREEN after direct realExitIndex raccord',
  pureOwner:'GensDungeonV1.movement.resolveAuthoredRealExitIndex',
  runtimeOwner:'DungeonAuthoredRuntime167839.realExitIndex',
  terminalPolicyOwner:'DungeonAuthoredRuntime167839.atTerminalExit',
  spatialOwner:'DungeonSpatial313 unchanged'
},null,2));
