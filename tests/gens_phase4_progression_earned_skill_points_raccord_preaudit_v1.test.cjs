const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const crypto=require('node:crypto');
const path=require('node:path');
const root=path.join(__dirname,'..');
const indexBuf=fs.readFileSync(path.join(root,'index.html'));
const index=indexBuf.toString('utf8');
const corePath='assets/gensrpg/core/progression-v1.js';
const coreSource=fs.readFileSync(path.join(root,corePath),'utf8');
function gitBlob(b){return crypto.createHash('sha1').update(Buffer.from('blob '+b.length+'\0')).update(b).digest('hex')}
assert.equal(indexBuf.length,8172610);
assert.equal(gitBlob(indexBuf),'eddba424d3ebb086a1bdd0bcc1b1822d16a83771');
assert.equal(gitBlob(Buffer.from(coreSource)),'3cca29084ce436a8dcae95e5d6d745edd4afa3cf');
function scriptBody(id){const marker='<script id="'+id+'">';const s=index.indexOf(marker),f=s+marker.length,e=index.indexOf('</script>',f);assert.ok(s>=0&&e>f);return index.slice(f,e)}
function extractFunction(src,name){const needle='function '+name+'(';const p=src.indexOf(needle);assert.ok(p>=0,'missing '+name);const b=src.indexOf('{',p);let d=0,q=null,esc=false,line=false,block=false;for(let i=b;i<src.length;i++){const c=src[i],n=src[i+1]||'';if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;i++}continue}if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}if(c==='/'&&n==='/'){line=true;i++;continue}if(c==='/'&&n==='*'){block=true;i++;continue}if(c==="'"||c==='"'||c==='`'){q=c;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return src.slice(p,i+1)}throw Error('unterminated '+name)}
function extractWindowFunction(src,name){const needle='window.'+name+'=function';const p=src.indexOf(needle);assert.ok(p>=0,'missing window '+name);const b=src.indexOf('{',p);let d=0,q=null,esc=false,line=false,block=false;for(let i=b;i<src.length;i++){const c=src[i],n=src[i+1]||'';if(line){if(c==='\n')line=false;continue}if(block){if(c==='*'&&n==='/'){block=false;i++}continue}if(q){if(esc){esc=false;continue}if(c==='\\'){esc=true;continue}if(c===q)q=null;continue}if(c==='/'&&n==='/'){line=true;i++;continue}if(c==='/'&&n==='*'){block=true;i++;continue}if(c==="'"||c==='"'||c==='`'){q=c;continue}if(c==='{')d++;else if(c==='}'&&--d===0)return src.slice(p,i+1)}throw Error('unterminated '+name)}
const defaultFn=extractFunction(index,'defaultDungeonRpgRules');
const normalizeFn=extractFunction(index,'normalizeDungeonRpgRules');
const core044=scriptBody('dungeonCore044HeroProgression');
const current=extractWindowFunction(core044,'dungeonRpgEarnedSkillPoints');
const candidate='window.dungeonRpgEarnedSkillPoints=function(xp){const p=activeProg();if(!p){const r=loadDungeonRpgRules(),level=dungeonRpgLevelFromXp(xp);return GensProgressionV1.earnedSkillPointsFromLevel(level,null,r.startingSkillPoints,r.skillPointsPerLevel)}const level=dungeonRpgLevelFromXp(xp);return GensProgressionV1.earnedSkillPointsFromLevel(level,p)}';
const legacy='window.dungeonRpgEarnedSkillPoints=function(xp){const p=activeProg();if(!p){const r=loadDungeonRpgRules();return Math.max(0,r.startingSkillPoints)+Math.max(0,dungeonRpgLevelFromXp(xp)-1)*Math.max(0,r.skillPointsPerLevel)}const level=dungeonRpgLevelFromXp(xp);return Math.max(0,Number(p.startingSkillPoints)||0)+Math.max(0,level-1)*Math.max(0,Number(p.talentPointsPerLevel)||0)}';
assert.match(current,/activeProg\(\)/);
assert.match(current,/loadDungeonRpgRules\(\)/);
assert.match(current,/dungeonRpgLevelFromXp\(xp\)/);
assert.equal(current,candidate,'dedicated raccord must install exactly the preaudited candidate');
assert.match(candidate,/GensProgressionV1\.earnedSkillPointsFromLevel/);
const ABS=Symbol('abs'),MISS=Symbol('miss');
function run({profile=ABS,gameStyle='dungeon',rawRules={},xp=0,candidateMode=false}){
  const events=[];
  const profiles=profile===ABS?[]:[{id:'p',gameStyle,rpgUniverse:profile===MISS?{}:{progression:profile}}];
  const store=JSON.stringify(rawRules||{});
  const ctx={console,document:{getElementById:()=>null,querySelector:()=>null},rpgEditingId:'p',GENS_DUNGEON_RPG_RULES_KEY:'rules',events};
  ctx.window=ctx;ctx.globalThis=ctx;
  ctx.localStorage={getItem:(k)=>{assert.equal(k,'rules');events.push('storage');return store}};
  ctx.loadGameProfiles=()=>{events.push('profiles');return profiles};
  ctx.activeGameProfileId=()=>{events.push('profileId');return 'p'};
  vm.createContext(ctx);
  vm.runInContext(defaultFn+'\n'+normalizeFn+'\nfunction loadDungeonRpgRules(){events.push("rules");try{return normalizeDungeonRpgRules(JSON.parse(localStorage.getItem(GENS_DUNGEON_RPG_RULES_KEY)||"{}"))}catch(e){return defaultDungeonRpgRules()}}',ctx);
  vm.runInContext(coreSource,ctx);
  const originalEarned=ctx.GensProgressionV1.earnedSkillPointsFromLevel;
  ctx.GensProgressionV1=Object.freeze({...ctx.GensProgressionV1,earnedSkillPointsFromLevel:(...args)=>{events.push('coreEarned');return originalEarned(...args)}});
  vm.runInContext(candidateMode?core044:core044.replace(current,legacy),ctx);
  return {value:ctx.dungeonRpgEarnedSkillPoints(xp),events};
}
function sameValue(a,b,label){if(Number.isNaN(a)&&Number.isNaN(b))return;assert.equal(a,b,label)}
const suites=[
 {name:'no profile defaults',profile:ABS,rawRules:{},xs:[undefined,-9,0,1,9,10,11,20,99,100,999,'20','bad',Infinity]},
 {name:'no profile custom rules',profile:ABS,rawRules:{xpPerLevel:25,startingSkillPoints:2,skillPointsPerLevel:3},xs:[0,24,25,49,50,63,249,250,999,1000]},
 {name:'no profile invalid raw rules normalized',profile:ABS,rawRules:{xpPerLevel:'bad',startingSkillPoints:'bad',skillPointsPerLevel:'bad'},xs:[0,10,20,99]},
 {name:'no profile negative raw rules normalized',profile:ABS,rawRules:{xpPerLevel:-5,startingSkillPoints:-3,skillPointsPerLevel:-2},xs:[0,1,20,99]},
 {name:'profile linear',profile:{xpCurveMode:'linear',xpPerLevel:10,maxLevel:3,startingSkillPoints:2,talentPointsPerLevel:4},rawRules:{xpPerLevel:25,startingSkillPoints:99,skillPointsPerLevel:99},xs:[0,9,10,19,20,29,30,999,'20','bad',Infinity]},
 {name:'profile custom',profile:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70},startingSkillPoints:3,talentPointsPerLevel:2},rawRules:{xpPerLevel:25,startingSkillPoints:99,skillPointsPerLevel:99},xs:[0,3,4,10,11,29,30,69,70,999]},
 {name:'empty configured progression',profile:{},rawRules:{xpPerLevel:25,startingSkillPoints:7,skillPointsPerLevel:4},xs:[0,10,20,99]},
 {name:'missing progression object',profile:MISS,rawRules:{xpPerLevel:10,startingSkillPoints:2,skillPointsPerLevel:1},xs:[0,10,20,99]},
 {name:'non dungeon profile',profile:{startingSkillPoints:99,talentPointsPerLevel:99},gameStyle:'survival',rawRules:{xpPerLevel:10,startingSkillPoints:1,skillPointsPerLevel:2},xs:[0,10,20,99]},
];
let parity=0;
for(const s of suites){for(const xp of s.xs){
  const a=run({...s,xp,candidateMode:false});
  const b=run({...s,xp,candidateMode:true});
  sameValue(a.value,b.value,s.name+' '+String(xp));
  // Candidate may add only the Core earned call; all owner reads before it must stay in same order.
  assert.deepEqual(b.events.filter(x=>x!=='coreEarned'),a.events,s.name+' event order '+String(xp));
  assert.equal(b.events.filter(x=>x==='coreEarned').length,1,s.name+' Core call count '+String(xp));
  parity++;
}}
// Explicitly prove the previously suspected NaN case is normalized by the real rules owner.
for(const bad of ['bad',undefined,NaN]){
  const a=run({profile:ABS,rawRules:{xpPerLevel:bad,startingSkillPoints:2,skillPointsPerLevel:3},xp:20,candidateMode:false});
  const b=run({profile:ABS,rawRules:{xpPerLevel:bad,startingSkillPoints:2,skillPointsPerLevel:3},xp:20,candidateSode:true});
  assert.equal(a.value,8); assert.equal(b.value,8); assert.ok(!Number.isNaN(a.value)); assert.ok(!Number.isNaN(b.value));
}
assert.ok(parity>=60);
console.log(JSON.stringify({scenario:'Phase 4 earned skill points raccord preaudit real path',parityCases:parity,indexBlob:gitBlob(indexBuf),coreBlob:gitBlob(Buffer.from(coreSource)),owner:'dungeonCore044HeroProgression',selected:'dungeonRpgEarnedSkillPoints',candidateDelegates:'GensProgressionV1.earnedSkillPointsFromLevel',normalizationOwner:'normalizeDungeonRpgRules via loadDungeonRpgRules',runtimeChanged:true},null,2));
