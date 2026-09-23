const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const indexBuf=fs.readFileSync(path.join(root,'index.html'));
const index=indexBuf.toString('utf8');
const corePath='assets/gensrpg/core/progression-v1.js';
const coreBuf=fs.readFileSync(path.join(root,corePath));
const coreSource=coreBuf.toString('utf8');
const owners=fs.existsSync(path.join(root,'docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv'))
  ?fs.readFileSync(path.join(root,'docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv'),'utf8')
  :'dungeonRpgEarnedSkillPoints\t1\tdungeonCore044HeroProgression\n';

const gitBlob=buf=>crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');
assert.equal(indexBuf.length,8171186,'earned-points preaudit must run on exact xpIntoLevel GREEN index');
assert.equal(gitBlob(indexBuf),'c2424bada56517e579ffe65fa147facbb6bf2caf','earned-points preaudit index blob drifted');
assert.equal(gitBlob(coreBuf),'3cca29084ce436a8dcae95e5d6d745edd4afa3cf','Core Progression blob must remain unchanged during preaudit');

function scriptBody(id){
  const marker='<script id="'+id+'">';
  const start=index.indexOf(marker);assert.ok(start>=0,'missing inline script '+id);
  const from=start+marker.length,end=index.indexOf('</script>',from);
  assert.ok(end>from,'unterminated inline script '+id);
  return index.slice(from,end);
}
function extractWindowFunction(src,name){
  const needle='window.'+name+'=function';
  const pos=src.indexOf(needle);assert.ok(pos>=0,'missing window function '+name);
  const brace=src.indexOf('{',pos);let depth=0,quote=null,escape=false,line=false,block=false;
  for(let i=brace;i<src.length;i++){
    const c=src[i],n=src[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue}
    if(quote){if(escape){escape=false;continue}if(c==='\\'){escape=true;continue}if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==="'"||c==='"'||c===String.fromCharCode(96)){quote=c;continue}
    if(c==='{')depth++; else if(c==='}'&&--depth===0)return src.slice(pos,i+1);
  }
  assert.fail('unterminated window function '+name);
}
function extractFunction(src,name){
  const marker='function '+name+'(';
  const pos=src.indexOf(marker);assert.ok(pos>=0,'missing function '+name);
  const brace=src.indexOf('{',pos);let depth=0,quote=null,escape=false,line=false,block=false;
  for(let i=brace;i<src.length;i++){
    const c=src[i],n=src[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue}
    if(quote){if(escape){escape=false;continue}if(c==='\\'){escape=true;continue}if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==="'"||c==='"'||c===String.fromCharCode(96)){quote=c;continue}
    if(c==='{')depth++; else if(c==='}'&&--depth===0)return src.slice(pos,i+1);
  }
  assert.fail('unterminated function '+name);
}

const core044=scriptBody('dungeonCore044HeroProgression');
const earnedFn=extractWindowFunction(core044,'dungeonRpgEarnedSkillPoints');
const levelFn=extractWindowFunction(core044,'dungeonRpgLevelFromXp');
const syncFn=extractFunction(index,'dungeonSyncProgressionForState');
const defaultRulesFn=extractFunction(index,'defaultDungeonRpgRules');
const normalizeRulesFn=extractFunction(index,'normalizeDungeonRpgRules');

assert.match(owners,/^dungeonRpgEarnedSkillPoints\t1\tdungeonCore044HeroProgression$/m,
  'Core 0.44 must remain the active earned skill points owner');
assert.equal((index.match(/\bdungeonRpgEarnedSkillPoints\b/g)||[]).length,3,
  'earned-points identifier inventory drifted');
