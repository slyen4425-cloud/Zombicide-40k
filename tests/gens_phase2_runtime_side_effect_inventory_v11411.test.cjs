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
  ...rawDirect.filter(x=>x!=='assets/gensrpg/gens-mobile-combat-performance-16781022.js'),
  ...injected
];
const assetRefs=source=>[...source.matchAll(/assets\/(?:gensrpg|dungeon)\/[^"'\x60\s)]+\.js(?:\?[^"'\x60\s)]*)?/g)]
  .map(m=>stripQuery(m[0])).filter(exists);
const reachable=new Set(),queue=[...productionDirect];
while(queue.length){
  const rel=queue.shift();
  if(reachable.has(rel))continue;
  reachable.add(rel);
  for(const dep of assetRefs(read(rel)))if(!reachable.has(dep))queue.push(dep);
}
assert.equal(reachable.size,78);
for(const rel of reachable)assert.ok(manifest.files?.[rel],rel+' must be owned before side-effect inventory');

const disabled=new Set([
  'dungeonCore081TacticalMovementDisabled',
  'dungeonCore084MovementRuntimeFixDisabled',
  'dungeonCore086MovementStabilityDisabled',
  'dungeonCore087InteractionRulesDisabled',
  'dungeonCore087ChestGuardDisabled',
  'dungeonCore089TacticalInteractionsDisabled',
  'dungeonCore090MovementV2Disabled',
  'dungeonCore094EndTurnFinalDisabled',
  'dungeonCore095SoloTurnFinalDisabled',
  'dungeonCore097StabilityRollbackDisabled'
]);

const inline=[...index.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(m=>({id:m[1],source:m[2]}));
const activeInline=inline.filter(x=>!disabled.has(x.id));
assert.equal(inline.length,130);
assert.equal(activeInline.length,120);

function count(source,re){return (source.match(re)||[]).length}
function metrics(source){
  return {
    mutationObservers:count(source,/new\s+(?:window\.|R\.|ROOT\.)?MutationObserver\s*\(/g),
    setIntervals:count(source,/\bsetInterval\s*\(/g),
    setTimeouts:count(source,/\bsetTimeout\s*\(/g),
    documentListeners:count(source,/\b(?:document|D)\.addEventListener\s*\(/g),
    windowListeners:count(source,/\b(?:window|R|ROOT)\.addEventListener\s*\(/g),
    localStorageRefs:count(source,/\blocalStorage\b/g),
    indexedDBRefs:count(source,/\bindexedDB\b/g),
    globalAssignments:count(source,/\b(?:window|R|ROOT)\.[A-Za-z_$][\w$]*\s*=/g),
    wrapperMarkers:count(source,/__original|const\s+(?:old|prev|previous|native[A-Z][A-Za-z0-9_$]*)\s*=|let\s+(?:old|prev|previous)\s*=/g)
  };
}
const hasSignal=m=>Object.values(m).some(Number);
const coreAssetMetrics=metrics(read('assets/gensrpg/core/asset-resolver-v1.js'));
assert.deepEqual(coreAssetMetrics,{
  mutationObservers:0,
  setIntervals:0,
  setTimeouts:0,
  documentListeners:0,
  windowListeners:0,
  localStorageRefs:0,
  indexedDBRefs:0,
  globalAssignments:1,
  wrapperMarkers:0
},'Core asset resolver may expose exactly one public API global and must own no other side effect');

const external=[...reachable].sort().map(rel=>({
  file:rel,
  owner:manifest.files[rel].owner,
  domain:manifest.files[rel].domain,
  ...metrics(read(rel))
})).filter(hasSignal);

const inlineReport=activeInline.map(x=>({id:x.id,...metrics(x.source)})).filter(hasSignal);

const totals=rows=>{
  const out={};
  for(const key of ['mutationObservers','setIntervals','setTimeouts','documentListeners','windowListeners','localStorageRefs','indexedDBRefs','globalAssignments','wrapperMarkers']){
    out[key]=rows.reduce((sum,row)=>sum+(Number(row[key])||0),0);
  }
  return out;
};

const externalTotals=totals(external);
const inlineTotals=totals(inlineReport);

assert.ok(externalTotals.localStorageRefs>0,'production external graph must expose its direct storage debt');
assert.ok(inlineTotals.localStorageRefs>0,'inline runtime must expose its direct storage debt');
assert.ok(inlineTotals.globalAssignments>0,'inline runtime must expose its global assignment density');

console.log(JSON.stringify({
  scenario:'Phase 2 runtime side-effect inventory',
  productionReachableFiles:reachable.size,
  activeInlineBlocks:activeInline.length,
  externalTotals,
  inlineTotals,
  external,
  inline:inlineReport
},null,2));
