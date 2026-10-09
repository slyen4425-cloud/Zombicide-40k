'use strict';

// Documentation-only Phase 9 boundary characterization. Runtime is frozen.
// The previous Phase 5 Capture screen-return migration is LIVE in Capture139,
// while the Capture Phase 3 module entry still declares this public operation
// as not loaded. Do not create a second active provider from this preaudit.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const json=rel=>JSON.parse(read(rel));
const bytes=fs.readFileSync(path.join(root,'index.html'));
const source=bytes.toString('utf8');
const blob=crypto.createHash('sha1').update(Buffer.from('blob '+bytes.length+'\0')).update(bytes).digest('hex');
assert.equal(bytes.length,8165398,'Rule 26: unexpected runtime size; re-audit exact new source before interpreting Capture139');
assert.equal(blob,'18627cc0c5fc7945732c8a910504c59ef823b6ae','Rule 26: unexpected runtime blob; stop before any ownership decision');

const blocks=[...source.matchAll(/<script\b[^>]*\bid=["']([^"']+)["'][^>]*>([\s\S]*?)<\/script>/gi)]
  .map(x=>({id:x[1],body:x[2]}));
const capture=blocks.find(x=>x.id==='captureFix139')?.body||'';
const dungeon=blocks.find(x=>x.id==='dungeonCore200Rebuild')?.body||'';
const go=source.match(/function goMenu\(\)\{[\s\S]*?\n\}/)?.[0]||'';
const shellContract=json('assets/gensrpg/shell/module-screen-return-contract-v1.json');
const captureContract=json('assets/gensrpg/capture/module-contract-v1.json');
const captureEntry=read('assets/gensrpg/capture/entry-v1.js');

assert.equal(shellContract.operation,'returnToPrimaryView');
assert.ok(shellContract.providers.includes('capture'));
assert.equal(captureContract.publicEntries?.moduleScreenReturn?.operation,'returnToPrimaryView');
assert.equal(captureContract.publicEntries?.moduleScreenReturn?.status,'loaded-public-provider',
  'Capture Phase 3 metadata must not be silently changed before relocating the real provider');
assert.equal(captureContract.publicEntries?.moduleLaunch?.status,'loaded-public-provider',
  'Capture session-start ownership was transferred in the previous GREEN lot');
assert.match(captureEntry,/shell\.register\("capture",startModuleSession\)/);
assert.doesNotMatch(captureEntry,/GensShellScreenReturnV1|returnToPrimaryView/,
  'public Capture entry must not accidentally become a second screen-return provider');
assert.match(go,/GensShellScreenReturnV1/);
assert.match(go,/returnToPrimaryView/);
assert.match(capture,/GensCaptureScreenReturnV1/);
assert.match(capture,/GensCaptureScreenReturnV1\.install\s*\(/,
  'the existing LIVE screen-return provider must be installed via the dedicated Capture owner');
assert.match(capture,/GensCaptureHubEntryV1\.enterWorld\(\)/,
  'Capture139 delegates the Hub transition to the unique physical Capture Hub owner');
assert.equal((capture.match(/GensCaptureScreenReturnV1\.install\s*\(/g)||[]).length,1,
  'the historic Capture block must provide exactly one owner dependency binding');
assert.doesNotMatch(capture,/window\.goMenu\s*=/,
  'Phase 5 removed the Capture global goMenu override');
assert.doesNotMatch(dungeon,/window\.goMenu\s*=/,
  'Phase 5 removed the Dungeon global goMenu override');
assert.deepEqual(blocks.filter(x=>/window\.goMenu\s*=/.test(x.body)).map(x=>x.id),[],
  'no additional inline global screen-return owner is permitted');

for(const rel of [
  'tests/gens_phase5_module_screen_return_capture_raccord_v1.test.cjs',
  'tests/gens_phase5_module_screen_return_dungeon_s2_v1.test.cjs',
  'tests/gens_phase5_gomenu_e2e_browser_v1.test.cjs',
  'tests/gens_phase5_gomenu_survival_e2e_browser_v1.test.cjs',
  'tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs',
  'tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs',
  'tests/gens_dungeon_builder_visibility_browser_v11411.test.cjs'
])assert.ok(fs.existsSync(path.join(root,rel)),'missing required screen-return non-regression: '+rel);

console.log(JSON.stringify({
  scenario:'Phase 9 Capture screen-return physical ownership preaudit',
  source:{size:bytes.length,blob},
  shell:'native goMenu dispatches GensShellScreenReturnV1',
  liveCaptureProvider:'captureFix139 -> captureEnterWorld139',
  entryStatus:'declared-not-loaded',
  duplicationAllowed:false,
  runtimeChanged:false,
  nextStep:'Rule 26 exact-owner extraction audit (separate lot)'
},null,2));
