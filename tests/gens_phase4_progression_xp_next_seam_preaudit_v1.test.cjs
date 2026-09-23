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
const owners=read('docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv');

const gitBlob=buf=>crypto.createHash('sha1')
  .update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');

assert.equal(indexBuf.length,8172500,'next-seam preaudit must run on exact first-raccord GREEN index');
assert.equal(gitBlob(indexBuf),'7b586e9fb14b7a93a0edb069e115fd6d48cbda97','next-seam preaudit index blob drifted');
assert.equal(gitBlob(coreBuf),'3cca29084ce436a8dcae95e5d6d745edd4afa3cf','current Core Progression contract blob drifted');

function scriptBody(id){
  const marker='<script id="'+id+'">';
  const start=index.indexOf(marker);
  assert.ok(start>=0,'missing inline script '+id);
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
    if(block){if(c==='*'&&n==='/'){block=false;i++}continue}
    if(quote){if(escape){escape=false;continue}if(c==='\\'){escape=true;continue}if(c===quote)quote=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==="'"||c==='"'||c===String.fromCharCode(96)){quote=c;continue}
    if(c==='{')depth++; else if(c==='}'&&--depth===0)return src.slice(pos,i+1);
  }
  assert.fail('unterminated window function '+name);
}

const core044=scriptBody('dungeonCore044HeroProgression');
const xpIntoFn=extractWindowFunction(core044,'dungeonRpgXpIntoLevel');
const earnedFn=extractWindowFunction(core044,'dungeonRpgEarnedSkillPoints');

assert.match(owners,/^dungeonRpgXpIntoLevel\t1\tdungeonCore044HeroProgression$/m,
  'Core 0.44 must remain the active XP-into-level owner');
assert.match(owners,/^dungeonRpgEarnedSkillPoints\t1\tdungeonCore044HeroProgression$/m,
  'Core 0.44 must remain the active earned-points owner');
assert.equal((index.match(/\bdungeonRpgXpIntoLevel\b/g)||[]).length,5,
  'XP-into-level identifier inventory drifted');

assert.match(xpIntoFn,/const p=activeProg\(\),v=Math\.max\(0,Number\(xp\)\|\|0\)/,
  'XP normalization boundary drifted');
assert.match(xpIntoFn,/needsFallback=\(!p\|\|\(p\.xpCurveMode\|\|"linear"\)!=="custom"\)&&!Number\(p\?\.xpPerLevel\)/,
  'later raccord must preserve the preaudited lazy Dungeon fallback condition');
assert.match(xpIntoFn,/fallback=needsFallback\?loadDungeonRpgRules\(\)\.xpPerLevel:undefined/,
  'later raccord must preserve lazy Dungeon-rules evaluation');
assert.match(xpIntoFn,/GensProgressionV1\.xpIntoLevel\(v,p,fallback\)/,
  'later dedicated raccord must delegate XP-into-level to Core');
assert.doesNotMatch(xpIntoFn,/dungeonRpgLevelFromXp|p\.xpThresholds|%/,
  'later raccord must retire the local level/custom/modulo implementation');
