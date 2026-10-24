const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const room=read('assets/dungeon/dungeon-room-creator-100.js');
const storage=read('assets/gensrpg/core/storage-v1.js');
const index=read('index.html');
const workflow=read('.github/workflows/main.yml');
const preview=read('preview.html');
const sw=read('service-worker.js');

assert.match(room,/STORAGE_KEY="gensrpg_dungeon_custom_rooms_v1"/,'historical Room Creator key must remain unchanged');
assert.doesNotMatch(room,/localStorage\.(?:getItem|setItem|removeItem)\s*\(/,'Room Creator 1.0 must no longer access localStorage directly');
assert.match(room,/GensStorageV1/,'Room Creator 1.0 must delegate JSON storage to the Core service');
assert.match(room,/normalizeRoom/,'Room normalizer must remain module-owned');
assert.doesNotMatch(storage,/gensrpg_dungeon_custom_rooms_v1|normalizeRoom|DungeonRoomCreator/i,'Core storage must not absorb Room Creator business ownership');

function before(text,a,b,label){
  const ia=text.indexOf(a),ib=text.indexOf(b);
  assert.ok(ia>=0&&ib>=0&&ia<ib,label);
}
before(
  workflow,
  'assets/gensrpg/core/storage-v1.js',
  'assets/dungeon/dungeon-room-creator-100.js',
  'Pages composition must load Core storage before Room Creator'
);
assert.equal((index.match(/assets\/gensrpg\/core\/storage-v1\.js/g)||[]).length,1,'source index must bootstrap Core storage exactly once');
assert.equal(preview.indexOf('assets/gensrpg/core/storage-v1.js'),-1,'preview must inherit Core storage from source index instead of injecting a duplicate');
assert.ok(preview.indexOf('assets/dungeon/dungeon-room-creator-100.js')>=0,'preview must still append Room Creator after source bootstrap');
assert.match(sw,/assets\/gensrpg\/core\/storage-v1\.js/,'PWA cache must include the production-connected Core storage service');

console.log(JSON.stringify({
  scenario:'Phase 4 Room Creator storage owner raccord',
  key:'gensrpg_dungeon_custom_rooms_v1',
  coreOwner:'GensStorageV1',
  moduleOwner:'DungeonRoomCreator100'
},null,2));
