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
  'assets/gensrpg/shell/pwa-manifest-dynamic-v1.js',
  'assets/gensrpg/core/asset-resolver-v1.js',
  'assets/gensrpg/survival/entry-v1.js',
  'assets/gensrpg/dungeon/entry-v1.js',
  'assets/gensrpg/capture/entry-v1.js',
  'assets/gensrpg/capture/session-start-v1.js',
  'assets/gensrpg/capture/screen-return-v1.js',
  'assets/gensrpg/capture/hub-entry-v1.js',
  'assets/gensrpg/capture/world-exploration-v1.js',
  'assets/gensrpg/capture/team-roster-v1.js',
  'assets/gensrpg/capture/combat-core-v1.js',
  'assets/gensrpg/core/legacy-visual-data-v1.js',
  'assets/gensrpg/shell/legacy-hub-family-ui-v1.js',
  'assets/gensrpg/builders/equipment-library-editor-v1.js',
  'assets/gensrpg/core/legacy-magic-sounds-v1.js',
  'assets/gensrpg/survival/legacy-wave-presets-spawn-v1.js',
  'assets/gensrpg/capture/legacy-monolith-functions-v1.js',
  'assets/gensrpg/dungeon/legacy-rpg-rules-talents-v1.js',
  'assets/gensrpg/builders/legacy-enemy-editor-v1.js',
  'assets/gensrpg/builders/legacy-rpg-universe-editor-v1.js',
  'assets/gensrpg/core/legacy-cloud-sync-backup-v1.js',
  'assets/gensrpg/builders/legacy-ability-skill-catalog-v1.js',
  'assets/gensrpg/builders/legacy-character-entity-editors-v1.js',
  'assets/gensrpg/dungeon/mj72-scene-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-gameplay-modal-mount-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-playtest-fix128-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix129-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix130-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix131-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix132-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix133-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix134-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix135-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix136-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix137-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix138-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix139-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix140-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-items141-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-buffs142-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-buff-fx143-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-ability-truth144-v1.js',
  'assets/gensrpg/capture/builtin-seed-v1.js',
  'assets/gensrpg/dungeon/core01-session-ui-v1.js',
  'assets/gensrpg/core/progression-v1.js',
  'assets/gensrpg/dungeon/core051-exploration-polish-v1.js',
  'assets/gensrpg/dungeon/core200-rebuild-v1.js',
  'assets/gensrpg/dungeon/core201-stability-v1.js',
  'assets/gensrpg/dungeon/core202-content-density-v1.js',
  'assets/gensrpg/dungeon/core211-consolidation-v1.js',
  'assets/gensrpg/dungeon/core213-stability-v1.js',
  'assets/gensrpg/dungeon/core214-single-authority-v1.js',
  'assets/dungeon/dungeon-core-316.js',
  'assets/gensrpg/dungeon/core303-timeline-single-authority-v1.js',
  'assets/dungeon/dungeon-core-317.js',
  'assets/gensrpg/gens-mobile-combat-performance-16781022.js',
  'assets/gensrpg/pvp/session-v1.js',
  'assets/gensrpg/pvp/module-launch-v1.js',
  'assets/gensrpg/pvp/shell-composition-v1.js',
  'assets/gensrpg/shell/module-launch-final-authority-v1.js'
],'raw index local JS entries must remain explicit and ordered');
assert.match(index,/window\.GensPvpShellCompositionV1\.connect\(\)/,
  'S2 must compose PvP from the real Shell without a global navigation wrapper');

const workflowBlock=(workflow.match(/modules = \[(.*?)\n\s*\]/s)||[])[1];
assert.ok(workflowBlock,'GitHub Pages module injection list missing');
const previewBlock=(preview.match(/const tags=\[(.*?)\n\s*\];/s)||[])[1];
assert.ok(previewBlock,'preview module injection list missing');

const injected=[...workflowBlock.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)]
  .map(m=>stripQuery(m[1]));
const previewInjected=[...previewBlock.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)]
  .map(m=>stripQuery(m[1]));

assert.equal(injected.length,32,'GitHub Pages must inject the current 32-module production list, including Dungeon real-event placement');
assert.equal(injected.filter(x=>x==='assets/dungeon/dungeon-event-runtime-fix-167878.js').length,1,'Dungeon event spawn placement must have exactly one production script load');
assert.deepEqual(previewInjected,injected.filter(x=>x!=='assets/gensrpg/core/storage-v1.js'),'preview must reproduce Pages additions while inheriting Core storage from source index');
assert.equal(injected.at(-2),'assets/gensrpg/gens-mobile-combat-performance-16781022.js','performance/bootstrap entry must stay immediately before final Shell authority');
assert.equal(injected.at(-1),'assets/gensrpg/shell/module-launch-final-authority-v1.js','final Shell authority must stay final');

