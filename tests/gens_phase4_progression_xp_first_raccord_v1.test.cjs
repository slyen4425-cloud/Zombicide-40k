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
const sw=read('service-worker.js');

const coreBlob=crypto.createHash('sha1')
  .update(Buffer.from('blob '+coreBuf.length+'\0'))
  .update(coreBuf)
  .digest('hex');

assert.equal(coreBlob,'f633de55f1e6bda339e66c65debc35d7b8da2510',
  'current Core Progression contract blob drifted after later pure API expansion');

function scriptBody(id){
  const marker='<script id="'+id+'">';
  const start=index.indexOf(marker);
  assert.ok(start>=0,'missing inline script '+id);
  const from=start+marker.length;
  const end=index.indexOf('</script>',from);
  assert.ok(end>from,'unterminated inline script '+id);
  return index.slice(from,end);
}

const ownerMarker='<script id="dungeonCore044HeroProgression">';
const ownerPos=index.indexOf(ownerMarker);
assert.ok(ownerPos>=0,'missing dungeonCore044HeroProgression owner');

const coreLoadPos=index.indexOf(corePath);
assert.ok(coreLoadPos>=0,
  'RED expected: Core Progression is not loaded by the source composition yet');
assert.ok(coreLoadPos<ownerPos,
  'Core Progression must load before dungeonCore044HeroProgression');

assert.ok(sw.includes('./'+corePath),
  'connected Core Progression must be cached by the PWA service worker');

const core044=scriptBody('dungeonCore044HeroProgression');
const levelStart=core044.indexOf('window.dungeonRpgLevelFromXp=function(xp)');
assert.ok(levelStart>=0,'missing active dungeonRpgLevelFromXp assignment');
const nextStart=core044.indexOf('window.dungeonRpgXpIntoLevel=',levelStart);
assert.ok(nextStart>levelStart,'cannot isolate dungeonRpgLevelFromXp from next seam');
const levelSource=core044.slice(levelStart,nextStart);

assert.match(levelSource,
  /window\.dungeonRpgLevelFromXp=function\(xp\)\{const p=activeProg\(\),v=Math\.max\(0,Number\(xp\)\|\|0\);if\(!p\)\{const r=loadDungeonRpgRules\(\);return 1\+Math\.floor\(v\/Math\.max\(1,r\.xpPerLevel\)\)\}/,
  'legacy no-profile boundary must remain byte-semantically intact');

assert.match(levelSource,/GensProgressionV1\.levelFromXp\(v,p\)/,
  'RED expected: configured-profile branch must delegate to Core Progression');
assert.equal((levelSource.match(/GensProgressionV1\.levelFromXp\(v,p\)/g)||[]).length,1,
  'configured-profile branch must have exactly one Core delegation');
assert.doesNotMatch(levelSource,/p\.xpThresholds/,
  'configured custom-curve implementation must no longer be duplicated locally');
assert.doesNotMatch(levelSource,/Math\.min\(max,1\+Math\.floor/,
  'configured linear implementation must no longer be duplicated locally');

const xpIntoStart=nextStart;
const skillStart=core044.indexOf('window.dungeonRpgEarnedSkillPoints=',xpIntoStart);
assert.ok(skillStart>xpIntoStart,'cannot isolate deferred XP-into-level seam');
const xpIntoSource=core044.slice(xpIntoStart,skillStart);
assert.match(xpIntoSource,/GensProgressionV1\.xpIntoLevel\(v,p,fallback\)/,
  'later dedicated raccord must now connect dungeonRpgXpIntoLevel without altering the first level raccord');

function runtime({profile=null,rules={xpPerLevel:10}}={}){
  const ctx={
    console,
    document:{getElementById:()=>null,querySelector:()=>null},
    loadGameProfiles:()=>profile?[{id:'p',gameStyle:'dungeon',rpgUniverse:{progression:profile}}]:[],
    activeGameProfileId:()=> 'p',
    loadDungeonRpgRules:()=>rules,
    rpgEditingId:'p'
  };
  ctx.window=ctx;
  ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(coreSource,ctx,{filename:corePath});
  const pure=ctx.GensProgressionV1.levelFromXp;
  let coreCalls=0;
  ctx.GensProgressionV1={
    VERSION:ctx.GensProgressionV1.VERSION,
    levelFromXp:(xp,p)=>{coreCalls++;return pure(xp,p);}
  };
  vm.runInContext(core044,ctx,{filename:'dungeonCore044HeroProgression'});
  return {ctx,pure,calls:()=>coreCalls};
}

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
  const rt=runtime({profile,rules:{xpPerLevel:37}});
  for(const xp of xpValues){
    const before=rt.calls();
    const actual=rt.ctx.dungeonRpgLevelFromXp(xp);
    const after=rt.calls();
    const expected=rt.pure(xp,profile);
    assert.equal(actual,expected,
      'configured-profile parity drifted for xp='+String(xp)+' config='+JSON.stringify(profile));
    assert.equal(after,before+1,
      'configured-profile owner must call Core exactly once');
    profileCases++;
  }
}

{
  const rt=runtime({profile:null,rules:{xpPerLevel:25}});
  assert.equal(rt.ctx.dungeonRpgLevelFromXp(50),3);
  assert.equal(rt.calls(),0,
    'no-profile legacy branch must not call Core Progression');
  assert.equal(rt.ctx.dungeonRpgLevelFromXp(2500),101);
  assert.equal(rt.calls(),0,
    'uncapped no-profile legacy branch must remain outside Core Progression');
}

console.log(JSON.stringify({
  scenario:'Phase 4 Core Progression first XP-to-level raccord',
  profileParityCases:profileCases,
  configuredProfileCoreDelegation:true,
  noProfileCoreDelegation:false,
  pureCoreChanged:false,
  laterConnected:['dungeonRpgXpIntoLevel'],
  deferred:['dungeonRpgEarnedSkillPoints','sync/manual XP/rewards/level-up']
},null,2));
