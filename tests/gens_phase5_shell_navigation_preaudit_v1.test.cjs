'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const inlineOwners=JSON.parse(read('docs/GENSRPG_PHASE2_INLINE_OWNERS.json'));
const layered=JSON.parse(read('docs/GENSRPG_PHASE2_LAYERED_RESPONSIBILITIES.json'));
const runtimeOwners=JSON.parse(read('docs/GENSRPG_PHASE2_RUNTIME_OWNERS.json'));
const storageOwners=JSON.parse(read('docs/GENSRPG_PHASE2_STORAGE_OWNERS.json'));
const shellContract=JSON.parse(read('assets/gensrpg/shell/module-contract-v1.json'));
const shellEntry=read('assets/gensrpg/shell/entry-v1.js');
const lastOwners=read('docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv');
const workflow=read('.github/workflows/gensrpg-architecture-sentinels.yml');
const pages=read('.github/workflows/main.yml');
const preview=read('preview.html');

function lastOwner(name){
  const safe=name.replace(/[-/\\^$*+?.()|[\]{}]/g,'\\$&');
  const m=lastOwners.match(new RegExp('^'+safe+'\\t(\\d+)\\t([^\\n]+)$','m'));
  assert.ok(m,'missing last-owner row for '+name);
  return {count:Number(m[1]),last:m[2].trim()};
}
function block(id){
  const rec=inlineOwners.blocks?.[id];
  assert.ok(rec,'missing inline owner metadata for '+id);
  assert.equal(rec.status,'active',id+' must remain active during pre-audit');
  return rec;
}

assert.equal(shellContract.phase,3);
assert.equal(shellContract.module,'shell');
assert.equal(shellContract.status,'contract-only-not-loaded');
assert.deepEqual(shellContract.owns,[
  'root navigation',
  'active module/session routing',
  'global screen transitions'
]);
assert.match(shellEntry,/Intentionally contains no runtime code/);
assert.doesNotMatch(shellEntry,/window\.|document\.|localStorage|setTimeout|MutationObserver|addEventListener/);
for(const composition of [pages,preview]){
  assert.equal(composition.includes('assets/gensrpg/shell/entry-v1.js'),false,
    'Phase 5 pre-audit must not connect the inert Shell entry');
}

const shellInline=Object.entries(inlineOwners.blocks||{})
  .filter(([,rec])=>rec.primaryDomain==='shell'||(rec.crossDomains||[]).includes('shell'))
  .map(([id,rec])=>({id,primaryDomain:rec.primaryDomain,responsibility:rec.responsibility,crossDomains:rec.crossDomains||[]}));

const forceReload=block('forceReload155');
assert.equal(forceReload.primaryDomain,'shell');
assert.match(forceReload.responsibility,/switching and safe reload boundary/);
assert.deepEqual(lastOwner('openGensBuiltInGame'),{count:1,last:'forceReload155'});
assert.deepEqual(lastOwner('gensProfileContentFamily155'),{count:1,last:'forceReload155'});

const start=lastOwner('startConfiguredGame');
assert.deepEqual(start,{count:6,last:'dungeonCore200Rebuild'});
const startHotspot=(layered.hotspots||[]).find(x=>x.name==='startConfiguredGame');
assert.ok(startHotspot,'startConfiguredGame layered-responsibility record missing');
assert.equal(startHotspot.assignmentCount,6);
assert.equal(startHotspot.lastOwner,'dungeonCore200Rebuild');
assert.equal(startHotspot.classification,'cross-domain-boundary-chain');
assert.equal(startHotspot.domain,'shell');
assert.match(startHotspot.responsibility,/shared launch path is layered by Capture then Dungeon/);