assert.match(earnedFn,/const p=activeProg\(\)/,'earned points must read active progression at the boundary');
assert.match(earnedFn,/if\(!p\)\{const r=loadDungeonRpgRules\(\)/,
  'no-profile policy must remain backed by Dungeon rules');
assert.match(earnedFn,/dungeonRpgLevelFromXp\(xp\)/,
  'earned points must consume the canonical XP-to-level seam rather than duplicate curve logic');
assert.match(earnedFn,/r\.startingSkillPoints/,'no-profile branch must preserve startingSkillPoints rule');
assert.match(earnedFn,/r\.skillPointsPerLevel/,'no-profile branch must preserve skillPointsPerLevel rule');
assert.match(earnedFn,/GensProgressionV1\.earnedSkillPointsFromLevel\(level,p\)/,
  'configured profile branch must delegate its points policy to Core');
assert.doesNotMatch(earnedFn,/p\.startingSkillPoints|p\.talentPointsPerLevel/,
  'runtime seam must not retain configured-profile points arithmetic after raccord');
assert.match(coreSource,/p\.startingSkillPoints/,
  'Core earned-points policy must preserve startingSkillPoints profile field');
assert.match(coreSource,/p\.talentPointsPerLevel/,
  'Core earned-points policy must preserve talentPointsPerLevel profile field');
assert.doesNotMatch(earnedFn,/xpPerLevel|xpThresholds|maxLevel|localStorage|document\.|setTimeout|setInterval|save\(|render\(/,
  'earned-points owner must not own curve math, persistence, UI or timers');
assert.match(levelFn,/GensProgressionV1\.levelFromXp/,'XP-to-level dependency must remain Core-backed');
assert.match(syncFn,/const earned=dungeonRpgEarnedSkillPoints\(st\.xp\)/,
  'state sync must remain the real consumer of the earned-points seam');
assert.match(syncFn,/const spent=dungeonSpentSkillPointsFor/,
  'spending remains a separate concern outside earned-points policy');

const ABSENT=Symbol('absent-profile');
const MISSING_PROGRESSION=Symbol('missing-progression');
function runtime({profile=ABSENT,gameStyle='dungeon',rules={xpPerLevel:10,startingSkillPoints:0,skillPointsPerLevel:1}}={}){
  let profilesCalls=0,profileIdCalls=0,rulesCalls=0,levelCalls=0;
  const profiles=profile===ABSENT?[]:[{id:'p',gameStyle,rpgUniverse:profile===MISSING_PROGRESSION?{}:{progression:profile}}];
  const ctx={
    console,
    document:{getElementById:()=>null,querySelector:()=>null},
    rpgEditingId:'p',
    loadGameProfiles:()=>{profilesCalls++;return profiles;},
    activeGameProfileId:()=>{profileIdCalls++;return 'p';}
  };
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(defaultRulesFn+'\n'+normalizeRulesFn,ctx,{filename:'dungeon-rules-normalization-owner'});
  ctx.loadDungeonRpgRules=()=>{rulesCalls++;return ctx.normalizeDungeonRpgRules(rules);};
  vm.runInContext(coreSource,ctx,{filename:corePath});
  vm.runInContext(core044,ctx,{filename:'dungeonCore044HeroProgression'});
  const originalLevel=ctx.dungeonRpgLevelFromXp;
  ctx.dungeonRpgLevelFromXp=function(xp){levelCalls++;return originalLevel(xp)};
  return {
    call:xp=>ctx.dungeonRpgEarnedSkillPoints(xp),
    counts:()=>({profilesCalls,profileIdCalls,rulesCalls,levelCalls})
  };
}
function eqActual(actual,expected,label){
  if(Number.isNaN(expected))assert.ok(Number.isNaN(actual),label+' expected NaN');
  else assert.equal(actual,expected,label);
}
function runCases(label,opts,cases,expectedCounts){
  for(const [xp,expected] of cases){
    const r=runtime(opts);
    eqActual(r.call(xp),expected,label+' xp='+String(xp));
    assert.deepEqual(r.counts(),expectedCounts,label+' call counts xp='+String(xp));
  }
  return cases.length;
}

let parityCases=0;
parityCases+=runCases('no-profile rules 10/2/3',
  {profile:ABSENT,rules:{xpPerLevel:10,startingSkillPoints:2,skillPointsPerLevel:3}},
  [[undefined,2],[-9,2],[0,2],[1,2],[9,2],[10,5],[11,5],[19,5],[20,8],[21,8],[99,29],[100,32],[999,299],[1000,302],['20',8],['bad',2]],
  {profilesCalls:2,profileIdCalls:0,rulesCalls:2,levelCalls:1});

parityCases+=runCases('no-profile rules 25/0/1',
  {profile:ABSENT,rules:{xpPerLevel:25,startingSkillPoints:0,skillPointsPerLevel:1}},
  [[0,0],[24,0],[25,1],[49,1],[50,2],[63,2],[249,9],[250,10],[999,39],[1000,40]],
  {profilesCalls:2,profileIdCalls:0,rulesCalls:2,levelCalls:1});

parityCases+=runCases('linear capped profile',
  {profile:{xpCurveMode:'linear',xpPerLevel:10,maxLevel:3,startingSkillPoints:2,talentPointsPerLevel:4},rules:{xpPerLevel:25,startingSkillPoints:99,skillPointsPerLevel:99}},
  [[-1,2],[0,2],[9,2],[10,6],[19,6],[20,10],[29,10],[30,10],[999,10],['20',10]],
  {profilesCalls:2,profileIdCalls:2,rulesCalls:0,levelCalls:1});

parityCases+=runCases('linear numeric strings profile',
  {profile:{xpCurveMode:'linear',xpPerLevel:'10',maxLevel:'100',startingSkillPoints:'3',talentPointsPerLevel:'2'}},
  [[0,3],[9,3],[10,5],[20,7],[999,201],[1000,201],['bad',3]],
  {profilesCalls:2,profileIdCalls:2,rulesCalls:0,levelCalls:1});

parityCases+=runCases('linear invalid points profile',
  {profile:{xpCurveMode:'linear',xpPerLevel:10,maxLevel:5,startingSkillPoints:-3,talentPointsPerLevel:-2}},
  [[0,0],[10,0],[20,0],[40,0],[999,0]],
  {profilesCalls:2,profileIdCalls:2,rulesCalls:0,levelCalls:1});
parityCases+=runCases('linear nonnumeric points profile',
  {profile:{xpCurveMode:'linear',xpPerLevel:10,maxLevel:5,startingSkillPoints:'bad',talentPointsPerLevel:'bad'}},
  [[0,0],[10,0],[20,0],[40,0],[999,0]],
  {profilesCalls:2,profileIdCalls:2,rulesCalls:0,levelCalls:1});

parityCases+=runCases('custom profile',
  {profile:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70},startingSkillPoints:3,talentPointsPerLevel:2}},
  [[0,3],[3,3],[4,5],[10,5],[11,7],[29,7],[30,9],[69,9],[70,11],[999,11]],
  {profilesCalls:2,profileIdCalls:2,rulesCalls:0,levelCalls:1});

parityCases+=runCases('sparse custom profile',
  {profile:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:5,4:40,5:'bad'},startingSkillPoints:1,talentPointsPerLevel:3}},
  [[0,1],[4,1],[5,4],[19,4],[20,7],[39,7],[40,13],[99,13]],
  {profilesCalls:2,profileIdCalls:2,rulesCalls:0,levelCalls:1});

