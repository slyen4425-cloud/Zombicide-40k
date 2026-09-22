const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const serviceRel='assets/gensrpg/core/progression-xp-v1.js';
const servicePath=path.join(root,serviceRel);

assert.ok(fs.existsSync(servicePath),'Phase 4 pure Core Progression XP service must exist');

const src=read(serviceRel);
assert.doesNotThrow(()=>new Function(src),'Core Progression XP source must stay syntactically valid');
assert.doesNotMatch(
  src,
  /\b(?:document|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener|Math\.random|loadGameProfiles|loadDungeonRpgRules|activeGameProfileId)\b/,
  'Core Progression XP must not own DOM, storage, timers, RNG or active-profile lookup'
);
assert.doesNotMatch(
  src,
  /(?:Tactical|Survival|Survie|Capture|PvP|Inventory|Equipment|reward|loot|victory|popup|save\s*\(|render\s*\()/i,
  'Core Progression XP must stay independent from module actions, rewards and UI'
);

const ctx={console,Math,Number,Object,Infinity,NaN};
ctx.window=ctx;
vm.createContext(ctx);
vm.runInContext(src,ctx,{filename:'progression-xp-v1.js'});
const api=ctx.GensProgressionXpV1;
assert.ok(api,'Core Progression XP API must exist when explicitly loaded');
assert.equal(api.VERSION,'1.0.0');
assert.equal(typeof api.levelFromXp,'function');
assert.equal(Object.isFrozen(api),true,'Core Progression XP public API must be immutable');

const cjs=require(path.join('..',serviceRel));
assert.equal(cjs.VERSION,'1.0.0','Core Progression XP must stay CommonJS-testable');
assert.equal(typeof cjs.levelFromXp,'function');

const indexBuf=fs.readFileSync(path.join(root,'index.html'));
const index=indexBuf.toString('utf8');
const gitBlob=crypto.createHash('sha1')
  .update(Buffer.from('blob '+indexBuf.length+'\0'))
  .update(indexBuf)
  .digest('hex');
assert.equal(indexBuf.length,8174648,'Progression contract must stay on the preaudit GREEN index');
assert.equal(gitBlob,'2d7677950f04e9a3290ff0062e157a126123891d','Progression contract index blob drifted');

function scriptBody(id){
  const re=new RegExp('<script[^>]*id=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i');
  const m=index.match(re);
  assert.ok(m,'missing inline script '+id);
  return m[1];
}
const core044=scriptBody('dungeonCore044HeroProgression');

function legacyLevel(profile,xp){
  const legacy={
    console,
    Math,
    Number,
    Object,
    document:{getElementById:()=>null,querySelector:()=>null},
    loadGameProfiles:()=>[{id:'profile',gameStyle:'dungeon',rpgUniverse:{progression:profile}}],
    activeGameProfileId:()=> 'profile',
    loadDungeonRpgRules:()=>({xpPerLevel:10,startingSkillPoints:0,skillPointsPerLevel:1}),
    rpgEditingId:'profile'
  };
  legacy.window=legacy;
  legacy.globalThis=legacy;
  vm.createContext(legacy);
  vm.runInContext(core044,legacy,{filename:'dungeonCore044HeroProgression'});
  return legacy.dungeonRpgLevelFromXp(xp);
}

const configs=[
  {name:'linear-default',value:{xpCurveMode:'linear',xpPerLevel:10,maxLevel:100}},
  {name:'linear-custom',value:{xpCurveMode:'linear',xpPerLevel:7,maxLevel:3}},
  {name:'linear-negative-per',value:{xpCurveMode:'linear',xpPerLevel:-5,maxLevel:6}},
  {name:'linear-zero-per',value:{xpCurveMode:'linear',xpPerLevel:0,maxLevel:6}},
  {name:'linear-fractional-max',value:{xpCurveMode:'linear',xpPerLevel:10,maxLevel:2.5}},
  {name:'linear-infinite-max',value:{xpCurveMode:'linear',xpPerLevel:10,maxLevel:Infinity}},
  {name:'custom-complete',value:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}}},
  {name:'custom-missing-threshold',value:{xpCurveMode:'custom',xpPerLevel:8,maxLevel:5,xpThresholds:{2:3,4:28}}},
  {name:'custom-zero-threshold',value:{xpCurveMode:'custom',xpPerLevel:8,maxLevel:4,xpThresholds:{2:0,3:15,4:24}}},
  {name:'custom-negative-threshold',value:{xpCurveMode:'custom',xpPerLevel:8,maxLevel:4,xpThresholds:{2:-4,3:15,4:24}}},
  {name:'implicit-linear',value:{xpPerLevel:12,maxLevel:4}}
];
const xpValues=[
  undefined,NaN,-Infinity,Infinity,-100,-1,0,1,3,4,7,8,9,10,11,15,16,23,24,28,29,30,69,70,71,999,
  '10','29','',null,false,'abc'
];

let parityCases=0;
for(const row of configs){
  for(const xp of xpValues){
    const expected=legacyLevel(row.value,xp);
    const actual=api.levelFromXp(xp,row.value);
    assert.equal(
      Object.is(actual,-0)?0:actual,
      Object.is(expected,-0)?0:expected,
      row.name+' parity drift for xp='+String(xp)
    );
    parityCases++;
  }
}

assert.equal(api.levelFromXp(999,{xpCurveMode:'linear',xpPerLevel:10,maxLevel:2.5}),2.5,
  'legacy fractional maxLevel behavior must not be silently normalized');
assert.equal(api.levelFromXp(29,{xpCurveMode:'custom',xpPerLevel:8,maxLevel:5,xpThresholds:{2:3,4:28}}),3,
  'missing custom threshold must fall back to the historical linear threshold for that level');
assert.equal(api.levelFromXp(0,{xpCurveMode:'custom',xpPerLevel:8,maxLevel:4,xpThresholds:{2:-4}}),2,
  'negative explicit custom threshold must preserve legacy clamp-to-zero behavior');
assert.equal(api.levelFromXp(0,{xpCurveMode:'custom',xpPerLevel:8,maxLevel:4,xpThresholds:{2:0}}),1,
  'zero custom threshold is falsy in legacy and must fall back to the linear threshold');
assert.equal(api.levelFromXp(Infinity,{xpCurveMode:'linear',xpPerLevel:10,maxLevel:Infinity}),Infinity,
  'legacy explicit infinite max must stay representable for boundary adapters');

for(const source of [
  index,
  read('preview.html'),
  read('.github/workflows/main.yml'),
  read('service-worker.js')
]){
  assert.equal(source.includes(serviceRel),false,
    'pure Core Progression XP contract must stay outside the production graph');
}

console.log(JSON.stringify({
  scenario:'Phase 4 pure Core Progression XP contract',
  api:'GensProgressionXpV1.levelFromXp',
  parityCases,
  modes:['linear','custom'],
  explicitConfig:true,
  runtimeRaccord:false
},null,2));
