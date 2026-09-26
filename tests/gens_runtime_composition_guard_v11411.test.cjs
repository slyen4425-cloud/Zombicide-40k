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
const bootstrap=read('assets/gensrpg/core/runtime-bootstrap-v1.js');
const integration=read('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js');

// 1. Source index remains the known legacy shell entry point, now with Core storage bootstrapped before inline storage.
const directSrcs=[...source.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
assert.deepEqual(directSrcs,[
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/qrcodejs@1.0.0/qrcode.min.js',
  'assets/gensrpg/core/storage-v1.js',
  'assets/gensrpg/core/dice-v1.js',
  'assets/gensrpg/core/asset-resolver-v1.js',
  'assets/gensrpg/survival/entry-v1.js?v=1',
  'assets/gensrpg/dungeon/entry-v1.js?v=1',
  'assets/gensrpg/core/progression-v1.js?v=1',
  'assets/dungeon/dungeon-core-316.js',
  'assets/dungeon/dungeon-core-317.js',
  'assets/gensrpg/gens-mobile-combat-performance-16781022.js',
  'assets/gensrpg/shell/module-launch-final-authority-v1.js'
],'source index direct script composition changed: update the runtime map deliberately before accepting a new composition');

// 2. Pages build keeps the same deterministic static order.
const pagesModules=[
  'storage-v1.js',
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
  'stats-normalization-v1.js',
  'gens-rpg-stats-clean-167874.js',
  'gens-dungeon-hero-art-repair-167874.js',
  'gens-mobile-combat-performance-16781022.js',
  'module-launch-final-authority-v1.js'
];
assertOrdered(workflow,pagesModules,'Pages build modules');
const perfTag='assets/gensrpg/gens-mobile-combat-performance-16781022.js';
const finalShellTag='assets/gensrpg/shell/module-launch-final-authority-v1.js';
const removePerfPos=workflow.indexOf('html = html.replace(perf_tag');
const removeFinalPos=workflow.indexOf('html = html.replace(final_shell_tag');
const injectPos=workflow.indexOf('for module, tag, error in modules');
assert.ok(removePerfPos>=0 && removeFinalPos>removePerfPos && injectPos>removeFinalPos,
  'Pages build must remove both source tail tags before reinjecting the canonical ordered module list');
assert.ok(workflow.includes("perf_tag = '<script src=\"assets/gensrpg/gens-mobile-combat-performance-16781022.js\"></script>'"),
  'Pages build must explicitly identify the performance entry tag');
assert.ok(workflow.includes("final_shell_tag = '<script src=\"assets/gensrpg/shell/module-launch-final-authority-v1.js\"></script>'"),
  'Pages build must explicitly identify the final Shell authority tag');
assert.equal(pagesModules.at(-2),'gens-mobile-combat-performance-16781022.js',
  'performance entry must remain immediately before the final Shell authority');
assert.equal(pagesModules.at(-1),'module-launch-final-authority-v1.js',
  'final Shell authority must be the last statically injected production module');
assert.ok(workflow.lastIndexOf(finalShellTag)>workflow.lastIndexOf(perfTag),
  'final Shell authority must remain ordered after mobile performance in the Pages build');

// 3. Performance may start ONE explicit bootstrap, but it no longer owns Tactical composition.
const baseTactical=[
  'gens-rpg-tactical-combat-v2.js',
  'gens-rpg-tactical-combat-v2-adapter.js',
  'gens-rpg-tactical-combat-v2-rules.js',
  'gens-rpg-tactical-combat-v2-integration.js',
  'gens-rpg-tactical-combat-v2-ui.js',
  'gens-rpg-tactical-combat-v2-bridge.js'
];
assert.ok(perf.includes('assets/gensrpg/core/runtime-bootstrap-v1.js?v=1'),'performance layer must delegate runtime composition to RuntimeBootstrap V1');
assert.ok(perf.includes('R.__gensRuntimeBootstrapEntryV1=true'),'performance-to-bootstrap handoff must be idempotent');
for(const file of baseTactical)assert.equal(perf.includes(file),false,`performance layer must not own ${file}`);
assert.equal(perf.includes('setTimeout(apply,3000)'),false,'performance layer must not own Tactical/Survival install retries');

// 4. RuntimeBootstrap is the one documented owner of base Tactical composition.
assertOrdered(bootstrap,baseTactical,'RuntimeBootstrap V1 base Tactical composition');
assert.ok(bootstrap.includes('R.__gensTacticalV2Loader105=true'),'RuntimeBootstrap must preserve the historical idempotency guard');
assert.ok(bootstrap.includes('setTimeout(apply,250)') && bootstrap.includes('setTimeout(apply,1200)') && bootstrap.includes('setTimeout(apply,3000)'),
  'RuntimeBootstrap must preserve the known Tactical bridge retry timings during extraction');
assert.ok(bootstrap.includes('s.async=false'),'RuntimeBootstrap must preserve ordered sequential script loading');

// 5. Integration preserves the real runtime call chain V108 -> V114.11, now with direct cleaned installs.
for(const file of [
  'gens-rpg-tactical-combat-v2-polish-1678108.js',
  'gens-rpg-tactical-combat-v2-polish-1678109.js',
  'gens-rpg-tactical-combat-v2-stats-1678110.js',
  'gens-rpg-tactical-runtime-fixes-1678111.js',
  'gens-rpg-tactical-combat-coherence-1678112.js',
  'gens-rpg-tactical-runtime-authority-1678113.js',
  'gens-rpg-tactical-visual-dice-16781142.js'
]) assert.ok(integration.includes(file),`Tactical runtime chain missing ${file}`);

assert.ok(integration.includes('const after108=()=>{try{R.GensRpgTacticalPolish1678108?.installWithRetries?.(R)}catch(e){console.error("GenSrpG V108 polish install",e)}loadPolish109()}'),'V108 must install directly then hand off to V109');
assert.ok(integration.includes('const after109=()=>{try{R.GensRpgTacticalPolish1678109?.installWithRetries?.(R)}catch(e){console.error("GenSrpG V109 polish install",e)}loadStats110()}'),'V109 must install directly then hand off to V110');
assert.ok(integration.includes('const after110=()=>{try{R.GensRpgTacticalStats1678110?.installWithRetries?.(R)}catch(e){console.error("GenSrpG V110 tactical stats install",e)}loadRuntime111()}'),'V110 must hand off to V111');
assert.ok(integration.includes('const after111=()=>{try{R.GensRpgTacticalRuntimeFixes1678111?.installWithRetries?.(R)}catch(e){console.error("GenSrpG V111 tactical runtime install",e)}loadCoherence112()}'),'V111 must install directly then hand off to V112');
assert.ok(integration.includes('const after112=()=>{try{R.GensRpgTacticalCombatCoherence1678112?.installWithRetries?.(R)}catch(e){console.error("GenSrpG V112 combat coherence install",e)}loadAuthority113()}'),'V112 must install directly then hand off to V113');
assert.ok(integration.includes('const after113=()=>{try{R.GensRpgTacticalRuntimeAuthority1678113?.installWithRetries?.(R)}catch(e){console.error("GenSrpG V113 runtime authority install",e)}loadHotfix114()}'),'V113 must install directly then hand off to V114.11');
assert.ok(integration.includes('function loadHotfix114(){return loadVisualDice11411()}'),'V114.1 global-observer hotfix must remain bypassed in favor of V114.11 visual dice');

// 6. The obsolete MutationObserver constructor guard must stay gone.
assert.equal(integration.includes('installWithoutGlobalObserver'),false,'clean Tactical layers must not be wrapped by a scoped observer shim');
assert.equal(integration.includes('beginChainObserverGuard'),false,'whole-chain observer guard must remain retired');
assert.equal(integration.includes('endChainObserverGuard'),false,'whole-chain observer guard teardown must remain retired');
assert.equal(/R\.MutationObserver\s*=/.test(integration),false,'integration must never replace the native MutationObserver constructor');
assert.ok(integration.trim().endsWith('})(typeof globalThis!=="undefined"?globalThis:this);'),'integration wrapper must remain intact');
assert.ok(integration.includes('loadPolish108();'),'clean Tactical chain must still start at V108');
assert.ok(!integration.includes('gens-rpg-tactical-hotfix-1678114.js'),'V114.1 hotfix file must not return to the active Tactical chain');
assert.ok(!integration.includes('gens-rpg-tactical-session-guard-16781144.js'),'global V114.4 session guard must not return to the active Tactical chain');

console.log('GenSrpG runtime composition guard OK: deterministic Tactical bootstrap without legacy Survival/Dungeon guard');
