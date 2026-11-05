const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const indexBuf=require('./helpers/gens_capture_v162_legacy_snapshot_v1.cjs').legacyBytes();
const index=indexBuf.toString('utf8');
const corePath='assets/gensrpg/core/progression-v1.js';
const coreBuf=fs.readFileSync(path.join(root,corePath));
const coreSource=coreBuf.toString('utf8');
const preview=read('preview.html');
const pages=read('.github/workflows/main.yml');
const sw=read('service-worker.js');
const owners=read('docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv');

const indexBlob=crypto.createHash('sha1').update(Buffer.from('blob '+indexBuf.length+'\0')).update(indexBuf).digest('hex');
assert.equal(indexBuf.length,8165438,'first-raccord preaudit must track the exact current Phase 7 Dungeon generated Boss policy index');
assert.equal(indexBlob,'1a61147d5a32889fa85e6a09e846049103b9f0bf','index blob drifted from the Phase 7 Dungeon generated Boss policy baseline');
// The phase-4 source hash was retired by the certified, compatible Core XP-band
// extension. Guard the public behavior below instead of freezing obsolete bytes.
assert.match(coreSource,/function progressInBands\(/,
  'only the existing Core Progression may interpret compact creator XP bands');

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
assert.equal((index.match(/\bdungeonRpgLevelFromXp\b/g)||[]).length,13,
  'global level helper identifier inventory drifted after the dedicated xpIntoLevel raccord retired its local level-seam call');

assert.match(core044,/window\.dungeonRpgLevelFromXp=function\(xp\)\{const p=activeProg\(\),v=Math\.max\(0,Number\(xp\)\|\|0\);if\(!p\)\{const r=loadDungeonRpgRules\(\);return 1\+Math\.floor\(v\/Math\.max\(1,r\.xpPerLevel\)\)\}/,
  'historical no-profile boundary drifted');
assert.match(core044,/return GensProgressionV1\.levelFromXp\(v,p\)/,
  'configured profile branch must stay delegated to Core Progression');
assert.doesNotMatch(core044,/p\.xpThresholds\?\.\[lv\]|const max=Math\.max\(1,Number\(p\.maxLevel\)/,
  'configured profile curve implementation must not reappear locally');

assert.equal(index.includes(corePath),true,
  'Core Progression must be loaded by the source index after the dedicated raccord');
assert.equal(sw.includes('./'+corePath),true,
  'Core Progression must be included in the PWA cache after the dedicated raccord');
for(const source of [preview,pages]){
  assert.equal(source.includes(corePath),false,
    'preview/Pages must inherit the source-index Core Progression load instead of injecting a second copy');
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

// Core owner extension: the real compact progression is tested at cost changes,
// on optional high-level caps, and on the original single-source Core API.
// No per-level threshold materialization or alternate UI XP calculator is allowed.
{
  const ctx=runtime();
  const p={xpCurveMode:'custom',xpPerLevel:2000,maxLevel:250,
    xpBands:[{throughLevel:20,xpPerLevel:2000},{throughLevel:250,xpPerLevel:4000}]};
  for(const [xp,level,remaining] of [
    [0,1,0],[37999,19,1999],[38000,20,0],[41999,20,3999],
    [42000,21,0],[37999+230*4000,249,3999],[38000+230*4000,250,0]
  ]){
    assert.equal(ctx.GensProgressionV1.levelFromXp(xp,p),level,
      'Core levelFromXp: compact XP bands must honor creator thresholds');
    assert.equal(ctx.GensProgressionV1.xpIntoLevel(xp,p),remaining,
      'Core xpIntoLevel: compact XP bands must preserve exact within-level XP');
  }
  const large={xpCurveMode:'custom',xpPerLevel:5,maxLevel:1_000_000,
    xpBands:[{throughLevel:1_000_000,xpPerLevel:5}]};
  assert.equal(ctx.GensProgressionV1.levelFromXp(4_999_995,large),1_000_000);
  assert.equal(ctx.GensProgressionV1.xpIntoLevel(4_999_994,large),4);
  assert.throws(()=>ctx.GensProgressionV1.levelFromXp(100,{
    xpCurveMode:'custom',maxLevel:250,xpBands:[{throughLevel:100,xpPerLevel:0}]
  }),/XP band/,'invalid editor bands must fail rather than silently grant XP');
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
  laterConnected:[
    'dungeonRpgXpIntoLevel'
  ],
  deferred:[
    'dungeonRpgEarnedSkillPoints',
    'dungeonSyncProgressionForState',
    'changeXP',
    'combat XP/rewards/persistence',
    'dungeonHandleLevelUp071'
  ],
  futureLoadOrder:'resolved: progression-v1.js loads before dungeonCore044HeroProgression',
  graphEffect:'resolved: Phase 4 connected; production reachable 78'
};

console.log(JSON.stringify({
  scenario:'Phase 4 Core Progression first-raccord preaudit',
  profileParityCases:profileCases,
  noProfileDirectDelegationSafe:false,
  selection,
  runtimeChanged:true
},null,2));
