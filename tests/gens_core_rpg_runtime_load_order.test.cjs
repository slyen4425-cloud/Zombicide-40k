const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const loaderPath=path.join(root,'assets','gensrpg','gens-mobile-combat-performance-16781022.js');
const loader=fs.readFileSync(loaderPath,'utf8');

const loaderScript='assets/gensrpg/gens-mobile-combat-performance-16781022.js';
const coreRules='assets/gensrpg/core/rpg-rules.js';
const tacticalEntry='assets/gensrpg/gens-rpg-tactical-combat-v2.js';

assert.ok(
  index.includes(loaderScript),
  'index.html must load the GenSrpG sequential runtime loader used by the browser'
);

const coreIndex=loader.indexOf(coreRules);
const tacticalIndex=loader.indexOf(tacticalEntry);
assert.ok(coreIndex>=0,'browser loader must include Core RPG rules');
assert.ok(tacticalIndex>=0,'browser loader must include Tactical V2 entry');
assert.ok(
  coreIndex<tacticalIndex,
  'Core RPG rules must load before Tactical so canonical configurable rules are available to every Tactical layer'
);

const occurrences=loader.split(coreRules).length-1;
assert.equal(occurrences,1,'Core RPG rules must have one browser loader owner, not duplicate script authorities');

for(const tacticalFile of [
  'assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js',
]){
  const pos=loader.indexOf(tacticalFile);
  assert.ok(pos>=0,`browser loader must include ${tacticalFile}`);
  assert.ok(coreIndex<pos,`Core RPG rules must load before ${tacticalFile}`);
}

console.log('GenSrpG Core RPG browser load-order contract OK');
