'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const entry=read('assets/gensrpg/capture/entry-v1.js');
const owner=read('assets/gensrpg/capture/session-start-v1.js');
const contract=JSON.parse(read('assets/gensrpg/capture/module-contract-v1.json'));
const shellFinal=read('assets/gensrpg/shell/module-launch-final-authority-v1.js');

function block(id){
  const marker='<script id="'+id+'">';
  const start=index.indexOf(marker);
  assert.ok(start>=0,'missing '+id);
  const bodyStart=start+marker.length;
  const end=index.indexOf('</script>',bodyStart);
  assert.ok(end>bodyStart,'unterminated '+id);
  return index.slice(bodyStart,end);
}

const c139=block('captureFix139');

assert.equal((index.match(/assets\/gensrpg\/capture\/entry-v1\.js/g)||[]).length,1,
  'Capture public entry must be loaded exactly once by the real index');
assert.equal((index.match(/assets\/gensrpg\/capture\/session-start-v1\.js/g)||[]).length,1,
  'Capture session-start owner must be loaded exactly once by the real index');
assert.match(entry,/GensCaptureV1/,
  'Capture entry must expose the public GensCaptureV1 API');
assert.match(entry,/function\s+install\s*\(/,
  'Capture entry must expose an explicit install boundary');
assert.match(entry,/function\s+startModuleSession\s*\(/,
  'Capture entry must own the public module-launch provider');
assert.match(entry,/shell\.register\("capture",startModuleSession\)/,
  'Capture entry must own the unique Shell provider registration');
assert.doesNotMatch(entry,/document\.|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener/,
  'Capture public entry must not own DOM/storage/timer/listener gameplay state');
assert.doesNotMatch(entry,/DungeonCore|DungeonSpatial|GensTactical|CombatRuntime|WorldDocument/,
  'first public-entry seam must not import private Dungeon/Tactical/lab runtimes');

assert.equal(contract.status,'partial-runtime-loaded');
assert.equal(contract.activatedPhase,9);
assert.equal(contract.publicRuntimeApi,'GensCaptureV1');
assert.equal(contract.publicEntries.moduleLaunch.status,'loaded-public-provider');
assert.ok(contract.owns.includes('Capture session initialization'));
assert.ok(contract.consumes.includes('Capture session-start owner public API'));

assert.match(owner,/GensCaptureSessionStartV1/);
assert.match(owner,/async\s+function\s+start\s*\(/);
assert.doesNotMatch(owner,/document\.|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener/,
  'Capture session owner must consume injected contracts only');
assert.doesNotMatch(c139,/window\.startConfiguredGame\s*=|gensCaptureStartConfiguredGame139V1|legacyStartConfiguredGame/,
  'Capture139 must remain retired from session-start ownership');
assert.match(c139,/GensCaptureSessionStartV1\.install\(/,
  'Capture139 may only wire explicit dependencies into the Capture session owner');
assert.match(c139,/GensCaptureV1\.install\(window\.GensCaptureSessionStartV1\)/,
  'Capture139 must bind the dedicated session owner into the public entry');
assert.doesNotMatch(c139,/GensShellModuleLaunchV1\.register\("capture"/,
  'Capture139 must not register the public Capture provider directly');

assert.match(shellFinal,/activeModule\(\)/);
assert.match(shellFinal,/startModuleSession\(moduleId\)/);
assert.doesNotMatch(shellFinal,/GensCaptureV1|captureFix139|gensCapture/,
  'Shell final authority must remain generic routing-only');

console.log(JSON.stringify({
  scenario:'Phase 9 Capture public-entry raccord',
  owner:'GensCaptureV1',
  sessionOwner:'GensCaptureSessionStartV1',
  uniqueProvider:true
},null,2));
