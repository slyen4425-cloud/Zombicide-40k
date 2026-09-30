'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/dungeon/entry-v1.js');
const core317Source=read('assets/dungeon/dungeon-core-317.js');

assert.equal(
  (core317Source.match(/GensDungeonV1\.movement\.resolveAuthoredActiveHero\(/g)||[]).length,
  0,
  'Core 317 must not consume the canonical active-hero helper in this characterization-only lot'
);
assert.match(
  core317Source,
  /function activeHeroId\(x\)\{[\s\S]*?return list\[i\]\|\|"";[\s\S]*?\}/,
  'Core 317 historical activeHeroId implementation must still be present'
);

const instrumented=core317Source.replace(
  'ROOT.DungeonCore317={',
  'ROOT.__testCore317ActiveHeroId=activeHeroId;\nROOT.DungeonCore317={'
);
assert.notEqual(instrumented,core317Source,'test instrumentation anchor must be applied');

const ctx={console,JSON,Math,Date};
ctx.window=ctx;
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(entry,ctx,{filename:'assets/gensrpg/dungeon/entry-v1.js'});
vm.runInContext(instrumented,ctx,{filename:'assets/dungeon/dungeon-core-317.js'});

const core317=ctx.__testCore317ActiveHeroId;
const canonical=ctx.GensDungeonV1?.movement?.resolveAuthoredActiveHero;
assert.equal(typeof core317,'function','the real Core 317 private selector must be exposed only inside the test VM');
assert.equal(typeof canonical,'function','the canonical Dungeon active-hero helper must exist');

const parityCases=[
  {participants:['a','b'],index:undefined},
  {participants:['a','b'],index:NaN},
  {participants:['a','b'],index:'1'},
  {participants:['a','b'],index:-4},
  {participants:['a','b'],index:99},
  {participants:['a','b'],index:1.5},
  {participants:['a','b','c'],index:1.5},
  {participants:[],index:0},
  {participants:'not-an-array',index:0},
  {participants:[0,'b'],index:0},
  {participants:['hero'],index:0}
];

for(const test of parityCases){
  assert.equal(
    core317(test),
    canonical(test.participants,test.index),
    'Core 317 and canonical helper must remain equal for the historical string/falsy selection cases'
  );
}

const numeric={participants:[42],index:0};
assert.equal(core317(numeric),42,'Core 317 must preserve the raw numeric participant value');
assert.equal(typeof core317(numeric),'number');
assert.equal(canonical(numeric.participants,numeric.index),'42','canonical helper stringifies a truthy numeric participant');
assert.equal(typeof canonical(numeric.participants,numeric.index),'string');
assert.notStrictEqual(
  core317(numeric),
  canonical(numeric.participants,numeric.index),
  'numeric participant confirms a semantic divergence, so migration is not a behavior-preserving refactor'
);

const objectHero={id:'hero-object'};
const objectCase={participants:[objectHero],index:0};
assert.strictEqual(core317(objectCase),objectHero,'Core 317 must preserve the raw object participant reference');
assert.equal(canonical(objectCase.participants,objectCase.index),'[object Object]');
assert.notStrictEqual(core317(objectCase),canonical(objectCase.participants,objectCase.index));

const boolCase={participants:[true],index:0};
assert.strictEqual(core317(boolCase),true);
assert.strictEqual(canonical(boolCase.participants,boolCase.index),'true');
assert.notStrictEqual(core317(boolCase),canonical(boolCase.participants,boolCase.index));

console.log(JSON.stringify({
  scenario:'Phase 7 Core 317 active hero divergence characterization',
  core317:'returns the selected truthy participant value without String coercion',
  canonical:'returns String(selectedParticipant || "")',
  parity:'string/falsy/index-selection cases',
  divergence:'truthy non-string participant values',
  decision:'no migration RED in this lot; behavioral harmonization requires a dedicated functional decision',
  deferred:'DungeonSourceRenderStability167877 inline active selection divergence'
},null,2));
