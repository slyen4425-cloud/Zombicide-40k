'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const index=read('index.html');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

assert.equal(typeof sandbox.GensDungeonV1?.exploration?.shouldCreateGeneratedBranch,'function',
  'Phase 7 micro-lot 5 requires Dungeon-owned generated branch presence decision');

const decide=sandbox.GensDungeonV1.exploration.shouldCreateGeneratedBranch;

assert.equal(decide(0,0),false,'chance zero must reject even at roll zero');
assert.equal(decide(20,0),true,'roll zero must pass a positive chance');
assert.equal(decide(20,0.199999),true,'roll below the boundary must pass');
assert.equal(decide(20,0.20),false,'roll exactly at the boundary must reject');
assert.equal(decide(20,0.200001),false,'roll above the boundary must reject');
assert.equal(decide(100,0.999999),true,'chance 100 must pass all normal Math.random rolls');
assert.equal(decide(-5,0),false,'negative chance must clamp to zero');
assert.equal(decide('20',0.10),true,'numeric-string chance must preserve Number coercion');
assert.equal(decide('bad',0),false,'invalid chance must normalize to zero');
assert.equal(decide(150,0.999999),true,'historical chance must keep no upper clamp');

assert.doesNotMatch(entry,/Math\.random\(|document|localStorage|sessionStorage|setTimeout|setInterval|MutationObserver|addEventListener/,
  'Dungeon generated-branch presence decision must remain pure and receive roll explicitly');
assert.doesNotMatch(entry,/Tactical|GensRpgTactical|Capture|GensSurvival|PvP/i,
  'Dungeon generated-branch presence decision must not consume another module runtime');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing '+id);
  return m[1];
}
const core200=block('dungeonCore200Rebuild');
const line=core200.split(/\r?\n/).find(v=>v.startsWith('function maybeSpecialBranch(x){'));
assert.ok(line,'Core 2.00 maybeSpecialBranch must remain directly characterizable');

assert.equal((line.match(/GensDungeonV1\.exploration\.shouldCreateGeneratedBranch\(/g)||[]).length,1,
  'Core 2.00 must delegate generated branch presence exactly once');
assert.match(line,/!GensDungeonV1\.exploration\.shouldCreateGeneratedBranch\(c\.specialBranchChance,Math\.random\(\)\)[\s\S]*const i=nearestFree\(x\);if\(i<0\)return null;[\s\S]*pickWeightedGeneratedBranchType\(c\.specialBranchWeights,Math\.random\(\)\)/,
  'explicit presence roll, nearest-free gate and explicit type roll must preserve historical order');
assert.doesNotMatch(line,/Math\.random\(\)\*100>=Math\.max\(0,Number\(c\.specialBranchChance\)\|\|0\)/,
  'Core 2.00 must retire the inline generated-branch presence calculation');
assert.equal((line.match(/Math\.random\(\)/g)||[]).length,2,
  'Core 2.00 must preserve exactly two generated-branch RNG callsites');
assert.match(line,/addDungeonSceneElement\?\.\(\{kind:'trapdoor'/,
  'branch materialization must remain in Core 2.00');
assert.match(line,/m\.cells\[i\]='trapdoor'/,
  'branch map mutation must remain in Core 2.00');

assert.doesNotMatch(authored,/shouldCreateGeneratedBranch|specialBranchChance/,
  'authored World Builder must remain outside generated branch presence decision');

console.log(JSON.stringify({
  scenario:'Phase 7 Dungeon generated branch presence owner',
  owner:'GensDungeonV1.exploration.shouldCreateGeneratedBranch',
  normalization:'Math.max(0, Number(chance)||0)',
  comparison:'roll*100 < normalized chance',
  random:'explicit roll from Core 2.00',
  nearestFree:'Core 2.00 unchanged after presence decision',
  typeSelector:'existing Dungeon owner unchanged after nearestFree',
  materialization:'Core 2.00 unchanged',
  authored:'unchanged'
},null,2));
