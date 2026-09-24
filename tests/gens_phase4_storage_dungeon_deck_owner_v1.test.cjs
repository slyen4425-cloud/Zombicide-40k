const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex');

assert.equal(index.includes('const DUNGEON_DECK_KEY="gensrpg_dungeon_deck_v1";'),true,'Dungeon must retain the deck key');
const start=index.indexOf('const DUNGEON_DECK_KEY="gensrpg_dungeon_deck_v1";');
const end=index.indexOf('function dungeonEligibleLootItemsForRarity',start);
assert.ok(start>=0&&end>start,'Dungeon deck block must be locatable');
const block=index.slice(start,end);

assert.equal((block.match(/localStorage\.getItem\(DUNGEON_DECK_KEY\)/g)||[]).length,0,'Deck must have no direct localStorage read');
assert.equal((block.match(/localStorage\.setItem\(DUNGEON_DECK_KEY/g)||[]).length,0,'Deck must have no direct localStorage write');
assert.equal((block.match(/GensStorageV1\.readJson\(localStorage,DUNGEON_DECK_KEY,null\)/g)||[]).length,1,'Deck must use exactly one Core JSON read');
assert.equal((block.match(/GensStorageV1\.writeJson\(localStorage,DUNGEON_DECK_KEY,ds\)/g)||[]).length,2,'Deck must use exactly two Core JSON writes');

assert.match(block,/if\(!ds\|\|!ds\.remaining\)ds=\{remaining:\{\},createdAt:Date\.now\(\)\}/,'Dungeon must remain owner of missing deck initialization');
assert.match(block,/if\(ds\.remaining\[it\.id\]===undefined\)\{ds\.remaining\[it\.id\]=Math\.max\(1,parseInt\(cfg\[it\.id\],10\)\|\|2\);changed=true\}/,'Dungeon must remain owner of missing item quantities');
assert.match(block,/remaining\[it\.id\]=raw===undefined\?2:Math\.max\(0,parseInt\(raw,10\)\|\|0\)/,'Dungeon deck build quantity semantics must remain unchanged');
assert.equal(block.includes('gensrpg_dungeon_runtime_v2'),false,'Deck raccord must not touch deferred runtime_v2');

assert.equal(bytes.length,8172204,'current index size must include the later Challenge Library micro-diff');
assert.equal(blob,'6c95e3f6ca4bf8e34003776e7e43e44192aafb16','current index blob must include the later Challenge Library micro-diff');

console.log(JSON.stringify({
  scenario:'Phase 4 Dungeon deck Core storage authority',
  key:'gensrpg_dungeon_deck_v1',
  coreReads:1,
  coreWrites:2,
  indexBlob:blob
},null,2));
