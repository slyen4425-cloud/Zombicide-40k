const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const corePath=path.join(root,'assets','gensrpg','core','stats-armor-contract-v1.js');
const coreSrc=fs.readFileSync(corePath,'utf8');

function extractFunction(name){
  const token='function '+name+'(';
  const start=index.indexOf(token);
  assert.ok(start>=0,'missing inline owner '+name);
  const brace=index.indexOf('{',start);
  let depth=0,quote=null,escaped=false,line=false,block=false;
  for(let i=brace;i<index.length;i++){
    const c=index[i],n=index[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++}continue}
    if(quote){if(escaped)escaped=false;else if(c==='\\')escaped=true;else if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==='"'||c==="'"||c==='\x60'){quote=c;continue}
    if(c==='{')depth++;
    if(c==='}'&&--depth===0)return index.slice(start,i+1);
  }
  throw new Error('unterminated '+name);
}

function dungeonOracle(rules){
  const ctx={Math,Number,loadDungeonRpgRules:()=>rules};
  ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(extractFunction('dungeonArmorReductionFromScore'),ctx,{filename:'index-armor-owner.js'});
  return score=>ctx.dungeonArmorReductionFromScore(score);
}

const coreCtx={console,Math,Number,Object,String,Array,JSON};
coreCtx.globalThis=coreCtx;
coreCtx.window=coreCtx;
vm.createContext(coreCtx);
vm.runInContext(coreSrc,coreCtx,{filename:'stats-armor-contract-v1.js'});
const Core=coreCtx.GensStatsArmorContractV1;
assert.ok(Core,'S9 Core Armor API missing');
for(const fn of ['normalizeScore','dungeonReductionFromScore','tacticalReductionFromScore','floorPolicy']){
  assert.equal(typeof Core[fn],'function','S9 Core Armor API missing '+fn);
}

for(const [input,expected] of [[0,0],[4,4],['7',7],[-2,0],[null,0],[undefined,0],['bad',0]]){
  assert.equal(Core.normalizeScore(input),expected,'normalizeScore '+String(input));
}

const cases=[
  {rules:{armorReductionStep:2,armorReductionGain:1},scores:[0,1,2,3,4,5,6]},
  {rules:{armorReductionStep:3,armorReductionGain:2},scores:[0,1,2,3,4,6,9]},
  {rules:{armorReductionStep:1,armorReductionGain:0},scores:[0,1,5]}
];
for(const row of cases){
  const oracle=dungeonOracle(row.rules);
  for(const score of row.scores){
    assert.equal(
      Core.dungeonReductionFromScore(score,row.rules),
      oracle(score),
      'Dungeon reduction parity score '+score+' rules '+JSON.stringify(row.rules)
    );
  }
}

for(const score of [0,1,2,4,7]){
  assert.equal(Core.tacticalReductionFromScore(score),score,'Tactical must preserve direct score semantics');
  assert.equal(Core.tacticalReductionFromScore(score,{ignoreArmor:true}),0,'ignoreArmor must explicitly zero Tactical reduction');
}
assert.equal(Core.tacticalReductionFromScore(-4),0);
assert.equal(Core.tacticalReductionFromScore('bad'),0);

assert.deepEqual(
  JSON.parse(JSON.stringify(Core.floorPolicy({}))),
  {zeroBlockChance:75,minPhysicalDamage:1},
  'default floor policy must expose current Dungeon defaults'
);
assert.deepEqual(
  JSON.parse(JSON.stringify(Core.floorPolicy({armorZeroBlockChance:150,minPhysicalDamage:-4}))),
  {zeroBlockChance:100,minPhysicalDamage:0},
  'floor policy must normalize current configured bounds without applying damage'
);
assert.deepEqual(
  JSON.parse(JSON.stringify(Core.floorPolicy({armorZeroBlockChance:40,minPhysicalDamage:3}))),
  {zeroBlockChance:40,minPhysicalDamage:3}
);

assert.notEqual(
  Core.dungeonReductionFromScore(4,{armorReductionStep:2,armorReductionGain:1}),
  Core.tacticalReductionFromScore(4),
  'S9 must preserve the visible semantic divergence instead of choosing a hidden winner'
);

for(const forbidden of [
  'document','localStorage','MutationObserver','setTimeout','setInterval',
  'CHARS','state','currentRpgProfile','getActiveGameProfile',
  'Math.random','resolveArmorFloor','target.hp','wounds',
  'attackPreview','resolveAttack','damagePerHit','hitChance','D100',
  'dungeonEquipmentBonus','dungeonSkillEffectTotal','dungeonChallengeDebuffTotal067'
]){
  assert.equal(coreSrc.includes(forbidden),false,'S9 Core Armor contract must remain pure/inert: '+forbidden);
}

assert.equal(Object.isFrozen(Core.floorPolicy({})),true,'floor policy projection must be immutable');

console.log(JSON.stringify({
  scenario:'Phase 4 Core Stats S9 armor contract parity',
  explicitArmorScore:true,
  dungeonReductionParity:true,
  tacticalDirectScoreParity:true,
  semanticDivergencePreserved:true,
  floorPolicyDataOnly:true,
  pure:true,
  runtimeConnected:false
},null,2));
