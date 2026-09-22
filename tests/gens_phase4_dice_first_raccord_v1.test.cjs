const assert=require('node:assert/strict');
const crypto=require('node:crypto');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const gitBlobSha=src=>crypto.createHash('sha1')
  .update('blob '+Buffer.byteLength(src,'utf8')+'\0')
  .update(src,'utf8')
  .digest('hex');
const sha256=value=>crypto.createHash('sha256').update(value,'utf8').digest('hex');

const index=read('index.html');
const coreSrc=read('assets/gensrpg/core/dice-v1.js');
const workflow=read('.github/workflows/main.yml');
const preview=read('preview.html');
const serviceWorker=read('service-worker.js');
const tactical=read('assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js');
const performance=read('assets/gensrpg/gens-mobile-combat-performance-16781022.js');

const DICE='assets/gensrpg/core/dice-v1.js';
const DICE_TAG='<script src="'+DICE+'"></script>';
const helperStart=index.indexOf('function d100ThresholdFromChance(chance){');

assert.equal((index.match(/assets\/gensrpg\/core\/dice-v1\.js/g)||[]).length,1,
  'RED: source index must load Core Dice exactly once');
assert.ok(index.indexOf(DICE_TAG)>=0,
  'RED: source index must load Core Dice explicitly');
assert.ok(index.indexOf(DICE_TAG)<helperStart,
  'RED: Core Dice must load before the historical D100 seam can consume it');
assert.equal(workflow.includes(DICE),false,
  'Core Dice source load must not be duplicated by the Pages injection list');
assert.equal(preview.includes(DICE),false,
  'Core Dice source load must not be duplicated by preview injection');
assert.equal((serviceWorker.match(/\.\/assets\/gensrpg\/core\/dice-v1\.js/g)||[]).length,1,
  'production-connected Core Dice must be present exactly once in the PWA cache list');

assert.equal(gitBlobSha(coreSrc),'1813b6edb1ac69317d158e8cac6eb5c8ac353855',
  'pure Core Dice implementation must remain byte-for-byte unchanged in this raccord');
assert.equal(gitBlobSha(tactical),'3e7e92eea89fd8e949361162636b4b524ff93eef',
  'Tactical V114.11 dice authority must remain byte-for-byte unchanged');
assert.equal(gitBlobSha(performance),'e8fd9f1049a6597118eb026976bca7548f11b284',
  'mobile dice animation/performance layer must remain byte-for-byte unchanged');

const helperMatch=index.match(/function d100ThresholdFromChance\(chance\)\{[\s\S]*?\n\}/);
assert.ok(helperMatch,'historical d100ThresholdFromChance seam missing');
const helperSrc=helperMatch[0];
assert.match(helperSrc,/const c=Math\.max\(1,Math\.min\(100,Number\(chance\)\|\|1\)\);/,
  'legacy Number/fallback/clamp normalization must stay at the boundary');
assert.doesNotMatch(helperSrc,/101\s*-/,
  'local 101 - chance formula must be removed from the historical helper');
assert.match(helperSrc,/return GensDiceV1\.thresholdFromChance\(c\);/,
  'historical helper must delegate its threshold formula to Core Dice');
