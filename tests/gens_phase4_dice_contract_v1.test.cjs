const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const file=path.join(root,'assets','gensrpg','core','dice-v1.js');

assert.ok(fs.existsSync(file),'Phase 4 pure Core Dice service must exist');
const src=fs.readFileSync(file,'utf8');

assert.doesNotThrow(()=>new Function(src),'Core Dice source must stay syntactically valid');
assert.doesNotMatch(
  src,
  /\b(?:document|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener)\b/,
  'Core Dice must not own DOM, storage, observers, listeners or timers'
);
assert.doesNotMatch(
  src,
  /(?:Dungeon|Tactical|Survival|Survie|Capture|PvP|Inventory|Equipment|Stats|resolveAttack|damage|armor|critical)/i,
  'Core Dice must stay independent from gameplay/module owners'
);

const ctx={console,Math,Number,Object,RangeError,TypeError};
ctx.window=ctx;
ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(src,ctx,{filename:'dice-v1.js'});

const api=ctx.GensDiceV1;
assert.ok(api,'Core Dice API must exist when explicitly loaded');
assert.equal(api.VERSION,'1.0.0');

const zero=()=>0;
const nearOne=()=>0.999999999999;

for(const sides of [6,20,100]){
  assert.equal(api.roll(sides,zero),1,'roll must include lower face for D'+sides);
  assert.equal(api.roll(sides,nearOne),sides,'roll must include upper face for D'+sides);
}
assert.throws(()=>api.roll(1,zero),/sides/i,'dice must have at least two sides');
assert.throws(()=>api.roll(6,()=>-0.1),/rng/i,'negative RNG output must fail explicitly');
assert.throws(()=>api.roll(6,()=>1),/rng/i,'RNG output >= 1 must fail explicitly');
assert.throws(()=>api.roll(6,42),/rng/i,'RNG adapter must be a function');

assert.equal(api.thresholdFromChance(50),51,'historical high-roll D100 threshold');
assert.equal(api.thresholdFromChance(1),100);
assert.equal(api.thresholdFromChance(100),1);
assert.equal(api.thresholdFromChance(-999),100,'default chance lower clamp must remain 1');
assert.equal(api.thresholdFromChance(999),1,'default chance upper clamp must remain 100');

assert.equal(
  api.thresholdFromChance(0,{min:5,max:95}),
  96,
  'caller-supplied 5..95 lower clamp must be preserved without hardwiring it globally'
);
assert.equal(api.thresholdFromChance(100,{min:5,max:95}),6);
assert.equal(api.thresholdFromChance(100,{min:1,max:99}),2);
assert.equal(api.thresholdFromChance(0,{min:1,max:99}),100);
assert.throws(()=>api.thresholdFromChance(50,{min:95,max:5}),/bounds/i);
assert.throws(()=>api.thresholdFromChance(Number.NaN),/chance/i);

const hit=api.rollChanceHigh(30,{min:1,max:100},()=>0.70);
assert.deepEqual(
  JSON.parse(JSON.stringify(hit)),
  {roll:71,chance:30,threshold:71,success:true},
  'chance result must be explicit and explainable'
);
const miss=api.rollChanceHigh(30,{min:1,max:100},()=>0.69);
assert.deepEqual(JSON.parse(JSON.stringify(miss)),{roll:70,chance:30,threshold:71,success:false});

const capped=api.rollChanceHigh(100,{min:5,max:95},zero);
assert.deepEqual(JSON.parse(JSON.stringify(capped)),{roll:1,chance:95,threshold:6,success:false});

const check=api.rollCheck({sides:20,modifier:5,difficulty:15,rng:()=>0.45});
assert.deepEqual(
  JSON.parse(JSON.stringify(check)),
  {roll:10,modifier:5,total:15,difficulty:15,success:true},
  'generic check must expose roll + modifier + total + difficulty'
);
const failedCheck=api.rollCheck({sides:6,modifier:-1,difficulty:6,rng:()=>0.5});
assert.deepEqual(JSON.parse(JSON.stringify(failedCheck)),{roll:4,modifier:-1,total:3,difficulty:6,success:false});
assert.throws(()=>api.rollCheck({sides:20,modifier:0,difficulty:Number.NaN,rng:zero}),/difficulty/i);

assert.equal(Object.isFrozen(api),true,'public Core Dice API must be immutable');

console.log(JSON.stringify({
  scenario:'Phase 4 pure Core Dice contract',
  api:'GensDiceV1',
  dice:['D6','D20','D100'],
  chanceBounds:['1..100','1..99','5..95'],
  injectedRng:true,
  explainableResults:true,
  runtimeRaccord:false
},null,2));
