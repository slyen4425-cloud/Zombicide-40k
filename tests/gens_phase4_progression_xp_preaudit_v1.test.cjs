const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const bytes=fs.readFileSync(path.join(root,'index.html'));
const index=bytes.toString('utf8');
const preview=read('preview.html');
const pagesWorkflow=read('.github/workflows/main.yml');
const serviceWorker=read('service-worker.js');
const progressionRuntime=read('assets/gensrpg/dungeon/progression-runtime-v1.js');
const statUpgradePolicy=read('assets/gensrpg/gens-stat-upgrade-policy-167898.js');
const nonProd=JSON.parse(read('docs/GENSRPG_PHASE2_NONPRODUCTION_FILES.json'));
const lastOwners=read('docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv');

const blob=crypto.createHash('sha1')
  .update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
assert.equal(bytes.length,8169596,'Progression preaudit must run on the exact first-raccord index');
assert.equal(blob,'d451372389f29d0145d3f9689ca739128a0650e9','Progression preaudit index blob drifted');

function scriptBody(id){
  const re=new RegExp('<script[^>]*id=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i');
  const m=index.match(re);assert.ok(m,'missing inline script '+id);return m[1];
}
function extractWindowFunction(src,name){
  const needle='window.'+name+'=function';
  const pos=src.indexOf(needle);assert.ok(pos>=0,'missing window function '+name);
  const brace=src.indexOf('{',pos);let depth=0,quote=null,escape=false,line=false,block=false;
  for(let i=brace;i<src.length;i++){
    const c=src[i],n=src[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++}continue}
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
    if(block){if(c==='*'&&n==='/'){block=false;i++}continue}
    if(quote){if(escape){escape=false;continue}if(c==='\\'){escape=true;continue}if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==="'"||c==='"'||c===String.fromCharCode(96)){quote=c;continue}
    if(c==='{')depth++; else if(c==='}'&&--depth===0)return src.slice(pos,i+1);
  }
  assert.fail('unterminated function '+name);
}

const core044=scriptBody('dungeonCore044HeroProgression');
const core312=scriptBody('dungeonCore312TurnAndPopupFixes');

assert.match(lastOwners,/^dungeonRpgLevelFromXp\t1\tdungeonCore044HeroProgression$/m,
  'Phase 2 last-owner map must identify Core 0.44 as active XP->level owner');
assert.match(lastOwners,/^dungeonHandleLevelUp071\t2\tdungeonCore312TurnAndPopupFixes$/m,
  'Phase 2 last-owner map must identify Core 3.12 as active level-up UI owner');

