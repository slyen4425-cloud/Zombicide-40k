const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const bootstrap=fs.readFileSync(path.join(root,'assets','gensrpg','gens-mobile-combat-performance-16781022.js'),'utf8');
const assetPath='assets/gensrpg/core/asset-resolver.js';
const storagePath='assets/gensrpg/core/storage.js';
const enginePath='assets/gensrpg/gens-rpg-tactical-combat-v2.js';
const bridgePath='assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js';

for(const p of [assetPath,storagePath,enginePath,bridgePath])assert.ok(bootstrap.includes(p),`bootstrap must load ${p}`);
assert.ok(bootstrap.indexOf(assetPath)<bootstrap.indexOf(storagePath),'Phase 4 order must keep Assets before Storage');
assert.ok(bootstrap.indexOf(storagePath)<bootstrap.indexOf(enginePath),'Core Storage must exist before Tactical engine/runtime');
assert.ok(bootstrap.indexOf(storagePath)<bootstrap.indexOf(bridgePath),'Core Storage must exist before runtime repair can be loaded by the bridge');
assert.equal((bootstrap.match(/assets\/gensrpg\/core\/storage\.js/g)||[]).length,1,'Core Storage must have exactly one browser load path');

console.log('GenSrpG browser wiring: Core Storage loads once before Tactical runtime OK');
