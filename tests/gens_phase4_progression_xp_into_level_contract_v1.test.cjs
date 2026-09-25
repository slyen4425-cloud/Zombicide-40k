const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const corePath='assets/gensrpg/core/progression-v1.js';
const coreBuf=fs.readFileSync(path.join(root,corePath));
const coreSource=coreBuf.toString('utf8');
const indexBuf=fs.readFileSync(path.join(root,'index.html'));
const index=indexBuf.toString('utf8');

const gitBlob=buf=>crypto.createHash('sha1')
  .update(Buffer.from('blob '+buf.length+'\0')).update(buf).digest('hex');

assert.equal(indexBuf.length,8169596,'contract lot must stay on exact preaudit GREEN index');
assert.equal(gitBlob(indexBuf),'d451372389f29d0145d3f9689ca739128a0650e9','index runtime must remain untouched by pure contract lot');

assert.doesNotMatch(coreSource,/\bdocument\b|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|dispatchEvent|CustomEvent|fetch\s*\(|XMLHttpRequest|Math\.random/,
  'Core Progression contract must remain pure and infrastructure-free');

const marker='<script id="dungeonCore044HeroProgression">';
const s0=index.indexOf(marker);
assert.ok(s0>=0,'Core 0.44 owner missing');
const s1=index.indexOf('</script>',s0+marker.length);
assert.ok(s1>s0,'Core 0.44 owner script unterminated');
const core044=index.slice(s0+marker.length,s1);

function extractWindowFunction(src,name){
  const needle='window.'+name+'=function';
  const pos=src.indexOf(needle);assert.ok(pos>=0,'missing '+name);
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
  assert.fail('unterminated '+name);
}

const ownerFn=extractWindowFunction(core044,'dungeonRpgXpIntoLevel');
assert.match(ownerFn,/GensProgressionV1\.xpIntoLevel\(v,p,fallback\)/,
  'later dedicated runtime lot must consume the pure contract through the canonical owner');

const ctx={console};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(coreSource,ctx,{filename:corePath});

assert.ok(ctx.GensProgressionV1,'Core Progression API missing');
assert.equal(typeof ctx.GensProgressionV1.levelFromXp,'function','existing levelFromXp API must stay present');
assert.equal(typeof ctx.GensProgressionV1.xpIntoLevel,'function',
  'RED until pure xpIntoLevel contract exists');

const xpInto=ctx.GensProgressionV1.xpIntoLevel;

// Existing level contract must remain stable while the new primitive is added.
assert.equal(ctx.GensProgressionV1.levelFromXp(50,{xpCurveMode:'linear',xpPerLevel:10,maxLevel:100}),6);
assert.equal(ctx.GensProgressionV1.levelFromXp(2500,{xpCurveMode:'linear',xpPerLevel:25,maxLevel:100}),100);

const cases=[
  // no profile / explicit Dungeon fallback
  {xp:undefined,p:null,f:25,expected:0,label:'no-profile undefined'},
  {xp:-9,p:null,f:25,expected:0,label:'no-profile negative'},
  {xp:24,p:null,f:25,expected:24,label:'no-profile before boundary'},
  {xp:25,p:null,f:25,expected:0,label:'no-profile boundary'},
  {xp:63,p:null,f:25,expected:13,label:'no-profile modulo'},
  {xp:'63',p:null,f:25,expected:13,label:'no-profile numeric string'},

  // default fallback if explicit Dungeon fallback is invalid
  {xp:23,p:null,f:0,expected:3,label:'no-profile invalid fallback uses 10'},
  {xp:23,p:null,f:'bad',expected:NaN,label:'no-profile truthy invalid fallback preserves NaN'},
  {xp:23,p:null,f:-5,expected:0,label:'negative fallback clamps to one'},

  // linear profile
  {xp:20,p:{xpCurveMode:'linear',xpPerLevel:7,maxLevel:100},f:25,expected:6,label:'linear profile'},
  {xp:21,p:{xpCurveMode:'linear',xpPerLevel:7,maxLevel:100},f:25,expected:0,label:'linear boundary'},
  {xp:63,p:{xpCurveMode:'linear',xpPerLevel:0,maxLevel:100},f:25,expected:13,label:'linear zero falls back Dungeon'},
  {xp:63,p:{xpCurveMode:'linear',xpPerLevel:'bad',maxLevel:100},f:25,expected:13,label:'linear NaN falls back Dungeon'},
  {xp:63,p:{xpCurveMode:'linear',xpPerLevel:-5,maxLevel:100},f:25,expected:0,label:'linear negative clamps one'},

  // custom complete
  {xp:0,p:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}},f:25,expected:0,label:'custom zero'},
  {xp:3,p:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}},f:25,expected:3,label:'custom level1'},
  {xp:4,p:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}},f:25,expected:0,label:'custom level2 boundary'},
  {xp:10,p:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}},f:25,expected:6,label:'custom level2 progress'},
  {xp:11,p:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}},f:25,expected:0,label:'custom level3 boundary'},
  {xp:29,p:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}},f:25,expected:18,label:'custom level3 progress'},
  {xp:30,p:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}},f:25,expected:0,label:'custom level4 boundary'},
  {xp:69,p:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}},f:25,expected:39,label:'custom level4 progress'},
  {xp:70,p:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}},f:25,expected:0,label:'custom max boundary'},
  {xp:999,p:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}},f:25,expected:929,label:'custom max overflow preserved'},

  // sparse custom thresholds: level calculation may use fallback thresholds,
  // while xpIntoLevel subtracts only explicit current-level threshold.
  {xp:20,p:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:5,4:40,5:'bad'}},f:25,expected:20,label:'sparse level3 explicit threshold missing'},
  {xp:39,p:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:5,4:40,5:'bad'}},f:25,expected:39,label:'sparse level3 progress'},
  {xp:40,p:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:5,4:40,5:'bad'}},f:25,expected:40,label:'invalid max threshold subtracts zero'},
  {xp:99,p:{xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:5,4:40,5:'bad'}},f:25,expected:99,label:'invalid max threshold overflow'}
];

for(const c of cases){
  assert.equal(xpInto(c.xp,c.p,c.f),c.expected,c.label);
}

// Purity/determinism and input immutability.
const profile={xpCurveMode:'custom',xpPerLevel:10,maxLevel:5,xpThresholds:{2:4,3:11,4:30,5:70}};
const before=JSON.stringify(profile);
assert.equal(xpInto(69,profile,25),39);
assert.equal(xpInto(69,profile,25),39);
assert.equal(JSON.stringify(profile),before,'xpIntoLevel must not mutate progression config');

assert.ok(Object.isFrozen(ctx.GensProgressionV1),'Core Progression public API must remain frozen');

console.log(JSON.stringify({
  scenario:'Phase 4 Core Progression XP-into-level pure contract',
  cases:cases.length,
  runtimeRaccord:true,
  indexBlob:gitBlob(indexBuf)
},null,2));
