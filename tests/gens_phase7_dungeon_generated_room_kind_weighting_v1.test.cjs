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

assert.equal(typeof sandbox.GensDungeonV1?.exploration?.pickWeightedGeneratedRoomKind,'function',
  'Phase 7 micro-lot 2 requires Dungeon-owned weighted generated room-kind selection');

const pick=sandbox.GensDungeonV1.exploration.pickWeightedGeneratedRoomKind;
const defaults={enemy:44,ambush:12,trap:14,chest:14,merchant:8,rest:11,mystery:11};

assert.equal(pick(defaults,0),'enemy','zero roll must select the first weighted kind');
assert.equal(pick(defaults,0.5),'trap','default weighted thresholds must preserve current behavior');
assert.equal(pick({...defaults,enemy:0,ambush:0,trap:0,chest:0,merchant:0,rest:0,mystery:0,portal:5},0.4),'portal',
  'custom roomWeight keys must remain eligible');
assert.equal(pick({enemy:-2,ambush:0,trap:0,chest:0,merchant:0,rest:0,mystery:0},0.7),'enemy',
  'non-positive total must preserve enemy fallback');
assert.equal(pick(null,0),'enemy','missing weights must use current defaults');

assert.doesNotMatch(entry,/Math\.random\(/,
  'Dungeon weighting API must receive a deterministic roll and must not own randomness');
assert.doesNotMatch(entry,/document|localStorage|sessionStorage|setTimeout|setInterval|MutationObserver|addEventListener/,
  'Dungeon weighting API must remain pure and side-effect free');
assert.doesNotMatch(entry,/Tactical|GensRpgTactical|Capture|GensSurvival|PvP/i,
  'Dungeon weighting API must not consume another module runtime');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}
const core200=block('dungeonCore200Rebuild');

assert.match(core200,/if\(c\.boss!==['"]none['"]&&room===Number\(c\.rooms\)\)return['"]boss['"]/,
  'final-room Boss policy must remain in Core 2.00');
assert.match(core200,/if\(c\.boss===['"]everyN['"]&&room%Math\.max\(1,Number\(c\.bossEvery\)\|\|5\)===0\)return['"]boss['"]/,
  'everyN Boss policy must remain in Core 2.00');
assert.match(core200,/if\(c\.boss===['"]specific['"]&&explicit\.includes\(room\)\)return['"]boss['"]/,
  'specific Boss policy must remain in Core 2.00');
assert.match(core200,/if\(c\.boss===['"]random['"]&&room>2&&Math\.random\(\)\*100<Math\.max\(0,Number\(c\.bossChance\)\|\|13\)\)return['"]boss['"]/,
  'random Boss policy must remain in Core 2.00');

assert.match(core200,/GensDungeonV1\.exploration\.pickWeightedGeneratedRoomKind\(c\.roomWeights,Math\.random\(\)\)/,
  'Core 2.00 must delegate only the non-Boss weighted selection with one explicit random roll');
assert.doesNotMatch(core200,/const w=\{enemy:44,ambush:12,trap:14,chest:14,merchant:8,rest:11,mystery:11,\.\.\.\(c\.roomWeights\|\|\{\}\)\}/,
  'Core 2.00 must retire the inline weighted room-kind implementation');

assert.doesNotMatch(authored,/pickWeightedGeneratedRoomKind/,
  'Authored World Builder must remain outside generated weighting');

console.log(JSON.stringify({
  scenario:'Phase 7 Dungeon generated room-kind weighting owner',
  owner:'GensDungeonV1.exploration.pickWeightedGeneratedRoomKind',
  bossPolicy:'Core 2.00 unchanged',
  randomness:'explicit callsite roll',
  authored:'unchanged'
},null,2));
