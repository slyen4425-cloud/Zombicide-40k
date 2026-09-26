const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const stripQuery=value=>String(value||'').replace(/\?.*$/,'');
const exists=rel=>fs.existsSync(path.join(root,rel));

const index=read('index.html');
const preview=read('preview.html');
const workflow=read('.github/workflows/main.yml');
const manifest=JSON.parse(read('docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json'));

const rawDirect=[...index.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
  .map(m=>m[1])
  .filter(src=>/^assets\/(?:gensrpg|dungeon)\//.test(src))
  .map(stripQuery);

const workflowBlock=(workflow.match(/modules = \[(.*?)\n\s*\]/s)||[])[1];
assert.ok(workflowBlock,'GitHub Pages module injection list missing');
const previewBlock=(preview.match(/const tags=\[(.*?)\n\s*\];/s)||[])[1];
assert.ok(previewBlock,'preview module injection list missing');

const injected=[...workflowBlock.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)]
  .map(m=>stripQuery(m[1]));
const previewInjected=[...previewBlock.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)]
  .map(m=>stripQuery(m[1]));
assert.deepEqual(previewInjected,injected.filter(x=>x!=='assets/gensrpg/core/storage-v1.js'),'owner manifest must follow Pages additions while preview inherits Core storage from source index');

const productionDirect=[
  ...rawDirect.filter(x=>![
    'assets/gensrpg/gens-mobile-combat-performance-16781022.js',
    'assets/gensrpg/shell/module-launch-final-authority-v1.js'
  ].includes(x)),
  ...injected
];

const assetRefs=source=>[...source.matchAll(/assets\/(?:gensrpg|dungeon)\/[^"'\x60\s)]+\.js(?:\?[^"'\x60\s)]*)?/g)]
  .map(m=>stripQuery(m[0]))
  .filter(exists);

const reachable=new Set();
const queue=[...productionDirect];
while(queue.length){
  const rel=queue.shift();
  if(reachable.has(rel))continue;
  assert.equal(exists(rel),true,'production graph references missing asset: '+rel);
  reachable.add(rel);
  for(const dep of assetRefs(read(rel)))if(!reachable.has(dep))queue.push(dep);
}

const mapped=new Set(Object.keys(manifest.files||{}));
assert.equal(reachable.size,81,'production graph must include the active Survival and Dungeon entries');
assert.equal(mapped.size,81,'owner manifest must map all 81 production-reachable files after the first Phase 7 Dungeon extraction');

const missing=[...reachable].filter(rel=>!mapped.has(rel)).sort();
const stale=[...mapped].filter(rel=>!reachable.has(rel)).sort();
assert.deepEqual(missing,[],'production-reachable files without an owner: '+missing.join(', '));
assert.deepEqual(stale,[],'owner manifest contains files no longer production-reachable: '+stale.join(', '));

const allowed=new Set(manifest.allowedDomains||[]);
for(const rel of [...reachable].sort()){
  const rec=manifest.files[rel];
  assert.ok(rec&&typeof rec.owner==='string'&&rec.owner.trim(),rel+' must have a non-empty owner');
  assert.ok(rec&&typeof rec.role==='string'&&rec.role.trim(),rel+' must have a non-empty role');
  assert.ok(allowed.has(rec.domain),rel+' has an unknown domain '+String(rec?.domain));
}

const counts={};
for(const rec of Object.values(manifest.files))counts[rec.domain]=(counts[rec.domain]||0)+1;

console.log(JSON.stringify({
  scenario:'Phase 2 production runtime owner manifest',
  productionReachable:reachable.size,
  ownerMapped:mapped.size,
  domainCounts:counts
},null,2));
