'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

const bootstrap=read('assets/gensrpg/core/runtime-bootstrap-v1.js');
const entry=read('assets/gensrpg/tactical/entry-v1.js');
const contract=JSON.parse(read('assets/gensrpg/tactical/module-contract-v1.json'));

const baseFiles=[
  'assets/gensrpg/gens-rpg-tactical-combat-v2.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-adapter.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-rules.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-integration.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-ui.js',
  'assets/gensrpg/gens-rpg-tactical-combat-v2-bridge.js'
];

assert.notEqual(contract.status,'contract-only-not-loaded',
  'Tactical contract must describe a connected public entry after the handoff');
assert.equal(contract.publicRuntimeApi,'GensTacticalV1',
  'Tactical public runtime API must be explicit after the handoff');

let entryCursor=-1;
for(const file of baseFiles){
  const pos=entry.indexOf('"'+file+'"',entryCursor+1);
  assert.ok(pos>entryCursor,'Tactical entry must own ordered base composition: '+file);
  entryCursor=pos;
}
assert.match(entry,/R\.GensTacticalV1=/,'Tactical entry must expose the public module API');
assert.match(entry,/if\(R\.__gensTacticalV2Loader105\)return true;/,'Tactical entry must own the historical idempotency guard');
assert.match(entry,/R\.__gensTacticalV2Loader105=true;/,'Tactical entry must set the historical guard before loading');
assert.match(entry,/s\.src=files\[i\]\+"\?v=16\.78\.105";/,'Tactical entry must preserve the base cache suffix');
assert.match(entry,/s\.async=false;/,'Tactical entry must preserve sequential script loading');
assert.match(entry,/s\.onload=\(\)=>load\(i\+1\)/,'Tactical entry must preserve sequential success continuation');
assert.match(entry,/GensRpgTacticalCombatV2Bridge\?\.install\?\.\(R\)/,'Tactical entry must own final bridge install');
assert.equal((entry.match(/setTimeout\(apply,/g)||[]).length,0,
  'Tactical public entry must not regain delayed Bridge reinstalls');

assert.match(bootstrap,/assets\/gensrpg\/tactical\/entry-v1\.js/,
  'Core RuntimeBootstrap must delegate only to the Tactical public entry');
for(const file of baseFiles){
  assert.equal(bootstrap.includes(file),false,'Core RuntimeBootstrap must no longer know Tactical private file: '+file);
}
assert.doesNotMatch(bootstrap,/GensRpgTacticalCombatV2Bridge/,
  'Core RuntimeBootstrap must no longer install Tactical bridge');
assert.doesNotMatch(bootstrap,/__gensTacticalV2Loader105/,
  'Core RuntimeBootstrap must no longer own Tactical idempotency');
assert.equal((bootstrap.match(/assets\/gensrpg\/tactical\/entry-v1\.js/g)||[]).length,1,
  'Core RuntimeBootstrap must have one Tactical public entry handoff');

console.log('Phase 8 Tactical composition ownership handoff GREEN');
