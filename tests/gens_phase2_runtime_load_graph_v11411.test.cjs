const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const stripQuery=value=>String(value||'').replace(/\?.*$/,'');

const index=read('index.html');
const mobile=read('assets/gensrpg/gens-mobile-combat-performance-16781022.js');
const bootstrap=read('assets/gensrpg/core/runtime-bootstrap-v1.js');
const integration=read('assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js');
const bridge=read('assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js');
const core317=read('assets/dungeon/dungeon-core-317.js');

const direct=[...index.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
  .map(m=>m[1])
  .filter(src=>/^assets\/(?:gensrpg|dungeon)\//.test(src))
  .map(stripQuery);

assert.deepEqual(direct,[
  'assets/dungeon/dungeon-core-316.js',
  'assets/dungeon/dungeon-core-317.js',
  'assets/gensrpg/gens-mobile-combat-performance-16781022.js'
],'index.html local JS entries must remain explicit and ordered');

const inlineIds=[...index.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
assert.equal(inlineIds.length,130,'Phase 2 cartography expects the current 130 identified inline script blocks');

const assetRefs=source=>[...source.matchAll(/assets\/(?:gensrpg|dungeon)\/[^"'`\s)]+\.js(?:\?[^"'`\s)]*)?/g)]
  .map(m=>stripQuery(m[0]));

assert.deepEqual([...new Set(assetRefs(mobile))],[
  'assets/gensrpg/core/runtime-bootstrap-v1.js'
],'mobile performance file must remain the single current RuntimeBootstrap entry');

const expectedBootstrap=[
  'assets/gensrpg/gens-rpg-tactical-combat-v2.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js',
  'assets/gensrpg/gens-survival-mode-isolation-1678104.js'
];
for(const rel of expectedBootstrap)assert.ok(bootstrap.includes(rel),'RuntimeBootstrap must still reference '+rel);
assert.ok(expectedBootstrap.every((rel,i)=>i===0||bootstrap.indexOf(rel)>bootstrap.indexOf(expectedBootstrap[i-1])),'RuntimeBootstrap order must remain stable');

const expectedIntegration=[
  'assets/gensrpg/gens-rpg-tactical-visual-dice-16781142.js',
  'assets/gensrpg/gens-rpg-tactical-runtime-authority-1678113.js',
  'assets/gensrpg/gens-rpg-tactical-combat-coherence-1678112.js',
  'assets/gensrpg/gens-rpg-tactical-runtime-fixes-1678111.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678109.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-polish-1678108.js'
];
assert.deepEqual([...new Set(assetRefs(integration))],expectedIntegration,'Tactical integration load chain must remain mapped exactly');

assert.deepEqual([...new Set(assetRefs(bridge))],[
  'assets/gensrpg/gens-rpg-runtime-repair-1678106.js'
],'Tactical bridge must keep its mapped runtime-repair dependency');

assert.match(core317,/new\s+MutationObserver\(scheduleBackButton\)/,'Phase 2 must keep the known Core 3.17 observer debt visible until a dedicated cleanup lot');
assert.match(core317,/observe\(document\.documentElement,\{childList:true,subtree:true\}\)/,'Core 3.17 observer debt target must remain characterized');
assert.match(core317,/merchantRetryTimer=setInterval\(/,'Core 3.17 merchant retry debt must remain characterized');

const active=[
  ...direct,
  'assets/gensrpg/core/runtime-bootstrap-v1.js',
  ...expectedBootstrap,
  ...expectedIntegration,
  'assets/gensrpg/gens-rpg-runtime-repair-1678106.js'
];
const unique=[...new Set(active)];
assert.equal(unique.length,19,'Phase 2 initial external active graph must contain 19 local JS files');

console.log(JSON.stringify({
  scenario:'Phase 2 runtime load graph cartography',
  directLocalJs:direct.length,
  inlineIdScripts:inlineIds.length,
  activeExternalLocalJs:unique.length,
  knownDebt:{
    core317DocumentElementObserver:true,
    core317MerchantRetryInterval:true
  }
}));
