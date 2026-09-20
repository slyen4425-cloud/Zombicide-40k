const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const world=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-world-builder-167821.js'),'utf8');
const visual=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-visual-config-167826.js'),'utf8');

assert.match(world,/STORAGE_KEY="gensrpg_zone_graphs_v1"/,'World Builder must keep the historical zone graph key');
assert.doesNotMatch(world,/\blocalStorage\.(?:getItem|setItem|removeItem)\s*\(/,'World Builder must not own direct localStorage access after the Core raccord');
assert.match(world,/GensStorageV1\.readJson\(ROOT\.localStorage,STORAGE_KEY,\[\]\)/,'World Builder must read zone graphs through GensStorageV1 with [] fallback');
assert.match(world,/GensStorageV1\.writeJson\(ROOT\.localStorage,STORAGE_KEY,/,'World Builder must write zone graphs through GensStorageV1');
assert.match(world,/function normalizeGraph\(raw\)/,'normalizeGraph must remain owned by World Builder');

assert.match(visual,/GRAPH_KEY="gensrpg_zone_graphs_v1"/,'Visual Config must keep the historical zone graph key');
assert.doesNotMatch(visual,/\blocalStorage\.(?:getItem|setItem|removeItem)\s*\(/,'Visual Config must not own direct localStorage access after the Core raccord');
assert.match(visual,/GensStorageV1\.readJson\(ROOT\.localStorage,GRAPH_KEY,\[\]\)/,'Visual Config must read zone graphs through GensStorageV1 with [] fallback');
assert.doesNotMatch(visual,/GensStorageV1\.writeJson\(/,'Visual Config must remain read-only for zone graph storage');

console.log(JSON.stringify({
  scenario:'Phase 4 zone graph storage owner',
  key:'gensrpg_zone_graphs_v1',
  writer:'DungeonWorldBuilder167821',
  reader:'DungeonRoomVisualConfig167826',
  storageOwner:'GensStorageV1'
},null,2));