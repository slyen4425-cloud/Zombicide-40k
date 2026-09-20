const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const cp=require('node:child_process');

const root=path.join(__dirname,'..');
const bytes=fs.readFileSync(path.join(root,'index.html'));
const src=bytes.toString('utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_STORAGE_OWNERS.json'),'utf8');
const inlineOwners=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_INLINE_OWNERS.json'),'utf8');

const KEY='gensrpg_dungeon_mj_rules_v145';
const SOURCE_BLOB='1545aba502777d9fb76decdcee90a89c7cf3f971';
const TARGET_BLOB='5b9b9ae780f735eadef049afeb10acf0b57441fe';

function gitBlob(buffer){
  return crypto.createHash('sha1').update(Buffer.concat([
    Buffer.from('blob '+buffer.length+'\0'),buffer
  ])).digest('hex');
}
function blockInfo(id){
  const re=new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i');
  const m=src.match(re);
  assert.ok(m,'missing inline block '+id);
  return {body:m[1],full:m[0],index:m.index};
}

assert.deepEqual(manifest.totals,{
  totalAccesses:185,resolvedAccesses:120,unresolvedAccesses:65,distinctResolvedKeys:20
},'Audit 12 must start from Economy Session GREEN totals');
assert.deepEqual(manifest.byDomain.dungeon,{
  accesses:153,resolved:103,unresolved:50,distinctKeys:12
},'Audit 12 must start from Economy Session GREEN Dungeon totals');
assert.equal(bytes.length,8174580);
assert.equal(gitBlob(bytes),SOURCE_BLOB,'Audit 12 must inspect the exact Economy Session GREEN index');

const mj=blockInfo('dungeonMj72_2Script');
const stability=blockInfo('gensStability151');
assert.equal(inlineOwners.blocks.dungeonMj72_2Script.status,'active');
assert.equal(inlineOwners.blocks.gensStability151.status,'active');
assert.equal(inlineOwners.blocks.dungeonMj72_2Script.primaryDomain,'dungeon');
assert.equal(inlineOwners.blocks.gensStability151.primaryDomain,'core');

const coreLoad=src.indexOf('assets/gensrpg/core/storage-v1.js');
assert.ok(coreLoad>=0,'Core Storage load must exist');
assert.ok(coreLoad<mj.index && coreLoad<stability.index,'Core Storage must load before both future MJ Rules consumers');

assert.equal(src.split(KEY).length-1,3,'MJ Rules key must have exactly three occurrences');
assert.equal(mj.split(KEY).length-1,1,'Dungeon MJ owner must contain one writer occurrence');
assert.equal(stability.split(KEY).length-1,2,'Stability owner must contain reader + writer occurrences');

const readExpr='JSON.parse(localStorage.getItem("'+KEY+'")||"{}")';
const writeExpr='localStorage.setItem("'+KEY+'",JSON.stringify(r))';
const coreRead='GensStorageV1.readJson(localStorage,"'+KEY+'",{})';
const coreWrite='GensStorageV1.writeJson(localStorage,"'+KEY+'",r)';

assert.equal(mj.body.split(readExpr).length-1,0);
assert.equal(mj.body.split(writeExpr).length-1,1);
assert.equal(stability.body.split(readExpr).length-1,1);
assert.equal(stability.body.split(writeExpr).length-1,1);
assert.equal(mj.body.includes('removeItem("'+KEY+'")'),false);
assert.equal(stability.body.includes('removeItem("'+KEY+'")'),false);
assert.equal(src.split(coreRead).length-1,0,'Audit must remain pre-raccord');
assert.equal(src.split(coreWrite).length-1,0,'Audit must remain pre-raccord');

let outside=src.replace(mj.full,'').replace(stability.full,'');
assert.equal(outside.includes(KEY),false,'no additional inline owner/call site is allowed');

const jsFiles=cp.execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'})
  .split('\0').filter(file=>file.endsWith('.js'));
for(const file of jsFiles){
  const code=fs.readFileSync(path.join(root,file),'utf8');
  assert.equal(code.includes(KEY),false,'additional external owner/call site: '+file);
}

const keyEntry=(manifest.resolvedKeys||[]).find(x=>x.key===KEY);
assert.ok(keyEntry,'MJ Rules must remain in direct-storage manifest before migration');
assert.deepEqual([...keyEntry.ops].sort(),['getItem','setItem']);
assert.deepEqual([...keyEntry.sources].sort(),['inline:dungeonMj72_2Script','inline:gensStability151'].sort());

