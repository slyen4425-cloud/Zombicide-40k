const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const core='assets/gensrpg/core/rpg-rules.js';
const bridge='assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js';
const occurrences=(source,needle)=>source.split(needle).length-1;

assert.equal(
  occurrences(html,core),
  1,
  'Core RPG rules must be loaded exactly once by the real application shell'
);
assert.ok(
  occurrences(html,bridge)>=1,
  'Tactical RPG stats bridge must be loaded by the real application shell'
);

const coreAt=html.indexOf(core);
const bridgeAt=html.indexOf(bridge);
assert.ok(coreAt>=0,'Core RPG rules script must exist in index.html');
assert.ok(bridgeAt>=0,'Tactical RPG stats bridge script must exist in index.html');
assert.ok(
  coreAt<bridgeAt,
  'Core RPG rules must load before Tactical RPG stats bridge so Core owns derivations at runtime'
);

console.log('GenSrpG Core RPG real load order contract OK');
