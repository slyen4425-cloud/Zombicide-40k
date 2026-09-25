'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');

const root=path.join(__dirname,'..');
const bytes=fs.readFileSync(path.join(root,'index.html'));
const index=bytes.toString('utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');

assert.equal(bytes.length,8170402,
  'custom-enemy-refresh wrapper lot must start from the exact GREEN base-reserve runtime size');
assert.equal(blob,'2a7dae75115d83b4edc368c42453a7cb58d0bd73',
  'custom-enemy-refresh wrapper lot must target the exact GREEN base-reserve runtime');

assert.equal(
  (index.match(/function\s+refreshCustomEnemiesIntoZombieTypes\s*\(/g)||[]).length,
  1,
  'the native shared refreshCustomEnemiesIntoZombieTypes owner must remain present'
);

const start=index.indexOf('<script id="dungeonArtRenderFix165">');
const end=index.indexOf('</script>',start);
assert.ok(start>=0&&end>start,'dungeonArtRenderFix165 must remain present');
const v165=index.slice(start,end);

assert.doesNotMatch(
  v165,
  /window\.refreshCustomEnemiesIntoZombieTypes\s*=\s*function\s*\(/,
  'Phase 6 requires retiring the Dungeon V165 global refreshCustomEnemiesIntoZombieTypes wrapper'
);

for(const preserved of [
  /window\.gensDungeonCreatureArt165\s*=\s*function/,
  /window\.activeEnemyDefinition\s*=\s*function/,
  /window\.enemyCardHtml\s*=\s*function/,
  /window\.openZombieRule\s*=\s*function/,
  /window\.renderActiveEnemies\s*=\s*function/
]){
  assert.match(v165,preserved,
    'this micro-lot must preserve the reviewed remaining Dungeon V165 art protections');
}

const nativeStart=index.indexOf('function refreshCustomEnemiesIntoZombieTypes(){');
const nativeEnd=index.indexOf('function isDungeonEnemyRecord(',nativeStart);
assert.ok(nativeStart>=0&&nativeEnd>nativeStart,'native refresh owner must have the reviewed boundary');
const native=index.slice(nativeStart,nativeEnd);

assert.match(native,/applyBuiltinEnemyOverrides\(\)/,
  'native shared refresh behavior must remain unchanged in this micro-lot');
assert.match(native,/loadCustomEnemies\(\)/,
  'native custom-enemy publication must remain unchanged');
assert.match(native,/ensureDungeonEnemies/,
  'mixed Dungeon dependency is intentionally deferred to a later micro-lot');

assert.match(index,/<script id="dungeonDirectImageBinding166">/,
  'direct Dungeon image binding V166 must remain loaded');

console.log(JSON.stringify({
  scenario:'Phase 6 retire Dungeon V165 global custom-enemy refresh wrapper',
  expected:'RED before retirement, GREEN after removing only the reviewed V165 wrapper',
  nativeOwnerPreserved:true
},null,2));
