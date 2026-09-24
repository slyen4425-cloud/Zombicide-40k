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

assert.equal(indexBuf.length,8172118,'earned-points raccord RED must start from exact preaudit GREEN index');
assert.equal(gitBlob(indexBuf),'198207e3f52730498831f196caa35c4a0283e934','earned-points raccord RED index drifted');
assert.equal(gitBlob(coreBuf),'3cca29084ce436a8dcae95e5d6d745edd4afa3cf','Core Progression must remain byte-identical');

function scriptBody(id){
  const marker='<script id="'+id+'">';
  const s=index.indexOf(marker);assert.ok(s>=0,'missing '+id);
  const f=s+marker.length,e=index.indexOf('</script>',f);assert.ok(e>f,'unterminated '+id);
  return index.slice(f,e);
}
function extractWindowFunction(src,name){
  const needle='window.'+name+'=function';
  const p=src.indexOf(needle);assert.ok(p>=0,'missing '+name);
  const b=src.indexOf('{',p);let d=0,q=null,esc=false,line=false,block=false;
  for(let i=b;i<src.length;i++){
    const c=src[i],n=src[i+1]||'';
    if(line){if(c==='\n')line=false;continue}
    if(block){if(c==='*'&&n==='/'){block=false;i++;}continue}
    if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}
    if(c==='/'&&n==='/'){line=true;i++;continue}
    if(c==='/'&&n==='*'){block=true;i++;continue}
    if(c==="'"||c==='"'||c===String.fromCharCode(96)){q=c;continue}
    if(c==='{')d++; else if(c==='}'&&--d===0)return src.slice(p,i+1);
  }
  assert.fail('unterminated '+name);
}

const core044=scriptBody('dungeonCore044HeroProgression');
const earned=extractWindowFunction(core044,'dungeonRpgEarnedSkillPoints');

assert.match(owners,/^dungeonRpgEarnedSkillPoints\t1\tdungeonCore044HeroProgression$/m,
  'earned skill points owner must remain Core 0.44');
assert.match(earned,/GensProgressionV1\.earnedSkillPointsFromLevel\(/,
  'RED expected: runtime earned-points owner must delegate to Core');
assert.match(earned,/const p=activeProg\(\)/,'active progression boundary must remain');
assert.match(earned,/loadDungeonRpgRules\(\)/,'Dungeon rules fallback must remain');
assert.match(earned,/dungeonRpgLevelFromXp\(xp\)/,'canonical level seam must remain');
assert.doesNotMatch(earned,/Math\.max\(0,Number\(p\.startingSkillPoints\)|Math\.max\(0,r\.startingSkillPoints\)/,
  'local earned-points arithmetic must be removed after raccord');

const candidate='window.dungeonRpgEarnedSkillPoints=function(xp){const p=activeProg();if(!p){const r=loadDungeonRpgRules(),level=dungeonRpgLevelFromXp(xp);return GensProgressionV1.earnedSkillPointsFromLevel(level,null,r.startingSkillPoints,r.skillPointsPerLevel)}const level=dungeonRpgLevelFromXp(xp);return GensProgressionV1.earnedSkillPointsFromLevel(level,p)}';

function makeRuntime({profile=null,rules={xpPerLevel:10,startingSkillPoints:0,skillPointsPerLevel:1}}={}){
  let profilesCalls=0,rulesCalls=0,levelCalls=0,coreCalls=0;
  const ctx={
    console,
    document:{getElementById:()=>null,querySelector:()=>null},
    rpgEditingId:'p',
    loadGameProfiles:()=>{profilesCalls++;return profile?[{id:'p',gameStyle:'dungeon',rpgUniverse:{progression:profile}}]:[];},
    activeGameProfileId:()=> 'p',
    loadDungeonRpgRules:()=>{rulesCalls++;return rules;}
  };
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(coreSource,ctx,{filename:corePath});
  vm.runInContext(core044.replace(earned,candidate),ctx,{filename:'dungeonCore044HeroProgression'});
  const realLevel=ctx.dungeonRpgLevelFromXp;
  ctx.dungeonRpgLevelFromXp=(xp)=>{levelCalls++;return realLevel(xp)};
  const realEarned=ctx.GensProgressionV1.earnedSkillPointsFromLevel;
  ctx.GensProgressionV1=Object.freeze({...ctx.GensProgressionV1,earnedSkillPointsFromLevel:(...args)=>{coreCalls++;return realEarned(...args)}});
  return {
    call:xp=>ctx.dungeonRpgEarnedSkillPoints(xp),
    counts:()=>({profilesCalls,rulesCalls,levelCalls,coreCalls})
  };
}

const cases=[
  {profile:null,rules:{xpPerLevel:10,startingSkillPoints:2,skillPointsPerLevel:3},xs:[0,9,10,20,99]},
  {profile:{xpCurveMode:'linear',xpPerLevel:10,maxLevel:3,startingSkillPoints:2,talentPointsPerLevel:4},rules:{xpPerLevel:25,startingSkillPoints:99,skillPointsPerLevel:99},xs:[0,9,10,20,999]},
  {profile:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70},startingSkillPoints:3,talentPointsPerLevel:2},rules:{xpPerLevel:25,startingSkillPoints:99,skillPointsPerLevel:99},xs:[0,4,11,30,70,999]}
];
let n=0;
for(const s of cases)for(const xp of s.xs){
  const rt=makeRuntime(s);
  const value=rt.call(xp);
  assert.ok(Number.isFinite(value),'candidate result must remain numeric on characterized inputs');
  const c=rt.counts();
  assert.equal(c.coreCalls,1,'must delegate exactly once');
  assert.equal(c.levelCalls,1,'must read canonical level exactly once');
  assert.equal(c.rulesCalls,s.profile?0:2,'Dungeon rules read count drifted');
  assert.equal(c.profilesCalls,2,'active profile read count drifted');
  n++;
}
assert.ok(n>=15);

console.log(JSON.stringify({
  scenario:'Phase 4 Progression earned skill points runtime raccord',
  cases:n,
  owner:'dungeonCore044HeroProgression',
  seam:'dungeonRpgEarnedSkillPoints',
  target:'GensProgressionV1.earnedSkillPointsFromLevel',
  runtimeExpectedRed:false
},null,2));