parityCases+=runCases('empty progression object is a configured profile',
  {profile:{},rules:{xpPerLevel:25,startingSkillPoints:7,skillPointsPerLevel:4}},
  [[0,0],[9,0],[10,0],[99,0],[100,0],[999,0]],
  {profilesCalls:2,profileIdCalls:2,rulesCalls:0,levelCalls:1});

parityCases+=runCases('missing progression object falls back to rules',
  {profile:MISSING_PROGRESSION,rules:{xpPerLevel:10,startingSkillPoints:2,skillPointsPerLevel:1}},
  [[0,2],[9,2],[10,3],[20,4],[99,11],[100,12]],
  {profilesCalls:2,profileIdCalls:2,rulesCalls:2,levelCalls:1});

parityCases+=runCases('non-dungeon active profile falls back to rules',
  {profile:{xpCurveMode:'linear',xpPerLevel:2,startingSkillPoints:99,talentPointsPerLevel:99},gameStyle:'survival',rules:{xpPerLevel:10,startingSkillPoints:1,skillPointsPerLevel:2}},
  [[0,1],[9,1],[10,3],[20,5],[99,19],[100,21]],
  {profilesCalls:2,profileIdCalls:2,rulesCalls:2,levelCalls:1});

// Exercise no-profile values through the real Dungeon rules normalization owner.
assert.match(normalizeRulesFn,/pos\("xpPerLevel"\)/,'real rules owner must normalize xpPerLevel');
assert.match(normalizeRulesFn,/non\("skillPointsPerLevel",99\)/,'real rules owner must normalize skillPointsPerLevel');
assert.match(normalizeRulesFn,/non\("startingSkillPoints",99\)/,'real rules owner must normalize startingSkillPoints');
parityCases+=runCases('legacy string rules coercion',
  {profile:ABSENT,rules:{xpPerLevel:'10',startingSkillPoints:'3',skillPointsPerLevel:'2'}},
  [[0,3],[10,5],[20,7],[99,21]],
  {profilesCalls:2,profileIdCalls:0,rulesCalls:2,levelCalls:1});
