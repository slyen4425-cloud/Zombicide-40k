'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const owners=JSON.parse(read('docs/GENSRPG_PHASE2_INLINE_OWNERS.json'));
const lastOwners=read('docs/GENSRPG_PHASE2_INLINE_GLOBAL_LAST_OWNERS.tsv');
const shellContract=JSON.parse(read('assets/gensrpg/shell/module-contract-v1.json'));
const captureContract=JSON.parse(read('assets/gensrpg/capture/module-contract-v1.json'));
const captureEntry=read('assets/gensrpg/capture/entry-v1.js');
const sessionOwner=read('assets/gensrpg/capture/session-start-v1.js');
const screenReturnOwner=read('assets/gensrpg/capture/screen-return-v1.js');

function blockBody(id){
  const m=index.match(new RegExp('<script\\b[^>]*\\bid=["\\\']'+id+'["\\\'][^>]*>([\\s\\S]*?)<\\/script>','i'));
  assert.ok(m,'missing inline block '+id);
  return m[1];
}
const c135=blockBody('captureFix135');
const c138=blockBody('captureFix138');
const c139=blockBody('captureFix139');

assert.match(lastOwners,/^startConfiguredGame\t1\tgensDungeonCore01Js$/m,
  'Phase 9 closure must retain only Dungeon Core01 as historical inline launch owner');
assert.doesNotMatch(c135,/window\.startConfiguredGame\s*=/,
  'Capture135 global launch owner must remain retired');
assert.doesNotMatch(c138,/window\.startConfiguredGame\s*=|const start138=/,'Capture138 launch authority must remain retired');
assert.match(c138,/isCaptureContext138/);
assert.match(c138,/captureBattleApplyAbility/,'Capture138 combat targeting stays loaded');
assert.doesNotMatch(c138,/renderCaptureWorldHub\(\)/,'obsolete delayed Hub render stays retired');

assert.doesNotMatch(c139,/window\.startConfiguredGame\s*=|const\s+start139\s*=|gensCaptureStartConfiguredGame139V1/,
  'Capture139 must remain retired from the global launch chain');
assert.match(c139,/GensCaptureSessionStartV1\.install\(/,
  'Capture139 may only wire historical dependencies into the dedicated Capture session owner');
assert.match(c139,/GensCaptureV1\.install\(window\.GensCaptureSessionStartV1\)/);
assert.match(c139,/GensCaptureScreenReturnV1\.install\(/,
  'Capture139 only injects the screen-return owner dependencies, not Shell registration');
assert.match(screenReturnOwner,/shell\.register\("capture",returnToPrimaryView\)/,
  'the sole Capture return provider must be installed by the Capture module');

assert.equal(owners.blocks.captureFix139.primaryDomain,'capture');
assert.match(owners.blocks.captureFix139.responsibility,/dependency wiring for public session-start, screen-return and primary Hub UI entry owners/i,
  'Capture139 cartography must describe only the explicit dependency composer');
assert.match(owners.blocks.captureFix139.responsibility,/no direct Shell registration or Hub UI transition/i,
  'Capture139 must not regain Shell or visual Hub ownership');
const hubOwner=read('assets/gensrpg/capture/hub-entry-v1.js');
assert.match(c139,/window\.GensCaptureHubEntryV1\.install\s*\(/,
  'Capture139 must explicitly inject UI dependencies into the sole Hub owner');
assert.doesNotMatch(c139,/window\.captureEnterWorld139\s*=/,
  'Capture139 must not define a legacy global Hub transition');
assert.match(hubOwner,/root\.GensCaptureHubEntryV1=Object\.freeze/,
  'Capture Hub API must be owned exclusively by the Capture module');
assert.doesNotMatch(hubOwner,/DungeonCore|GensTactical|localStorage|sessionStorage|window\.goMenu/,
  'Capture Hub UI owner must not become a foreign gameplay or storage owner');

assert.equal(shellContract.status,'contract-only-not-loaded');
assert.ok(shellContract.forbidden.includes('module gameplay rules'));
assert.equal(captureContract.status,'partial-runtime-loaded');
assert.equal(captureContract.activatedPhase,9);
assert.ok(captureContract.owns.includes('Capture session initialization'));
assert.ok(captureContract.consumes.includes('Capture session-start owner public API'));
assert.ok(!captureContract.consumes.includes('temporary legacy Capture139 session start binding'));

assert.match(captureEntry,/let\s+sessionStartOwner\s*=\s*null/);
assert.match(captureEntry,/function install\(owner\)/);
assert.match(captureEntry,/await sessionStartOwner\.start\(\)/);
assert.match(captureEntry,/shell\.register\("capture",startModuleSession\)/);
assert.doesNotMatch(captureEntry,/legacyStartConfiguredGame|document\.|localStorage|setTimeout|MutationObserver/);

assert.match(sessionOwner,/GensCaptureSessionStartV1/);
assert.match(sessionOwner,/async function start\(\)/);
assert.match(sessionOwner,/function dispose\(\)/);
assert.doesNotMatch(sessionOwner,/document\.|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener/);

console.log(JSON.stringify({
  scenario:'Phase 5 Capture public launch-entry preaudit closure after Phase 9',
  inlineLaunchOwners:['gensDungeonCore01Js'],
  retiredOwner:'captureFix139',
  activeCaptureSessionOwner:'GensCaptureSessionStartV1',
  screenReturnDeferred:false
},null,2));
