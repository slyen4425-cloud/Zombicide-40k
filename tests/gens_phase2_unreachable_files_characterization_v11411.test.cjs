const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const exists=rel=>fs.existsSync(path.join(root,rel));
const stripQuery=v=>String(v||'').replace(/\?.*$/,'');
const manifest=JSON.parse(read('docs/GENSRPG_PHASE2_NONPRODUCTION_FILES.json'));

const targets=[
  'assets/gensrpg/dungeon/progression-runtime-v1.js',
  'assets/gensrpg/gens-dungeon-ingame-hero-art-167898.js',
  'assets/gensrpg/gens-dungeon-sheet-art-stability-167899.js',
  'assets/gensrpg/gens-rpg-tactical-hotfix-1678114.js',
  'assets/gensrpg/gens-rpg-tactical-session-guard-16781144.js',
  'assets/gensrpg/gens-rpg-tactical-wall-dice-stats-16781145.js',
  'assets/gensrpg/gens-stat-manual-cost-167898.js'
];
for(const rel of targets)assert.equal(exists(rel),true,'expected physical file missing: '+rel);

const index=read('index.html');
const preview=read('preview.html');
const workflow=read('.github/workflows/main.yml');
const rawDirect=[...index.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
  .map(m=>m[1]).filter(src=>/^assets\/(?:gensrpg|dungeon)\//.test(src)).map(stripQuery);
const workflowBlock=(workflow.match(/modules = \[(.*?)\n\s*\]/s)||[])[1];
const previewBlock=(preview.match(/const tags=\[(.*?)\n\s*\];/s)||[])[1];
assert.ok(workflowBlock&&previewBlock);
const injected=[...workflowBlock.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)].map(m=>stripQuery(m[1]));
const previewInjected=[...previewBlock.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)].map(m=>stripQuery(m[1]));
const CORE_STORAGE='assets/gensrpg/core/storage-v1.js';
assert.equal(rawDirect.filter(x=>x===CORE_STORAGE).length,1,'Core storage must be loaded exactly once by source index.html');
assert.equal(injected[0],CORE_STORAGE,'Pages fallback must keep Core storage first');
assert.equal(previewInjected.includes(CORE_STORAGE),false,'Preview must inherit Core storage from source index instead of injecting a duplicate');
assert.deepEqual(previewInjected,injected.filter(x=>x!==CORE_STORAGE),'Preview and Pages must otherwise share the same external module order');
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
assert.equal(reachable.size,81);
for(const rel of targets)assert.equal(reachable.has(rel),false,rel+' unexpectedly entered production graph');

const textExt=new Set(['.js','.cjs','.mjs','.html','.md','.json','.yml','.yaml','.txt','.webmanifest']);
function walk(dir,out=[]){
  for(const ent of fs.readdirSync(dir,{withFileTypes:true})){
    if(['.git','node_modules'].includes(ent.name))continue;
    const abs=path.join(dir,ent.name);
    if(ent.isDirectory())walk(abs,out);
    else out.push(abs);
  }
  return out;
}
const files=walk(root).filter(abs=>textExt.has(path.extname(abs).toLowerCase()));
const self='tests/gens_phase2_unreachable_files_characterization_v11411.test.cjs';
const manifestPath='docs/GENSRPG_PHASE2_NONPRODUCTION_FILES.json';
const report=[];
for(const target of targets){
  const base=path.basename(target);
  const refs=[];
  for(const abs of files){
    const rel=path.relative(root,abs).replace(/\\/g,'/');
    if(rel===target||rel===self||rel===manifestPath)continue;
    let src;try{src=fs.readFileSync(abs,'utf8')}catch(e){continue}
    if(src.includes(target)||src.includes(base))refs.push(rel);
  }
  const buckets={
    tests:refs.filter(x=>x.startsWith('tests/')),
    docs:refs.filter(x=>x.startsWith('docs/')),
    workflows:refs.filter(x=>x.startsWith('.github/workflows/')),
    other:refs.filter(x=>!x.startsWith('tests/')&&!x.startsWith('docs/')&&!x.startsWith('.github/workflows/'))
  };
  report.push({file:target,refs,buckets});
}
const expected=(manifest.files||[]).map(x=>({file:x.file,refs:x.refs}));
assert.deepEqual(
  report.map(x=>({file:x.file,refs:x.refs})),
  expected,
  'non-production file references drifted'
);
for(const rec of manifest.files||[]){
  const row=report.find(x=>x.file===rec.file);
  assert.ok(row,rec.file+' missing from characterization');
  assert.equal(rec.serviceWorkerCached,row.refs.includes('service-worker.js'),rec.file+' service-worker cache classification drifted');
  assert.equal(rec.workflowReferenced,row.refs.some(x=>x.startsWith('.github/workflows/')),rec.file+' workflow-reference classification drifted');
}

console.log(JSON.stringify({
  scenario:'Phase 2 non-production file characterization',
  productionReachable:reachable.size,
  targetCount:targets.length,
  files:report
},null,2));