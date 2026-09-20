const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const summary=fs.readFileSync(path.join(root,'assets','gensrpg','gens-world-summary-167820.js'),'utf8');

assert.doesNotMatch(summary,/\blocalStorage\.(?:getItem|setItem|removeItem)\s*\(/,'World Summary must not own direct localStorage after Core raccord');
assert.match(summary,/GensStorageV1\.readJson\(ROOT\.localStorage,key,fallback\)/,'World Summary JSON helper must delegate to Core storage with the same key and fallback');
assert.doesNotMatch(summary,/GensStorageV1\.writeJson\(/,'World Summary must remain read-only through Core storage');

assert.match(summary,/readJson\("gensrpg_shared_entities_v1__"\+profileId,\[\]\)/,'per-profile Capture entity key must remain unchanged');
assert.match(summary,/readJson\("gensrpg_shared_entities_v1__family__creature",\[\]\)/,'Capture creature-family fallback key must remain unchanged');

console.log(JSON.stringify({
  scenario:'Phase 4 World Summary storage owner',
  consumer:'Shell World Summary',
  owner:'GensStorageV1',
  readOnly:true,
  formatMigration:false
},null,2));
