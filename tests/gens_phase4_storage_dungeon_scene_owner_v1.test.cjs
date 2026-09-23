const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const bytes=fs.readFileSync(path.join(root,'index.html'));
const src=bytes.toString('utf8');
const m=src.match(/<script[^>]*id=["']dungeonMj72_2Script["'][^>]*>([\s\S]*?)<\/script>/i);
assert.ok(m,'missing dungeonMj72_2Script');
const block=m[1];

assert.match(block,/const GENS_DUNGEON_SCENE_KEY="gensrpg_dungeon_scene_v1"/);
assert.equal((block.match(/localStorage\.getItem\(GENS_DUNGEON_SCENE_KEY\)/g)||[]).length,0,'Dungeon Scene direct read must be removed');
assert.equal((block.match(/localStorage\.setItem\(GENS_DUNGEON_SCENE_KEY,/g)||[]).length,0,'Dungeon Scene direct write must be removed');
assert.equal((block.match(/localStorage\.removeItem\(GENS_DUNGEON_SCENE_KEY\)/g)||[]).length,0,'Dungeon Scene must have no direct remove');

assert.equal((block.match(/GensStorageV1\.readJson\(localStorage,GENS_DUNGEON_SCENE_KEY,\[\]\)/g)||[]).length,1,'Dungeon Scene must have exactly one Core read');
assert.equal((block.match(/GensStorageV1\.writeJson\(localStorage,GENS_DUNGEON_SCENE_KEY,a\|\|\[\]\)/g)||[]).length,1,'Dungeon Scene must have exactly one Core write');

assert.match(block,/return Array\.isArray\(a\)\?a:\[\]/,'array normalization must remain Dungeon-owned');
assert.match(block,/GensStorageV1\.writeJson\(localStorage,GENS_DUNGEON_SCENE_KEY,a\|\|\[\]\);try\{renderDungeonMasterScene\(\)\}catch\(e\)\{\}/,'write/render order and render error boundary must remain unchanged');

const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');
assert.equal(bytes.length,8173578);
assert.equal(blob,'9313afd3437fe827b9c17245a675f75645570878','Dungeon Scene final index blob must match deterministic micro-diff');

console.log(JSON.stringify({
  scenario:'Phase 4 Dungeon Scene Core storage authority',
  key:'gensrpg_dungeon_scene_v1',
  directAccesses:{reads:0,writes:0,removes:0},
  coreAccesses:{reads:1,writes:1},
  indexBlob:blob
},null,2));
