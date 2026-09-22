const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const corePath=path.join(root,'assets','gensrpg','core','dice-v1.js');
const tacticalPath=path.join(root,'assets','gensrpg','gens-rpg-tactical-visual-dice-16781142.js');
const perfPath=path.join(root,'assets','gensrpg','gens-mobile-combat-performance-16781022.js');
const coreSrc=fs.readFileSync(corePath,'utf8');

function gitBlob(file){
  const buf=fs.readFileSync(file);
  return crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');
}
function sha256(value){return crypto.createHash('sha256').update(value).digest('hex');}
function extractFunctionSource(source,name){
  const markers=['window.'+name+'=function','function '+name+'('];
  let pos=-1;
  for(const marker of markers){pos=source.indexOf(marker);if(pos>=0)break;}
  assert.ok(pos>=0,'function owner missing: '+name);
  const brace=source.indexOf('{',pos);
  assert.ok(brace>=0,'function body missing: '+name);
  let depth=0,quote=null,escape=false,lineComment=false,blockComment=false;
  for(let i=brace;i<source.length;i++){
    const ch=source[i],next=source[i+1]||'';
    if(lineComment){if(ch==='\n')lineComment=false;continue;}
    if(blockComment){if(ch==='*'&&next==='/'){blockComment=false;i++;}continue;}
    if(quote){
      if(escape){escape=false;continue;}
      if(ch==='\\'){escape=true;continue;}
      if(ch===quote)quote=null;
      continue;
    }
    if(ch==='/'&&next==='/'){lineComment=true;i++;continue;}
    if(ch==='/'&&next==='*'){blockComment=true;i++;continue;}
    if(ch==="'"||ch==='"'||ch===String.fromCharCode(96)){quote=ch;continue;}
    if(ch==='{')depth++;
    if(ch==='}'){
      depth--;
      if(depth===0){
        let end=i+1;
        if(source[end]===';')end++;
        return source.slice(pos,end);
      }
    }
  }
  assert.fail('unterminated function owner: '+name);
}

assert.equal(gitBlob(corePath),'1813b6edb1ac69317d158e8cac6eb5c8ac353855','Core Dice service must stay byte-identical');
assert.equal(gitBlob(tacticalPath),'3e7e92eea89fd8e949361162636b4b524ff93eef','Tactical dice owner must stay byte-identical');
assert.equal(gitBlob(perfPath),'e8fd9f1049a6597118eb026976bca7548f11b284','mobile combat performance must stay byte-identical');

assert.match(index,/function d100ThresholdFromChance\(chance\)\{\s*const c=Math\.max\(1,Math\.min\(100,Number\(chance\)\|\|1\)\);\s*return GensDiceV1\.thresholdFromChance\(c\);\s*\}/,
  'first GREEN Core Dice raccord must remain unchanged');
assert.equal((index.match(/\bd100ThresholdFromChance\s*\(/g)||[]).length,16,
  'first GREEN seam must remain one definition + fifteen callsites');

assert.equal((index.match(/\bd10048\s*\(/g)||[]).length,5,
  'd10048 seam must remain one definition + four consumers');

const d10048=extractFunctionSource(index,'d10048');
assert.match(d10048,/const c=Math\.max\(5,Math\.min\(95,Math\.round\(Number\(chance\)\|\|50\)\)\);/,
  'd10048 must preserve legacy round/coercion/clamp boundary');
assert.doesNotMatch(d10048,/101\s*-\s*(?:chance|c)/,
  'd10048 must not retain a local threshold formula');
assert.doesNotMatch(d10048,/Math\.random\s*\(/,
  'd10048 must not retain a local D100 generator');
assert.match(d10048,/GensDiceV1\.rollChanceHigh\(c,\{min:5,max:95\}\)/,
  'd10048 must delegate the D100 roll to Core Dice');
assert.match(d10048,/return \{chance:r\.chance,threshold:r\.threshold,roll:r\.roll,ok:r\.success\};/,
  'd10048 must preserve the exact legacy result surface');

const consumerHashes={
  dc047StealthPrompt:'7bcfc26a213160f77b5cd3c04b4e305aee97f329c2cff664bca6d682b83f9fef',
  dc048TrapDetectRoll:'3ce7ba4b1a273bd27fd78d65b78389b754066e92cfb5d51fe404a195a9257b70',
  dc048TrapActionRoll:'801cda9073d35a275d9d9134ce3c612206e4cc44cae7e1f518151b04bbafead0',
  dc048TrapTrigger:'b1c9c8ea7c7a0e27636fa59956f5913234322d7a402fdc486372ee0391365dd6'
};
for(const [name,expected] of Object.entries(consumerHashes)){
  assert.equal(sha256(extractFunctionSource(index,name)),expected,name+' consumer must remain byte-identical');
}

assert.match(index,/function dungeonUniversalTest\(statValue,opt=\{\}\)\{[\s\S]*?Math\.random\(\)\*sides/,
  'dungeonUniversalTest must remain deferred');
assert.match(index,/function showSpecialD6Roll\([\s\S]*?Math\.random\(\)\*6/,
  'showSpecialD6Roll must remain deferred');
assert.match(index,/dc051RollStatChallenge=function\(kind,id,chance\)\{[\s\S]*?threshold=101-chance,roll=1\+Math\.floor\(Math\.random\(\)\*100\)/,
  'dc051RollStatChallenge must remain deferred');
assert.match(index,/dc201PuzzleRoll=function\(\)\{[\s\S]*?ok=roll<=chance/,
  'puzzle low-roll convention must remain deferred');
assert.match(index,/dc211TrapTest=function\(\)\{[\s\S]*?ok=roll<=chance/,
  'trap low-roll convention must remain deferred');

const math=Object.create(Math);
let draws=0;
let rngValue=0;
math.random=()=>{draws++;return rngValue;};
const ctx={console,Math:math,Number,Object,RangeError,TypeError};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(coreSrc,ctx,{filename:'dice-v1.js'});
vm.runInContext(d10048+'\nthis.__d10048=d10048;',ctx,{filename:'d10048.js'});
assert.equal(typeof ctx.__d10048,'function','d10048 runtime seam missing');

const normalize=chance=>Math.max(5,Math.min(95,Math.round(Number(chance)||50)));
const cases=[
  undefined,Number.NaN,Number.NEGATIVE_INFINITY,Number.POSITIVE_INFINITY,
  -1,0,4.4,5,5.6,49.4,49.5,50,94.6,95,96,'50','',null,false
];
for(const chance of cases){
  for(const rv of [0,0.0099,0.49,0.9499,0.999999]){
    rngValue=rv;draws=0;
    const expectedChance=normalize(chance);
    const expectedRoll=1+Math.floor(rv*100);
    const expectedThreshold=101-expectedChance;
    const actual=ctx.__d10048(chance);
    assert.equal(draws,1,'d10048 must consume exactly one RNG draw');
    assert.deepEqual(
      JSON.parse(JSON.stringify(actual)),
      {chance:expectedChance,threshold:expectedThreshold,roll:expectedRoll,ok:expectedRoll>=expectedThreshold},
      'd10048/Core parity drifted for chance='+String(chance)+' rng='+rv
    );
  }
}

console.log(JSON.stringify({
  scenario:'Phase 4 Core Dice d10048 raccord',
  seam:{definition:1,consumers:4,bounds:'5..95',legacyResult:'{chance,threshold,roll,ok}'},
  delegation:'GensDiceV1.rollChanceHigh',
  rngDrawsPerCall:1,
  protectedConsumers:Object.keys(consumerHashes),
  otherDiceSeams:'deferred',
  runtimeChanged:true
},null,2));