const buildPrelude=require('./helpers/gens_profile_repair_build_prelude_20261027.cjs');
const productionDirect=buildPrelude.includeBuildPrelude([
  ...rawDirect.filter(x=>![
    'assets/gensrpg/gens-mobile-combat-performance-16781022.js',
    'assets/gensrpg/shell/module-launch-final-authority-v1.js'
  ].includes(x)),
  ...injected
],workflow);
assert.equal(new Set(productionDirect).size,92,'production composition includes the explicit profile repair prelude and the single Capture combat core owner');

const inlineIds=[...index.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
assert.equal(inlineIds.length,112,'R11 must retire exactly 17 previously disabled named script tags from 129');
assert.equal((index.match(/<script\b[^>]*type=["']application\/x-gensrpg-disabled["']/gi)||[]).length,0,'R11 must leave no legacy disabled script tags');
assert.equal([...index.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script\s*>/gi)].length,152,'R16 replaces the inline Core303 slot by a single external entry, preserving 152 tags');

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
  'assets/gensrpg/core/dungeon-profile-auto-repair-v1.js',
  'assets/gensrpg/core/asset-resolver-v1.js',
  'assets/gensrpg/core/storage-v1.js',
  'assets/gensrpg/core/dice-v1.js',
  'assets/gensrpg/core/progression-v1.js',
  'assets/gensrpg/core/text-utils-v1.js',
  'assets/gensrpg/core/stats-normalization-v1.js',
  'assets/gensrpg/core/stats-value-engine-v1.js',
  'assets/gensrpg/core/stats-hero-values-v1.js',
  'assets/gensrpg/core/stats-modifier-provider-v1.js',
  'assets/gensrpg/core/stats-derived-values-v1.js',
  'assets/gensrpg/core/stats-snapshot-v1.js',
  'assets/gensrpg/core/inventory-equipped-view-v1.js',
  'assets/gensrpg/core/equipment-bonus-sets-v1.js',
  'assets/gensrpg/core/equipment-evolution-v1.js'
];
const phase4InertServices=[
  'assets/gensrpg/core/stats-resistance-normalization-v1.js',
  'assets/gensrpg/core/stats-armor-contract-v1.js'
];
const phase4Set=new Set([...phase4ConnectedServices,...phase4InertServices]);
const phase5ConnectedServices=[
  'assets/gensrpg/shell/legacy-hub-family-ui-v1.js',
  'assets/gensrpg/shell/module-launch-final-authority-v1.js'
];
const phase5Set=new Set(phase5ConnectedServices);
const phase12ConnectedServices=["assets/gensrpg/builders/equipment-library-editor-v1.js","assets/gensrpg/core/legacy-cloud-sync-backup-v1.js","assets/gensrpg/core/legacy-magic-sounds-v1.js","assets/gensrpg/builders/legacy-ability-skill-catalog-v1.js","assets/gensrpg/survival/legacy-wave-presets-spawn-v1.js","assets/gensrpg/capture/legacy-monolith-functions-v1.js","assets/gensrpg/dungeon/legacy-rpg-rules-talents-v1.js","assets/gensrpg/builders/legacy-enemy-editor-v1.js","assets/gensrpg/builders/legacy-rpg-universe-editor-v1.js","assets/gensrpg/builders/legacy-character-entity-editors-v1.js","assets/gensrpg/dungeon/core303-timeline-single-authority-v1.js"];
const phase12Set=new Set(phase12ConnectedServices);
const phase9ConnectedServices=[
  'assets/gensrpg/capture/session-start-v1.js',
  'assets/gensrpg/capture/screen-return-v1.js',
  'assets/gensrpg/capture/hub-entry-v1.js',
  'assets/gensrpg/capture/world-exploration-v1.js',
  'assets/gensrpg/capture/team-roster-v1.js',
  'assets/gensrpg/capture/combat-core-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-gameplay-modal-mount-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-playtest-fix128-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix129-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix130-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix131-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix132-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix133-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix134-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix135-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix136-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix137-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix138-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix139-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-fix140-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-items141-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-buffs142-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-buff-fx143-v1.js',
  'assets/gensrpg/capture/legacy-patches/capture-ability-truth144-v1.js',
  'assets/gensrpg/capture/builtin-seed-v1.js'
];
const phase9Set=new Set(phase9ConnectedServices);
const phase10ConnectedServices=[
  'assets/gensrpg/pvp/session-v1.js',
  'assets/gensrpg/pvp/module-launch-v1.js',
  'assets/gensrpg/pvp/shell-composition-v1.js'
];
const phase10InertServices=['assets/gensrpg/pvp/setup-ui-v1.js'];
const phase10Set=new Set([...phase10ConnectedServices,...phase10InertServices]);
const captureLabInventory=JSON.parse(read('docs/GENSRPG_CAPTURE_LAB_STAGED_FILES_2026-10-27.json'));
assert.equal(captureLabInventory.schemaVersion,1);
assert.equal(captureLabInventory.productionActivated,false);
const captureLabOptInServices=captureLabInventory.classicScripts;
assert.equal(new Set(captureLabOptInServices).size,10,'every staged Capture/Lab service is explicitly classified');
for(const rel of captureLabOptInServices){
  assert.equal(allJs.includes(rel),true,'staged Capture/Lab service must exist: '+rel);
  assert.equal(reachable.has(rel),false,'staged Capture/Lab service must not enter production implicitly: '+rel);
}
// Preview-only owner scaffolding is a new, explicit isolated JS file.
// Keep the production reachable set exactly identical; do not accidentally
// put preview-owned profile/storage declarations into the game entry graph.
const savedHubPreviewScripts=captureLabInventory.capturePreviewFiles
  .filter(file=>file.endsWith('.js'))
  .map(file=>captureLabInventory.capturePreviewDirectory+'/'+file);
assert.deepEqual(savedHubPreviewScripts,[
  'assets/gensrpg/capture/preview/saved-hub-owners.js'
],'only the reviewed isolated preview owner context may be added as classic JS');
for(const rel of savedHubPreviewScripts){
  assert.equal(allJs.includes(rel),true,'preview-only owner context must physically exist');
  assert.equal(reachable.has(rel),false,'preview-only fake identity cannot load in production');
}
const captureLabOptInSet=new Set([...captureLabOptInServices,...savedHubPreviewScripts]);
const phase2Js=allJs.filter(rel=>!phase3Set.has(rel)&&!phase4Set.has(rel)&&!phase5Set.has(rel)&&!phase9Set.has(rel)&&!phase10Set.has(rel)&&!phase12Set.has(rel)&&!captureLabOptInSet.has(rel));
const notReachablePhase2=phase2Js.filter(rel=>!reachable.has(rel));

assert.equal(allJs.length,160,'physical inventory includes ten Capture/Lab opt-in services, isolated preview owner and Core profile repair prelude');
assert.equal(phase2Js.length,82,'Phase 2 baseline JS inventory must drop the retired legacy Survival/Dungeon guard');
assert.equal(reachable.size,135,'production graph must include the profile repair prelude and existing Capture owners');
const connectedPhaseEntrypoints=new Set([
  'assets/gensrpg/survival/entry-v1.js',
  'assets/gensrpg/dungeon/entry-v1.js',
  'assets/gensrpg/capture/entry-v1.js',
  'assets/gensrpg/tactical/entry-v1.js'
]);
for(const rel of phase3Entrypoints){
  assert.equal(allJs.includes(rel),true,'Phase 3 target entry missing: '+rel);
  if(connectedPhaseEntrypoints.has(rel)){
    assert.equal(reachable.has(rel),true,'connected module entry must stay production-reachable: '+rel);
  }else{
    assert.equal(reachable.has(rel),false,'unconnected Phase 3 entry must stay outside production graph: '+rel);
  }
}
for(const rel of phase4ConnectedServices){
  assert.equal(allJs.includes(rel),true,'Phase 4 connected service missing: '+rel);
  assert.equal(reachable.has(rel),true,'Phase 4 connected service must stay production-reachable: '+rel);
}
for(const rel of phase4InertServices){
  assert.equal(allJs.includes(rel),true,'Phase 4 inert service missing: '+rel);
  assert.equal(reachable.has(rel),false,'Phase 4 inert service must stay outside production graph until its dedicated raccord: '+rel);
}
for(const rel of phase5ConnectedServices){
  assert.equal(allJs.includes(rel),true,'Phase 5 connected Shell service missing: '+rel);
  assert.equal(reachable.has(rel),true,'Phase 5 connected Shell service must stay production-reachable: '+rel);
}
for(const rel of phase9ConnectedServices){
  assert.equal(allJs.includes(rel),true,'Phase 9 connected Capture service missing: '+rel);
  assert.equal(reachable.has(rel),true,'Phase 9 connected Capture service must stay production-reachable: '+rel);
}
for(const rel of phase12ConnectedServices){assert.equal(allJs.includes(rel),true,rel+' exists');assert.equal(reachable.has(rel),true,rel+' reachable');}
for(const rel of phase10ConnectedServices){
  assert.equal(allJs.includes(rel),true,'Phase 10 PvP owner file missing: '+rel);
  assert.equal(reachable.has(rel),true,'S2 connected PvP composition must be reachable from index: '+rel);
}
for(const rel of phase10InertServices){
  assert.equal(allJs.includes(rel),true,'PvP S3 setup screen missing: '+rel);
  assert.equal(reachable.has(rel),false,'opt-in PvP setup UI must remain outside production until a full Shell gate: '+rel);
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
  phase3TargetEntrypoints:phase3Entrypoints.length,
  phase3ConnectedEntrypoints:connectedPhaseEntrypoints.size,
  phase4ConnectedServices:phase4ConnectedServices.length,
  phase4InertServices:phase4InertServices.length,
  phase5ConnectedServices:phase5ConnectedServices.length,
  phase9ConnectedServices:phase9ConnectedServices.length,
  productionReachableLocalJs:reachable.size,
  phase2NonReachableLocalJs:notReachablePhase2.length,
  knownDebt:{
    core317DocumentElementObserver:true,
    core317MerchantRetryInterval:true
  }
},null,2));
