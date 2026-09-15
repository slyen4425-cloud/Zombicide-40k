const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const bootstrapPath='assets/gensrpg/gens-mobile-combat-performance-16781022.js';
const integrationPath='assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js';
const corePath='assets/gensrpg/core/rpg-rules.js';
const statsPath='assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js';

const bootstrap=fs.readFileSync(path.join(root,bootstrapPath),'utf8');
const integration=fs.readFileSync(path.join(root,integrationPath),'utf8');

assert.equal(
  (html.match(/assets\/gensrpg\/gens-mobile-combat-performance-16781022\.js/g)||[]).length,
  1,
  'browser shell must load the GenSrpG bootstrap exactly once'
);
assert.ok(html.includes(bootstrapPath),'index.html must reach the GenSrpG bootstrap');
assert.ok(bootstrap.includes(integrationPath),'bootstrap must load the Tactical integration owner');
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

console.log('GenSrpG browser chain: index -> bootstrap -> integration -> Core RPG rules -> Tactical V110 stats OK');
