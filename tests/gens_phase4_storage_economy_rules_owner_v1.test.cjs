const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bytes=Buffer.from(index,'utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([Buffer.from('blob '+bytes.length+'\0'),bytes])).digest('hex');

const start=index.indexOf('<script id="dungeonEconomy160">');
const end=index.indexOf('</script>',start);
assert.ok(start>=0&&end>start,'Dungeon Economy owner block must be locatable');
const block=index.slice(start,end);

assert.ok(block.includes('const DUNGEON_ECO_RULES_160="gensrpg_dungeon_economy_rules_160";'),'Dungeon Economy must retain the exact rules key');
assert.equal((block.match(/localStorage\.getItem\(DUNGEON_ECO_RULES_160\)/g)||[]).length,0,'Economy rules must have no direct localStorage read after raccord');
assert.equal((block.match(/localStorage\.setItem\(DUNGEON_ECO_RULES_160/g)||[]).length,0,'Economy rules must have no direct localStorage write after raccord');
assert.equal((block.match(/GensStorageV1\.readJson\(localStorage,DUNGEON_ECO_RULES_160,\{\}\)/g)||[]).length,1,'Economy rules must use exactly one Core JSON read');
assert.equal((block.match(/GensStorageV1\.writeJson\(localStorage,DUNGEON_ECO_RULES_160,r\|\|dungeonEconomyRules160\(\)\)/g)||[]).length,1,'Economy rules must use exactly one Core JSON write');

assert.match(block,/try\{Object\.assign\(d,GensStorageV1\.readJson\(localStorage,DUNGEON_ECO_RULES_160,\{\}\)\)\}catch\(e\)\{\}/,'Dungeon must retain default merge/error boundary');
assert.match(block,/function\(r\)\{\s*GensStorageV1\.writeJson\(localStorage,DUNGEON_ECO_RULES_160,r\|\|dungeonEconomyRules160\(\)\);\s*\}/,'writer must preserve r || dungeonEconomyRules160() contract');

assert.equal((block.match(/localStorage\.getItem\(key\)/g)||[]).length,0,'migrated Economy session must have no direct read');
assert.equal((block.match(/localStorage\.setItem\(key,/g)||[]).length,0,'migrated Economy session must have no direct write');
assert.equal((block.match(/localStorage\.setItem\(key\(heroId\),/g)||[]).length,1,'hero inventory write must remain direct and untouched');
assert.equal((block.match(/GensStorageV1\.readJson\(localStorage,key,\{\}\)/g)||[]).length,1,'migrated Economy session must use one Core read');
assert.equal((block.match(/GensStorageV1\.writeJson\(localStorage,key,rest\)/g)||[]).length,1,'migrated Economy session must use one Core write');
assert.match(block,/const key="gensrpg_dungeon_session_eco_160_"\+id/,'dynamic Economy session key must remain profile-scoped');
assert.equal(block.includes('gensrpg_dungeon_runtime_v2'),false,'Economy rules raccord must not touch deferred runtime_v2');

assert.equal(bytes.length,8172500,'post-raccord index size must match the exact Economy rules micro-diff');
assert.equal(blob,'7b586e9fb14b7a93a0edb069e115fd6d48cbda97','post-raccord index blob must match the exact Economy rules micro-diff');

console.log(JSON.stringify({
  scenario:'Phase 4 Dungeon Economy rules Core storage authority',
  key:'gensrpg_dungeon_economy_rules_160',
  coreReads:1,
  coreWrites:1,
  sameBlock:{economyRulesCore:true,dynamicSessionCore:true,heroInventoryDirect:true},
  indexBlob:blob
},null,2));