assert.equal((index.match(/function dungeonSyncProgressionForState\s*\(/g)||[]).length,1,
  'progression state sync should still have one named definition');
assert.equal((index.match(/function changeXP\s*\(/g)||[]).length,1,
  'manual XP action should still have one named definition');
assert.equal((index.match(/function awardDungeonDefeatXp\s*\(/g)||[]).length,1,
  'combat XP award should still have one named definition');
assert.equal((index.match(/function dungeonRecordCombatReward\s*\(/g)||[]).length,1,
  'combat reward aggregation should still have one named definition');

const levelFn=extractWindowFunction(core044,'dungeonRpgLevelFromXp');
assert.match(levelFn,/const p=activeProg\(\),v=Math\.max\(0,Number\(xp\)\|\|0\)/,
  'XP->level boundary normalization drifted');
assert.match(levelFn,/if\(!p\)\{const r=loadDungeonRpgRules\(\);return 1\+Math\.floor\(v\/Math\.max\(1,r\.xpPerLevel\)\)\}/,
  'legacy no-profile XP curve boundary drifted');
assert.match(levelFn,/return GensProgressionV1\.levelFromXp\(v,p\)/,
  'configured profile XP curve must delegate to Core Progression');
assert.doesNotMatch(levelFn,/p\.xpThresholds|const max=Math\.max/,
  'configured profile curve implementation must no longer be duplicated in Core 0.44');

const sync=extractFunction(index,'dungeonSyncProgressionForState');
assert.match(sync,/const level=dungeonRpgLevelFromXp\(st\.xp\)/,'state sync must consume the canonical level seam');
assert.match(sync,/p\.startingStatPoints/,'state sync must honor configurable starting stat points');
assert.match(sync,/p\.statPointsPerLevel/,'state sync must honor configurable stat points per level');
assert.match(sync,/st\.rpgLevel=level/,'state sync must write rpgLevel');
assert.match(sync,/st\.skillPoints=/,'state sync must write skillPoints');
assert.match(sync,/st\.statPoints=/,'state sync must write statPoints');
assert.doesNotMatch(levelFn,/localStorage|document\.|setTimeout|save\(|render\(/,
  'XP->level calculation must stay free of persistence/UI side effects');

const changeXP=extractFunction(index,'changeXP');
assert.match(changeXP,/state\.xp=Math\.max\(0,Math\.min\(999,state\.xp\+v\)\)/,
  'manual XP mutation boundary drifted');
assert.match(changeXP,/dungeonSyncProgressionForState\(current,state\)/,
  'manual XP must reuse progression sync');
assert.match(changeXP,/dungeonHandleLevelUp071/,'manual XP must reuse level-up lifecycle');
assert.match(changeXP,/\bsave\(\)/,'manual XP action owns persistence');
assert.match(changeXP,/\brender\(\)/,'manual XP action owns UI refresh');

const award=extractFunction(index,'awardDungeonDefeatXp');
assert.match(award,/dungeonCombatSelection\?\.heroes/,'combat XP must remain participant/group based');
assert.match(award,/dungeonSyncProgressionForState\(id,hs\)/,'combat XP must reuse progression sync');
assert.match(award,/dungeonHandleLevelUp071\?\.\(id,before,hs,180\+i\*220\)/,
  'combat XP must reuse level-up lifecycle');
assert.match(award,/localStorage\.setItem\(key\(id\),JSON\.stringify\(hs\)\)/,
  'combat XP award still owns persistence and is not a pure Core seam');

const levelUp=extractWindowFunction(core312,'dungeonHandleLevelUp071');
assert.match(levelUp,/levelQueue312\.push/,'active level-up owner must still queue presentation');
assert.match(levelUp,/schedulePump312\(delay\)/,'active level-up owner remains UI/timer coupled');
assert.match(levelUp,/localStorage\.setItem/,'active level-up owner remains persistence coupled');

const np=nonProd.files.find(x=>x.file==='assets/gensrpg/dungeon/progression-runtime-v1.js');
assert.ok(np,'non-production manifest must list progression-runtime-v1.js');
assert.equal(np.status,'tests-docs-only');
assert.equal(np.serviceWorkerCached,false);
assert.equal(np.workflowReferenced,false);
for(const src of [index,preview,pagesWorkflow,serviceWorker]){
  assert.equal(src.includes('progression-runtime-v1.js'),false,
    'progression-runtime-v1.js must remain outside the production execution graph');
}
assert.match(progressionRuntime,/rt\.changeXP=wrapped/,'historical external progression runtime is a changeXP wrapper');
assert.match(progressionRuntime,/function install\(/,'historical external progression runtime exposes an installer');
assert.match(progressionRuntime,/dungeonSyncProgressionForState/,'historical external progression runtime delegates formulas back to monolith');
assert.doesNotMatch(progressionRuntime,/function levelFromXp|function progressionLevel/,
  'historical external runtime must not be mistaken for a pure progression formula service');

assert.match(statUpgradePolicy,/function wrapChange\(/,'stat upgrade policy remains a mutation wrapper boundary');
assert.match(statUpgradePolicy,/setTimeout\(/,'stat upgrade policy remains timer/retry coupled and outside first pure Core seam');

// Execute the real active Core 0.44 progression script with explicit profile data.
function runLevel(profile,xp){
  const ctx={
    console,
    document:{getElementById:()=>null,querySelector:()=>null},
    loadGameProfiles:()=>profile?[{id:'p',gameStyle:'dungeon',rpgUniverse:{progression:profile}}]:[],
    activeGameProfileId:()=> 'p',
    loadDungeonRpgRules:()=>({xpPerLevel:10,startingSkillPoints:0,skillPointsPerLevel:1}),
    rpgEditingId:'p'
  };
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(read('assets/gensrpg/core/progression-v1.js'),ctx,{filename:'progression-v1.js'});
  vm.runInContext(core044,ctx,{filename:'dungeonCore044HeroProgression'});
  return ctx.dungeonRpgLevelFromXp(xp);
}
assert.equal(runLevel({xpCurveMode:'linear',xpPerLevel:10,maxLevel:100},0),1);
assert.equal(runLevel({xpCurveMode:'linear',xpPerLevel:10,maxLevel:100},9),1);
assert.equal(runLevel({xpCurveMode:'linear',xpPerLevel:10,maxLevel:100},10),2);
assert.equal(runLevel({xpCurveMode:'linear',xpPerLevel:7,maxLevel:3},999),3,
  'custom linear xpPerLevel/maxLevel must beat defaults');
assert.equal(runLevel({xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}},29),3);
assert.equal(runLevel({xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}},30),4);
assert.equal(runLevel({xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}},70),5);

const selection={
  first:'pure XP-to-level curve contract',
  activeOwner:'dungeonCore044HeroProgression -> dungeonRpgLevelFromXp',
  futureCoreShape:'levelFromXp(xp, explicitProgressionConfig)',
  reasons:[
    'calculation is deterministic and data-driven',
    'linear/custom curves and maxLevel can be tested without DOM/storage',
    'manual XP, combat rewards, level-up UI and persistence can stay untouched',
    'existing progression-runtime-v1.js is non-production and wrapper-based, so it must not be connected as the Core formula owner'
  ],
  deferred:[
    'dungeonSyncProgressionForState: mutates hero state and combines skill/stat spending',
    'changeXP: mutation + persistence + render',
    'awardDungeonDefeatXp: combat participant distribution + persistence',
    'dungeonHandleLevelUp071: restore rules + persistence + queued UI/timer',
    'gens-stat-upgrade-policy-167898.js: points spending wrapper + UI + retries'
  ]
};

console.log(JSON.stringify({
  scenario:'Phase 4 Core Progression XP preaudit',
  index:{bytes:bytes.length,blob},
  productionProgressionRuntime:'inline',
  externalProgressionRuntime:'tests-docs-only',
  selection,
  runtimeChanged:false
},null,2));
