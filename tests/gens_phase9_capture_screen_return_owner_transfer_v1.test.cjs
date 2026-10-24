'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const index=read('index.html');
const entry=read('assets/gensrpg/capture/entry-v1.js');
const source=read('assets/gensrpg/capture/screen-return-v1.js');
const contract=JSON.parse(read('assets/gensrpg/capture/module-contract-v1.json'));
const match=index.match(/<script\b[^>]*\bid=["']captureFix139["'][^>]*>([\s\S]*?)<\/script>/i);
assert.ok(match,'Capture139 original dependency binding must remain');
const legacy=match[1];

// RED on the exact historical runtime: no second provider, no premature metadata flip.
assert.equal((index.match(/assets\/gensrpg\/capture\/screen-return-v1\.js/g)||[]).length,1,
  'Capture screen-return owner must be loaded exactly once from source index');
assert.ok(index.indexOf('assets/gensrpg/capture/session-start-v1.js')<index.indexOf('assets/gensrpg/capture/screen-return-v1.js'));
assert.ok(index.indexOf('assets/gensrpg/capture/screen-return-v1.js')<index.indexOf('id="captureFix139"'));
assert.doesNotMatch(legacy,/GensShellScreenReturnV1\s*\??\.\s*register/,
  'legacy Capture139 must not retain public Shell screen-return ownership');
assert.match(legacy,/GensCaptureScreenReturnV1\.install\s*\(\s*\{/,
  'Capture139 must only inject existing owner-local dependencies');
assert.match(legacy,/hasActiveSession:\(\)=>hasActiveSession\(\)/);
assert.match(legacy,/isCaptureContext:\(\)=>isCaptureContext138\(\)/);
assert.match(legacy,/enterWorld:\(\)=>window\.GensCaptureHubEntryV1\.enterWorld\(\)/);
assert.match(legacy,/GensCaptureHubEntryV1\.install\(\{/,
  'Capture139 must wire, not own, the dedicated Hub entry; world renderer remains unchanged');
assert.doesNotMatch(legacy,/window\.goMenu\s*=/);
assert.doesNotMatch(entry,/GensShellScreenReturnV1/,
  'public Capture entry must not also register a screen-return owner');
assert.equal(contract.publicEntries.moduleScreenReturn.status,'loaded-public-provider');
assert.ok(contract.consumes.includes('Capture screen-return owner public API'));
assert.match(source,/GensCaptureScreenReturnV1/);
assert.match(source,/shell\.register\("capture",returnToPrimaryView\)/);
assert.doesNotMatch(source,/document\.|localStorage|sessionStorage|indexedDB|MutationObserver|setTimeout|setInterval|addEventListener|removeEventListener/,
  'new owner must not read DOM or persisted state or create maintenance timers');
assert.doesNotMatch(source,/DungeonCore|GensTactical|GensSurvival|CombatRuntime/,
  'new owner must stay inside Capture and Shell public boundary');
const calls=[];
const providers=new Map();
const ctx={console,GensShellScreenReturnV1:{register(id,fn){calls.push('register:'+id);providers.set(id,fn);return true}}};
ctx.globalThis=ctx;vm.createContext(ctx);vm.runInContext(source,ctx,{filename:'screen-return-v1.js'});
const api=ctx.GensCaptureScreenReturnV1;
assert.equal(api.status().installed,false);
assert.equal(api.returnToPrimaryView(),false,'inert owner before explicit installation');
assert.throws(()=>api.install({}),/missing binding/);
let session=false,context=false,enters=0;
const hooks={hasActiveSession:()=>session,isCaptureContext:()=>context,enterWorld:()=>{enters++}};
assert.equal(api.install(hooks),true);
assert.equal(api.install(hooks),true,'idempotent with same dependency binding');
assert.throws(()=>api.install({...hooks}),/already installed/,'cannot silently replace owner dependencies');
assert.deepEqual(calls,['register:capture'],'one and only one Shell provider registration');
assert.equal(providers.size,1);
assert.equal(providers.get('capture')(),false,'no session means no Capture return');
session=true;
assert.equal(providers.get('capture')(),false,'foreign family must not invoke Capture renderer');
context=true;
assert.equal(providers.get('capture')(),true,'active Capture must return to Hub');
assert.equal(enters,1);
api.dispose();
assert.equal(api.status().installed,false);
assert.equal(providers.get('capture')(),false,'disposed provider must be inert');
assert.equal(enters,1);
console.log(JSON.stringify({scenario:'Phase 9 Capture screen-return owner transfer',owner:'GensCaptureScreenReturnV1',providerCount:providers.size,hubCalls:enters,disposedInert:true,runtimeLoadedOnce:true}));
