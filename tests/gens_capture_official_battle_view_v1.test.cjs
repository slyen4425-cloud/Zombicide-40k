'use strict';
// A pure contract check for the single user-visible view. The real Lab Core,
// sprites and saved Capture owners are exercised in the Chromium/Firefox test.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const target=path.join(root,'assets/gensrpg/capture/capture-official-battle-view-v1.mjs');
test('official battle view has one export, no second clock, damage or save authority',async()=>{
 const source=fs.readFileSync(target,'utf8');
 assert.doesNotMatch(source,/localStorage|sessionStorage|createCombatSession|createCombatRuntime|setInterval|setTimeout|window\.captureStartWildBattle\s*=/,
  'view must never own storage, combat simulation, scheduler or global handler');
 assert.match(source,/resolveCaptureLabAsset/,'only central immutable sprite resolver');
 const m=await import('../assets/gensrpg/capture/capture-official-battle-view-v1.mjs');
 assert.equal(typeof m.createCaptureOfficialBattleViewV1,'function');
 assert.deepEqual(Object.keys(m),['createCaptureOfficialBattleViewV1']);
 assert.throws(()=>m.createCaptureOfficialBattleViewV1({host:null,assetResolver:null}),/host/i);
});