assert.doesNotMatch(helperSrc,/(?:typeof\s+GensDiceV1|window\.GensDiceV1|globalThis\.GensDiceV1|MutationObserver|setTimeout|setInterval|try\s*\{|catch\s*\()/,
  'first raccord must not add fallback/wrapper/observer/timer/retry logic');

const coreCtx={console,Math,Number,Object,RangeError,TypeError};
coreCtx.window=coreCtx;
coreCtx.globalThis=coreCtx;
vm.createContext(coreCtx);
vm.runInContext(coreSrc,coreCtx,{filename:'dice-v1.js'});
vm.runInContext(helperSrc+';this.adapter=d100ThresholdFromChance;',coreCtx,{filename:'d100-threshold-adapter.js'});
const adapter=coreCtx.adapter;
const Core=coreCtx.GensDiceV1;
assert.ok(Core&&typeof Core.thresholdFromChance==='function');

const legacy=chance=>{
  const c=Math.max(1,Math.min(100,Number(chance)||1));
  return Math.max(1,Math.min(100,101-c));
};
for(const value of [-500,-1,0,1,5,25,50,50.5,95,99,100,150,500,'50','',null,false,undefined,Number.NaN,Number.POSITIVE_INFINITY,Number.NEGATIVE_INFINITY]){
  assert.equal(adapter(value),legacy(value),
    'legacy/Core boundary parity drifted for '+String(value));
}
for(const value of [undefined,Number.NaN,Number.POSITIVE_INFINITY,Number.NEGATIVE_INFINITY]){
  assert.throws(()=>Core.thresholdFromChance(value),/chance must be finite/,
    'Core Dice must remain strict while the legacy boundary stays tolerant');
}

const callsiteLines=index.split(/\r?\n/)
  .filter(line=>line.includes('d100ThresholdFromChance(')&&!line.includes('function d100ThresholdFromChance('))
  .map(line=>line.trim());
assert.equal(callsiteLines.length,15,'the fifteen historical consumers must remain untouched');
assert.equal(
  sha256(callsiteLines.join('\n')),
  'a73971cc49668b9eba0185965a2b6f03474679c0a6b310b0dc46749b2a2d52f3',
  'one or more of the fifteen d100ThresholdFromChance consumers changed'
);

assert.equal((index.match(/Math\.random\(\)/g)||[]).length,228,
  'global direct RNG inventory drifted after the later d10048 Core raccord');
assert.equal((index.match(/Math\.floor\(Math\.random\(\)\*100\)\+1/g)||[]).length,16,
  'D100 generation pattern Math.floor(Math.random()*100)+1 changed');
assert.equal((index.match(/1\+Math\.floor\(Math\.random\(\)\*100\)/g)||[]).length,5,
  'direct D100 1+Math.floor(Math.random()*100) inventory drifted after d10048 raccord');
assert.equal((index.match(/Math\.random\(\)\*100/g)||[]).length,59,
  'direct D100 RNG multiplication inventory drifted after d10048 raccord');
assert.equal((index.match(/Math\.random\(\)\*6/g)||[]).length,15,
  'D6 RNG inventory changed');

const universalExpected=`function dungeonUniversalTest(statValue,opt={}){
  const r=loadDungeonRpgRules(); if(!r.testsEnabled)return {enabled:false,success:true,total:Number(statValue)||0,roll:0};
  const sides=Math.max(2,Number(opt.die)||r.testDie||20),roll=1+Math.floor(Math.random()*sides),mod=Number(opt.modifier)||0,difficulty=Math.max(1,Number(opt.difficulty)||r.testDefaultDifficulty||10),total=(Number(statValue)||0)+roll+mod;
  return {enabled:true,success:total>=difficulty,total,roll,sides,modifier:mod,difficulty};
}`;
assert.ok(index.includes(universalExpected),
  'dungeonUniversalTest is deferred and must remain byte-for-byte unchanged');

assert.equal((index.match(/GensDiceV1\.thresholdFromChance/g)||[]).length,1,
  'this micro-lot may connect only d100ThresholdFromChance to Core Dice');

const extraRuntimeRefs=[];
for(const base of ['assets/gensrpg','assets/dungeon']){
  const walk=dir=>{
    for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
      const rel=path.posix.join(dir,entry.name);
      if(entry.isDirectory())walk(rel);
      else if(entry.isFile()&&entry.name.endsWith('.js')&&rel!==DICE&&read(rel).includes('GensDiceV1')){
        extraRuntimeRefs.push(rel);
      }
    }
  };
  walk(base);
}
assert.deepEqual(extraRuntimeRefs,[],
  'no second runtime Dice consumer may be connected in the first raccord lot');

console.log(JSON.stringify({
  scenario:'Phase 4 Core Dice first real raccord',
  seam:'d100ThresholdFromChance',
  consumers:callsiteLines.length,
  sourceLoad:true,
  pwaCached:true,
  legacyNonFiniteBoundary:true,
  coreStrict:true,
  rngChanged:false,
  tacticalChanged:false,
  otherDiceRaccords:0
},null,2));
