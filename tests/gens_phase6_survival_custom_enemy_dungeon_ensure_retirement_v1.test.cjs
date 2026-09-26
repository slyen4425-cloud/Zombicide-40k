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

assert.equal(bytes.length,8170350,
  'Dungeon ensure retirement lot must run on the current Phase 7 Dungeon generated-advance runtime size');
assert.equal(blob,'e513d23c7a8c7aef9a187202bbcc34ab540e856f',
  'Dungeon ensure retirement lot must target the current Phase 7 runtime baseline');

assert.equal(
  (index.match(/function\s+refreshCustomEnemiesIntoZombieTypes\s*\(/g)||[]).length,
  1,
  'shared refresh owner must remain unique'
);

const nativeStart=index.indexOf('function refreshCustomEnemiesIntoZombieTypes(){');
const nativeEnd=index.indexOf('function isDungeonEnemyRecord(',nativeStart);
assert.ok(nativeStart>=0&&nativeEnd>nativeStart,'native refresh owner must have the reviewed boundary');
const native=index.slice(nativeStart,nativeEnd);

assert.match(native,/applyBuiltinEnemyOverrides\(\)/,
  'shared refresh must preserve builtin publication');
assert.match(native,/loadCustomEnemies\(\)/,
  'shared refresh must preserve custom enemy publication');
assert.doesNotMatch(native,/ensureDungeonEnemies/,
  'Phase 6 requires removing the private Dungeon ensureDungeonEnemies dependency from the shared custom-enemy refresh owner');

assert.equal(
  (index.match(/function\s+ensureDungeonEnemies\s*\(/g)||[]).length,
  1,
  'the Dungeon-owned ensureDungeonEnemies function itself must remain present'
);
assert.match(
  index,
  /function\s+ensureDungeonContent\s*\(\)\s*\{[^}]*ensureDungeonEnemies\(\)/,
  'Dungeon ensureDungeonContent must keep its own ensureDungeonEnemies call'
);

for(const id of ['dungeonGithubArts164','dungeonArtRenderFix165','dungeonDirectImageBinding166']){
  assert.ok(index.includes('<script id="'+id+'">'),id+' must remain loaded');
}

console.log(JSON.stringify({
  scenario:'Phase 6 retire ensureDungeonEnemies dependency from shared custom enemy refresh',
  expected:'RED before retiring only the reviewed direct call, GREEN afterward',
  dungeonEnsureOwnerPreserved:true
},null,2));
