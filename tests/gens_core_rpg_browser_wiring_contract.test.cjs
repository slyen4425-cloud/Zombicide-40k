const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const core='assets/gensrpg/core/rpg-rules.js';
const tactical='assets/gensrpg/gens-rpg-tactical-combat-v2-stats-1678110.js';

const coreIx=html.indexOf(core);
const tacticalIx=html.indexOf(tactical);

assert.ok(coreIx>=0,'Core RPG rules must be loaded by the browser shell');
assert.ok(tacticalIx>=0,'Tactical RPG stats bridge must remain loaded by the browser shell');
assert.ok(coreIx<tacticalIx,'Core RPG rules must load before the Tactical RPG stats bridge');
assert.equal((html.match(/assets\/gensrpg\/core\/rpg-rules\.js/g)||[]).length,1,'Core RPG rules must be loaded exactly once');

console.log('GenSrpG Core RPG browser wiring contract OK');