assert.doesNotMatch(xpIntoFn,/localStorage|document\.|setTimeout|setInterval|save\(|render\(/,
  'XP-into-level owner must remain calculation-only');

assert.match(earnedFn,/dungeonRpgLevelFromXp\(xp\)/,
  'earned points depends on the level seam');
assert.match(earnedFn,/startingSkillPoints|skillPointsPerLevel|talentPointsPerLevel/,
  'earned points mixes level with points policy and stays deferred');

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
  assert.equal(typeof ctx.GensProgressionV1.xpIntoLevel,'function',
    'dedicated pure contract lot must expose xpIntoLevel while runtime owner stays unraccorded');
  const originalLevel=ctx.dungeonRpgLevelFromXp;
  let levelCalls=0;
  ctx.dungeonRpgLevelFromXp=function(xp){levelCalls++;return originalLevel(xp)};
  return {ctx,levelCalls:()=>levelCalls,reset:()=>{levelCalls=0}};
}

// 1) No profile: exact legacy Dungeon rules remain authoritative.
{
  const r=runtime({profile:null,rules:{xpPerLevel:25}});
  const cases=[[undefined,0],[-9,0],[0,0],[24,24],[25,0],[50,0],[63,13],['63',13]];
  for(const [xp,expected] of cases){
    r.reset();assert.equal(r.ctx.dungeonRpgXpIntoLevel(xp),expected,'no-profile xp='+String(xp));
    assert.equal(r.levelCalls(),0,'no-profile branch must not call level seam');
  }
}

// 2) Linear profile: profile per-level wins, but invalid/zero profile values fall back to Dungeon rules.
{
  const r=runtime({profile:{xpCurveMode:'linear',xpPerLevel:7,maxLevel:100},rules:{xpPerLevel:25}});
  for(const [xp,expected] of [[20,6],[21,0],[28,0],['29',1]]){
    r.reset();assert.equal(r.ctx.dungeonRpgXpIntoLevel(xp),expected,'linear xp='+String(xp));
    assert.equal(r.levelCalls(),0,'linear branch must not call level seam');
  }
}
{
  const r=runtime({profile:{xpCurveMode:'linear',xpPerLevel:0,maxLevel:100},rules:{xpPerLevel:25}});
  assert.equal(r.ctx.dungeonRpgXpIntoLevel(63),13,
    'zero profile xpPerLevel must preserve Dungeon rules fallback');
  assert.equal(r.levelCalls(),0);
}
{
  const r=runtime({profile:{xpCurveMode:'linear',xpPerLevel:-5,maxLevel:100},rules:{xpPerLevel:25}});
  assert.equal(r.ctx.dungeonRpgXpIntoLevel(63),0,
    'negative profile xpPerLevel is truthy then clamped to one; preserve exact legacy coercion');
  assert.equal(r.levelCalls(),0);
}

// 3) Custom profile: current canonical level determines the current threshold offset.
{
  const profile={xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}};
  const r=runtime({profile,rules:{xpPerLevel:25}});
  const cases=[[0,0],[3,3],[4,0],[10,6],[11,0],[29,18],[30,0],[69,39],[70,0],[99,29],[999,929]];
  for(const [xp,expected] of cases){
    r.reset();assert.equal(r.ctx.dungeonRpgXpIntoLevel(xp),expected,'custom xp='+String(xp));
    assert.equal(r.levelCalls(),0,'later Core raccord must remove the redundant global level-seam round trip');
  }
}

// Missing/invalid custom thresholds have intentionally non-obvious legacy semantics:
// levelFromXp may advance using fallback thresholds while xpIntoLevel subtracts only an explicit
// current-level threshold, otherwise zero.
{
  const profile={xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:5,4:40,5:'bad'}};
  const r=runtime({profile,rules:{xpPerLevel:25}});
  for(const [xp,expected] of [[20,20],[39,39],[40,40],[99,99]]){
    r.reset();assert.equal(r.ctx.dungeonRpgXpIntoLevel(xp),expected,'sparse custom xp='+String(xp));
    assert.equal(r.levelCalls(),0);
  }
}

const selection={
  selected:'dungeonRpgXpIntoLevel',
  owner:'dungeonCore044HeroProgression',
  reason:[
    'calculation-only and deterministic once profile plus Dungeon fallback are explicit',
    'read-only consumer of the already-canonical level seam in custom mode',
    'no persistence, DOM, timer, reward, spending or mutation authority'
  ],
  futureCoreShape:'xpIntoLevel(xp, explicitProgressionConfig, fallbackXpPerLevel)',
  preserve:[
    'Math.max(0, Number(xp) || 0)',
    'Dungeon xpPerLevel fallback for no-profile and invalid/zero linear profile values',
    'negative profile xpPerLevel truthy-then-clamp-to-one coercion',
    'custom current-level explicit-threshold subtraction, including sparse/invalid threshold behavior'
  ],
  deferred:[
    'dungeonRpgEarnedSkillPoints',
    'dungeonSyncProgressionForState',
    'changeXP',
    'combat/objective XP distribution',
    'dungeonHandleLevelUp071',
    'persistence/UI/restore'
  ],
  nextAction:'create a pure Core contract with characterization parity before any runtime raccord'
};

console.log(JSON.stringify({
  scenario:'Phase 4 Progression XP next-seam preaudit',
  selection,
  runtimeChanged:true
},null,2));
