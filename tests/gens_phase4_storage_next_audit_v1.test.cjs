const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const summary=read('assets/gensrpg/gens-world-summary-167820.js');
const storage=read('assets/gensrpg/core/storage-v1.js');
const workflow=read('.github/workflows/main.yml');
const preview=read('preview.html');

assert.equal((summary.match(/localStorage\.getItem\(/g)||[]).length,1,'World Summary must have exactly one direct storage read before migration');
assert.equal((summary.match(/localStorage\.setItem\(/g)||[]).length,0,'World Summary must remain read-only');
assert.equal((summary.match(/localStorage\.removeItem\(/g)||[]).length,0,'World Summary must remain read-only');

assert.match(summary,/function readJson\(key,fallback\)\{try\{const v=JSON\.parse\(localStorage\.getItem\(key\)\|\|""\);return v\?\?fallback\}catch\(e\)\{return fallback\}\}/,'World Summary JSON fallback semantics must be characterized');
assert.match(summary,/readJson\("gensrpg_shared_entities_v1__"\+profileId,\[\]\)/,'World Summary must read the exact per-profile Capture entity family');
assert.match(summary,/readJson\("gensrpg_shared_entities_v1__family__creature",\[\]\)/,'World Summary must read the Capture creature-family fallback');
assert.doesNotMatch(summary,/localStorage\.(?:setItem|removeItem)\(/,'World Summary cannot become a storage writer');

assert.match(storage,/function readJson\(storage,key,fallback\)/,'Core storage JSON reader must exist');
assert.ok(workflow.indexOf('assets/gensrpg/core/storage-v1.js')>=0,'Pages must load Core storage');
assert.ok(workflow.indexOf('assets/gensrpg/gens-world-summary-167820.js')>workflow.indexOf('assets/gensrpg/core/storage-v1.js'),'Pages must load Core storage before World Summary');
assert.ok(preview.indexOf('assets/gensrpg/core/storage-v1.js')>=0,'Preview must load Core storage');
assert.ok(preview.indexOf('assets/gensrpg/gens-world-summary-167820.js')>preview.indexOf('assets/gensrpg/core/storage-v1.js'),'Preview must load Core storage before World Summary');

console.log(JSON.stringify({
  scenario:'Phase 4 storage next-audit',
  candidate:'assets/gensrpg/gens-world-summary-167820.js',
  directReads:1,
  writes:0,
  keyFamilies:[
    'gensrpg_shared_entities_v1__<profileId>',
    'gensrpg_shared_entities_v1__family__creature'
  ],
  nextLot:'World Summary read-only Core storage raccord'
},null,2));