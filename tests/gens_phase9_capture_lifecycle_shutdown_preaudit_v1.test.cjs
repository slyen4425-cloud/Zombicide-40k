'use strict';
// Phase 9: pure-API characterization only; never mutates the production runtime.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const entry=read('assets/gensrpg/capture/entry-v1.js');
const start=read('assets/gensrpg/capture/session-start-v1.js');
const back=read('assets/gensrpg/capture/screen-return-v1.js');
const contract=JSON.parse(read('assets/gensrpg/capture/module-contract-v1.json'));
const roadmap=read('docs/GENSRPG_RESTRUCTURATION_ROADMAP.md');
assert.match(roadmap,/fonctionner et se fermer comme module autonome de premier niveau/);
assert.equal(contract.module,'capture');
assert.equal(contract.publicEntries.moduleLaunch.status,'loaded-public-provider');
assert.equal(contract.publicEntries.moduleScreenReturn.status,'loaded-public-provider');
for(const [name,source] of [['entry',entry],['start',start],['return',back]]){
  assert.doesNotMatch(source,/document\.|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener/,
    name+' must not own global UI/storage/timers');
  assert.doesNotMatch(source,/DungeonCore|DungeonSpatial|GensTactical|GensSurvival/,
    name+' must not touch a foreign private runtime');
}
const calls={start:[],return:[]};
let active='capture';
const ctx={console,
  GensShellModuleLaunchV1:{activeModule:()=>active,register:(id,fn)=>{calls.start.push(id);return typeof fn==='function';}},
  GensShellScreenReturnV1:{register:(id,fn)=>{calls.return.push(id);return typeof fn==='function';}}};
ctx.globalThis=ctx;
vm.createContext(ctx);
for(const [file,src] of [['entry',entry],['start',start],['return',back]])
  vm.runInContext(src,ctx,{filename:file});
const cap=ctx.GensCaptureV1,session=ctx.GensCaptureSessionStartV1,returnOwner=ctx.GensCaptureScreenReturnV1;
assert.ok(cap&&session&&returnOwner);
assert.equal(typeof cap.install,'function');
assert.equal(typeof cap.status,'function');
assert.equal(typeof cap.startModuleSession,'function');
assert.equal(typeof cap.dispose,'undefined',
  'current Capture entry has no coordinated shutdown; this is a characterization, not a prescribed API');
assert.equal(typeof session.dispose,'function');
assert.equal(typeof returnOwner.dispose,'function');
assert.equal(session.status().installed,false);
assert.equal(returnOwner.returnToPrimaryView(),false);
const launchOwner={start:async()=>true};
assert.equal(cap.install(launchOwner),true);
assert.equal(cap.install(launchOwner),true);
assert.deepEqual(calls.start,['capture']);
assert.equal(await cap.startModuleSession(),true);
active='dungeon';
assert.equal(await cap.startModuleSession(),false);
active='capture';
const hooks={hasActiveSession:()=>true,isCaptureContext:()=>true,enterWorld:()=>{}};
assert.equal(returnOwner.install(hooks),true);
assert.equal(returnOwner.install(hooks),true);
assert.deepEqual(calls.return,['capture']);
assert.equal(returnOwner.returnToPrimaryView(),true);
assert.equal(returnOwner.dispose(),true);
assert.equal(returnOwner.returnToPrimaryView(),false);
assert.equal(session.dispose(),true);
assert.equal(session.status().installed,false);
for(const rel of [
  'tests/gens_phase9_capture_session_start_owner_transfer_v1.test.cjs',
  'tests/gens_phase9_capture_screen_return_owner_transfer_v1.test.cjs',
  'tests/gens_phase5_capture_victory_resume_e2e_browser_v1.test.cjs',
  'tests/gens_four_module_noninterference_shell_browser_v11411.test.cjs',
  'tests/gens_dungeon_builder_visibility_browser_v11411.test.cjs'
])assert.ok(fs.existsSync(path.join(root,rel)),'missing non-regression: '+rel);
console.log(JSON.stringify({
  scenario:'Phase 9 Capture lifecycle shutdown preaudit',
  publicEntryDisposePresent:false,
  ownerLocalDispose:['session-start','screen-return'],
  registrations:calls,
  runtimeModified:false,
  nextGate:'Rule 26 inspect exact quit/save/close transitions before a single-owner TDD transfer'
},null,2));