const expectedStartChain=[
  'captureFix131',
  'captureFix135',
  'captureFix138',
  'captureFix139',
  'gensDungeonCore01Js',
  'dungeonCore200Rebuild'
];
const globalOwnerTest=read('tests/gens_phase2_global_owner_inventory_v11411.test.cjs');
for(const id of expectedStartChain)assert.ok(globalOwnerTest.includes("'"+id+"'"),'startConfiguredGame chain proof missing '+id);
assert.match(globalOwnerTest,/startConfiguredGame:\{[\s\S]*assignments:6,[\s\S]*last:'dungeonCore200Rebuild'/);

for(const id of ['captureFix131','captureFix135','captureFix138','captureFix139']){
  assert.equal(block(id).primaryDomain,'capture',id+' currently belongs to Capture');
}
assert.equal(block('gensDungeonCore01Js').primaryDomain,'dungeon');
assert.equal(block('dungeonCore200Rebuild').primaryDomain,'dungeon');

assert.deepEqual(lastOwner('goMenu'),{count:5,last:'dungeonCore200Rebuild'});
assert.deepEqual(lastOwner('openChar'),{count:3,last:'dungeonCore028HeroExploreGuard'});
assert.deepEqual(lastOwner('markSessionActive'),{count:1,last:'dungeonCore100ResumeAndInteractionFix'});
assert.deepEqual(lastOwner('gensSelectedFamily'),{count:3,last:'dungeonCore310PersistenceAndTokens'});
assert.deepEqual(lastOwner('applyGameProfile'),{count:1,last:'gensStability151'});

const forcedReloadKey=(storageOwners.resolvedKeys||[]).find(x=>x.key==='gensrpg_forced_mode_reload_155');
assert.ok(forcedReloadKey);
assert.deepEqual(forcedReloadKey.domains,['shell']);
assert.deepEqual(forcedReloadKey.sources,['inline:forceReload155']);

for(const rel of [
  'assets/gensrpg/gens-survival-mode-isolation-1678104.js',
  'assets/gensrpg/gens-ui-recovery-167843.js',
  'assets/gensrpg/gens-world-summary-167820.js',
  'assets/gensrpg/gens-multiplayer-entry-167831.js'
]){
  assert.equal(runtimeOwners.files?.[rel]?.domain,'shell','runtime Shell owner missing: '+rel);
}

for(const rel of [
  'tests/gens_survival_shell_launch_browser_v11411.test.cjs',
  'tests/gens_savequit_resume_shell_browser_v11411.test.cjs',
  'tests/gens_pvp_placeholder_shell_browser_v11411.test.cjs',
  'tests/gens_capture_current_shell_browser_v11411.test.cjs',
  'tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs'
]){
  assert.ok(workflow.includes(rel),'real Shell browser sentinel must stay in CI: '+rel);
}
for(const rel of [
  'tests/gens_single_hero_sheet_art_authority_v11411.test.cjs',
  'tests/gens_hero_sheet_art_runtime_v11411.test.cjs'
]){
  assert.ok(workflow.includes(rel),'hero-sheet authority sentinel must stay in CI: '+rel);
}

const responsibilities={
  rootNavigation:{
    currentOwner:'base Shell + forceReload155 boundary',
    evidence:['openGensBuiltInGame -> forceReload155','real Shell browser sentinels']
  },
  moduleSwitching:{
    currentOwner:'forceReload155',
    evidence:['gensProfileContentFamily155','gensrpg_forced_mode_reload_155']
  },
  generalNavigation:{
    currentOwner:'layered Shell/Capture/Dungeon',
    hotspot:'startConfiguredGame',
    assignments:start.count,
    lastOwner:start.last
  },
  outOfCombatHeroSheet:{
    currentOwner:'native sheet lifecycle; Dungeon openChar last owner',
    openChar:lastOwner('openChar')
  },
  screenOpenClose:{
    currentOwner:'mixed base Shell + module-specific owners',
    goMenu:lastOwner('goMenu')
  },
  activeSessionModule:{
    currentOwner:'mixed Shell guard/profile + Dungeon session boundary',
    markSessionActive:lastOwner('markSessionActive'),
    selectedFamily:lastOwner('gensSelectedFamily')
  }
};

assert.equal(start.count>lastOwner('openGensBuiltInGame').count,true,
  'first Phase 5 lot must target the proven layered launch hotspot, not the already single-owner switch boundary');

console.log(JSON.stringify({
  scenario:'Phase 5 Shell/navigation pre-audit',
  shellContractOwns:shellContract.owns,
  shellInlineOwners:shellInline,
  responsibilities,
  firstMicroLot:{
    name:'startConfiguredGame authority consolidation',
    reason:'Shell-classified cross-domain boundary has six active assignments and ends in Dungeon ownership',
    runtimeChanged:false
  }
},null,2));
