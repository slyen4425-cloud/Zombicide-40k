const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const world=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-world-builder-167821.js'),'utf8');
const visual=fs.readFileSync(path.join(root,'assets','dungeon','dungeon-room-visual-config-167826.js'),'utf8');

assert.match(world,/STORAGE_KEY="gensrpg_zone_graphs_v1"/,'World Builder must keep the historical zone graph key');
assert.match(visual,/GRAPH_KEY="gensrpg_zone_graphs_v1"/,'Visual Config must read the same historical zone graph key');

assert.doesNotMatch(world,/\blocalStorage\.(?:getItem|setItem|removeItem)\s*\(/,'World Builder must not own direct localStorage after Core raccord');
assert.doesNotMatch(visual,/\blocalStorage\.(?:getItem|setItem|removeItem)\s*\(/,'Visual Config must not own direct localStorage after Core raccord');

assert.match(world,/GensStorageV1\.readJson\(ROOT\.localStorage,STORAGE_KEY,\[\]\)/,'World Builder reads zone graphs through Core with [] fallback');
assert.match(world,/GensStorageV1\.writeJson\(ROOT\.localStorage,STORAGE_KEY,clean\)/,'World Builder writes normalized graphs through Core');
assert.match(visual,/GensStorageV1\.readJson\(ROOT\.localStorage,key,fallback\)/,'Visual Config generic JSON read helper delegates to Core');
assert.doesNotMatch(visual,/GensStorageV1\.writeJson\(/,'Visual Config must remain read-only for zone graphs');

assert.match(world,/function normalizeGraph\(raw\)/,'normalizeGraph remains owned by World Builder');
assert.match(world,/map\(normalizeGraph\)\.filter\(Boolean\)/,'graph normalization remains outside Core storage');

console.log(JSON.stringify({
  scenario:'Phase 4 zone graph storage owner',
  key:'gensrpg_zone_graphs_v1',
  writer:'DungeonWorldBuilder167821',
  reader:'DungeonRoomVisualConfig167826',
  storage:'GensStorageV1'
},null,2));
