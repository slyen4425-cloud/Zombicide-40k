'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const json=rel=>JSON.parse(read(rel));

const entry=read('assets/gensrpg/capture/entry-v1.js');
const contract=json('assets/gensrpg/capture/module-contract-v1.json');
const shell=read('assets/gensrpg/shell/module-launch-final-authority-v1.js');
const publicRaccord=read('tests/gens_phase9_capture_public_entry_raccord_v1.test.cjs');
const s3=read('tests/gens_phase5_module_launch_s3_capture_provider_v1.test.cjs');

assert.equal(contract.module,'capture');
assert.equal(contract.status,'partial-runtime-loaded');
assert.equal(contract.publicRuntimeApi,'GensCaptureV1');
assert.equal(contract.publicEntries?.moduleLaunch?.status,'loaded-public-provider');
assert.equal(contract.publicEntries?.moduleScreenReturn?.status,'declared-not-loaded');

assert.match(entry,/let\s+legacyStartConfiguredGame\s*=\s*null/);
assert.match(entry,/function\s+startModuleSession\s*\(\)/);
assert.match(entry,/if\(shell\.activeModule\(\)!=="capture"\)return false/);
assert.match(entry,/if\(typeof legacyStartConfiguredGame!=="function"\)return false/);
assert.match(entry,/await legacyStartConfiguredGame\(\)/,
  'public Capture start still delegates to the temporary Capture139 session owner');
assert.match(entry,/function\s+install\s*\(legacyStart\)/);
assert.match(entry,/GensCaptureV1\.install requires the Capture139 legacy start function/);
assert.match(entry,/legacyStartConfiguredGame=legacyStart/);
assert.match(entry,/shell\.register\("capture",startModuleSession\)/);

assert.ok(contract.consumes.includes('temporary legacy Capture139 session start binding'));
assert.ok(contract.invariants.some(x=>/Capture139 remains the sole temporary legacy session initializer/i.test(x)));

assert.doesNotMatch(entry,/document\.|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener/,
  'public entry must stay free of gameplay/DOM/storage maintenance while the owner transfer is only preaudited');
assert.doesNotMatch(entry,/DungeonCore|DungeonSpatial|GensTactical|CombatRuntime|WorldDocument/,
  'public entry must not acquire a foreign private runtime dependency');

assert.match(publicRaccord,/GensCaptureV1\.install/);
assert.match(publicRaccord,/legacySessionOwner:'Capture139'/);
assert.match(s3,/await legacyStartConfiguredGame\(\)/);
assert.match(s3,/Capture139 remains the gameplay\/session owner/);

assert.match(shell,/activeModule\(\)/);
assert.match(shell,/startModuleSession\(moduleId\)/);
assert.doesNotMatch(shell,/captureFix139|legacyStartConfiguredGame/,
  'Shell must remain generic and must not absorb the Capture139 bridge');

console.log(JSON.stringify({
  scenario:'Phase 9 autonomous Capture top-level entry preaudit',
  publicEntry:'GensCaptureV1',
  publicProviderLoaded:true,
  remainingSessionOwner:'Capture139 legacy binding',
  firstAutonomyBlocker:'session-start owner transfer',
  screenReturnDeferred:true,
  runtimeChanged:false
},null,2));
