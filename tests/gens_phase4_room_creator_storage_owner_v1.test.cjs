const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-creator-100.js'),'utf8');
const preview=fs.readFileSync(path.join(root,'preview.html'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github','workflows','main.yml'),'utf8');
const sw=fs.readFileSync(path.join(root,'service-worker.js'),'utf8');

assert.doesNotMatch(src,/localStorage\.getItem\(STORAGE_KEY\)/,'Room Creator 1.0 must not directly read localStorage after Core storage raccord');
assert.doesNotMatch(src,/localStorage\.setItem\(STORAGE_KEY/,'Room Creator 1.0 must not directly write localStorage after Core storage raccord');
assert.match(src,/GensStorageV1\.readJson\(STORAGE_KEY,\[\]\)/,'Room Creator 1.0 must delegate reads to Core storage');
assert.match(src,/GensStorageV1\.writeJson\(STORAGE_KEY,clean\)/,'Room Creator 1.0 must delegate writes to Core storage');

assert.match(src,/STORAGE_KEY="gensrpg_dungeon_custom_rooms_v1"/,'Room Creator key must stay unchanged');
assert.match(src,/map\(normalizeRoom\)\.filter\(Boolean\)/,'Room normalization must remain module-owned');

for(const composition of [preview,workflow]){
  const storagePos=composition.indexOf('assets/gensrpg/core/storage-v1.js');
  const roomPos=composition.indexOf('assets/dungeon/dungeon-room-creator-100.js');
  assert.ok(storagePos>=0&&roomPos>storagePos,'Core storage must load before Room Creator 1.0');
}
assert.match(sw,/\.\/assets\/gensrpg\/core\/storage-v1\.js/,'Core storage must be precached when production-loaded');

console.log(JSON.stringify({
  scenario:'Phase 4 Room Creator 1.0 storage owner',
  key:'gensrpg_dungeon_custom_rooms_v1',
  directLocalStorage:false,
  coreStorage:true
},null,2));