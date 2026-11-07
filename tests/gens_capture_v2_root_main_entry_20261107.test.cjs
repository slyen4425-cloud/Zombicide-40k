'use strict';
// Root GenSRPG -> ONE official Capture V2 owner. No root Capture V1 runtime entry.
// The existing Pages publisher stages the immutable V2 and Lab main pins once.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const root=path.resolve(__dirname,'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('main Shell chooses exactly one Capture V2 route before the legacy Capture menu',()=>{
 const hub=read('assets/gensrpg/shell/legacy-hub-family-ui-v1.js');
 const marker='data-gensrpg-main-capture-route="v2"';
 assert.ok(hub.indexOf('GensCaptureMainEntryV1.open')>0,'Shell must delegate to the official Capture entry');
 assert.ok(hub.indexOf('GensCaptureMainEntryV1.open')<hub.indexOf('gensSelectedFamily=family'),
  'public route must run before any legacy Capture state or UI is activated');
 assert.match(hub,/data-gensrpg-main-capture-route/,'main route must be an explicit published entry');
 assert.match(hub,/throw new Error\(/,'fail closed if the published authoritative module is not loaded');
 const workflow=read('.github/workflows/main.yml');
 assert.ok(workflow.includes(marker),'single main publisher must inject the routing entry');
 assert.ok(workflow.includes('capture-v2-main-entry-v1.js'),'main router must ship its exact owner');
});

test('root Capture destination is the only approved same-origin V2 release and never a new game engine',()=>{
 const source=read('assets/gensrpg/shell/capture-v2-main-entry-v1.js');
 assert.doesNotMatch(source,/captureStartBattleAutomatic|legacy-monolith|CombatRules|localStorage|indexedDB/);
 const urls=[];
 const location={origin:'https://slyen4425-cloud.github.io',assign:v=>urls.push(v)};
 const window={document:{baseURI:'https://slyen4425-cloud.github.io/Zombicide-40k/index.html'},location};
 vm.runInNewContext(source,{window,URL});
 assert.equal(window.GensCaptureMainEntryV1.open(),true);
 assert.deepEqual(urls,['https://slyen4425-cloud.github.io/Zombicide-40k/preview/capture-v2-pr225/index.html?entry=gensrpg-main']);
 assert.ok(Object.isFrozen(window.GensCaptureMainEntryV1));
});

test('published Capture V2 enters the native menu and offers a return to the SAME main app',()=>{
 const source=read('assets/gensrpg/shell/capture-v2-from-main-entry-v1.js');
 assert.doesNotMatch(source,/captureStartBattleAutomatic|combat\.html|localStorage|indexedDB/);
 let onload, clicked=0, appended=[];
 const header={append:e=>appended.push(e)};
 const doc={
   addEventListener:(event,cb)=>{if(event==='DOMContentLoaded')onload=cb},
   querySelector:s=>s==='button.gensRootModeCard.capture'?{click:()=>{clicked++}}:null,
   getElementById:id=>id==='gensCaptureV2Root'?{querySelector:s=>s==='header'?header:null}:null,
   createElement:t=>({tagName:t})
 };
 const window={
   location:{href:'https://slyen4425-cloud.github.io/Zombicide-40k/preview/capture-v2-pr225/index.html?entry=gensrpg-main',search:'?entry=gensrpg-main'},
   document:doc
 };
 vm.runInNewContext(source,{window,URL,URLSearchParams});
 assert.equal(typeof onload,'function');
 onload();
 assert.equal(clicked,1,'enter Capture V2 exactly once through its own native Shell');
 assert.equal(appended.length,1);
 assert.equal(appended[0].href,'https://slyen4425-cloud.github.io/Zombicide-40k/');
 const publisher=read('tools/stage_capture_v2_pages_preview.mjs');
 assert.match(publisher,/capture-v2-from-main-entry-v1\.js/,'publisher must attach the root handoff to the existing V2 release');
 assert.doesNotMatch(publisher,/new.*capture.*engine|duplicate.*combat.*runtime/i);
});
