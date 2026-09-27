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

assert.equal(typeof sandbox.GensDungeonV1?.exploration?.pickWeightedGeneratedBranchType,'function',
  'Phase 7 micro-lot 4 requires Dungeon-owned weighted generated branch-type selection');

const pick=sandbox.GensDungeonV1.exploration.pickWeightedGeneratedBranchType;
assert.equal(pick(null,0.10),'treasure','default first 45 percent must remain treasure');
assert.equal(pick(null,0.50),'boss','default middle 25 percent must remain boss');
assert.equal(pick(null,0.90),'secret','default final 30 percent must remain secret');
assert.equal(pick({treasure:0,boss:0,secret:7},0.25),'secret',
  'configured special-branch weights must override defaults');
assert.equal(pick({treasure:0,boss:0,secret:0},0.50),'treasure',
  'all-zero weighting must preserve the historical treasure fallback');
assert.equal(pick({treasure:-10,boss:'5',secret:'bad'},0.50),'boss',
  'branch weights must preserve historical non-negative numeric normalization');

assert.doesNotMatch(entry,/Math\.random\(|document|localStorage|sessionStorage|setTimeout|setInterval|MutationObserver|addEventListener/,
  'Dungeon branch-type selector must remain pure and receive roll explicitly');
assert.doesNotMatch(entry,/Tactical|GensRpgTactical|Capture|GensSurvival|PvP/i,
  'Dungeon branch-type selector must not consume another module runtime');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing '+id);
  return m[1];
}
const core200=block('dungeonCore200Rebuild');
const line=core200.split(/\r?\n/).find(v=>v.startsWith('function maybeSpecialBranch(x){'));
assert.ok(line,'Core 2.00 maybeSpecialBranch must remain directly characterizable');

assert.equal((line.match(/GensDungeonV1\.exploration\.pickWeightedGeneratedBranchType\(/g)||[]).length,1,
  'Core 2.00 must delegate generated branch-type weighting exactly once');
assert.match(line,/GensDungeonV1\.exploration\.shouldCreateGeneratedBranch\(c\.specialBranchChance,Math\.random\(\)\)[\s\S]*const i=nearestFree\(x\);if\(i<0\)return null;[\s\S]*GensDungeonV1\.exploration\.pickWeightedGeneratedBranchType\(c\.specialBranchWeights,Math\.random\(\)\)/,
  'explicit chance roll, Dungeon chance gate, nearest-free check and explicit type roll must preserve historical order at the callsite');
assert.doesNotMatch(line,/const w=\{treasure:45,boss:25,secret:30/,
  'Core 2.00 must retire the inline branch-type weighting calculation');
assert.match(line,/addDungeonSceneElement\?\.\(\{kind:'trapdoor'/,
  'branch scene materialization must remain in Core 2.00');
assert.match(line,/m\.cells\[i\]='trapdoor'/,
  'branch map mutation must remain in Core 2.00');
assert.doesNotMatch(authored,/pickWeightedGeneratedBranchType/,
  'Authored World Builder must remain outside generated branch-type selection');

console.log(JSON.stringify({
  scenario:'Phase 7 Dungeon generated branch type weighting owner',
  owner:'GensDungeonV1.exploration.pickWeightedGeneratedBranchType',
  defaults:{treasure:45,boss:25,secret:30},
  random:'explicit roll from Core 2.00 after nearestFree',
  materialization:'Core 2.00 unchanged',
  authored:'unchanged'
},null,2));
