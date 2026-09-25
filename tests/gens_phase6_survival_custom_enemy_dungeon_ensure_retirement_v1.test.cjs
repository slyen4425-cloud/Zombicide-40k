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
  'Dungeon ensure retirement lot must start from the exact custom-enemy-wrapper GREEN runtime size');
assert.equal(blob,'2a7dae75115d83b4edc368c42453a7cb58d0bd73',
  'Dungeon ensure retirement lot must target the exact custom-enemy-wrapper GREEN runtime');

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
