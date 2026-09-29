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
const finalExit=read('assets/dungeon/dungeon-authored-final-exit-167875.js');
const returnPersist=read('assets/dungeon/dungeon-authored-return-persist-167862.js');
const branchNav=read('assets/dungeon/dungeon-authored-branch-nav-cleanup-167863.js');
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8169990,
  'Phase 7 authored active-hero RED must start from Final Exit terminal GREEN runtime');
assert.equal(gitBlob,'1dde9f80fcc1cd5e3c9560491ab28a2ecd2d2082',
  'Phase 7 authored active-hero RED must keep the exact canonical index blob');

const pure={};
pure.window=pure;
pure.globalThis=pure;
vm.createContext(pure);
vm.runInContext(entry,pure,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

assert.equal(
  typeof pure.GensDungeonV1?.exploration?.resolveAuthoredActiveHero,
  'function',
  'Phase 7 micro-lot 16 requires Dungeon-owned authored active-hero selection'
);

const resolve=pure.GensDungeonV1.exploration.resolveAuthoredActiveHero;
assert.equal(resolve(['a','b','c'],0),'a');
assert.equal(resolve(['a','b','c'],2),'c');
assert.equal(resolve(['a','b','c'],99),'c');
assert.equal(resolve(['a','b','c'],-4),'a');
assert.equal(resolve(['a','b','c'],'1'),'b');
assert.equal(resolve(['a','b','c'],undefined),'a');
assert.equal(resolve(['a','b','c'],'abc'),'a');
assert.equal(resolve(['a','b','c'],1.5),'');
assert.equal(resolve(null,0),'');
assert.equal(resolve([],0),'');
assert.equal(resolve([0,'b'],0),'');
assert.equal(resolve([123],0),'123');

assert.equal(
  (authored.match(/GensDungeonV1\.exploration\.resolveAuthoredActiveHero\(/g)||[]).length,
  1,
  'Authored Runtime must consume the pure active-hero selector exactly once through activeHero'
);
assert.match(
  authored,
  /function activeHero\(x\)\{return ROOT\.GensDungeonV1\.exploration\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Authored Runtime activeHero must retain runtime reads and delegate only the pure selection'
);

for(const [name,source] of [
  ['Final Exit',finalExit],
  ['Return Persist',returnPersist],
  ['Branch Nav Cleanup',branchNav]
]){
  assert.equal(
    (source.match(/resolveAuthoredActiveHero\(/g)||[]).length,
    0,
    name+' must stay outside micro-lot 16'
  );
}

assert.doesNotMatch(
  entry,
  /DungeonSpatial313|localStorage|sessionStorage|document|setTimeout|setInterval|MutationObserver|addEventListener/,
  'pure Dungeon entry must not absorb runtime state, spatial state, DOM or storage'
);

assert.ok(
  contract.invariants.some(x=>/active hero|active-hero/i.test(x)),
  'Dungeon contract must document the pure authored active-hero selection boundary'
);

console.log(JSON.stringify({
  scenario:'Phase 7 authored active hero owner',
  expected:'RED before pure active-hero extraction, GREEN after Authored Runtime-only raccord',
  pureOwner:'GensDungeonV1.exploration.resolveAuthoredActiveHero',
  runtimeConsumer:'DungeonAuthoredRuntime167839.activeHero',
  untouched:['DungeonAuthoredFinalExit167875','DungeonAuthoredReturnPersist167862','DungeonAuthoredBranchNavCleanup167863','DungeonSpatial313']
},null,2));