parityCases+=runCases('normalized invalid starting points',
  {profile:ABSENT,rules:{xpPerLevel:10,startingSkillPoints:'bad',skillPointsPerLevel:2}},
  [[0,0],[20,4]],
  {profilesCalls:2,profileIdCalls:0,rulesCalls:2,levelCalls:1});
parityCases+=runCases('normalized invalid xpPerLevel',
  {profile:ABSENT,rules:{xpPerLevel:'bad',startingSkillPoints:1,skillPointsPerLevel:2}},
  [[0,1],[20,5]],
  {profilesCalls:2,profileIdCalls:0,rulesCalls:2,levelCalls:1});
parityCases+=runCases('legacy negative rules clamp',
  {profile:ABSENT,rules:{xpPerLevel:-5,startingSkillPoints:-3,skillPointsPerLevel:-2}},
  [[0,0],[1,0],[20,0]],
  {profilesCalls:2,profileIdCalls:0,rulesCalls:2,levelCalls:1});

assert.ok(parityCases>=90,'expected broad earned-points characterization matrix');

const selection={
  selected:'dungeonRpgEarnedSkillPoints',
  owner:'dungeonCore044HeroProgression',
  consumer:'dungeonSyncProgressionForState',
  dependency:'dungeonRpgLevelFromXp (already canonical/Core-backed)',
  futureCoreShape:'earnedSkillPointsFromLevel(level, explicitProgressionConfig, fallbackStartingSkillPoints, fallbackSkillPointsPerLevel)',
  reasons:[
    'earned-points policy is deterministic once canonical level and explicit policy values are provided',
    'it must not duplicate XP curve/maxLevel/custom-threshold ownership already held by levelFromXp',
    'it has no persistence, DOM, timer, spending or mutation authority'
  ],
  preserve:[
    'profile branch fields: startingSkillPoints + talentPointsPerLevel',
    'no-profile fallback fields: startingSkillPoints + skillPointsPerLevel',
    'configured empty progression object is not the same as no profile',
    'profile maxLevel/custom curve effects arrive only through dungeonRpgLevelFromXp',
    'no-profile fallbacks pass through the real normalizeDungeonRpgRules owner before this seam'
  ],
  observedReads:{
    configuredProfile:'two active-profile reads via earned seam plus level seam; zero Dungeon-rules reads',
    absentOrNonDungeonProfile:'two active-profile reads plus two Dungeon-rules reads; one of each pair comes through level seam'
  },
  deferred:[
    'dungeonSpentSkillPointsFor',
    'dungeonSyncProgressionForState mutation',
    'bonusSkillPoints and spent-points subtraction',
    'stat points',
    'changeXP/combat/objective distribution',
    'level-up UI/persistence'
  ],
  nextAction:'guard the installed runtime raccord and keep rule normalization owned by normalizeDungeonRpgRules'
};

console.log(JSON.stringify({
  scenario:'Phase 4 Progression earned skill points preaudit',
  index:{bytes:indexBuf.length,blob:gitBlob(indexBuf)},
  coreBlob:gitBlob(coreBuf),
  parityCases,
  selection,
  runtimeChanged:true
},null,2));
