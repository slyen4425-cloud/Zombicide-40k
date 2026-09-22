const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const rel='assets/gensrpg/core/progression-v1.js';
const file=path.join(root,rel);

assert.equal(fs.existsSync(file),true,'Phase 4 pure Core Progression service must exist');

const source=fs.readFileSync(file,'utf8');

for(const forbidden of [
  /\bdocument\b/,
  /\blocalStorage\b/,
  /\bsessionStorage\b/,
  /\bindexedDB\b/,
  /\bMutationObserver\b/,
  /\bsetTimeout\s*\(/,
  /\bsetInterval\s*\(/,
  /\baddEventListener\s*\(/,
  /\bMath\.random\s*\(/,
  /\bloadGameProfiles\b/,
  /\bactiveGameProfileId\b/,
  /\bloadDungeonRpgRules\b/,
  /\bchangeXP\b/,
  /\bdungeonSyncProgressionForState\b/,
  /\bdungeonHandleLevelUp071\b/
]){
  assert.doesNotMatch(source,forbidden,'pure Core Progression must not own runtime/UI/storage/global-profile concerns: '+forbidden);
}

const context={console};
context.window=context;
context.globalThis=context;
vm.createContext(context);
vm.runInContext(source,context,{filename:rel});

const P=context.GensProgressionV1;
assert.ok(P,'GensProgressionV1 global API missing');
assert.equal(P.VERSION,'1.0.0');
assert.equal(typeof P.levelFromXp,'function');

const level=(xp,config)=>P.levelFromXp(xp,config);

// Historical input normalization: Math.max(0, Number(xp) || 0).
assert.equal(level(undefined,{}),1);
assert.equal(level(NaN,{}),1);
assert.equal(level('',{}),1);
assert.equal(level(null,{}),1);
assert.equal(level(false,{}),1);
assert.equal(level(-50,{}),1);
assert.equal(level('10',{}),2);

// Historical profile defaults remain compatibility fallbacks only.
assert.equal(level(0,{}),1);
assert.equal(level(9,{}),1);
assert.equal(level(10,{}),2);
assert.equal(level(99,{}),10);

// Explicit linear configuration must beat compatibility defaults.
assert.equal(level(0,{xpCurveMode:'linear',xpPerLevel:7,maxLevel:3}),1);
assert.equal(level(6,{xpCurveMode:'linear',xpPerLevel:7,maxLevel:3}),1);
assert.equal(level(7,{xpCurveMode:'linear',xpPerLevel:7,maxLevel:3}),2);
assert.equal(level(14,{xpCurveMode:'linear',xpPerLevel:7,maxLevel:3}),3);
assert.equal(level(999,{xpCurveMode:'linear',xpPerLevel:7,maxLevel:3}),3);
assert.equal(level(999,{xpCurveMode:'linear',xpPerLevel:1,maxLevel:1}),1);

// Explicit custom thresholds must reproduce the current Core 0.44 semantics.
const custom={
  xpCurveMode:'custom',
  xpPerLevel:10,
  maxLevel:5,
  xpThresholds:{2:4,3:11,4:30,5:70}
};
assert.equal(level(0,custom),1);
assert.equal(level(3,custom),1);
assert.equal(level(4,custom),2);
assert.equal(level(10,custom),2);
assert.equal(level(11,custom),3);
assert.equal(level(29,custom),3);
assert.equal(level(30,custom),4);
assert.equal(level(69,custom),4);
assert.equal(level(70,custom),5);
assert.equal(level(999,custom),5);

// Missing/invalid custom thresholds fall back exactly to (level-1) * xpPerLevel.
const sparse={
  xpCurveMode:'custom',
  xpPerLevel:10,
  maxLevel:5,
  xpThresholds:{2:5,4:40,5:'bad'}
};
assert.equal(level(4,sparse),1);
assert.equal(level(5,sparse),2);
assert.equal(level(19,sparse),2);
assert.equal(level(20,sparse),3,'missing level 3 threshold must fall back to 20');
assert.equal(level(39,sparse),3);
assert.equal(level(40,sparse),4);
assert.equal(level(49,sparse),4);
assert.equal(level(50,sparse),5,'invalid level 5 threshold must fall back to 50');

// Non-custom mode is legacy linear.
assert.equal(level(20,{xpCurveMode:'anything',xpPerLevel:6,maxLevel:9}),4);

// Service/API should be immutable like other Core primitives.
assert.equal(Object.isFrozen(P),true);

console.log(JSON.stringify({
  scenario:'Phase 4 pure Core Progression XP->level contract',
  api:['levelFromXp'],
  runtimeConnected:false,
  configWinsOverFallback:true,
  linear:true,
  custom:true,
  sparseCustomFallback:true
},null,2));
