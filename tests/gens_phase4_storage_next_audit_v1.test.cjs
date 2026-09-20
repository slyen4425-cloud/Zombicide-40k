const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const summary=read('assets/gensrpg/gens-world-summary-167820.js');
const storage=read('assets/gensrpg/core/storage-v1.js');
const index=read('index.html');
const workflow=read('.github/workflows/main.yml');
const preview=read('preview.html');

assert.equal((summary.match(/localStorage\.getItem\(/g)||[]).length,0,'World Summary direct storage read must be removed after Core raccord');
assert.equal((summary.match(/localStorage\.setItem\(/g)||[]).length,0,'World Summary must remain read-only');
assert.equal((summary.match(/localStorage\.removeItem\(/g)||[]).length,0,'World Summary must remain read-only');

assert.match(summary,/function readJson\(key,fallback\)\{return ROOT\.GensStorageV1\.readJson\(ROOT\.localStorage,key,fallback\)\}/,'World Summary JSON helper must delegate to Core storage without changing key or fallback');
assert.match(summary,/readJson\("gensrpg_shared_entities_v1__"\+profileId,\[\]\)/,'World Summary must read the exact per-profile Capture entity family');
assert.match(summary,/readJson\("gensrpg_shared_entities_v1__family__creature",\[\]\)/,'World Summary must read the Capture creature-family fallback');
assert.doesNotMatch(summary,/localStorage\.(?:setItem|removeItem)\(/,'World Summary cannot become a storage writer');

assert.match(storage,/function readJson\(storage,key,fallback\)/,'Core storage JSON reader must exist');
assert.ok(workflow.indexOf('assets/gensrpg/core/storage-v1.js')>=0,'Pages must load Core storage');
assert.ok(workflow.indexOf('assets/gensrpg/gens-world-summary-167820.js')>workflow.indexOf('assets/gensrpg/core/storage-v1.js'),'Pages must load Core storage before World Summary');
assert.equal((index.match(/assets\/gensrpg\/core\/storage-v1\.js/g)||[]).length,1,'Source index must load Core storage exactly once for raw and preview bootstrap');
assert.equal(preview.indexOf('assets/gensrpg/core/storage-v1.js'),-1,'Preview must inherit Core storage from source index instead of injecting a duplicate');
assert.ok(preview.indexOf('assets/gensrpg/gens-world-summary-167820.js')>=0,'Preview must still inject World Summary after the source-index bootstrap');

console.log(JSON.stringify({
  scenario:'Phase 4 storage next-audit',
  candidate:'assets/gensrpg/gens-world-summary-167820.js',
  directReads:0,
  writes:0,
  keyFamilies:[
    'gensrpg_shared_entities_v1__<profileId>',
    'gensrpg_shared_entities_v1__family__creature'
  ],
  nextLot:'open a fresh storage audit from the World Summary GREEN checkpoint'
},null,2));