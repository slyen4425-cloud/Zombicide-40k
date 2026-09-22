const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const indexBuf=fs.readFileSync(path.join(root,'index.html'));
const index=indexBuf.toString('utf8');
const corePath='assets/gensrpg/core/progression-v1.js';
const coreBuf=fs.readFileSync(path.join(root,corePath));
const coreSource=coreBuf.toString('utf8');
const preview=read('preview.html');
const pages=read('.github/workflows/main.yml');
const sw=read('service-worker.js');
const owners=read('docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv');

const indexBlob=crypto.createHash('sha1').update(Buffer.from('blob '+indexBuf.length+'\0')).update(indexBuf).digest('hex');
const coreBlob=crypto.createHash('sha1').update(Buffer.from('blob '+coreBuf.length+'\0')).update(coreBuf).digest('hex');
assert.equal(indexBuf.length,8174648,'first-raccord preaudit must remain on exact d10048 GREEN index');
assert.equal(indexBlob,'2d7677950f04e9a3290ff0062e157a126123891d','index blob drifted during Progression preaudit');
assert.equal(coreBlob,'b02487346f1a0df12effbc4559b5063bf8e12726','pure Core Progression service drifted');

function scriptBody(id){
  const marker='<script id="'+id+'">';
  const start=index.indexOf(marker);
  assert.ok(start>=0,'missing inline script '+id);
  const from=start+marker.length,end=index.indexOf('</script>',from);
  assert.ok(end>from,'unterminated inline script '+id);
  return index.slice(from,end);
}

const core044=scriptBody('dungeonCore044HeroProgression');
assert.match(owners,/^dungeonRpgLevelFromXp\t1\tdungeonCore044HeroProgression$/m,
  'Core 0.44 must remain last explicit owner of dungeonRpgLevelFromXp');
assert.equal((index.match(/function dungeonRpgLevelFromXp\s*\(/g)||[]).length,1,
  'historical base level helper definition count drifted');
assert.equal((index.match(/window\.dungeonRpgLevelFromXp\s*=\s*function/g)||[]).length,1,
  'Core 0.44 override count drifted');
assert.equal((index.match(/\bdungeonRpgLevelFromXp\b/g)||[]).length,14,
  'global level helper identifier inventory drifted');

assert.match(core044,/window\.dungeonRpgLevelFromXp=function\(xp\)\{const p=activeProg\(\),v=Math\.max\(0,Number\(xp\)\|\|0\);if\(!p\)\{const r=loadDungeonRpgRules\(\);return 1\+Math\.floor\(v\/Math\.max\(1,r\.xpPerLevel\)\)\}/,
  'historical no-profile boundary drifted');
assert.match(core044,/const max=Math\.max\(1,Number\(p\.maxLevel\)\|\|100\)/,
  'configured profile max-level branch drifted');
assert.match(core044,/p\.xpThresholds\?\.\[lv\]/,
  'configured custom threshold branch drifted');
assert.match(core044,/return Math\.min\(max,1\+Math\.floor\(v\/Math\.max\(1,Number\(p\.xpPerLevel\)\|\|10\)\)\)/,
  'configured linear branch drifted');

for(const source of [index,preview,pages,sw]){
  assert.equal(source.includes(corePath),false,
    'Core Progression must remain inert during first-raccord preaudit');
}

function runtime({profile=null,rules={xpPerLevel:10}}={}){
  const ctx={
    console,
    document:{getElementById:()=>null,querySelector:()=>null},
    loadGameProfiles:()=>profile?[{id:'p',gameStyle:'dungeon',rpgUniverse:{progression:profile}}]:[],
    activeGameProfileId:()=> 'p',
    loadDungeonRpgRules:()=>rules,
    rpgEditingId:'p'
  };
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(coreSource,ctx,{filename:corePath});
  vm.runInContext(core044,ctx,{filename:'dungeonCore044HeroProgression'});
  return ctx;
}

// Profile-active branch: exact Core parity across linear/custom/coercion cases.
const profiles=[
  {xpCurveMode:'linear',xpPerLevel:10,maxLevel:100},
  {xpCurveMode:'linear',xpPerLevel:7,maxLevel:3},
  {xpCurveMode:'linear',xpPerLevel:'12',maxLevel:'8'},
  {xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}},
  {xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:5,4:40,5:'bad'}}
];
const xpValues=[undefined,NaN,'',null,false,-50,0,3,4,5,6,7,9,10,11,14,19,20,29,30,39,40,49,50,69,70,999,'30'];
let profileCases=0;
for(const profile of profiles){
  const ctx=runtime({profile,rules:{xpPerLevel:37}});
  for(const xp of xpValues){
    const legacy=ctx.dungeonRpgLevelFromXp(xp);
    const core=ctx.GensProgressionV1.levelFromXp(xp,profile);
    assert.equal(core,legacy,'profile-active Core parity drifted for xp='+String(xp)+' config='+JSON.stringify(profile));
    profileCases++;
  }
}

// No-profile branch is a distinct compatibility boundary.
// Naive Core defaults are already wrong when Dungeon rules use a non-default xpPerLevel.
{
  const ctx=runtime({profile:null,rules:{xpPerLevel:25}});
  assert.equal(ctx.dungeonRpgLevelFromXp(50),3);
  assert.equal(ctx.GensProgressionV1.levelFromXp(50,{}),6,
    'proof case requires Core defaults to differ from legacy no-profile Dungeon rules');

  // Even adapting xpPerLevel alone is not exact because Core has a compatibility maxLevel=100.
  assert.equal(ctx.dungeonRpgLevelFromXp(2500),101);
  assert.equal(ctx.GensProgressionV1.levelFromXp(2500,{xpCurveMode:'linear',xpPerLevel:25}),100,
    'proof case requires legacy no-profile branch to remain explicitly uncapped');
}

// Minimal future seam: keep normalization + no-profile fallback at the historical boundary,
// delegate only the configured-profile calculation to the pure Core.
const selection={
  helper:'dungeonRpgLevelFromXp',
  activeOwner:'dungeonCore044HeroProgression',
  configuredProfileRaccord:'GensProgressionV1.levelFromXp(v,p)',
  keepAtBoundary:[
    'activeProg() lookup',
    'Math.max(0, Number(xp) || 0) normalization for legacy fallback',
    'no-profile loadDungeonRpgRules().xpPerLevel branch'
  ],
  deferred:[
    'dungeonRpgXpIntoLevel',
    'dungeonRpgEarnedSkillPoints',
    'dungeonSyncProgressionForState',
    'changeXP',
    'combat XP/rewards/persistence',
    'dungeonHandleLevelUp071'
  ],
  futureLoadOrder:'load progression-v1.js before dungeonCore044HeroProgression',
  graphEffect:'Phase 4 inert -> connected; production reachable 77 -> 78'
};

console.log(JSON.stringify({
  scenario:'Phase 4 Core Progression first-raccord preaudit',
  profileParityCases:profileCases,
  noProfileDirectDelegationSafe:false,
  selection,
  runtimeChanged:false
},null,2));
