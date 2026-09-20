const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const files={
  bridge:read('assets/dungeon/dungeon-world-session-bridge-167832.js'),
  large:read('assets/dungeon/dungeon-large-room-support-167834.js'),
  bootstrap:read('assets/dungeon/dungeon-authored-bootstrap-167849.js'),
  action:read('assets/dungeon/dungeon-authored-action-fix-167857.js'),
  core:read('assets/gensrpg/core/storage-v1.js')
};
const KEY='gensrpg_dungeon_primary_selection_v167833';

for(const name of ['bridge','large','bootstrap','action']){
  const src=files[name];
  assert.ok(src.includes('const PRIMARY_KEY="'+KEY+'"'),'Dungeon owner '+name+' must retain the exact key');
  assert.equal((src.match(/localStorage\.getItem\(PRIMARY_KEY\)/g)||[]).length,0,name+' must not directly read PRIMARY_KEY');
  assert.equal((src.match(/localStorage\.setItem\(PRIMARY_KEY/g)||[]).length,0,name+' must not directly write PRIMARY_KEY');
}
assert.equal(files.core.includes(KEY),false,'Core Storage must remain domain-agnostic');

assert.equal((files.bridge.match(/ROOT\.GensStorageV1\.readJson\(ROOT\.localStorage,PRIMARY_KEY,null\)/g)||[]).length,1,'Bridge must own one Core JSON read');
assert.equal((files.bridge.match(/ROOT\.GensStorageV1\.writeJson\(ROOT\.localStorage,PRIMARY_KEY,x\|\|null\)/g)||[]).length,1,'Bridge must own one Core JSON write');
assert.equal((files.large.match(/ROOT\.GensStorageV1\.readJson\(ROOT\.localStorage,PRIMARY_KEY,null\)/g)||[]).length,1,'Large Room must own one Core JSON read');
assert.equal((files.bootstrap.match(/ROOT\.GensStorageV1\.readJson\(ROOT\.localStorage,PRIMARY_KEY,null\)/g)||[]).length,1,'Authored Bootstrap must own one Core JSON fallback read');
assert.equal((files.action.match(/ROOT\.GensStorageV1\.readJson\(ROOT\.localStorage,PRIMARY_KEY,null\)/g)||[]).length,1,'Authored Action Fix must own one Core JSON fallback read');

assert.match(files.large,/function readRt\(\)\{try\{const x=JSON\.parse\(localStorage\.getItem\(RT_KEY\)\|\|"null"\);return x&&typeof x==="object"\?x:null\}catch\(e\)\{return null\}\}/,'Large Room runtime read must remain untouched');
assert.match(files.large,/function writeRt\(x\)\{try\{localStorage\.setItem\(RT_KEY,JSON\.stringify\(x\|\|\{\}\)\);return true\}catch\(e\)\{return false\}\}/,'Large Room runtime write must remain untouched');
assert.match(files.action,/function readRt\(\)\{try\{const x=JSON\.parse\(localStorage\.getItem\(RT_KEY\)\|\|"null"\);return x&&typeof x==="object"\?x:null\}catch\(e\)\{return null\}\}/,'Authored Action runtime read must remain untouched');

console.log(JSON.stringify({
  scenario:'Phase 4 Dungeon primary selection Core storage authority',
  key:KEY,coreReads:4,coreWrites:1,runtimeV2:'intentionally untouched'
},null,2));
