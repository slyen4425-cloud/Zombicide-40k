const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const performancePath='assets/gensrpg/gens-mobile-combat-performance-16781022.js';
const runtimeBootstrapPath='assets/gensrpg/shell/runtime-bootstrap.js';
const integrationPath='assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js';
const corePath='assets/gensrpg/core/rpg-rules.js';
const statsPath='assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js';

const performance=fs.readFileSync(path.join(root,performancePath),'utf8');
const runtimeBootstrap=fs.readFileSync(path.join(root,runtimeBootstrapPath),'utf8');
const integration=fs.readFileSync(path.join(root,integrationPath),'utf8');

assert.equal(
  (html.match(/assets\/gensrpg\/gens-mobile-combat-performance-16781022\.js/g)||[]).length,
  1,
  'browser shell must load the mobile performance handoff exactly once'
);
assert.ok(html.includes(performancePath),'index.html must reach the current final handoff');
assert.equal((performance.match(/assets\/gensrpg\/shell\/runtime-bootstrap\.js/g)||[]).length,1,'performance layer must hand off to one Shell runtime bootstrap');
assert.ok(!performance.includes(integrationPath),'mobile performance must no longer own Tactical composition');
assert.ok(runtimeBootstrap.includes(integrationPath),'Shell runtime bootstrap must load the Tactical integration owner');
assert.ok(integration.includes(corePath),'Tactical integration must load Core RPG rules');
assert.ok(integration.includes(statsPath),'Tactical integration must still load Tactical V110 stats');
assert.match(
  integration,
  /after109=.*loadCoreRpgRules\(loadStats110\)/s,
  'V109 completion must route through Core RPG rules before Tactical V110 stats'
);
assert.equal(
  (integration.match(/assets\/gensrpg\/core\/rpg-rules\.js/g)||[]).length,
  1,
  'Tactical integration must declare one Core RPG rules load path'
);

console.log('GenSrpG browser chain: index -> performance handoff -> Shell bootstrap -> integration -> Core RPG -> Tactical V110 OK');
