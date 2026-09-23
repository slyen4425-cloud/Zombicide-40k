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
const owners=fs.readFileSync(path.join(root,'docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv'),'utf8');
const gitBlob=buf=>crypto.createHash('sha1').update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');

assert.equal(indexBuf.length,8171576,'raccord RED must start from exact preaudit GREEN index');
assert.equal(gitBlob(indexBuf),'12be0fdbaa5c05f7852933b48a3dd5df09da6145','raccord RED index drifted');
assert.equal(gitBlob(coreBuf),'3cca29084ce436a8dcae95e5d6d745edd4afa3cf','Core Progression must remain byte-identical');

function scriptBody(id){
  const marker='<script id="'+id+'">';
  const start=index.indexOf(marker);
  assert.ok(start>=0,'missing '+id);
  const from=start+marker.length,end=index.indexOf('</script>',from);
  assert.ok(end>from,'unterminated '+id);
  return index.slice(from,end);
}
function extractWindowFunction(src,name){
  const needle='window.'+name+'=function';
  const pos=src.indexOf(needle);assert.ok(pos>=0,'missing '+name);
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
  assert.fail('unterminated '+name);
}

const core044=scriptBody('dungeonCore044HeroProgression');
const xpInto=extractWindowFunction(core044,'dungeonRpgXpIntoLevel');
const earned=extractWindowFunction(core044,'dungeonRpgEarnedSkillPoints');

assert.match(owners,/^dungeonRpgXpIntoLevel\t1\tdungeonCore044HeroProgression$/m,
  'XP-into-level owner must remain Core 0.44');
assert.match(owners,/^dungeonRpgEarnedSkillPoints\t1\tdungeonCore044HeroProgression$/m,
  'earned-points owner must remain unchanged');

assert.match(xpInto,/GensProgressionV1\.xpIntoLevel\(v,p,fallback\)/,
  'RED expected: runtime XP-into-level owner must delegate to Core');
assert.match(xpInto,/const p=activeProg\(\),v=Math\.max\(0,Number\(xp\)\|\|0\)/,
  'historical active-profile and XP normalization boundary must remain');
assert.match(xpInto,/needsFallback=.*!Number\(p\?\.xpPerLevel\)/,
  'Dungeon fallback must remain lazy and depend on the historical numeric short-circuit');
assert.match(xpInto,/fallback=needsFallback\?loadDungeonRpgRules\(\)\.xpPerLevel:undefined/,
  'Dungeon rules must only be read when the fallback is actually required');
assert.doesNotMatch(xpInto,/dungeonRpgLevelFromXp|xpThresholds|%/,
  'runtime owner must stop duplicating level/custom/modulo math after raccord');
assert.match(earned,/dungeonRpgLevelFromXp\(xp\)/,
  'earned skill points stays deferred');

function makeRuntime({profile=null,rules={xpPerLevel:10}}={}){
  let rulesCalls=0,profilesCalls=0,coreCalls=0;
  const ctx={
    console,
    document:{getElementById:()=>null,querySelector:()=>null},
    loadGameProfiles:()=>{profilesCalls++;return profile?[{id:'p',gameStyle:'dungeon',rpgUniverse:{progression:profile}}]:[];},
    activeGameProfileId:()=> 'p',
    loadDungeonRpgRules:()=>{rulesCalls++;return rules;},
    rpgEditingId:'p'
  };
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(coreSource,ctx,{filename:corePath});
  const pureLevel=ctx.GensProgressionV1.levelFromXp;
  const pureInto=ctx.GensProgressionV1.xpIntoLevel;
  ctx.GensProgressionV1=Object.freeze({
    VERSION:ctx.GensProgressionV1.VERSION,
    levelFromXp:pureLevel,
    xpIntoLevel:(xp,p,fallback)=>{coreCalls++;return pureInto(xp,p,fallback);}
  });
  vm.runInContext(core044,ctx,{filename:'dungeonCore044HeroProgression'});
  return {
    call:xp=>ctx.dungeonRpgXpIntoLevel(xp),
    pureInto,
    counts:()=>({rulesCalls,profilesCalls,coreCalls})
  };
}
function sameValue(a,b,label){
  if(Number.isNaN(a)&&Number.isNaN(b))return;
  assert.equal(a,b,label);
}

const scenarios=[
  {name:'no profile 25',profile:null,rules:{xpPerLevel:25},xs:[undefined,-9,0,1,24,25,50,63,'63',2500]},
  {name:'no profile zero',profile:null,rules:{xpPerLevel:0},xs:[0,9,10,23,99]},
  {name:'no profile bad',profile:null,rules:{xpPerLevel:'bad'},xs:[0,1,23,99]},
  {name:'no profile negative',profile:null,rules:{xpPerLevel:-5},xs:[0,1,23,99]},
  {name:'linear 7',profile:{xpCurveMode:'linear',xpPerLevel:7,maxLevel:100},rules:{xpPerLevel:25},xs:[0,6,7,20,21,28,29,63,100,101,123,999,1000]},
  {name:'linear zero',profile:{xpCurveMode:'linear',xpPerLevel:0,maxLevel:100},rules:{xpPerLevel:25},xs:[0,24,25,63,999]},
  {name:'linear bad',profile:{xpCurveMode:'linear',xpPerLevel:'bad',maxLevel:100},rules:{xpPerLevel:25},xs:[0,24,25,63,999]},
  {name:'linear negative',profile:{xpCurveMode:'linear',xpPerLevel:-5,maxLevel:100},rules:{xpPerLevel:25},xs:[0,1,63,999]},
  {name:'custom full',profile:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}},rules:{xpPerLevel:25},xs:[0,3,4,10,11,29,30,69,70,99,999]},
  {name:'custom sparse',profile:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:5,4:40,5:'bad'}},rules:{xpPerLevel:25},xs:[0,4,5,19,20,39,40,99,999]}
];

let cases=0;
for(const s of scenarios){
  for(const xp of s.xs){
    const rt=makeRuntime({profile:s.profile,rules:s.rules});
    const custom=!!s.profile&&((s.profile.xpCurveMode||'linear')==='custom');
    const numericProfilePer=s.profile?Number(s.profile.xpPerLevel):0;
    const needsFallback=(!s.profile||!custom)&&!numericProfilePer;
    const fallback=needsFallback?s.rules.xpPerLevel:undefined;
    const expected=rt.pureInto(Math.max(0,Number(xp)||0),s.profile,fallback);
    const actual=rt.call(xp);
    sameValue(actual,expected,s.name+' xp='+String(xp));
    const c=rt.counts();
    assert.equal(c.coreCalls,1,s.name+' must delegate exactly once to Core');
    assert.equal(c.rulesCalls,needsFallback?1:0,s.name+' Dungeon fallback read count drifted');
    assert.equal(c.profilesCalls,1,s.name+' active profile must be read exactly once');
    cases++;
  }
}
assert.ok(cases>=70,'expected broad raccord parity matrix');

console.log(JSON.stringify({
  scenario:'Phase 4 Progression xpIntoLevel runtime raccord',
  cases,
  coreCallsPerCase:1,
  lazyDungeonFallback:true,
  coreBlob:gitBlob(coreBuf),
  deferred:['dungeonRpgEarnedSkillPoints','sync/manual XP/rewards/level-up','persistence/UI']
},null,2));
