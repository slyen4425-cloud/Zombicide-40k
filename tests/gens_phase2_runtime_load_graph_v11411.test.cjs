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
const core317=read('assets/dungeon/dungeon-core-317.js');

const rawDirect=[...index.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
  .map(m=>m[1])
  .filter(src=>/^assets\/(?:gensrpg|dungeon)\//.test(src))
  .map(stripQuery);

assert.deepEqual(rawDirect,[
  'assets/gensrpg/core/storage-v1.js',
  'assets/gensrpg/core/dice-v1.js',
  'assets/gensrpg/core/asset-resolver-v1.js',
  'assets/gensrpg/core/progression-v1.js',
  'assets/dungeon/dungeon-core-316.js',
  'assets/dungeon/dungeon-core-317.js',
  'assets/gensrpg/gens-mobile-combat-performance-16781022.js'
],'raw index local JS entries must remain explicit and ordered');

const workflowBlock=(workflow.match(/modules = \[(.*?)\n\s*\]/s)||[])[1];
assert.ok(workflowBlock,'GitHub Pages module injection list missing');
const previewBlock=(preview.match(/const tags=\[(.*?)\n\s*\];/s)||[])[1];
assert.ok(previewBlock,'preview module injection list missing');

const injected=[...workflowBlock.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)]
  .map(m=>stripQuery(m[1]));
const previewInjected=[...previewBlock.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)]
  .map(m=>stripQuery(m[1]));

assert.equal(injected.length,29,'GitHub Pages must inject the current 29-module production list');
assert.deepEqual(previewInjected,injected.filter(x=>x!=='assets/gensrpg/core/storage-v1.js'),'preview must reproduce Pages additions while inheriting Core storage from source index');
assert.equal(injected.at(-1),'assets/gensrpg/gens-mobile-combat-performance-16781022.js','performance/bootstrap entry must stay final');

const productionDirect=[
  ...rawDirect.filter(x=>x!=='assets/gensrpg/gens-mobile-combat-performance-16781022.js'),
  ...injected
];
assert.equal(new Set(productionDirect).size,34,'production composition must expose 34 unique direct local JS entries');

const inlineIds=[...index.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
assert.equal(inlineIds.length,130,'Phase 2 cartography expects the current 130 identified inline script blocks');

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
  const source=read(rel);
  for(const dep of assetRefs(source))if(!reachable.has(dep))queue.push(dep);
}

const allJs=[];
for(const base of['assets/gensrpg','assets/dungeon']){
  const walk=dir=>{
    for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
      const rel=path.posix.join(dir,entry.name);
      if(entry.isDirectory())walk(rel);
      else if(entry.isFile()&&/\.js$/i.test(entry.name))allJs.push(rel);
    }
  };
  walk(base);
}
allJs.sort();

const phase3Entrypoints=[
  'assets/gensrpg/builders/entry-v1.js',
  'assets/gensrpg/capture/entry-v1.js',
  'assets/gensrpg/core/entry-v1.js',
  'assets/gensrpg/dungeon/entry-v1.js',
  'assets/gensrpg/pvp/entry-v1.js',
  'assets/gensrpg/shell/entry-v1.js',
  'assets/gensrpg/survival/entry-v1.js',
  'assets/gensrpg/tactical/entry-v1.js'
];
const phase3Set=new Set(phase3Entrypoints);
const phase4ConnectedServices=[
  'assets/gensrpg/core/asset-resolver-v1.js',
  'assets/gensrpg/core/storage-v1.js',
  'assets/gensrpg/core/dice-v1.js',
  'assets/gensrpg/core/progression-v1.js',
  'assets/gensrpg/core/stats-normalization-v1.js',
  'assets/gensrpg/core/stats-value-engine-v1.js',
  'assets/gensrpg/core/stats-hero-values-v1.js',
  'assets/gensrpg/core/stats-modifier-provider-v1.js',
  'assets/gensrpg/core/stats-derived-values-v1.js',
  'assets/gensrpg/core/stats-snapshot-v1.js',
  'assets/gensrpg/core/inventory-equipped-view-v1.js',
  'assets/gensrpg/core/equipment-bonus-sets-v1.js',
  'assets/gensrpg/core/equipment-evolution-v1.js',
  'assets/gensrpg/core/text-utils-v1.js'
];
const phase4InertServices=[
  'assets/gensrpg/core/stats-resistance-normalization-v1.js',
  'assets/gensrpg/core/stats-armor-contract-v1.js'
];
const phase4Set=new Set([...phase4ConnectedServices,...phase4InertServices]);
const phase2Js=allJs.filter(rel=>!phase3Set.has(rel)&&!phase4Set.has(rel));
const notReachablePhase2=phase2Js.filter(rel=>!reachable.has(rel));