const storageSrc=fs.readFileSync(path.join(root,'assets/gensrpg/core/storage-v1.js'),'utf8');
const ctx={};vm.createContext(ctx);vm.runInContext(storageSrc,ctx,{filename:'storage-v1.js'});
const api=ctx.GensStorageV1;
assert.ok(api&&typeof api.readJson==='function'&&typeof api.writeJson==='function');

class FakeStorage{
  constructor(raw=null,opts={}){this.raw=raw;this.failRead=!!opts.failRead;this.failWrite=!!opts.failWrite;this.writes=[]}
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
for(const raw of [
  null,'','null','0','false','"xy"','[]','[1,2]','{}','{broken',
  '{"xpMultiplier":2,"difficulty":4,"extra":"kept"}',
  '{"mixedBossMj":false,"eventFrequency":3}'
]){
  assert.deepEqual(plain(coreCandidateRead(raw)),plain(legacyRead(raw)),'read parity: '+String(raw));
}
assert.deepEqual(plain(coreCandidateRead(null,{failRead:true})),plain(legacyRead(null,{failRead:true})));

function legacyWrite(value,opts={}){
  const st=new FakeStorage(null,opts);let err=null;
  try{st.setItem(KEY,JSON.stringify(value))}catch(e){err=e}
  return {writes:st.writes,error:err?err.message:null};
}
function coreCandidateWrite(value,opts={}){
  const st=new FakeStorage(null,opts);let err=null;
  try{api.writeJson(st,KEY,value)}catch(e){err=e}
  return {writes:st.writes,error:err?err.message:null};
}
for(const value of [defaults(),{difficulty:4,extra:'kept'},[],null,false,0,'x']){
  assert.deepEqual(coreCandidateWrite(value),legacyWrite(value),'write parity');
}
const circular={};circular.self=circular;
assert.deepEqual(coreCandidateWrite(circular),legacyWrite(circular),'serialization error parity');
assert.deepEqual(coreCandidateWrite({x:1},{failWrite:true}),legacyWrite({x:1},{failWrite:true}),'write error parity');

assert.match(stability.body,/try\{\s*const old=JSON\.parse\(localStorage\.getItem\("gensrpg_dungeon_mj_rules_v145"\)\|\|"\{\}"\);\s*Object\.assign\(d,old\|\|\{\}\);\s*\}catch\(e\)\{\}/,'reader fallback/merge boundary must remain characterized');
assert.match(stability.body,/localStorage\.setItem\("gensrpg_dungeon_mj_rules_v145",JSON\.stringify\(r\)\);\s*const m=document\.getElementById\("dungeonMj151"\)/,'saveDungeonMj151 writes before closing UI');
assert.match(mj.body,/try\{[\s\S]*?localStorage\.setItem\("gensrpg_dungeon_mj_rules_v145",JSON\.stringify\(r\)\);\s*try\{gensReconcile171/,'unified MJ writer keeps write + reconciles inside outer try');

let candidate=src;
assert.equal(candidate.split(readExpr).length-1,1);
assert.equal(candidate.split(writeExpr).length-1,2);
candidate=candidate.replace(readExpr,coreRead).replaceAll(writeExpr,coreWrite);
const candidateBytes=Buffer.from(candidate,'utf8');
assert.equal(candidateBytes.length,8174580,'future micro-diff must keep exact size');
assert.equal(gitBlob(candidateBytes),TARGET_BLOB,'future MJ Rules micro-diff must be deterministic');

for(const deferred of [
  'gensrpg_dc048_pending_trap_v1',
  'gensrpg_dc052_special_branch_v1',
  'gensrpg_dungeon_runtime_v2',
  'gensrpg_rpg_gameplay_by_profile_v1'
]){
  assert.ok((manifest.resolvedKeys||[]).some(x=>x.key===deferred),'deferred family missing: '+deferred);
}

console.log(JSON.stringify({
  scenario:'Phase 4 storage Audit 12',
  indexBlob:SOURCE_BLOB,
  totals:manifest.totals,
  selected:KEY,
  owners:['dungeonMj72_2Script','gensStability151'],
  directAccesses:{reads:1,writes:2,removes:0},
  coreLoadBeforeOwners:true,
  candidateBlob:TARGET_BLOB,
  candidateSize:candidateBytes.length,
  decision:'select MJ Rules for a separate micro-lot; no runtime change in Audit 12'
},null,2));
