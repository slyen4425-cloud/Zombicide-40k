const fs=require('node:fs');
const assert=require('node:assert/strict');

function read(path){
  assert.ok(fs.existsSync(path),`required runtime file missing: ${path}`);
  return fs.readFileSync(path,'utf8');
}

function assertOrdered(text,needles,label){
  let cursor=-1;
  for(const needle of needles){
    const pos=text.indexOf(needle,cursor+1);
    assert.ok(pos>=0,`${label}: missing ${needle}`);
    assert.ok(pos>cursor,`${label}: ${needle} is out of order`);
    cursor=pos;
  }
}

const source=read('index.html');
const workflow=read('.github/workflows/main.yml');
const perf=read('assets/gensrpg/gens-mobile-combat-performance-16781022.js');
const integration=read('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js');

// 1. Source index remains a known shell/legacy monolith entry point.
// The deployed Pages runtime is completed later by the workflow and dynamic loaders.
const directSrcs=[...source.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
assert.deepEqual(directSrcs,[
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js',
  'assets/dungeon/dungeon-core-316.js',
  'assets/dungeon/dungeon-core-317.js',
  'assets/gensrpg/gens-mobile-combat-performance-16781022.js'
],'source index direct script composition changed: update the runtime map deliberately before accepting a new composition');

// 2. Pages build must keep its current deterministic injection order.
const pagesModules=[
  'dungeon-core-318.js',
  'dungeon-large-room-support-167834.js',
  'dungeon-room-creator-100.js',
  'dungeon-room-creator-v2-167819.js',
  'dungeon-room-creator-feedback-167821.js',
  'dungeon-world-builder-167821.js',
  'dungeon-room-runtime-167822.js',
  'dungeon-world-runtime-167823.js',
  'dungeon-zone-content-167824.js',
  'dungeon-authored-runtime-167839.js',
  'dungeon-authored-cache-visual-167852.js',
  'dungeon-source-render-stability-167877.js',
  'dungeon-equipment-ui.js',
  'dungeon-equipment-hotfix-167817.js',
  'dungeon-set-editor-167818.js',
  'gens-world-summary-167820.js',
  'gens-rpg-stats-clean-167874.js',
  'gens-dungeon-hero-art-repair-167874.js',
  'gens-mobile-combat-performance-16781022.js'
];
assertOrdered(workflow,pagesModules,'Pages build modules');
const perfTag='assets/gensrpg/gens-mobile-combat-performance-16781022.js';
const removePos=workflow.indexOf('html = html.replace(perf_tag');
const injectPos=workflow.indexOf('for module, tag, error in modules');
assert.ok(removePos>=0 && injectPos>removePos,'Pages build must remove the source performance tag before reinjecting the ordered module list');
assert.ok(workflow.includes("perf_tag = '<script src=\"assets/gensrpg/gens-mobile-combat-performance-16781022.js\"></script>'"),'Pages build must explicitly identify the performance/Tactical loader tag');
assert.equal(pagesModules.at(-1),'gens-mobile-combat-performance-16781022.js','performance/Tactical loader must remain the final statically injected module');
assert.ok(workflow.lastIndexOf(perfTag)>workflow.indexOf('gens-dungeon-hero-art-repair-167874.js'),'performance/Tactical loader must remain after canonical stats and hero-art layers in the build definition');

// 3. The performance file currently owns the base Tactical bootstrap.
// Freeze this composition until RuntimeBootstrap replaces it deliberately.
const baseTactical=[
  'gens-rpg-tactical-combat-v2.js',
  'gens-rpg-tactical-combat-v2-adapter.js',
  'gens-rpg-tactical-combat-v2-rules.js',
  'gens-rpg-tactical-combat-v2-integration.js',
  'gens-rpg-tactical-combat-v2-ui.js',
  'gens-rpg-tactical-combat-v2-bridge.js',
  'gens-survival-mode-isolation-1678104.js'
];
assertOrdered(perf,baseTactical,'mobile-performance dynamic bootstrap');
assert.ok(perf.includes('R.__gensTacticalV2Loader105=true'),'dynamic Tactical bootstrap guard must remain idempotent');
assert.ok(perf.includes('setTimeout(apply,250)') && perf.includes('setTimeout(apply,1200)') && perf.includes('setTimeout(apply,3000)'),
  'known bridge/isolation retry debt changed: update the audit before modifying this behavior');

// 4. Integration must keep the V108 -> V114.11 chain ordered and globally observer-scoped.
const tacticalLegacyChain=[
  'gens-rpg-tactical-combat-v2-polish-1678108.js',
  'gens-rpg-tactical-combat-v2-polish-1678109.js',
  'gens-rpg-tactical-combat-v2-stats-1678110.js',
  'gens-rpg-tactical-runtime-fixes-1678111.js',
  'gens-rpg-tactical-combat-coherence-1678112.js',
  'gens-rpg-tactical-runtime-authority-1678113.js',
  'gens-rpg-tactical-visual-dice-16781142.js'
];
assertOrdered(integration,tacticalLegacyChain,'Tactical V108-V114.11 chain');
assert.ok(integration.includes('target===D.body||target===D.documentElement'),'V114.11 must continue blocking body/html MutationObserver targets in the legacy Tactical chain');
assert.ok(integration.includes('R.MutationObserver=NativeMutationObserver'),'native MutationObserver must be restored after the Tactical chain guard');
assert.ok(integration.includes('beginChainObserverGuard();') && integration.includes('loadPolish108();'),'the observer guard must be established before the legacy Tactical chain starts');
assert.ok(integration.includes('function loadHotfix114(){return loadVisualDice11411()}'),'V114.1 global-observer hotfix must remain bypassed');
assert.ok(!integration.includes('gens-rpg-tactical-hotfix-1678114.js'),'V114.1 hotfix file must not return to the active Tactical chain');
assert.ok(!integration.includes('gens-rpg-tactical-session-guard-16781144.js'),'global V114.4 session guard must not return to the active Tactical chain');

console.log('GenSrpG V16.78.114.11 runtime composition guard OK');
