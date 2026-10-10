'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=require('./helpers/gens_capture_v162_legacy_snapshot_v1.cjs').legacyBytes().toString('utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const finalExit=read('assets/dungeon/dungeon-authored-final-exit-167875.js');
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8165438,
  'Phase 7 Final Exit terminal RED must start from the lock-delegation GREEN runtime');
assert.equal(gitBlob,'1a61147d5a32889fa85e6a09e846049103b9f0bf',
  'Phase 7 Final Exit terminal RED must keep the exact canonical index blob');

const pure={};
pure.window=pure;
pure.globalThis=pure;
vm.createContext(pure);
vm.runInContext(entry,pure,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
assert.equal(
  typeof pure.GensDungeonV1?.movement?.isAuthoredTerminalExit,
  'function',
  'canonical Dungeon terminal helper must already exist'
);

assert.equal(
  (finalExit.match(/GensDungeonV1\.movement\.isAuthoredTerminalExit\(/g)||[]).length,
  1,
  'Final Exit must consume the canonical terminal decision exactly once'
);

assert.match(
  finalExit,
  /const atExit=hasExit&&R\.GensDungeonV1\.movement\.isAuthoredTerminalExit\(hero,exitIdx,positional,x\?\.positions\?\.\[hero\]\);/,
  'Final Exit must keep hasExit local while delegating only the terminal position decision'
);

assert.match(
  finalExit,
  /const direct=Number\(map\.exitIdx\),exitIdx=Number\.isInteger\(direct\)&&direct>=0\?direct:cells\.findIndex\(v=>String\(v\|\|""\)\.toLowerCase\(\)==="exit"\);/,
  'Final Exit local exitIdx resolver must remain unchanged in this micro-lot'
);

assert.doesNotMatch(
  finalExit,
  /const atExit=hasExit&&\(!positional\|\|pos===exitIdx\);/,
  'Final Exit must retire the duplicated local positional terminal expression'
);

assert.ok(
  contract.invariants.some(x=>/Final Exit.*terminal|terminal.*Final Exit/i.test(x)),
  'Dungeon contract must identify Final Exit as a canonical terminal-decision consumer'
);

const terminal=pure.GensDungeonV1.movement.isAuthoredTerminalExit;
assert.equal(true && terminal('hero',2,false,0),true);
assert.equal(true && terminal('hero',2,true,2),true);
assert.equal(true && terminal('hero',2,true,'2'),true);
assert.equal(true && terminal('hero',2,true,1),false);
assert.equal(true && terminal('hero',2,true,undefined),false);
assert.equal(false && terminal('hero',0,false,0),false,
  'local hasExit guard must remain authoritative even when canonical terminal helper would allow non-positional exit');

console.log(JSON.stringify({
  scenario:'Phase 7 authored Final Exit terminal delegation',
  expected:'RED before canonical terminal delegation, GREEN after one direct consumer with local hasExit guard',
  canonicalOwner:'GensDungeonV1.movement.isAuthoredTerminalExit',
  consumer:'DungeonAuthoredFinalExit167875.finalState',
  localGuards:['exitIdx resolver','hasExit'],
  untouched:['finish','lock','storage','session','home','DungeonAuthoredRuntime167839','DungeonSpatial313']
},null,2));
