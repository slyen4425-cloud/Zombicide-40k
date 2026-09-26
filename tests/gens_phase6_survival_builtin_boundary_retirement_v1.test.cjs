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
  'builtin boundary lot must run on the current Phase 7 Dungeon generated-advance runtime size');
assert.equal(blob,'e513d23c7a8c7aef9a187202bbcc34ab540e856f',
  'builtin boundary lot must target the current Phase 7 runtime baseline');

assert.equal(
  (index.match(/function\s+refreshCustomEnemiesIntoZombieTypes\s*\(/g)||[]).length,
  1,
  'shared custom-enemy refresh owner must remain unique'
);

const refreshStart=index.indexOf('function refreshCustomEnemiesIntoZombieTypes(){');
const refreshEnd=index.indexOf('function isDungeonEnemyRecord(',refreshStart);
assert.ok(refreshStart>=0&&refreshEnd>refreshStart,'shared refresh must keep the reviewed boundary');
const refresh=index.slice(refreshStart,refreshEnd);
assert.match(refresh,/applyBuiltinEnemyOverrides\(\)/,
  'shared refresh must keep applying default Survival builtin overrides');
assert.doesNotMatch(refresh,/ensureDungeonEnemies/,
  'shared refresh must keep the previous Dungeon ensure retirement');

const applyStart=index.indexOf('function applyBuiltinEnemyOverrides');
const applyEnd=index.indexOf('function resetBuiltinEnemyCustomization(',applyStart);
assert.ok(applyStart>=0&&applyEnd>applyStart,'builtin override owner must keep the reviewed boundary');
const apply=index.slice(applyStart,applyEnd);
assert.match(apply,/function applyBuiltinEnemyOverrides\(bases=BASE_ZOMBIE_TYPES\)/,
  'Phase 6 requires the shared builtin override transform to accept explicit bases and default only to Survival bases');
assert.doesNotMatch(apply,/dungeonEnemies/,
  'Phase 6 requires removing the private Dungeon enemy factory from the shared builtin override transform');
assert.match(apply,/bases\.forEach/,
  'shared builtin override transform must operate on the provided/default base list');

assert.equal(
  (index.match(/function\s+ensureDungeonEnemies\s*\(/g)||[]).length,
  1,
  'Dungeon ensure owner must remain unique'
);
const ensureStart=index.indexOf('function ensureDungeonEnemies(){');
const ensureEnd=index.indexOf('function dungeonContentIds(',ensureStart);
assert.ok(ensureStart>=0&&ensureEnd>ensureStart,'Dungeon ensure owner must keep the reviewed boundary');
const ensure=index.slice(ensureStart,ensureEnd);
assert.match(ensure,/const bases=dungeonEnemies\(\)/,
  'Dungeon ensure must own the private Dungeon builtin factory call');
assert.match(ensure,/applyBuiltinEnemyOverrides\(bases\)/,
  'Dungeon ensure must explicitly apply shared overrides to its own builtin bases');

assert.match(index,
  /applyBuiltinEnemyOverrides\(\[builtinEnemyBase\(baseId\)\]\.filter\(Boolean\)\)/,
  'builtin editor save must apply the exact already-resolved builtin base instead of rebuilding every mode');
assert.match(index,
  /function resetBuiltinEnemyCustomization\(id\)\{[\s\S]*?applyBuiltinEnemyOverrides\(\[base\]\)/,
  'builtin reset must apply the exact already-resolved builtin base');

assert.equal(
  (index.match(/function\s+dungeonEnemies\s*\(/g)||[]).length,
  1,
  'native Dungeon enemy factory must remain present'
);

const v164Start=index.indexOf('<script id="dungeonGithubArts164">');
const v164End=index.indexOf('</script>',v164Start);
assert.ok(v164Start>=0&&v164End>v164Start,'Dungeon V164 art layer must remain loaded');
const v164=index.slice(v164Start,v164End);
assert.match(v164,/window\.dungeonEnemies=function\(\)/,
  'Dungeon V164 may keep decorating the Dungeon-owned enemy factory for art');
assert.match(v164,/window\.dungeonApplyGithubArts164=function\(\)/,
  'Dungeon V164 art application helper must remain available');
assert.doesNotMatch(v164,/window\.applyBuiltinEnemyOverrides=function\(\)/,
  'Phase 6 requires retiring the Dungeon V164 global wrapper around the shared builtin override owner');
assert.doesNotMatch(v164,/oldApplyOverrides164/,
  'retired V164 shared-owner wrapper must leave no stale alias');

for(const id of ['dungeonArtRenderFix165','dungeonDirectImageBinding166']){
  assert.ok(index.includes('<script id="'+id+'">'),id+' must remain loaded unchanged');
}

console.log(JSON.stringify({
  scenario:'Phase 6 retire Dungeon builtin dependencies from shared Survival refresh boundary',
  expected:'RED before the reviewed boundary split, GREEN afterward',
  survivalDefaultBases:'BASE_ZOMBIE_TYPES',
  dungeonFactoryOwner:'ensureDungeonEnemies',
  v164DungeonFactoryArtDecoratorPreserved:true,
  v164SharedApplyWrapperRetired:true
},null,2));
