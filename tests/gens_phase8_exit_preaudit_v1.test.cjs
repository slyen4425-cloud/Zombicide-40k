'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const block=(src,start,end,label)=>{
  const a=src.indexOf(start),b=src.indexOf(end,a+start.length);
  assert.ok(a>=0&&b>a,label+' block missing');
  return src.slice(a,b);
};

const roadmap=read('docs/GENSRPG_RESTRUCTURATION_ROADMAP.md');
const bootstrap=read('assets/gensrpg/core/runtime-bootstrap-v1.js');
const entry=read('assets/gensrpg/tactical/entry-v1.js');
const integration=read('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js');
const ui=read('assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js');
const bridge=read('assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js');
const v108=read('assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js');
const v109=read('assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js');
const v110=read('assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js');
const v111=read('assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js');
const v112=read('assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js');
const v113=read('assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js');
const v11411=read('assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js');
const dungeonContract=JSON.parse(read('assets/gensrpg/dungeon/module-contract-v1.json'));
const cartography=read('docs/GENSRPG_PHASE2_RUNTIME_CARTOGRAPHY.md');

assert.match(roadmap,/## Phase 8 — Consolider Tactical[\s\S]*Critère de sortie : Tactical n’existe que pendant une session de combat et se démonte proprement\./,
  'Phase 8 official lifecycle exit criterion must remain explicit');

assert.match(bootstrap,/assets\/gensrpg\/tactical\/entry-v1\.js/,
  'current Core bootstrap must characterize eager Tactical entry loading');
assert.match(bootstrap,/\binstall\(\);\s*\}\)\(\);/,
  'current Core bootstrap must still auto-install at application bootstrap');
assert.match(entry,/\binstall\(\);\s*\}\)\(/,
  'current Tactical entry must characterize eager private-stack activation');
assert.match(integration,/\bloadPolish108\(\);/,
  'current Tactical integration must characterize eager compatibility-chain loading');

const activeLayers=[
  ['V108',v108],['V109',v109],['V110',v110],['V111',v111],
  ['V112',v112],['V113',v113],['V114.11',v11411]
];

for(const [label,src] of activeLayers){
  assert.match(src,/function installWithRetries\(rt=R\)/,
    label+' must characterize install-with-retries lifecycle debt');
  assert.match(src,/DOMContentLoaded[\s\S]*installWithRetries|else installWithRetries\(R\)/,
    label+' must characterize automatic installation at file load');
  assert.doesNotMatch(src,/function dispose\(rt=R\)|function dispose\(/,
    label+' currently has no dispose contract; preaudit must keep this debt visible');
}

const closeFn=block(ui,'function close(apply=false){','function getBattle(){','Tactical UI close');
assert.match(closeFn,/rootEl\?\.remove\?\.\(\)/,'UI close must remove the local Tactical overlay');
assert.match(closeFn,/rootEl=null;battle=null/,'UI close must clear local battle state');
assert.doesNotMatch(closeFn,/removeEventListener|clearTimeout|clearInterval|\.dispose\?\.|\.dispose\(/,
  'UI close currently does not teardown global Tactical side effects');

assert.match(ui,/function installGlobalPolish\(\)[\s\S]*patchDungeonMapHtml\(\)[\s\S]*hookDungeonRender\(\)/,
  'base Tactical UI still installs Dungeon-facing global polish');
assert.match(ui,/DOMContentLoaded",installGlobalPolish|else installGlobalPolish\(\)/,
  'base Tactical UI global polish must characterize activation outside combat');

const v113Install=block(v113,'function install(rt=R){','function installWithRetries','V113 install');
for(const call of ['ensureDetectionHooks(rt)','bindBoardClicks(rt)']){
  assert.ok(v113Install.includes(call),'V113 active exploration authority missing from characterization: '+call);
}
assert.match(v113,/rt\.dungeonMoveHero098=wrapped/,
  'V113 currently wraps Dungeon movement outside a Tactical battle');
assert.match(v113,/D\.addEventListener\("click",onBoard,false\);D\.addEventListener\("pointerup",onBoard,false\)/,
  'V113 currently owns persistent board listeners');

assert.match(v11411,/D\.addEventListener\("click",[\s\S]*?stopImmediatePropagation/,
  'V114.11 currently owns a persistent capture-phase menu listener');
assert.match(v11411,/function guardCombatStart[\s\S]*rt\.dc200StartCombat=wrapped/,
  'V114.11 currently wraps the global combat start seam');

assert.ok(dungeonContract.owns.includes('combat trigger'),'Dungeon contract must remain owner of the combat trigger');
assert.ok(dungeonContract.forbidden.includes('Tactical combat resolution'),'Dungeon must continue to forbid Tactical combat resolution');
assert.match(bridge,/function requestCombat\(rt=R,options=\{\}\)/,
  'Bridge must remain the explicit Dungeon-to-Tactical request contract');
assert.match(bridge,/if\(!rt\?\.GensRpgTacticalCombatV2\|\|!A\|\|!U\)return \{ok:false,reason:"modules-missing"\}/,
  'current Bridge must characterize its dependency on an already-loaded Tactical runtime');

for(const dead of [
  'gens-rpg-tactical-hotfix-1678114.js',
  'gens-rpg-tactical-session-guard-16781144.js',
  'gens-rpg-tactical-wall-dice-stats-16781145.js'
]){
  assert.ok(cartography.includes(dead),dead+' must remain documented as non-reachable historical debt');
  assert.ok(!integration.includes(dead),dead+' must not be reintroduced into the active compatibility chain');
}

console.log(JSON.stringify({
  scenario:'Phase 8 exit preaudit',
  criterion:'Tactical exists only for a combat session and tears down cleanly',
  classification:{
    A_blocking:[
      'full Tactical stack activates eagerly from application bootstrap',
      'active compatibility layers auto-install with retries and expose no dispose',
      'UI close clears local battle state but does not teardown global listeners/hooks/timers',
      'V113 owns active Dungeon exploration detection hooks outside combat',
      'base UI and V114.11 keep global Dungeon/menu/start side effects outside session'
    ],
    B_backlog:[
      'physical presence of non-reachable V114.1/V114.4/V114.5 files',
      'historical code still inspectable but not installed',
      'cosmetic/version/documentation cleanup not required by lifecycle'
    ]
  },
  dungeonCombatTriggerOwner:'Dungeon',
  explicitBoundary:'Bridge.requestCombat',
  exitReady:false,
  runtimeChangeInThisAudit:false,
  indexChangeRequired:false
},null,2));
