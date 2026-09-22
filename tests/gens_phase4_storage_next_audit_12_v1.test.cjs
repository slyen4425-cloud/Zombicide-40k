const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const vm=require('node:vm');
const cp=require('node:child_process');

const root=path.join(__dirname,'..');
const bytes=fs.readFileSync(path.join(root,'index.html'));
const src=bytes.toString('utf8');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_STORAGE_OWNERS.json'),'utf8'));
const inlineOwners=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_INLINE_OWNERS.json'),'utf8'));

const KEY='gensrpg_dungeon_mj_rules_v145';
const HISTORICAL_SOURCE_BLOB='1545aba502777d9fb76decdcee90a89c7cf3f971';
const CURRENT_BLOB='8ef7c65fca1f72f0393f0f6ccb6fea8426b41f91';

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

assert.equal(manifest.sourceIndexBlob,CURRENT_BLOB,'Storage cartography fingerprint must follow MJ Rules GREEN candidate index');
assert.deepEqual(manifest.totals,{
  totalAccesses:182,resolvedAccesses:117,unresolvedAccesses:65,distinctResolvedKeys:19
},'Audit 12 guard must follow the migrated MJ Rules storage totals');
assert.deepEqual(manifest.byDomain.dungeon,{
  accesses:152,resolved:102,unresolved:50,distinctKeys:11
},'Audit 12 guard must follow the migrated MJ Rules Dungeon totals');
assert.deepEqual(manifest.byDomain.core,{
  accesses:2,resolved:1,unresolved:1,distinctKeys:1
},'Audit 12 guard must follow the migrated MJ Rules Core totals');
assert.equal(bytes.length,8174314);
assert.equal(gitBlob(bytes),CURRENT_BLOB,'Audit 12 must follow the exact migrated MJ Rules index');

const mj=blockInfo('dungeonMj72_2Script');
const stability=blockInfo('gensStability151');
assert.equal(inlineOwners.blocks.dungeonMj72_2Script.status,'active');
assert.equal(inlineOwners.blocks.gensStability151.status,'active');
assert.equal(inlineOwners.blocks.dungeonMj72_2Script.primaryDomain,'dungeon');
assert.equal(inlineOwners.blocks.gensStability151.primaryDomain,'core');

const coreLoad=src.indexOf('assets/gensrpg/core/storage-v1.js');
assert.ok(coreLoad>=0,'Core Storage load must exist');
assert.ok(coreLoad<mj.index && coreLoad<stability.index,'Core Storage must load before both MJ Rules consumers');

assert.equal(src.split(KEY).length-1,3,'MJ Rules key must keep exactly three owner occurrences');
assert.equal(mj.body.split(KEY).length-1,1,'Dungeon MJ owner must keep one writer occurrence');
assert.equal(stability.body.split(KEY).length-1,2,'Stability owner must keep reader + writer occurrences');

const readExpr='JSON.parse(localStorage.getItem("'+KEY+'")||"{}")';
const writeExpr='localStorage.setItem("'+KEY+'",JSON.stringify(r))';
const coreRead='GensStorageV1.readJson(localStorage,"'+KEY+'",{})';
const coreWrite='GensStorageV1.writeJson(localStorage,"'+KEY+'",r)';

assert.equal(mj.body.split(readExpr).length-1,0);
assert.equal(mj.body.split(writeExpr).length-1,0);
assert.equal(stability.body.split(readExpr).length-1,0);
assert.equal(stability.body.split(writeExpr).length-1,0);
assert.equal(src.split(coreRead).length-1,1,'migrated MJ Rules must use one Core read');
assert.equal(src.split(coreWrite).length-1,2,'migrated MJ Rules must use two Core writes');
assert.equal(mj.body.includes('removeItem("'+KEY+'")'),false);
assert.equal(stability.body.includes('removeItem("'+KEY+'")'),false);

const outside=src.replace(mj.full,'').replace(stability.full,'');
assert.equal(outside.includes(KEY),false,'no additional inline owner/call site is allowed');

const jsFiles=cp.execFileSync('git',['ls-files','-z'],{cwd:root,encoding:'utf8'})
  .split('\0').filter(file=>file.endsWith('.js'));
for(const file of jsFiles){
  const code=fs.readFileSync(path.join(root,file),'utf8');
  assert.equal(code.includes(KEY),false,'additional external owner/call site: '+file);
}

const keyEntry=(manifest.resolvedKeys||[]).find(x=>x.key===KEY);
assert.equal(keyEntry,undefined,'migrated MJ Rules key must leave the direct-storage manifest');

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

assert.match(stability.body,/try\{\s*const old=GensStorageV1\.readJson\(localStorage,"gensrpg_dungeon_mj_rules_v145",\{\}\);\s*Object\.assign\(d,old\|\|\{\}\);\s*\}catch\(e\)\{\}/,'reader fallback/merge boundary must remain characterized');
assert.match(stability.body,/GensStorageV1\.writeJson\(localStorage,"gensrpg_dungeon_mj_rules_v145",r\);\s*const m=document\.getElementById\("dungeonMj151"\)/,'saveDungeonMj151 writes before closing UI');
assert.match(mj.body,/try\{[\s\S]*?GensStorageV1\.writeJson\(localStorage,"gensrpg_dungeon_mj_rules_v145",r\);\s*try\{gensReconcile171/,'unified MJ writer keeps write + reconciles inside outer try');

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
  historicalSourceBlob:HISTORICAL_SOURCE_BLOB,
  indexBlob:CURRENT_BLOB,
  totals:manifest.totals,
  selected:KEY,
  owners:['dungeonMj72_2Script','gensStability151'],
  directAccesses:{reads:0,writes:0,removes:0},
  coreAccesses:{reads:1,writes:2},
  coreLoadBeforeOwners:true,
  state:'migrated',
  decision:'MJ Rules selected by Audit 12 and migrated in its separate micro-lot'
},null,2));
