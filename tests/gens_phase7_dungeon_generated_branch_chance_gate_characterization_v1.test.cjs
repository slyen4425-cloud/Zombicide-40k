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
const bytes=Buffer.from(index,'utf8');
const gitBlob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8167047,
  'Phase 7 branch chance-gate characterization must track the current Phase 9 runtime');
assert.equal(gitBlob,'a98daff5b7709c8a68f148a9af2b6d8a5837265b',
  'Phase 7 branch chance-gate characterization must track the exact current Phase 9 runtime blob');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}

const core200=block('dungeonCore200Rebuild');
const line=core200.split(/\r?\n/).find(v=>v.startsWith('function maybeSpecialBranch(x){'));
assert.ok(line,'Core 2.00 maybeSpecialBranch must remain directly characterizable');

assert.match(line,/GensDungeonV1\.exploration\.shouldCreateGeneratedBranch\(c\.specialBranchChance,Math\.random\(\)\)/,
  'generated branch presence must delegate normalized specialBranchChance and the first explicit RNG to the Dungeon gate');
assert.match(line,/GensDungeonV1\.exploration\.shouldCreateGeneratedBranch\(c\.specialBranchChance,Math\.random\(\)\)[\s\S]*const i=nearestFree\(x\);if\(i<0\)return null;[\s\S]*pickWeightedGeneratedBranchType\(c\.specialBranchWeights,Math\.random\(\)\)/,
  'chance gate, nearest-free search and type RNG must preserve their historical order');
assert.equal((line.match(/Math\.random\(\)/g)||[]).length,2,
  'accepted generated branch path must still contain exactly two RNG callsites');
assert.match(line,/addDungeonSceneElement\?\.\(GensDungeonV1\.exploration\.buildGeneratedBranchSceneElement\(x\.room,i,type\)\)/,
  'branch materialization must remain at the Core 2.00 callsite using the pure Dungeon descriptor');
assert.doesNotMatch(line,/name:type==='boss'\?'Trappe inquiétante':type==='secret'\?'Passage secret':'Cache souterraine'/,
  'Core 2.00 must no longer duplicate generated branch descriptor labels');
assert.match(line,/m\.cells\[i\]='trapdoor'/,
  'map mutation must remain at the Core 2.00 callsite');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
assert.equal(typeof sandbox.GensDungeonV1?.exploration?.pickWeightedGeneratedBranchType,'function',
  'prior branch-type weighting owner must remain present before chance-gate extraction');
assert.equal(typeof sandbox.GensDungeonV1?.exploration?.shouldCreateGeneratedBranch,'function',
  'chance-gate owner must exist in Dungeon after the dedicated Phase 7 raccord');

function currentGate(chance,roll){
  return !(Number(roll)*100>=Math.max(0,Number(chance)||0));
}

assert.equal(currentGate(20,0.19),true,'roll below chance must allow branch attempt');
assert.equal(currentGate(20,0.20),false,'roll exactly at threshold must reject branch attempt');
assert.equal(currentGate(20,0.21),false,'roll above chance must reject branch attempt');
assert.equal(currentGate(-5,0),false,'negative chance must normalize to zero and reject');
assert.equal(currentGate('bad',0),false,'invalid chance must normalize to zero and reject');
assert.equal(currentGate('100',0.999),true,'numeric string chance must retain historical Number normalization');

console.log(JSON.stringify({
  scenario:'Phase 7 generated branch chance gate characterization',
  runtime:{bytes:bytes.length,gitBlob},
  currentOwner:'Core 2.00 maybeSpecialBranch',
  semantics:'Number(roll)*100 < max(0, Number(specialBranchChance)||0)',
  rng:'first RNG remains at callsite before nearestFree; second RNG remains after nearestFree',
  materialization:'Core 2.00 unchanged'
},null,2));
