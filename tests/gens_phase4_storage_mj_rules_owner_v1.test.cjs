const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const bytes=fs.readFileSync(path.join(root,'index.html'));
const src=bytes.toString('utf8');
const KEY='gensrpg_dungeon_mj_rules_v145';

function gitBlob(buffer){
  return crypto.createHash('sha1').update(Buffer.concat([
    Buffer.from('blob '+buffer.length+'\0'),buffer
  ])).digest('hex');
}
function block(id){
  const m=src.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing owner '+id);
  return m[1];
}
const mj=block('dungeonMj72_2Script');
const stability=block('gensStability151');
const both=stability+'\n'+mj;

const oldRead='JSON.parse(localStorage.getItem("'+KEY+'")||"{}")';
const oldWrite='localStorage.setItem("'+KEY+'",JSON.stringify(r))';
const coreRead='GensStorageV1.readJson(localStorage,"'+KEY+'",{})';
const coreWrite='GensStorageV1.writeJson(localStorage,"'+KEY+'",r)';

assert.equal(both.split(oldRead).length-1,0,'MJ Rules direct JSON read must be removed');
assert.equal(both.split(oldWrite).length-1,0,'MJ Rules direct JSON writes must be removed');
assert.equal(both.split(coreRead).length-1,1,'MJ Rules must use exactly one Core read');
assert.equal(both.split(coreWrite).length-1,2,'MJ Rules must use exactly two Core writes');

assert.equal(src.split(KEY).length-1,3,'MJ Rules key occurrence count must remain exactly three');
assert.equal(mj.split(KEY).length-1,1,'Dungeon MJ owner keeps exactly one occurrence');
assert.equal(stability.split(KEY).length-1,2,'Stability owner keeps exactly two occurrences');

assert.match(
  stability,
  /try\{\s*const old=GensStorageV1\.readJson\(localStorage,"gensrpg_dungeon_mj_rules_v145",\{\}\);\s*Object\.assign\(d,old\|\|\{\}\);\s*\}catch\(e\)\{\}/,
  'reader must preserve historical catch and Object.assign merge'
);
assert.match(
  stability,
  /GensStorageV1\.writeJson\(localStorage,"gensrpg_dungeon_mj_rules_v145",r\);\s*const m=document\.getElementById\("dungeonMj151"\)/,
  'saveDungeonMj151 must write before closing UI'
);
assert.match(
  mj,
  /try\{[\s\S]*?GensStorageV1\.writeJson\(localStorage,"gensrpg_dungeon_mj_rules_v145",r\);\s*try\{gensReconcile171/,
  'unified MJ writer must keep Core write before reconciles inside outer try'
);

assert.equal(mj.includes('removeItem("'+KEY+'")'),false);
assert.equal(stability.includes('removeItem("'+KEY+'")'),false);

assert.equal(bytes.length,8171795,'current Phase 5 Shell index size must remain deterministic');
assert.equal(gitBlob(bytes),'4f8c3b9be4189a9ac163fcb17531c95cbd783b05','MJ Rules raccord must target the current Phase 5 Shell baseline');

console.log(JSON.stringify({
  scenario:'Phase 4 MJ Rules Core storage authority',
  key:KEY,
  owners:['dungeonMj72_2Script','gensStability151'],
  coreReads:1,
  coreWrites:2,
  removes:0,
  indexBlob:gitBlob(bytes)
},null,2));
