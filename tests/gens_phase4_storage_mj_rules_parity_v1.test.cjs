const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'index.html'),'utf8');
const storageSrc=fs.readFileSync(path.join(root,'assets/gensrpg/core/storage-v1.js'),'utf8');

const KEY='gensrpg_dungeon_mj_rules_v145';
const oldRead='JSON.parse(localStorage.getItem("'+KEY+'")||"{}")';
const oldWrite='localStorage.setItem("'+KEY+'",JSON.stringify(r))';
const coreRead='GensStorageV1.readJson(localStorage,"'+KEY+'",{})';
const coreWrite='GensStorageV1.writeJson(localStorage,"'+KEY+'",r)';

function block(id){
  const m=src.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing owner '+id);
  return m[1];
}
const mj=block('dungeonMj72_2Script');
const stability=block('gensStability151');

const directReads=(stability.split(oldRead).length-1)+(mj.split(oldRead).length-1);
const directWrites=(stability.split(oldWrite).length-1)+(mj.split(oldWrite).length-1);
const coreReads=(stability.split(coreRead).length-1)+(mj.split(coreRead).length-1);
const coreWrites=(stability.split(coreWrite).length-1)+(mj.split(coreWrite).length-1);

assert.ok(
  (directReads===1&&coreReads===0)||(directReads===0&&coreReads===1),
  'MJ Rules must expose exactly one legacy-or-Core reader'
);
assert.ok(
  (directWrites===2&&coreWrites===0)||(directWrites===0&&coreWrites===2),
  'MJ Rules must expose exactly two legacy-or-Core writers'
);

const ctx={};vm.createContext(ctx);vm.runInContext(storageSrc,ctx,{filename:'storage-v1.js'});
const api=ctx.GensStorageV1;
assert.ok(api&&typeof api.readJson==='function'&&typeof api.writeJson==='function');

class FakeStorage{
  constructor(raw=null,opts={}){
    this.raw=raw;
    this.failRead=!!opts.failRead;
    this.failWrite=!!opts.failWrite;
    this.writes=[];
  }
  getItem(){if(this.failRead)throw new Error('read-fail');return this.raw}
  setItem(key,value){if(this.failWrite)throw new Error('write-fail');this.writes.push([String(key),String(value)])}
}
const defaults=()=>({
  xpMultiplier:1,goldMultiplier:1,lootMultiplier:1,difficulty:2,
  enemyControl:'ai',initiativeMode:'strict',aiTactics:'standard',
  mixedBossMj:true,eventFrequency:2
});
const plain=x=>JSON.parse(JSON.stringify(x));

function legacyRead(raw,opts={}){
  const st=new FakeStorage(raw,opts),d=defaults();
  try{const old=JSON.parse(st.getItem(KEY)||'{}');Object.assign(d,old||{})}catch(e){}
  return d;
}
function coreCandidateRead(raw,opts={}){
  const st=new FakeStorage(raw,opts),d=defaults();
  try{const old=api.readJson(st,KEY,{});Object.assign(d,old||{})}catch(e){}
  return d;
}
const readCases=[
  null,'','null','0','false','"xy"','[]','[1,2]','{}','{broken',
  '{"xpMultiplier":2,"difficulty":4,"extra":"kept"}',
  '{"mixedBossMj":false,"eventFrequency":3}'
];
for(const raw of readCases){
  assert.deepEqual(plain(coreCandidateRead(raw)),plain(legacyRead(raw)),'read parity: '+String(raw));
}
assert.deepEqual(plain(coreCandidateRead(null,{failRead:true})),plain(legacyRead(null,{failRead:true})),'read failure parity');

function result(fn,value,opts={}){
  const st=new FakeStorage(null,opts);let error=null;
  try{fn(st,value)}catch(e){error=e}
  return {writes:st.writes,error:error?error.message:null};
}
const legacyWrite=(st,r)=>st.setItem(KEY,JSON.stringify(r));
const coreCandidateWrite=(st,r)=>api.writeJson(st,KEY,r);
for(const value of [defaults(),{difficulty:4,extra:'kept'},[],null,false,0,'x']){
  assert.deepEqual(result(coreCandidateWrite,value),result(legacyWrite,value),'write parity');
}
const circular={};circular.self=circular;
assert.deepEqual(result(coreCandidateWrite,circular),result(legacyWrite,circular),'serialization failure parity');
assert.deepEqual(result(coreCandidateWrite,{x:1},{failWrite:true}),result(legacyWrite,{x:1},{failWrite:true}),'storage failure parity');

const candidateStability=stability.replace(oldRead,coreRead).replace(oldWrite,coreWrite);
const candidateMj=mj.replace(oldWrite,coreWrite);
assert.equal(candidateStability.split(oldRead).length-1,0);
assert.equal(candidateStability.split(oldWrite).length-1,0);
assert.equal(candidateMj.split(oldWrite).length-1,0);
assert.equal(candidateStability.split(coreRead).length-1,1);
assert.equal(candidateStability.split(coreWrite).length-1,1);
assert.equal(candidateMj.split(coreWrite).length-1,1);

assert.match(
  stability,
  /(?:localStorage\.setItem\("gensrpg_dungeon_mj_rules_v145",JSON\.stringify\(r\)\)|GensStorageV1\.writeJson\(localStorage,"gensrpg_dungeon_mj_rules_v145",r\));\s*const m=document\.getElementById\("dungeonMj151"\)/,
  'saveDungeonMj151 must preserve write-before-close ordering'
);
assert.match(
  mj,
  /(?:localStorage\.setItem\("gensrpg_dungeon_mj_rules_v145",JSON\.stringify\(r\)\)|GensStorageV1\.writeJson\(localStorage,"gensrpg_dungeon_mj_rules_v145",r\));\s*try\{gensReconcile171/,
  'unified MJ writer must preserve write-before-reconcile ordering'
);

console.log(JSON.stringify({
  scenario:'Phase 4 MJ Rules Core transport parity',
  key:KEY,
  currentTransport:directReads?'legacy-direct':'core',
  readCases:readCases.length+1,
  writes:2,
  parity:true
},null,2));
