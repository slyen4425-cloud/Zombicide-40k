'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const bootstrap=read('assets/gensrpg/core/runtime-bootstrap-v1.js');
const entry=read('assets/gensrpg/tactical/entry-v1.js');
const contract=JSON.parse(read('assets/gensrpg/tactical/module-contract-v1.json'));
const privateFiles=[
 'assets/gensrpg/gens-rpg-tactical-combat-v2.js',
 'assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js',
 'assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js',
 'assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js',
 'assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js'
];
const facade='assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js';
assert.notEqual(contract.status,'contract-only-not-loaded');
assert.equal(contract.publicRuntimeApi,'GensTacticalV1');
const block=entry.slice(entry.indexOf('const privateFiles=['),entry.indexOf('];',entry.indexOf('const privateFiles=[')));
let cursor=-1;
for(const file of privateFiles){const pos=block.indexOf('"'+file+'"',cursor+1);assert.ok(pos>cursor,'Tactical private order drifted: '+file);cursor=pos}
assert.ok(entry.includes('const facadeFile="'+facade+'"'));
assert.match(entry,/R\.GensTacticalV1=Object\.freeze/);
assert.match(entry,/function activate\(onReady\)/);
assert.match(entry,/R\.__gensTacticalV2Loader105=true/);
assert.match(entry,/s\.async=false/);
assert.match(entry,/GensRpgTacticalCombatV2Bridge\?\.install\?\.\(R\)/);
assert.equal((entry.match(/setTimeout\(apply,/g)||[]).length,0);
assert.match(bootstrap,/assets\/gensrpg\/tactical\/entry-v1\.js/);
for(const file of [...privateFiles,facade])assert.equal(bootstrap.includes(file),false,'Core RuntimeBootstrap must not own '+file);
assert.doesNotMatch(bootstrap,/GensRpgTacticalCombatV2Bridge|__gensTacticalV2Loader105/);
console.log('Phase 8 Tactical composition ownership remains GREEN with cold private activation');
