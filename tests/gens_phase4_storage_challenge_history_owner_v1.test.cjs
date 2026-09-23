const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex');

const m=index.match(/<script[^>]*id=["']dungeonCore051ExplorationPolish["'][^>]*>([\s\S]*?)<\/script>/i);
assert.ok(m,'dungeonCore051ExplorationPolish must exist');
const block=m[1];

assert.match(block,/const hk="gensrpg_dc067_challenge_history"/);
assert.equal((block.match(/localStorage\.getItem\(hk\)/g)||[]).length,0,'Challenge History must have no direct localStorage read after raccord');
assert.equal((block.match(/localStorage\.setItem\(hk,/g)||[]).length,0,'Challenge History must have no direct localStorage write after raccord');
assert.equal((block.match(/GensStorageV1\.readJson\(localStorage,hk,\[\]\)/g)||[]).length,1,'Challenge History must use exactly one Core JSON read');
assert.equal((block.match(/GensStorageV1\.writeJson\(localStorage,hk,hist\.slice\(-24\)\)/g)||[]).length,1,'Challenge History must use exactly one Core JSON write');

assert.match(block,/let hist=\[\];try\{hist=GensStorageV1\.readJson\(localStorage,hk,\[\]\);if\(!Array\.isArray\(hist\)\)hist=\[\]\}catch\(e\)\{hist=\[\]\}/,'array normalization and historical catch boundary must remain');
assert.match(block,/const recent=new Set\(hist\.slice\(-12\)\.map\(String\)\)/,'anti-repeat window must remain 12');
assert.match(block,/if\(!fresh\.length\)fresh=p/,'full-pool fallback must remain');
assert.match(block,/hist\.push\(String\(chosen\.id\)\)/,'chosen challenge must still be appended');
assert.match(block,/try\{GensStorageV1\.writeJson\(localStorage,hk,hist\.slice\(-24\)\)\}catch\(e\)\{\}/,'write must remain swallowed by historical try/catch');
assert.equal(block.includes('gensrpg_dungeon_runtime_v2'),false,'Challenge History raccord must not touch deferred runtime_v2');

assert.equal(bytes.length,8171576,'current Phase 5 Shell index size must remain deterministic');
assert.equal(blob,'12be0fdbaa5c05f7852933b48a3dd5df09da6145','current Phase 5 Shell index blob must remain deterministic');

console.log(JSON.stringify({
  scenario:'Phase 4 Challenge History 0.67 Core storage authority',
  key:'gensrpg_dc067_challenge_history',
  coreReads:1,
  coreWrites:1,
  recentWindow:12,
  persistedHistory:24,
  indexBlob:blob
},null,2));
