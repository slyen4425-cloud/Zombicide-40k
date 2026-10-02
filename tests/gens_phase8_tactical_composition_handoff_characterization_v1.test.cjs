'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const bootstrap=read('assets/gensrpg/core/runtime-bootstrap-v1.js');
const entry=read('assets/gensrpg/tactical/entry-v1.js');
const contract=JSON.parse(read('assets/gensrpg/tactical/module-contract-v1.json'));
const characterizationDoc=read('docs/GENSRPG_PHASE8_TACTICAL_COMPOSITION_HANDOFF_CHARACTERIZATION.md');
const privateFiles=[
  'assets/gensrpg/gens-rpg-tactical-combat-v2.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js'
];
const facade='assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js';
assert.equal(contract.status,'partial-runtime-loaded');
assert.equal(contract.activatedPhase,8);
assert.equal(contract.publicRuntimeApi,'GensTacticalV1');
assert.match(characterizationDoc,/Propriétaire actuel[\s\S]*runtime-bootstrap-v1\.js/);
assert.match(characterizationDoc,/entry-v1\.js[\s\S]*encore inert/);
const block=entry.slice(entry.indexOf('const privateFiles=['),entry.indexOf('];',entry.indexOf('const privateFiles=[')));
let cursor=-1;
for(const file of privateFiles){const pos=block.indexOf('"'+file+'"',cursor+1);assert.ok(pos>cursor,'private composition order drifted: '+file);cursor=pos}
assert.ok(entry.includes('const facadeFile="'+facade+'"'),'Bridge facade ownership missing');
assert.match(entry,/function activate\(onReady\)/,'public entry must now own private activation');
assert.match(entry,/R\.__gensTacticalV2Loader105=true/,'historical private-loader guard must remain');
assert.match(entry,/s\.src=file\+"\?v=16\.78\.105"/,'private cache suffix drifted');
assert.match(entry,/s\.src=facadeFile\+"\?v=16\.78\.105"/,'facade cache suffix drifted');
assert.match(entry,/GensRpgTacticalCombatV2Bridge\?\.install\?\.\(R\)/,'entry must retain Bridge install ownership after private base readiness');
assert.equal((entry.match(/setTimeout\(apply,/g)||[]).length,0,'retired public Bridge retries must stay absent');
assert.match(bootstrap,/assets\/gensrpg\/tactical\/entry-v1\.js/);
for(const file of [...privateFiles,facade])assert.equal(bootstrap.includes(file),false,'Core regained Tactical private ownership: '+file);
console.log(JSON.stringify({
 scenario:'Phase 8 Tactical composition handoff characterization',
 baselineOwner:'assets/gensrpg/core/runtime-bootstrap-v1.js',
 currentOwner:'assets/gensrpg/tactical/entry-v1.js',
 privateFiles,facade,
 privateActivation:'first-request',
 idempotencyGuard:'__gensTacticalV2Loader105',
 gameplayChangeExpected:false,indexChangeRequired:false
},null,2));
