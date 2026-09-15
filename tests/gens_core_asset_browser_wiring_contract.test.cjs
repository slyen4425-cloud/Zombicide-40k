const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const bootstrap=fs.readFileSync(path.join(root,'assets','gensrpg','shell','runtime-bootstrap.js'),'utf8');
const assetPath='assets/gensrpg/core/asset-resolver.js';
const enginePath='assets/gensrpg/gens-rpg-tactical-combat-v2.js';
const adapterPath='assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js';
const uiPath='assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js';

for(const p of [assetPath,enginePath,adapterPath,uiPath])assert.ok(bootstrap.includes(p),`Shell bootstrap must load ${p}`);
assert.ok(bootstrap.indexOf(assetPath)<bootstrap.indexOf(enginePath),'Core Assets must load before the Tactical engine');
assert.ok(bootstrap.indexOf(assetPath)<bootstrap.indexOf(adapterPath),'Core Assets must load before the Tactical adapter');
assert.ok(bootstrap.indexOf(assetPath)<bootstrap.indexOf(uiPath),'Core Assets must load before the Tactical UI');
assert.equal((bootstrap.match(/assets\/gensrpg\/core\/asset-resolver\.js/g)||[]).length,1,'Core Assets must have one Shell bootstrap load path');

console.log('GenSrpG browser wiring: Core Assets loads once before Tactical runtime OK');