assert.equal(allJs.length,96,'physical JS inventory must be Phase 2 baseline plus eight Phase 3 entries and sixteen Phase 4 services');
assert.equal(phase2Js.length,72,'Phase 2 baseline JS inventory size drifted');
assert.equal(reachable.size,79,'production-reachable JS graph must currently contain 79 files');
for(const rel of phase3Entrypoints){
  assert.equal(allJs.includes(rel),true,'Phase 3 inert entry missing: '+rel);
  assert.equal(reachable.has(rel),false,'Phase 3 inert entry must stay outside production graph: '+rel);
}
for(const rel of phase4ConnectedServices){
  assert.equal(allJs.includes(rel),true,'Phase 4 connected service missing: '+rel);
  assert.equal(reachable.has(rel),true,'Phase 4 connected service must stay production-reachable: '+rel);
}
for(const rel of phase4InertServices){
  assert.equal(allJs.includes(rel),true,'Phase 4 inert service missing: '+rel);
  assert.equal(reachable.has(rel),false,'Phase 4 inert service must stay outside production graph until its dedicated raccord: '+rel);
}
assert.deepEqual(notReachablePhase2,[
  'assets/gensrpg/dungeon/progression-runtime-v1.js',
  'assets/gensrpg/gens-dungeon-ingame-hero-art-167898.js',
  'assets/gensrpg/gens-dungeon-sheet-art-stability-167899.js',
  'assets/gensrpg/gens-rpg-tactical-hotfix-1678114.js',
  'assets/gensrpg/gens-rpg-tactical-session-guard-16781144.js',
  'assets/gensrpg/gens-rpg-tactical-wall-dice-stats-16781145.js',
  'assets/gensrpg/gens-stat-manual-cost-167898.js'
],'Phase 2 non-reachable production JS inventory drifted');

assert.match(core317,/new\s+MutationObserver\(scheduleBackButton\)/,'Phase 2 must keep the known Core 3.17 observer debt visible until a dedicated cleanup lot');
assert.match(core317,/observe\(document\.documentElement,\{childList:true,subtree:true\}\)/,'Core 3.17 observer debt target must remain characterized');
assert.match(core317,/merchantRetryTimer=setInterval\(/,'Core 3.17 merchant retry debt must remain characterized');

console.log(JSON.stringify({
  scenario:'Phase 2 production runtime load graph cartography',
  rawDirectLocalJs:rawDirect.length,
  pagesInjectedModules:injected.length,
  productionDirectLocalJs:new Set(productionDirect).size,
  inlineIdScripts:inlineIds.length,
  currentPhysicalLocalJs:allJs.length,
  phase2BaselineLocalJs:phase2Js.length,
  phase3InertEntrypoints:phase3Entrypoints.length,
  phase4ConnectedServices:phase4ConnectedServices.length,
  phase4InertServices:phase4InertServices.length,
  productionReachableLocalJs:reachable.size,
  phase2NonReachableLocalJs:notReachablePhase2.length,
  knownDebt:{
    core317DocumentElementObserver:true,
    core317MerchantRetryInterval:true
  }
},null,2));
