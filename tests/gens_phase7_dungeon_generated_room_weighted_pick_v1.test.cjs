'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const contract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));
const index=read('index.html');
const authored=read('assets/dungeon/dungeon-authored-runtime-167839.js');

const sandbox={};
sandbox.window=sandbox;
sandbox.globalThis=sandbox;
vm.createContext(sandbox);
vm.runInContext(entry,sandbox,{filename:'assets/gensrpg/dungeon/entry-v1.js'});

assert.equal(typeof sandbox.GensDungeonV1?.exploration?.pickGeneratedRoomKind,'function',
  'Phase 7 requires the pure generated room weighted picker in the Dungeon public entry');

const pick=sandbox.GensDungeonV1.exploration.pickGeneratedRoomKind;
const plain=value=>JSON.parse(JSON.stringify(value));

const weightsA={enemy:1,ambush:0,trap:0,chest:1,merchant:0,rest:0,mystery:0};
const beforeA=JSON.stringify(weightsA);
assert.equal(pick(weightsA,0.50),'enemy',
  'weighted boundary must preserve the historical <= 0 bucket selection');
assert.equal(JSON.stringify(weightsA),beforeA,
  'weighted room picker must not mutate its input weights');

assert.equal(pick({enemy:0,ambush:0,trap:0,chest:1,merchant:0,rest:0,mystery:0},0.25),'chest',
  'single positive weighted room must be selected');

assert.equal(pick({enemy:-7,ambush:0,trap:0,chest:1,merchant:0,rest:0,mystery:'bad'},0.40),'chest',
  'negative and invalid weights must normalize to zero');

assert.equal(pick({enemy:0,ambush:0,trap:0,chest:0,merchant:0,rest:0,mystery:0},0.80),'enemy',
  'all-zero weights must preserve the historical enemy fallback');

assert.equal(
  plain(pick({enemy:1},0.10)),
  'enemy',
  'minimal valid weight map must remain deterministic'
);

assert.doesNotMatch(entry,/Math\.random|document|localStorage|sessionStorage|setTimeout|setInterval|MutationObserver|addEventListener/,
  'weighted picker must stay pure and receive RNG explicitly');
assert.doesNotMatch(entry,/Tactical|GensRpgTactical|Capture|GensSurvival|PvP/i,
  'weighted picker must not consume another module runtime');

function block(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing '+id);
  return m[1];
}

const core=block('dungeonCore200Rebuild');
const start=core.indexOf('function chooseKind(room){');
const end=core.indexOf('\nfunction selectedChallenges()',start);
assert.ok(start>=0&&end>start,'Core 2.00 chooseKind owner must remain locatable');
const chooseSrc=core.slice(start,end);

assert.match(chooseSrc,/if\(c\.boss!=='none'&&room===Number\(c\.rooms\)\)return'boss'/,
  'final-room Boss rule must remain Core 2.00-owned');
assert.match(chooseSrc,/if\(c\.boss==='everyN'/,
  'everyN Boss rule must remain Core 2.00-owned');
assert.match(chooseSrc,/if\(c\.boss==='specific'/,
  'specific Boss rule must remain Core 2.00-owned');
assert.match(chooseSrc,/if\(c\.boss==='random'&&room>2&&Math\.random\(\)\*100</,
  'random Boss rule and its RNG must remain Core 2.00-owned');

assert.match(
  chooseSrc,
  /const w=\{enemy:44,ambush:12,trap:14,chest:14,merchant:8,rest:11,mystery:11,\.\.\.\(c\.roomWeights\|\|\{\}\)\}/,
  'Core 2.00 must retain default gameplay weights and roomWeights merge'
);

assert.match(
  chooseSrc,
  /GensDungeonV1\.exploration\.pickGeneratedRoomKind\(w,Math\.random\(\)\)/,
  'Core 2.00 must delegate only the weighted selection with an explicit historical RNG roll'
);

assert.equal((chooseSrc.match(/Math\.random\(\)/g)||[]).length,2,
  'chooseKind must preserve exactly one random-Boss roll and one weighted-selection roll');
assert.doesNotMatch(chooseSrc,/Object\.entries\(w\)|entries\.reduce/,
  'Core 2.00 must no longer own the weighted bucket algorithm directly');

assert.match(index,/const kind=chooseKind\(x\.room\),made=createRoom\(x\.room,kind\);/,
  'generated room creation callsite must remain unchanged');
assert.doesNotMatch(authored,/pickGeneratedRoomKind/,
  'authored world must remain outside the generated weighted picker lot');

assert.equal(contract.status,'partial-runtime-loaded');
assert.equal(contract.activatedPhase,7);
assert.equal(contract.publicRuntimeApi,'GensDungeonV1');
assert.ok(
  contract.invariants.some(x=>/weighted room/i.test(String(x))),
  'Dungeon contract must record the pure generated weighted-room slice'
);

console.log(JSON.stringify({
  scenario:'Phase 7 Dungeon generated room weighted picker',
  owner:'GensDungeonV1.exploration.pickGeneratedRoomKind',
  caller:'dungeonCore200Rebuild.chooseKind',
  bossRules:'remain Core 2.00-owned',
  rng:'explicit roll passed into pure picker',
  createRoom:'unchanged',
  authored:'unchanged'
},null,2));
