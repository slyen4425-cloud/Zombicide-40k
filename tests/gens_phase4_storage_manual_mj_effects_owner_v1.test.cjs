const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex');

const scriptStart=index.indexOf('<script id="dungeonCore046ManualMjAssist">');
const scriptEnd=index.indexOf('</script>',scriptStart);
assert.ok(scriptStart>=0&&scriptEnd>scriptStart,'Manual MJ owner block must be locatable');
const block=index.slice(scriptStart,scriptEnd);

assert.ok(block.includes('const KEY="gensrpg_manual_mj_effects_v1";'),'Dungeon Manual MJ must retain the exact key');
assert.equal((block.match(/localStorage\.getItem\(KEY\)/g)||[]).length,0,'Manual MJ must have no direct localStorage read after raccord');
assert.equal((block.match(/localStorage\.setItem\(KEY/g)||[]).length,0,'Manual MJ must have no direct localStorage write after raccord');
assert.equal((block.match(/GensStorageV1\.readJson\(localStorage,KEY,\[\]\)/g)||[]).length,1,'Manual MJ must use exactly one Core JSON read');
assert.equal((block.match(/GensStorageV1\.writeJson\(localStorage,KEY,a\|\|\[\]\)/g)||[]).length,1,'Manual MJ must use exactly one Core JSON write');

assert.match(block,/function loadEffects\(\)\{const a=GensStorageV1\.readJson\(localStorage,KEY,\[\]\);return Array\.isArray\(a\)\?a:\[\]\}/,'Array ownership/fallback must remain in Dungeon Manual MJ');
assert.match(block,/function saveEffects\(a\)\{GensStorageV1\.writeJson\(localStorage,KEY,a\|\|\[\]\)\}/,'Writer must preserve a || [] contract without swallowing errors');
assert.equal(block.includes('gensrpg_dungeon_runtime_v2'),false,'Manual MJ raccord must not touch deferred runtime_v2');

assert.equal(bytes.length,8170726,'current index size must include the later Challenge Library micro-diff');
assert.equal(blob,'d9ee34d47fa888795db68cdc244d0c73d30ee523','current index blob must include the later Challenge Library micro-diff');

console.log(JSON.stringify({
  scenario:'Phase 4 Manual MJ effects Core storage authority',
  key:'gensrpg_manual_mj_effects_v1',
  coreReads:1,
  coreWrites:1,
  indexBlob:blob
},null,2));
