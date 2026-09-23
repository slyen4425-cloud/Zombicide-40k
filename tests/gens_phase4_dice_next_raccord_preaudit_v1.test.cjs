const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const indexBuf=fs.readFileSync(path.join(root,'index.html'));
const index=indexBuf.toString('utf8');
const coreSrc=fs.readFileSync(path.join(root,'assets','gensrpg','core','dice-v1.js'),'utf8');

const gitBlob=crypto.createHash('sha1').update(Buffer.from(`blob ${indexBuf.length}\0`)).update(indexBuf).digest('hex');
assert.equal(indexBuf.length,8171576,'preaudit must stay aligned to the exact d10048 raccord index');
assert.equal(gitBlob,'12be0fdbaa5c05f7852933b48a3dd5df09da6145','preaudit index blob drifted');

assert.equal((index.match(/\bd100ThresholdFromChance\s*\(/g)||[]).length,16,'first GREEN seam must remain one definition + fifteen callsites');
assert.match(index,/function d100ThresholdFromChance\(chance\)\{\s*const c=Math\.max\(1,Math\.min\(100,Number\(chance\)\|\|1\)\);\s*return GensDiceV1\.thresholdFromChance\(c\);\s*\}/,
  'first GREEN seam delegation drifted');

assert.equal((index.match(/\bd10048\s*\(/g)||[]).length,5,'d10048 must remain one definition + four consumers');
const d10048=index.match(/function d10048\(chance\)\{[\s\S]*?\n\}/)?.[0]||'';
assert.match(d10048,/const c=Math\.max\(5,Math\.min\(95,Math\.round\(Number\(chance\)\|\|50\)\)\);/,'d10048 5..95 rounded tolerant boundary drifted');
assert.match(d10048,/const r=GensDiceV1\.rollChanceHigh\(c,\{min:5,max:95\}\);/,'d10048 Core Dice delegation drifted');
assert.doesNotMatch(d10048,/threshold=101-chance|Math\.random\(\)\*100/,'d10048 must not regain local threshold or D100 generation');
assert.match(d10048,/return \{chance:r\.chance,threshold:r\.threshold,roll:r\.roll,ok:r\.success\}/,'d10048 legacy result projection drifted');

for(const marker of ['dc047StealthPrompt','dc048TrapDetectRoll','dc048TrapActionRoll','dc048TrapTrigger']){
  assert.ok(index.includes(marker),'expected d10048 consumer owner missing: '+marker);
}

assert.equal((index.match(/\bdungeonUniversalTest\s*\(/g)||[]).length,2,'universal test inventory drifted');
assert.match(index,/function dungeonUniversalTest\(statValue,opt=\{\}\)\{[\s\S]*?if\(!r\.testsEnabled\)return \{enabled:false,success:true,total:Number\(statValue\)\|\|0,roll:0\}/,
  'universal test still needs disabled-mode semantics');
assert.match(index,/const sides=Math\.max\(2,Number\(opt\.die\)\|\|r\.testDie\|\|20\),roll=1\+Math\.floor\(Math\.random\(\)\*sides\)/,
  'universal test still owns configurable-sided RNG');

assert.equal((index.match(/\bshowSpecialD6Roll\s*\(/g)||[]).length,3,'shared special D6 must remain one definition + two consumers');
assert.match(index,/function showSpecialD6Roll\([\s\S]*?const roll=Math\.floor\(Math\.random\(\)\*6\)\+1;[\s\S]*?const success=roll>=threshold;/,
  'special D6 remains coupled to presentation and threshold UI');

assert.equal((index.match(/\brollDungeonRpDice073\b/g)||[]).length,2,'RP dice UI identifier inventory drifted');
assert.match(index,/if\(type==="dodge"\)\{[\s\S]*?threshold=Math\.max\(1,101-chance\),roll=1\+Math\.floor\(Math\.random\(\)\*100\),ok=roll>=threshold/,
  'RP dice dodge remains an inline UI-owned D100 seam');

assert.equal((index.match(/\bdc051RollStatChallenge\b/g)||[]).length,2,'challenge D100 identifier inventory drifted');
assert.match(index,/dc051RollStatChallenge=function\(kind,id,chance\)\{[\s\S]*?chance=Math\.max\(5,Math\.min\(95,Number\(chance\)\|\|50\)\);[\s\S]*?threshold=101-chance,roll=1\+Math\.floor\(Math\.random\(\)\*100\),ok=roll>=threshold/,
  'challenge D100 remains inline with distinct non-rounded 5..95 normalization');

assert.match(index,/dc201PuzzleRoll=function\(\)\{[\s\S]*?chance=Math\.max\(5,Math\.min\(95,Number\(puzzleCtx201\?\.chance\)\|\|50\)\);[\s\S]*?roll=1\+Math\.floor\(Math\.random\(\)\*100\);[\s\S]*?ok=roll<=chance/,
  'puzzle D100 low-roll convention drifted');
assert.match(index,/dc211TrapTest=function\(\)\{[\s\S]*?chance=Math\.max\(0,Math\.min\(100,Math\.round\(base\+val\*gain\)\)\);[\s\S]*?roll=1\+Math\.floor\(Math\.random\(\)\*100\),ok=roll<=chance/,
  'trap detection D100 low-roll convention drifted');

assert.equal((index.match(/\bdungeonInitiativeScore\s*\(/g)||[]).length,1,'initiative score should remain definition-only in the current runtime');
assert.match(index,/function dungeonInitiativeScore\(statValue\)\{[\s\S]*?initiativeTurnMode!=="die"[\s\S]*?Math\.random\(\)\*d/,
  'initiative score characterization drifted');

const coreCtx={console,Math,Number,Object,RangeError,TypeError};
coreCtx.window=coreCtx;coreCtx.globalThis=coreCtx;
vm.createContext(coreCtx);
vm.runInContext(coreSrc,coreCtx,{filename:'dice-v1.js'});
const Core=coreCtx.GensDiceV1;
assert.ok(Core,'Core Dice API missing');

const normalize48=chance=>Math.max(5,Math.min(95,Math.round(Number(chance)||50)));
const legacy48=(chance,rng)=>{
  const normalized=normalize48(chance);
  const threshold=101-normalized;
  const roll=1+Math.floor(rng()*100);
  return {chance:normalized,threshold,roll,ok:roll>=threshold};
};
const values=[undefined,NaN,-Infinity,Infinity,-1,0,4.4,5,5.6,49.4,49.5,50,94.6,95,96,'50','',null,false];
const rngValues=[0,0.0099,0.49,0.9499,0.999999];
for(const value of values){
  for(const rv of rngValues){
    const expected=legacy48(value,()=>rv);
    const actual=Core.rollChanceHigh(normalize48(value),{min:5,max:95},()=>rv);
    assert.deepEqual(
      {chance:actual.chance,threshold:actual.threshold,roll:actual.roll,ok:actual.success},
      expected,
      `d10048/Core parity drifted for chance=${String(value)} rng=${rv}`
    );
  }
}

const selection={
  next:'d10048',
  callsites:4,
  boundary:'preserve Math.round(Number(chance)||50), then clamp 5..95 before Core',
  corePrimitive:'GensDiceV1.rollChanceHigh(c,{min:5,max:95})',
  reasons:[
    'single helper already centralizes four consumers',
    'one RNG draw and D100 mapping are exactly compatible with Core roll',
    '5..95 high-roll semantics map exactly after the legacy boundary normalization',
    'consumer result shape can remain unchanged at the historical boundary'
  ],
  deferred:[
    'dungeonUniversalTest: configuration, disabled branch, tolerant sides/difficulty and legacy result shape',
    'showSpecialD6Roll: presentation callback/modal/animation owner rather than a pure seam',
    'dc051RollStatChallenge: inline single consumer and distinct normalization',
    'puzzle/trap detection: low-roll <= chance convention not represented by current rollChanceHigh',
    'dungeonInitiativeScore: definition-only/inert in current runtime'
  ]
};

console.log(JSON.stringify({scenario:'Phase 4 Core Dice next-raccord preaudit',selection,runtimeChanged:true},null,2));
