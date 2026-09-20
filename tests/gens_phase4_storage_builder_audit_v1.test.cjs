const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const room100=read('assets/dungeon/dungeon-room-creator-100.js');
const roomV2=read('assets/dungeon/dungeon-room-creator-v2-167819.js');
const world=read('assets/dungeon/dungeon-world-builder-167821.js');
const visual=read('assets/dungeon/dungeon-room-visual-config-167826.js');

const keys={
  roomLibrary:'gensrpg_dungeon_custom_rooms_v1',
  roomInteractions:'gensrpg_dungeon_room_interactions_v2',
  zoneGraphs:'gensrpg_zone_graphs_v1'
};

assert.match(room100,/STORAGE_KEY="gensrpg_dungeon_custom_rooms_v1"/,'Room Creator 1.0 key must remain explicit');
assert.match(roomV2,/STORAGE_KEY="gensrpg_dungeon_room_interactions_v2"/,'Room Creator V2 key must remain explicit');
assert.match(world,/STORAGE_KEY="gensrpg_zone_graphs_v1"/,'World Builder key must remain explicit');
assert.match(visual,/GRAPH_KEY="gensrpg_zone_graphs_v1"/,'Visual Config must read the same canonical World Builder key');

assert.equal((room100.match(/localStorage\.getItem\(/g)||[]).length,0,'Room Creator 1.0 direct reads must be removed after Core raccord');
assert.equal((room100.match(/localStorage\.setItem\(/g)||[]).length,0,'Room Creator 1.0 direct writes must be removed after Core raccord');
assert.match(room100,/GensStorageV1\.readJson\(/,'Room Creator 1.0 must delegate reads to Core storage');
assert.match(room100,/GensStorageV1\.writeJson\(/,'Room Creator 1.0 must delegate writes to Core storage');
assert.equal((roomV2.match(/localStorage\.getItem\(/g)||[]).length,0,'Room Creator V2 direct reads must be removed after Core raccord');
assert.equal((roomV2.match(/localStorage\.setItem\(/g)||[]).length,0,'Room Creator V2 direct writes must be removed after Core raccord');
assert.match(roomV2,/GensStorageV1\.readJson\(/,'Room Creator V2 must delegate reads to Core storage');
assert.match(roomV2,/GensStorageV1\.writeJson\(/,'Room Creator V2 must delegate writes to Core storage');
assert.equal((world.match(/localStorage\.getItem\(/g)||[]).length,1,'World Builder must have one direct read owner before extraction');
assert.equal((world.match(/localStorage\.setItem\(/g)||[]).length,1,'World Builder must have one direct write owner before extraction');
assert.equal((visual.match(/localStorage\.getItem\(/g)||[]).length,1,'Visual Config must have one direct graph read before extraction');
assert.equal((visual.match(/localStorage\.setItem\(/g)||[]).length,0,'Visual Config must remain read-only for graph storage');

assert.match(room100,/GensStorageV1\.readJson\(ROOT\.localStorage,STORAGE_KEY,\[\]\)/,'Room Creator 1.0 must preserve [] fallback through Core storage');
assert.match(room100,/map\(normalizeRoom\)\.filter\(Boolean\)/,'Room normalization must remain module-owned');
assert.match(room100,/GensStorageV1\.writeJson\(ROOT\.localStorage,STORAGE_KEY,clean\)/,'Room Creator 1.0 must write normalized module data through Core storage');

assert.match(roomV2,/GensStorageV1\.readJson\(ROOT\.localStorage,STORAGE_KEY,\{\}\)/,'Room Creator V2 must preserve {} fallback through Core storage');
assert.match(roomV2,/normalizeMeta/,'Room Creator V2 normalization must remain module-owned');

assert.match(world,/JSON\.parse\(localStorage\.getItem\(STORAGE_KEY\)\|\|"\[\]"/,'World Builder empty fallback semantics must be characterized');
assert.match(world,/map\(normalizeGraph\)\.filter\(Boolean\)/,'World graph normalization must remain module-owned');

assert.match(visual,/function readJson\(key,fallback\)/,'Visual Config currently owns only a generic read helper');
assert.match(visual,/readJson\(GRAPH_KEY,\[\]\)/,'Visual Config reads graphs with [] fallback');

console.log(JSON.stringify({
  scenario:'Phase 4 storage/migrations Builder audit',
  correctedPhase2KeyCount:3,
  keys,
  directAccesses:{
    roomCreator100:{directRead:0,directWrite:0,coreStorage:true},
    roomCreatorV2:{read:1,write:1},
    worldBuilder:{read:1,write:1},
    visualConfig:{read:1,write:0}
  },
  migrationOrder:['Room Creator V2','World Builder + Visual Config'],
  formatMigrationInFirstMove:false
},null,2));