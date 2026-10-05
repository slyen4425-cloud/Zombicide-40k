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
const returnPersist=read('assets/dungeon/dungeon-authored-return-persist-167862.js');
const branchNav=read('assets/dungeon/dungeon-authored-branch-nav-cleanup-167863.js');
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));

const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8167138);
assert.equal(gitBlob,'09b1e19c04777da82fd0ad355adc7eb82532db29');

const ctx={};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
assert.equal(typeof ctx.GensDungeonV1?.movement?.resolveAuthoredActiveHero,'function',
  'lot 18 requires the canonical active-hero owner created by lot 17');

const historical=/function activeHero\(x\)\{const a=Array\.isArray\(x\?\.participants\)\?x\.participants:\[\],i=Math\.max\(0,Math\.min\(Math\.max\(0,a\.length-1\),Number\(x\?\.index\)\|\|0\)\);return String\(a\[i\]\|\|""\)\}/;

assert.doesNotMatch(finalExit,historical,
  'Final Exit must no longer own the duplicated active-hero decision');
assert.equal(
  (finalExit.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  1,
  'Final Exit must delegate active-hero selection exactly once'
);
assert.match(
  finalExit,
  /function activeHero\(x\)\{return R\.GensDungeonV1\.movement\.resolveAuthoredActiveHero\(x\?\.participants,x\?\.index\)\}/,
  'Final Exit must keep activeHero(x) as a local runtime raccord and delegate only the pure decision'
);

assert.doesNotMatch(returnPersist,historical,
  'Return Persist must reflect its later dedicated delegation lot');
assert.equal(
  (returnPersist.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  1,
  'Return Persist must delegate active-hero selection exactly once after its later lot'
);
assert.doesNotMatch(branchNav,historical,
  'Branch Nav Cleanup must reflect its later dedicated delegation lot');
assert.equal(
  (branchNav.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  1,
  'Branch Nav Cleanup must delegate active-hero selection exactly once after its later lot'
);

assert.ok(
  contract.invariants.some(x=>/Final Exit.*active hero|active hero.*Final Exit/i.test(x)),
  'Dungeon contract must document Final Exit active-hero delegation'
);

console.log(JSON.stringify({
  scenario:'Phase 7 Final Exit active hero delegation guard',
  canonicalOwner:'GensDungeonV1.movement.resolveAuthoredActiveHero',
  consumer:'DungeonAuthoredFinalExit167875.activeHero',
  laterDelegated:[
    'DungeonAuthoredReturnPersist167862.activeHero',
    'DungeonAuthoredBranchNavCleanup167863.activeHero'
  ],
  untouched:[
    'DungeonAuthoredRuntime167839',
    'DungeonSpatial313'
  ]
},null,2));
