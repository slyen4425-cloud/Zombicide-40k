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
const finalExit=read('assets/dungeon/dungeon-authored-final-exit-167875.js');
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8165614,
  'Phase 7 Final Exit lock RED must start from the exit-lock GREEN runtime');
assert.equal(gitBlob,'560966d096134cd58ff4dc6ab2be589cee936ba7',
  'Phase 7 Final Exit lock RED must keep the exact exit-lock GREEN blob');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

assert.equal(
  typeof sandbox.GensDungeonV1?.movement?.isAuthoredExitBlocked,
  'function',
  'the canonical authored exit-lock helper must already exist'
);

assert.equal(
  (finalExit.match(/GensDungeonV1\.movement\.isAuthoredExitBlocked\(/g)||[]).length,
  1,
  'Final Exit must consume the canonical authored exit-lock helper exactly once'
);

const blockedStart=finalExit.indexOf('function blocked');
const blockedEnd=finalExit.indexOf('function activeHero',blockedStart);
assert.ok(blockedStart>=0&&blockedEnd>blockedStart,'Final Exit blocked seam missing');
const blockedSource=finalExit.slice(blockedStart,blockedEnd);

assert.match(
  blockedSource,
  /function blocked\(x\)\{try\{if\(R\.dungeonRoomExitLocked102\?\.\(\)\)return true\}catch\(e\)\{\}return R\.GensDungeonV1\.movement\.isAuthoredExitBlocked\(x\?\.last\?\.exitLocked,x\?\.last\?\.map\?\.objective\?\.status,x\?\.last\?\.objective\?\.status\)\}/,
  'Final Exit must retain the dynamic guard first and delegate only the local authored fallback decision'
);

assert.doesNotMatch(
  blockedSource,
  /if\(x\?\.last\?\.exitLocked\)return true|String\(x\?\.last\?\.map\?\.objective\?\.status\|\|x\?\.last\?\.objective\?\.status\|\|""\)==="locked"/,
  'Final Exit must not retain a second implementation of the authored lock decision'
);

assert.ok(
  contract.invariants.some(x=>/Final Exit/i.test(x)&&/exit lock|exit-lock|verrouillage/i.test(x)),
  'Dungeon contract must document Final Exit consumption of the canonical authored exit-lock decision'
);

console.log(JSON.stringify({
  scenario:'Phase 7 authored Final Exit canonical lock delegation',
  expected:'RED before Final Exit delegates, GREEN after removing only the duplicate authored fallback',
  canonicalOwner:'GensDungeonV1.movement.isAuthoredExitBlocked',
  consumer:'DungeonAuthoredFinalExit167875.blocked',
  dynamicGuardOwner:'DungeonAuthoredFinalExit167875',
  authoredRuntimeOwner:'DungeonAuthoredRuntime167839 unchanged'
},null,2));
