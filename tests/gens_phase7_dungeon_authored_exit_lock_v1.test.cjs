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

assert.equal(bytes.length,8165398,
  'Phase 7 authored exit-lock RED must start from the terminal-exit GREEN runtime');
assert.equal(gitBlob,'18627cc0c5fc7945732c8a910504c59ef823b6ae',
  'Phase 7 authored exit-lock RED must keep the exact terminal-exit GREEN blob');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

assert.equal(
  typeof sandbox.GensDungeonV1?.movement?.isAuthoredExitBlocked,
  'function',
  'Phase 7 micro-lot 13 requires Dungeon-owned authored exit-lock decision'
);

const blocked=sandbox.GensDungeonV1.movement.isAuthoredExitBlocked;
assert.equal(blocked(true,'open','open'),true);
assert.equal(blocked(1,'open','open'),true);
assert.equal(blocked(false,'locked','open'),true);
assert.equal(blocked(false,'','locked'),true);
assert.equal(blocked(false,null,'locked'),true);
assert.equal(blocked(false,'open','locked'),false);
assert.equal(blocked(false,'LOCKED',''),false);
assert.equal(blocked(false,'open','open'),false);
assert.equal(blocked(false,'',''),false);

assert.doesNotMatch(
  entry,
  /dungeonRoomExitLocked102|DungeonSpatial313|localStorage|sessionStorage|document|setTimeout|setInterval|MutationObserver|addEventListener/,
  'pure authored exit-lock decision must not absorb dynamic guards, runtime state, spatial state, DOM or storage'
);

assert.equal(
  (authored.match(/GensDungeonV1\.movement\.isAuthoredExitBlocked\(/g)||[]).length,
  1,
  'Authored Runtime must consume the pure exit-lock decision exactly once'
);
assert.match(
  authored,
  /function blocked\(x\)\{try\{if\(ROOT\.dungeonRoomExitLocked102\?\.\(\)\)return true\}catch\(e\)\{\}return ROOT\.GensDungeonV1\.movement\.isAuthoredExitBlocked\(x\?\.last\?\.exitLocked,x\?\.last\?\.map\?\.objective\?\.status,x\?\.last\?\.objective\?\.status\)\}/,
  'Authored Runtime must retain the dynamic guard first and only delegate the local authored decision'
);

assert.ok(
  contract.invariants.some(x=>/exit lock|exit-lock|verrouillage de sortie/i.test(x)),
  'Dungeon contract must document the pure authored exit-lock decision boundary'
);

console.log(JSON.stringify({
  scenario:'Phase 7 authored exit lock owner',
  expected:'RED before pure exit-lock decision extraction, GREEN after direct blocked raccord',
  pureOwner:'GensDungeonV1.movement.isAuthoredExitBlocked',
  runtimeOwner:'DungeonAuthoredRuntime167839.blocked',
  dynamicGuardOwner:'DungeonAuthoredRuntime167839.dungeonRoomExitLocked102 guard',
  spatialOwner:'DungeonSpatial313 unchanged'
},null,2));
