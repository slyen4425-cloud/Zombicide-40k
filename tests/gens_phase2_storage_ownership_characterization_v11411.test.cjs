const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const exists=rel=>fs.existsSync(path.join(root,rel));
const stripQuery=v=>String(v||'').replace(/\?.*$/,'');
const index=read('index.html');
const preview=read('preview.html');
const workflow=read('.github/workflows/main.yml');
const externalOwners=JSON.parse(read('docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json'));
const inlineOwners=JSON.parse(read('docs/GENSRPG_PHASE2_INLINE_OWNERS.json'));
const storageManifest=JSON.parse(read('docs/GENSRPG_PHASE2_STORAGE_OWNERS.json'));

const rawDirect=[...index.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
  .map(m=>m[1]).filter(src=>/^assets\/(?:gensrpg|dungeon)\//.test(src)).map(stripQuery);
const workflowBlock=(workflow.match(/modules = \[(.*?)\n\s*\]/s)||[])[1];
const previewBlock=(preview.match(/const tags=\[(.*?)\n\s*\];/s)||[])[1];
assert.ok(workflowBlock&&previewBlock,'Pages/preview composition blocks required');
const injected=[...workflowBlock.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)].map(m=>stripQuery(m[1]));
const previewInjected=[...previewBlock.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)].map(m=>stripQuery(m[1]));
const CORE_STORAGE='assets/gensrpg/core/storage-v1.js';
assert.equal(rawDirect.filter(x=>x===CORE_STORAGE).length,1,'Core storage must be loaded exactly once by source index.html');
assert.equal(injected[0],CORE_STORAGE,'Pages fallback must keep Core storage first in the injected module list');
assert.equal(previewInjected.includes(CORE_STORAGE),false,'preview must inherit Core storage from source index.html instead of injecting a duplicate');
assert.deepEqual(previewInjected,injected.filter(x=>x!==CORE_STORAGE),'preview and Pages must otherwise share the same external module order');

const productionDirect=[
  ...rawDirect.filter(x=>![
    'assets/gensrpg/gens-mobile-combat-performance-16781022.js',
    'assets/gensrpg/shell/module-launch-final-authority-v1.js'
  ].includes(x)),
  ...injected
];
const assetRefs=source=>[...source.matchAll(/assets\/(?:gensrpg|dungeon)\/[^"'\s)]+\.js(?:\?[^"'\s)]*)?/g)]
  .map(m=>stripQuery(m[0])).filter(exists);
const reachable=new Set(),queue=[...productionDirect];
while(queue.length){
  const rel=queue.shift();
  if(reachable.has(rel))continue;
  reachable.add(rel);
  for(const dep of assetRefs(read(rel)))if(!reachable.has(dep))queue.push(dep);
}
assert.equal(reachable.size,79);

const disabled=new Set(Object.entries(inlineOwners.blocks||{}).filter(([,v])=>v.status==='disabled').map(([k])=>k));
const inline=[...index.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],source:m[2]}))
  .filter(x=>!disabled.has(x.id));
assert.equal(inline.length,119);

function constants(source){
  const out=new Map();
  for(const m of source.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(["'])([^"'\\\r\n]*)\2/g))out.set(m[1],m[3]);
  return out;
}
function resolveArg(arg,map){
  const s=String(arg||'').trim().replace(/\s+/g,' ');
  let m=s.match(/^(["'])(.*?)\1$/s); if(m)return {kind:'literal',key:m[2]};
  m=s.match(/^([A-Za-z_$][\w$]*)$/); if(m&&map.has(m[1]))return {kind:'constant',key:map.get(m[1]),identifier:m[1]};
  m=s.match(/^(["'])(.*?)\1\s*\+/s); if(m)return {kind:'dynamic-prefix',key:m[2]+'*'};
  return {kind:'dynamic',expr:s.slice(0,120)};
}
function accesses(source){
  const map=constants(source),out=[];
  const re=/\b(?:(?:window|R|ROOT)\.)?localStorage(?:\?\.)?\.(getItem|setItem|removeItem)(?:\?\.)?\s*\(\s*([^,\)]+)/g;
  for(const m of source.matchAll(re))out.push({op:m[1],...resolveArg(m[2],map)});
  return out;
}
function scanSource(sourceName,domain,source){
  return accesses(source).map(x=>({source:sourceName,domain,...x}));
}

const rows=[];
for(const file of [...reachable].sort()){
  assert.ok(externalOwners.files?.[file],file+' missing external owner');
  rows.push(...scanSource('file:'+file,externalOwners.files[file].domain,read(file)));
}
for(const block of inline){
  const rec=inlineOwners.blocks?.[block.id];
  assert.ok(rec,block.id+' missing inline owner');
  rows.push(...scanSource('inline:'+block.id,rec.primaryDomain,block.source));
}

const resolved=rows.filter(x=>x.kind!=='dynamic');
const unresolved=rows.filter(x=>x.kind==='dynamic');
const keyMap=new Map();
for(const r of resolved){
  if(!keyMap.has(r.key))keyMap.set(r.key,{key:r.key,domains:new Set(),sources:new Set(),ops:new Set(),kinds:new Set()});
  const rec=keyMap.get(r.key);
  rec.domains.add(r.domain);rec.sources.add(r.source);rec.ops.add(r.op);rec.kinds.add(r.kind);
}
const keys=[...keyMap.values()].map(x=>({
  key:x.key,
  domains:[...x.domains].sort(),
  sources:[...x.sources].sort(),
  ops:[...x.ops].sort(),
  kinds:[...x.kinds].sort()
})).sort((a,b)=>a.key.localeCompare(b.key));

const byDomain={};
for(const r of rows){
  const d=byDomain[r.domain]||(byDomain[r.domain]={accesses:0,resolved:0,unresolved:0,keys:new Set()});
  d.accesses++;
  if(r.kind==='dynamic')d.unresolved++;
  else {d.resolved++;d.keys.add(r.key)}
}
for(const [k,v] of Object.entries(byDomain))byDomain[k]={accesses:v.accesses,resolved:v.resolved,unresolved:v.unresolved,distinctKeys:v.keys.size};

for(const required of ['gensrpg_dungeon_runtime_v2','gensrpg_game_profile_active_v1','z40k_session_active_v1']){
  assert.ok(keys.some(x=>x.key===required),required+' must be resolved by storage characterization');
}

const totals={
  totalAccesses:rows.length,
  resolvedAccesses:resolved.length,
  unresolvedAccesses:unresolved.length,
  distinctResolvedKeys:keys.length
};
const unresolvedBySource={};
for(const x of unresolved){
  if(!unresolvedBySource[x.source])unresolvedBySource[x.source]={source:x.source,domain:x.domain,count:0,expressions:{}};
  const rec=unresolvedBySource[x.source];
  rec.count++;
  rec.expressions[x.expr]=(rec.expressions[x.expr]||0)+1;
}
const unresolvedSummary=Object.values(unresolvedBySource).sort((a,b)=>a.source.localeCompare(b.source));

assert.deepEqual(totals,storageManifest.totals,'storage totals drifted');
assert.deepEqual(byDomain,storageManifest.byDomain,'storage domain ownership drifted');
assert.deepEqual(keys,storageManifest.resolvedKeys,'resolved storage key ownership drifted');
assert.deepEqual(unresolvedSummary,storageManifest.unresolvedBySource,'dynamic storage access inventory drifted');

console.log(JSON.stringify({
  scenario:'Phase 2 storage ownership characterization',
  ...totals,
  byDomain,
  keys,
  unresolved
},null,2));