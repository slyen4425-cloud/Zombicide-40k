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

assert.equal(indexBuf.length,8174416,'raccord preaudit must use exact contract GREEN index');
assert.equal(gitBlob(indexBuf),'a68bcbaf5d16bdbe2e70cbe0959a421371554fcc','runtime index drifted');
assert.equal(gitBlob(coreBuf),'f633de55f1e6bda339e66c65debc35d7b8da2510','Core Progression contract drifted');

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
const currentXpInto=extractWindowFunction(core044,'dungeonRpgXpIntoLevel');
const currentLevel=extractWindowFunction(core044,'dungeonRpgLevelFromXp');
const earned=extractWindowFunction(core044,'dungeonRpgEarnedSkillPoints');

assert.match(owners,/^dungeonRpgXpIntoLevel\t1\tdungeonCore044HeroProgression$/m);
assert.match(owners,/^dungeonRpgLevelFromXp\t1\tdungeonCore044HeroProgression$/m);
assert.match(currentLevel,/return GensProgressionV1\.levelFromXp\(v,p\)/,
  'configured level seam must already delegate directly to Core');
assert.doesNotMatch(currentXpInto,/GensProgressionV1\.xpIntoLevel/,
  'raccord preaudit must remain runtime-inert');
assert.match(earned,/dungeonRpgLevelFromXp\(xp\)/,
  'earned skill points must remain outside this raccord');

const candidate='window.dungeonRpgXpIntoLevel=function(xp){const p=activeProg(),v=Math.max(0,Number(xp)||0),fallback=(!p||(p.xpCurveMode||"linear")!=="custom")?loadDungeonRpgRules().xpPerLevel:undefined;return GensProgressionV1.xpIntoLevel(v,p,fallback)}';
assert.notEqual(candidate,currentXpInto,'candidate must differ from current owner');

function makeRuntime({profile=null,rules={xpPerLevel:10},candidateMode=false}={}){
  let rulesCalls=0,profilesCalls=0,profileIdCalls=0;
  const ctx={
    console,
    document:{getElementById:()=>null,querySelector:()=>null},
    loadGameProfiles:()=>{profilesCalls++;return profile?[{id:'p',gameStyle:'dungeon',rpgUniverse:{progression:profile}}]:[];},
    activeGameProfileId:()=>{profileIdCalls++;return 'p';},
    loadDungeonRpgRules:()=>{rulesCalls++;return rules;},
    rpgEditingId:'p'
  };
  ctx.window=ctx;ctx.globalThis=ctx;
  vm.createContext(ctx);
  vm.runInContext(coreSource,ctx,{filename:corePath});
  const source=candidateMode?core044.replace(currentXpInto,candidate):core044;
  vm.runInContext(source,ctx,{filename:candidateMode?'candidate-core044':'legacy-core044'});
  return {
    call:xp=>ctx.dungeonRpgXpIntoLevel(xp),
    counts:()=>({rulesCalls,profilesCalls,profileIdCalls})
  };
}

function sameValue(a,b,label){
  if(Number.isNaN(a)&&Number.isNaN(b))return;
  assert.equal(a,b,label);
}

const scenarios=[
  {name:'no profile 25',profile:null,rules:{xpPerLevel:25},xs:[undefined,-9,0,1,24,25,50,63,'63',2500]},
  {name:'no profile zero fallback',profile:null,rules:{xpPerLevel:0},xs:[0,9,10,23,99]},
  {name:'no profile bad fallback',profile:null,rules:{xpPerLevel:'bad'},xs:[0,1,23,99]},
  {name:'no profile negative fallback',profile:null,rules:{xpPerLevel:-5},xs:[0,1,23,99]},
  {name:'linear 7',profile:{xpCurveMode:'linear',xpPerLevel:7,maxLevel:100},rules:{xpPerLevel:25},xs:[0,6,7,20,21,28,29,63,999]},
  {name:'linear zero',profile:{xpCurveMode:'linear',xpPerLevel:0,maxLevel:100},rules:{xpPerLevel:25},xs:[0,24,25,63,999]},
  {name:'linear bad',profile:{xpCurveMode:'linear',xpPerLevel:'bad',maxLevel:100},rules:{xpPerLevel:25},xs:[0,24,25,63,999]},
  {name:'linear negative',profile:{xpCurveMode:'linear',xpPerLevel:-5,maxLevel:100},rules:{xpPerLevel:25},xs:[0,1,63,999]},
  {name:'custom full',profile:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}},rules:{xpPerLevel:25},xs:[0,3,4,10,11,29,30,69,70,99,999]},
  {name:'custom sparse',profile:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:5,4:40,5:'bad'}},rules:{xpPerLevel:25},xs:[0,4,5,19,20,39,40,99,999]}
];

let parityCases=0;
for(const s of scenarios){
  for(const xp of s.xs){
    const legacy=makeRuntime({profile:s.profile,rules:s.rules,candidateMode:false});
    const next=makeRuntime({profile:s.profile,rules:s.rules,candidateMode:true});
    const a=legacy.call(xp),b=next.call(xp);
    sameValue(a,b,s.name+' xp='+String(xp));
    const lc=legacy.counts(),nc=next.counts();

    const custom=!!s.profile&&((s.profile.xpCurveMode||'linear')==='custom');
    if(custom){
      assert.equal(lc.rulesCalls,0,s.name+' legacy must not read Dungeon rules in custom mode');
      assert.equal(nc.rulesCalls,0,s.name+' candidate must keep Dungeon fallback lazy in custom mode');
      assert.equal(lc.profilesCalls,2,s.name+' legacy custom path currently re-reads active profile through level seam');
      assert.equal(nc.profilesCalls,1,s.name+' candidate removes only the redundant second active-profile read');
    }else{
      assert.equal(lc.rulesCalls,1,s.name+' legacy linear/no-profile reads Dungeon rules once');
      assert.equal(nc.rulesCalls,1,s.name+' candidate linear/no-profile must read Dungeon rules once');
      assert.equal(lc.profilesCalls,1,s.name+' legacy profile lookup count drifted');
      assert.equal(nc.profilesCalls,1,s.name+' candidate profile lookup count drifted');
    }
    parityCases++;
  }
}

assert.ok(parityCases>=70,'expected broad parity matrix');
assert.doesNotMatch(candidate,/dungeonRpgEarnedSkillPoints|dungeonSyncProgressionForState|changeXP|save|render|document\.|setTimeout|setInterval/,
  'candidate must stay inside the XP-into-level calculation boundary');

console.log(JSON.stringify({
  scenario:'Phase 4 Progression xpIntoLevel raccord preaudit',
  selectedOwner:'dungeonCore044HeroProgression -> dungeonRpgXpIntoLevel',
  candidate,
  parityCases,
  customDungeonRulesCalls:0,
  acceptedSubtraction:'custom branch removes one redundant activeProg()/level global round-trip; level math remains the same Core levelFromXp',
  deferred:[
    'dungeonRpgEarnedSkillPoints',
    'dungeonSyncProgressionForState',
    'changeXP',
    'combat/objective XP distribution',
    'dungeonHandleLevelUp071',
    'persistence/UI'
  ],
  runtimeChanged:false
},null,2));
