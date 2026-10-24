const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const rel='assets/gensrpg/core/progression-v1.js';
const source=fs.readFileSync(path.join(root,rel),'utf8');
const ctx={console};ctx.window=ctx;ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(source,ctx,{filename:rel});
const P=ctx.GensProgressionV1;
assert.ok(P);
assert.equal(typeof P.levelFromXp,'function');
assert.equal(typeof P.xpIntoLevel,'function');
assert.equal(typeof P.earnedSkillPointsFromLevel,'function','RED until earnedSkillPointsFromLevel exists');
const earned=P.earnedSkillPointsFromLevel;
const cases=[
  // configured profile policy
  {l:1,p:{startingSkillPoints:2,talentPointsPerLevel:3},a:99,b:99,e:2},
  {l:2,p:{startingSkillPoints:2,talentPointsPerLevel:3},a:99,b:99,e:5},
  {l:5,p:{startingSkillPoints:2,talentPointsPerLevel:3},a:99,b:99,e:14},
  {l:3,p:{startingSkillPoints:'3',talentPointsPerLevel:'2'},a:99,b:99,e:7},
  {l:3,p:{startingSkillPoints:-3,talentPointsPerLevel:-2},a:99,b:99,e:0},
  {l:3,p:{startingSkillPoints:'bad',talentPointsPerLevel:'bad'},a:99,b:99,e:0},
  {l:100,p:{},a:7,b:4,e:0},
  // no-profile fallback policy
  {l:1,p:null,a:2,b:3,e:2},
  {l:2,p:null,a:2,b:3,e:5},
  {l:5,p:null,a:2,b:3,e:14},
  {l:3,p:null,a:'3',b:'2',e:7},
  {l:3,p:null,a:-3,b:-2,e:0},
  {l:3,p:null,a:'bad',b:2,e:NaN},
  {l:3,p:null,a:1,b:'bad',e:NaN},
];
for(const c of cases){const v=earned(c.l,c.p,c.a,c.b);if(Number.isNaN(c.e))assert.ok(Number.isNaN(v));else assert.equal(v,c.e);}
for(const bad of [undefined,null,0,-5,'bad']){
  const v=earned(bad,{startingSkillPoints:2,talentPointsPerLevel:3},99,99);
  assert.equal(v,2,'noncanonical level normalization stays at zero gained levels');
}
const profile={startingSkillPoints:2,talentPointsPerLevel:3};const before=JSON.stringify(profile);
assert.equal(earned(4,profile,99,99),11);assert.equal(JSON.stringify(profile),before);
assert.equal(P.levelFromXp(20,{xpCurveMode:'linear',xpPerLevel:10,maxLevel:100}),3);
assert.equal(P.xpIntoLevel(23,{xpCurveMode:'linear',xpPerLevel:10,maxLevel:100},25),3);
assert.ok(Object.isFrozen(P));
console.log(JSON.stringify({scenario:'Phase 4 pure earned skill points from canonical level contract',cases:cases.length,runtimeConnected:false},null,2));
