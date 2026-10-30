'use strict';
// Single-authority acceptance: the signed Lab main manifest, never a GenSrpg
// preview fixture, decides which official creature transfers enter the release.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

const root=path.resolve(__dirname,'..');
const lab=path.resolve(process.env.COMBAT_LAB_ROOT||'');
const site=path.resolve(process.env.CAPTURE_LAB_DELIVERY_SITE||'_site');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');

test('TDD: publisher uses the one pinned Lab author manifest instead of the frozen GenSrpg fixture',()=>{
 const source=read('tools/prepare_capture_lab_authored_preview.mjs');
 assert.match(source,/src\(['"]src\/catalogs\/capture-showcase-creature-presets-v1\.js['"]\)/,
  'Read the official author-owned catalog from the verified Lab checkout');
 assert.doesNotMatch(source,/settings\.authoredCreatureFiles\.map\(data\)/,
  'The GenSrpg preview fixture must never decide release creature availability');
});

test('every author-owned creature transfer in pinned Lab main is delivered, without a guessed alias',async()=>{
 assert.ok(process.env.COMBAT_LAB_ROOT&&process.env.CAPTURE_LAB_DELIVERY_SITE,
  'Require real pinned Lab checkout and final signed package, never a synthetic catalog');
 const official=await import(pathToFileURL(path.join(lab,
  'src/catalogs/capture-showcase-creature-presets-v1.js')).href);
 const paths=official.CAPTURE_SHOWCASE_CREATURE_PRESET_FILES_V1;
 assert.ok(Array.isArray(paths)&&paths.length>=2);
 assert.equal(new Set(paths).size,paths.length,'Lab author preset paths must be unique');
 const transferIds=paths.map(p=>{
  assert.match(p,/^data\/capture\/showcase\/[^/]+\.capture-creature-transfer-v1\.json$/,
   'Only original Lab author transfer files may enter the package');
  const transfer=JSON.parse(fs.readFileSync(path.join(lab,p),'utf8'));
  assert.equal(transfer.schema,'capture-creature-transfer-v1');
  return transfer.draft.id;
 });
 assert.equal(new Set(transferIds).size,transferIds.length,'Duplicate official species ID');
 const expected=[...transferIds].sort();
 const data='assets/gensrpg/capture/runtime-data/';
 const manifest=JSON.parse(fs.readFileSync(path.join(site,data,'delivery-manifest.json'),'utf8'));
 const inputs=JSON.parse(fs.readFileSync(path.join(site,data,'author-inputs.json'),'utf8'));
 assert.deepEqual(manifest.supportedCreatureIds,expected,
  'Promoting a new signed Combat main creature must not require editing a GenSrpg fixture');
 assert.deepEqual(inputs.creatureTransfers.map(x=>x.draft.id),expected,
  'Authored runtime inputs must follow the SAME Lab manifest without omission');
 assert.equal(manifest.productionActivated,false,'No premature activation of public gameplay');
});
