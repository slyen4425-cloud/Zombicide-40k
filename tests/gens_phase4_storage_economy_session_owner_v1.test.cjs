const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const match = index.match(/<script\b[^>]*\bid=["']dungeonEconomy160["'][^>]*>([\s\S]*?)<\/script>/i);
assert.ok(match, 'Dungeon Economy owner block must be locatable');
const block = match[1];

const PREFIX = 'gensrpg_dungeon_session_eco_160_';
assert.equal(block.split(PREFIX).length - 1, 1, 'Economy Session must retain one profile-scoped key factory');
assert.equal((block.match(/window\.dungeonSessionEco160\s*=/g) || []).length, 1, 'reader owner must remain unique');
assert.equal((block.match(/window\.saveDungeonSessionEco160\s*=/g) || []).length, 1, 'writer owner must remain unique');

assert.equal(
  (block.match(/JSON\.parse\(localStorage\.getItem\(key\)\|\|"\{\}"\)/g) || []).length,
  0,
  'Economy Session must have no direct localStorage JSON read after raccord'
);
assert.equal(
  (block.match(/localStorage\.setItem\(key,JSON\.stringify\(rest\)\)/g) || []).length,
  0,
  'Economy Session must have no direct localStorage JSON write after raccord'
);
assert.equal(
  (block.match(/GensStorageV1\.readJson\(localStorage,key,\{\}\)/g) || []).length,
  1,
  'Economy Session must use exactly one Core JSON read'
);
assert.equal(
  (block.match(/GensStorageV1\.writeJson\(localStorage,key,rest\)/g) || []).length,
  1,
  'Economy Session must use exactly one Core JSON write'
);

assert.match(
  block,
  /const id=String\(activeGameProfileId\(\)\|\|"dungeon"\);\s*const key="gensrpg_dungeon_session_eco_160_"\+id;/,
  'profile-scoped key construction must remain Dungeon-owned'
);
assert.match(
  block,
  /const d=\{chests:0,merchantPasses:0\};/,
  'Economy Session defaults must remain unchanged'
);
assert.match(
  block,
  /try\{Object\.assign\(d,GensStorageV1\.readJson\(localStorage,key,\{\}\)\)\}catch\(e\)\{\}/,
  'reader must preserve its historical merge/error boundary'
);
assert.match(
  block,
  /return \{key,\.\.\.d\}/,
  'legacy {key,...d} precedence must remain unchanged'
);
assert.match(
  block,
  /if\(!d\?\.key\) return;\s*const \{key,\.\.\.rest\}=d;\s*GensStorageV1\.writeJson\(localStorage,key,rest\)/,
  'writer must preserve carried key, no-op and payload exclusion contract'
);

assert.equal(block.includes('removeItem'), false, 'Economy Session must not add removeItem');
assert.equal(
  (block.match(/localStorage\.setItem\(key\(heroId\),/g) || []).length,
  1,
  'hero inventory direct writer must remain untouched in this micro-lot'
);
assert.equal(
  (block.match(/GensStorageV1\.readJson\(localStorage,DUNGEON_ECO_RULES_160,\{\}\)/g) || []).length,
  1,
  'already-migrated Economy Rules read must remain untouched'
);
assert.equal(
  (block.match(/GensStorageV1\.writeJson\(localStorage,DUNGEON_ECO_RULES_160,r\|\|dungeonEconomyRules160\(\)\)/g) || []).length,
  1,
  'already-migrated Economy Rules write must remain untouched'
);
assert.equal(block.includes('gensrpg_dungeon_runtime_v2'), false, 'deferred runtime_v2 must remain outside Economy owner');

console.log(JSON.stringify({
  scenario: 'Phase 4 Economy Session Core storage authority',
  owner: 'dungeonEconomy160',
  keyPrefix: PREFIX,
  coreReads: 1,
  coreWrites: 1,
  untouchedSameBlock: {economyRules: true, heroInventory: true}
}, null, 2));
