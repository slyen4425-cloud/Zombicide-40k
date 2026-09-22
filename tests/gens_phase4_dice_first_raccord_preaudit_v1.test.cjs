const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const coreSrc=fs.readFileSync(path.join(root,'assets','gensrpg','core','dice-v1.js'),'utf8');

const thresholdOccurrences=(index.match(/\bd100ThresholdFromChance\s*\(/g)||[]).length;
const universalOccurrences=(index.match(/\bdungeonUniversalTest\s*\(/g)||[]).length;
assert.equal(thresholdOccurrences,16,'D100 threshold seam must remain one definition + fifteen callsites');
assert.equal(universalOccurrences,2,'universal test must remain one definition + one callsite');

const thresholdMatch=index.match(/function d100ThresholdFromChance\(chance\)\{\s*const c=Math\.max\(1,Math\.min\(100,Number\(chance\)\|\|1\)\);\s*return Math\.max\(1,Math\.min\(100,101-c\)\);\s*\}/);
assert.ok(thresholdMatch,'historical D100 threshold helper contract drifted');

const legacyCtx={Math,Number};
vm.createContext(legacyCtx);
vm.runInContext(thresholdMatch[0]+';this.legacyThreshold=d100ThresholdFromChance;',legacyCtx);
const legacy=legacyCtx.legacyThreshold;

const coreCtx={console,Math,Number,Object,RangeError,TypeError};
coreCtx.window=coreCtx;coreCtx.globalThis=coreCtx;
vm.createContext(coreCtx);
vm.runInContext(coreSrc,coreCtx,{filename:'dice-v1.js'});
const Core=coreCtx.GensDiceV1;
assert.ok(Core,'Core Dice API missing');

for(const value of [-500,-1,0,1,5,25,50,50.5,95,99,100,150,500,'50','',null,false]){
  assert.equal(
    Core.thresholdFromChance(value),
    legacy(value),
    'finite/coercible threshold parity drifted for '+String(value)
  );
}

const tolerantLegacy=[
  {value:undefined,expected:100,label:'undefined'},
  {value:Number.NaN,expected:100,label:'NaN'},
  {value:Number.POSITIVE_INFINITY,expected:1,label:'+Infinity'},
  {value:Number.NEGATIVE_INFINITY,expected:100,label:'-Infinity'}
];
for(const row of tolerantLegacy){
  assert.equal(legacy(row.value),row.expected,'legacy tolerant boundary drifted: '+row.label);
  assert.throws(
    ()=>Core.thresholdFromChance(row.value),
    /chance must be finite/,
    'Core must stay strict for non-finite input: '+row.label
  );
}

assert.match(index,/function dungeonUniversalTest\(statValue,opt=\{\}\)\{[\s\S]*?loadDungeonRpgRules\(\)/,
  'universal test must still read configurable RPG rules');
assert.match(index,/dungeonUniversalTest\(statValue,opt=\{\}\)\{[\s\S]*?if\(!r\.testsEnabled\)return \{enabled:false,success:true,total:Number\(statValue\)\|\|0,roll:0\}/,
  'universal test disabled semantics drifted');
assert.match(index,/const sides=Math\.max\(2,Number\(opt\.die\)\|\|r\.testDie\|\|20\),roll=1\+Math\.floor\(Math\.random\(\)\*sides\)/,
  'universal test still owns tolerant configurable-sided random roll');
assert.match(index,/difficulty=Math\.max\(1,Number\(opt\.difficulty\)\|\|r\.testDefaultDifficulty\|\|10\)/,
  'universal test difficulty normalization drifted');
assert.match(index,/return \{enabled:true,success:total>=difficulty,total,roll,sides,modifier:mod,difficulty\}/,
  'universal test result shape drifted');

assert.equal(index.includes('assets/gensrpg/core/dice-v1.js'),false,
  'Core Dice must remain inert during first-raccord preaudit');

const selection={
  first:'d100ThresholdFromChance',
  reason:'single central seam; finite/coercible parity already exact; non-finite tolerance can stay in a tiny boundary adapter',
  deferred:'dungeonUniversalTest',
  deferredReasons:[
    'testsEnabled branch',
    'runtime rule lookup',
    'tolerant configurable side count',
    'legacy coercions',
    'legacy result shape'
  ]
};

console.log(JSON.stringify({
  scenario:'Phase 4 Core Dice first-raccord preaudit',
  threshold:{callsites:thresholdOccurrences-1,finiteParity:true,nonFiniteBoundaryAdapterRequired:true},
  universalTest:{callsites:universalOccurrences-1,directCoreParity:false},
  selection,
  runtimeChanged:false
},null,2));
