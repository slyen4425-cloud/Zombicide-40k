const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-creator-v2-167819.js'),'utf8');

assert.match(src,/STORAGE_KEY="gensrpg_dungeon_room_interactions_v2"/,'Room Creator V2 must keep its historical storage key');
assert.doesNotMatch(src,/\blocalStorage\.(?:getItem|setItem|removeItem)\s*\(/,'Room Creator V2 must not own direct localStorage access after the Core raccord');
assert.match(src,/GensStorageV1\.readJson\(ROOT\.localStorage,STORAGE_KEY,\{\}\)/,'Room Creator V2 must read its historical key through GensStorageV1 with {} fallback');
assert.match(src,/GensStorageV1\.writeJson\(ROOT\.localStorage,STORAGE_KEY,/,'Room Creator V2 must write through GensStorageV1');
assert.match(src,/function normalizeMeta\(raw\)/,'normalizeMeta must remain owned by Room Creator V2');
assert.match(src,/schema:SCHEMA_VERSION,roomId/,'Room Creator V2 schema normalization must stay module-owned');

console.log(JSON.stringify({
  scenario:'Phase 4 Room Creator V2 storage owner',
  key:'gensrpg_dungeon_room_interactions_v2',
  owner:'GensStorageV1',
  normalizer:'DungeonRoomCreatorV2.normalizeMeta'
},null,2));
