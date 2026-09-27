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
  'Phase 7 micro-lot 5 requires Dungeon-owned generated branch chance gate');

const shouldCreate=sandbox.GensDungeonV1.exploration.shouldCreateGeneratedBranch;
assert.equal(shouldCreate(20,0.19),true,'roll below configured chance must allow a generated branch attempt');
assert.equal(shouldCreate(20,0.20),false,'roll exactly at configured chance boundary must reject');
assert.equal(shouldCreate(20,0.21),false,'roll above configured chance must reject');
assert.equal(shouldCreate(-5,0),false,'negative chance must normalize to zero');
assert.equal(shouldCreate('bad',0),false,'invalid chance must normalize to zero');
assert.equal(shouldCreate('100',0.999),true,'numeric string chance must preserve historical Number normalization');

assert.doesNotMatch(entry,/Math\.random\(|document|localStorage|sessionStorage|setTimeout|setInterval|MutationObserver|addEventListener/,
  'Dungeon generated branch chance gate must remain pure and receive roll explicitly');
assert.doesNotMatch(entry,/Tactical|GensRpgTactical|Capture|GensSurvival|PvP/i,
  'Dungeon generated branch chance gate must not consume another module runtime');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing '+id);
  return m[1];
}
const core200=block('dungeonCore200Rebuild');
const line=core200.split(/\r?\n/).find(v=>v.startsWith('function maybeSpecialBranch(x){'));
assert.ok(line,'Core 2.00 maybeSpecialBranch must remain directly characterizable');

assert.equal((line.match(/GensDungeonV1\.exploration\.shouldCreateGeneratedBranch\(/g)||[]).length,1,
  'Core 2.00 must delegate the generated branch presence decision exactly once');
assert.match(line,/shouldCreateGeneratedBranch\(c\.specialBranchChance,Math\.random\(\)\)[\s\S]*const i=nearestFree\(x\);if\(i<0\)return null;[\s\S]*pickWeightedGeneratedBranchType\(c\.specialBranchWeights,Math\.random\(\)\)/,
  'explicit chance RNG, nearest-free gate and explicit type RNG must preserve historical order');
assert.doesNotMatch(line,/Math\.random\(\)\*100>=Math\.max\(0,Number\(c\.specialBranchChance\)\|\|0\)/,
  'Core 2.00 must retire the inline generated branch chance calculation');
assert.equal((line.match(/Math\.random\(\)/g)||[]).length,2,
  'Core 2.00 must preserve exactly two RNG callsites on the accepted branch path');
assert.match(line,/addDungeonSceneElement\?\.\(\{kind:'trapdoor'/,
  'branch scene materialization must remain in Core 2.00');
assert.match(line,/m\.cells\[i\]='trapdoor'/,
  'branch map mutation must remain in Core 2.00');
assert.doesNotMatch(authored,/shouldCreateGeneratedBranch/,
  'Authored World Builder must remain outside generated branch presence selection');

console.log(JSON.stringify({
  scenario:'Phase 7 Dungeon generated branch chance gate owner',
  owner:'GensDungeonV1.exploration.shouldCreateGeneratedBranch',
  random:'explicit first roll from Core 2.00',
  nearestFree:'Core 2.00 unchanged after chance acceptance',
  typeWeighting:'existing Dungeon owner unchanged',
  materialization:'Core 2.00 unchanged',
  authored:'unchanged'
},null,2));
