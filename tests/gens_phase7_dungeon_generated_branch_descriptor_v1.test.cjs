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
const authoredBranchContent=read('assets/dungeon/dungeon-secondary-branch-content-fix-167860.js');
const authoredBranchNav=read('assets/dungeon/dungeon-authored-branch-nav-cleanup-167863.js');
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8169442,
  'Phase 7 generated branch descriptor guard must track the current generated Boss policy runtime');
assert.equal(gitBlob,'a37acaabcb3202a8527c2d545f9e2ff4466ea1db',
  'Phase 7 generated branch descriptor guard must track the exact generated Boss policy blob');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const core200=block('dungeonCore200Rebuild');
const line=core200.split(/\r?\n/).find(v=>v.startsWith('function maybeSpecialBranch(x){'));
assert.ok(line,'Core 2.00 maybeSpecialBranch must remain directly characterizable');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

assert.equal(
  typeof sandbox.GensDungeonV1?.exploration?.buildGeneratedBranchSceneElement,
  'function',
  'Phase 7 micro-lot 6 requires Dungeon-owned generated branch scene descriptor builder'
);

const build=sandbox.GensDungeonV1.exploration.buildGeneratedBranchSceneElement;
const normalize=v=>JSON.parse(JSON.stringify(v));

assert.deepEqual(normalize(build(6,7,'treasure')),{
  kind:'trapdoor',
  name:'Cache souterraine',
  room:6,
  cellIndex:7,
  environment:'dungeon',
  branchType:'treasure'
},'treasure descriptor must preserve exact historical shape');

assert.deepEqual(normalize(build(6,7,'boss')),{
  kind:'trapdoor',
  name:'Trappe inquiétante',
  room:6,
  cellIndex:7,
  environment:'dungeon',
  branchType:'boss'
},'boss descriptor must preserve exact historical shape');

assert.deepEqual(normalize(build(6,7,'secret')),{
  kind:'trapdoor',
  name:'Passage secret',
  room:6,
  cellIndex:7,
  environment:'dungeon',
  branchType:'secret'
},'secret descriptor must preserve exact historical shape');

assert.deepEqual(normalize(build(6,7,'unknown')),{
  kind:'trapdoor',
  name:'Cache souterraine',
  room:6,
  cellIndex:7,
  environment:'dungeon',
  branchType:'unknown'
},'unknown branch type must preserve the historical default label while retaining branchType');

const a=build(6,7,'treasure');
const b=build(6,7,'treasure');
assert.notEqual(a,b,'descriptor builder must return a fresh plain object');

assert.doesNotMatch(entry,/\bdocument\b|localStorage|sessionStorage|MutationObserver|setTimeout|setInterval|addEventListener|Math\.random|nearestFree|addDungeonSceneElement/,
  'descriptor builder module must remain pure and side-effect free');

assert.equal((line.match(/buildGeneratedBranchSceneElement\(/g)||[]).length,1,
  'Core 2.00 maybeSpecialBranch must consume the Dungeon descriptor builder exactly once');
assert.match(line,/const i=nearestFree\(x\);if\(i<0\)return null/,
  'nearestFree must remain at the Core 2.00 callsite');
assert.match(line,/pickWeightedGeneratedBranchType\(c\.specialBranchWeights,Math\.random\(\)\)/,
  'branch-type RNG and selection must remain at the Core 2.00 callsite');
assert.match(line,/addDungeonSceneElement\?\.\(GensDungeonV1\.exploration\.buildGeneratedBranchSceneElement\(x\.room,i,type\)\)/,
  'Core 2.00 must pass the pure Dungeon descriptor directly to addDungeonSceneElement');
assert.doesNotMatch(line,/name:type==='boss'\?'Trappe inquiétante':type==='secret'\?'Passage secret':'Cache souterraine'/,
  'Core 2.00 must retire the duplicated generated branch label/descriptor construction');
assert.match(line,/m\.cells\[i\]='trapdoor';return el/,
  'map mutation and materialization return must remain at the Core 2.00 callsite');

for(const src of [authored,authoredBranchContent,authoredBranchNav]){
  assert.doesNotMatch(src,/buildGeneratedBranchSceneElement/,
    'authored branch owners must remain outside generated branch descriptor extraction');
}

console.log(JSON.stringify({
  scenario:'Phase 7 generated branch scene descriptor owner',
  expected:'RED before descriptor builder extraction, GREEN after direct Dungeon raccord',
  pureOwner:'GensDungeonV1.exploration.buildGeneratedBranchSceneElement',
  materialization:'Core 2.00 unchanged',
  authored:'separate and unchanged'
},null,2));
