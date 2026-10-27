'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const PIN=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../docs/GENSRPG_CAPTURE_LAB_STAGED_FILES_2026-10-27.json'),'utf8')).authoredAssetsPin;
assert.match(PIN,/^[a-f0-9]{40}$/);
const labRoot=process.env.COMBAT_ASSETS_ROOT;
assert.ok(labRoot,'Pinned Lab visual catalog checkout required');
assert.equal(execFileSync('git',['-C',labRoot,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),PIN);
const source=fs.readFileSync(path.resolve(__dirname,'../assets/gensrpg/core/asset-resolver-v1.js'),'utf8');
const context={};vm.createContext(context);vm.runInContext(source,context);
const api=context.GensAssetResolverV1;
assert.equal(typeof api.resolveCaptureLabAsset,'function','central asset resolver must own Capture media');
const catalog=JSON.parse(fs.readFileSync(path.join(labRoot,'data/assets/catalog/global-visual-assets.v1.json'),'utf8'));
assert.equal(catalog.storage.repository,'slyen4425-cloud/GenSrpg_labo_combat_dynamique');
const readTransfer=rel=>JSON.parse(fs.readFileSync(path.resolve(process.env.COMBAT_LAB_ROOT,rel),'utf8'));
const loup=readTransfer('data/capture/showcase/crea-loup.capture-creature-transfer-v1.json').draft.presentation.visual;
const ash=readTransfer('data/capture/showcase/cap_fire_special_1.capture-skill-transfer-v1.json').draft.presentation.visual;
const cases=[
 loup.front.assetId,loup.back.assetId,loup.icon.assetId,
 loup.movement.assetId,loup.rangedAttack.assetId,loup.rangedAttackBack.assetId,
 ash.cast.assetId,ash.travel.assetId,ash.impact.assetId
];
for(const id of cases){
 const a=api.resolveCaptureLabAsset({catalog,assetId:id,commit:PIN});
 const original=catalog.assets.find(x=>x.id===id);
 assert.ok(original,id+' must exist in pinned official catalog');
 assert.equal(a.assetId,id);
 assert.equal(a.url,'https://raw.githubusercontent.com/'+catalog.storage.repository+'/'+PIN+'/assets/library/'+original.resource.file);
 assert.equal(a.mime,original.resource.mime);
 assert.equal(a.frameCount,original.resource.frameCount??null);
 assert.equal(a.frameMs,original.resource.frameMs??null);
 assert.equal(a.format,original.resource.format??null);
 assert.ok(a.url.includes('/'+PIN+'/'),'always immutable SHA, never a moving branch');
 assert.equal(a.url.includes('/global-assets/'),false);
}
const atlas=api.resolveCaptureLabAsset({catalog,assetId:loup.movement.assetId,commit:PIN});
assert.equal(atlas.frameCount,12);
assert.equal(atlas.frameMs,80);
assert.equal(atlas.format,'sprite-strip');
const before=JSON.stringify(catalog);
api.resolveCaptureLabAsset({catalog,assetId:loup.back.assetId,commit:PIN});
assert.equal(JSON.stringify(catalog),before,'Core must never change author catalog');
assert.equal(api.dungeonHeroPath('dungeon_aldren'),'assets/dungeon/creatures/dng_aldren.png');
assert.equal(api.resolve({module:'dungeon',kind:'item',id:'dng_bow'}),'assets/dungeon/creatures/dng_bow.png');

const valid=(id)=>api.resolveCaptureLabAsset({catalog,assetId:id,commit:PIN});
assert.throws(()=>valid('pack:capture:missing'),/unknown|missing/i);
assert.throws(()=>api.resolveCaptureLabAsset({catalog,assetId:cases[0],commit:'global-assets'}),/commit|sha/i);
assert.throws(()=>api.resolveCaptureLabAsset({catalog,assetId:cases[0],commit:'f'.repeat(40)}),/approved|pinned|commit|sha/i);
assert.throws(()=>api.resolveCaptureLabAsset({catalog,assetId:'core:arena-forest-01',commit:PIN,usage:'dungeon'}),/usage|Capture|compatible/i);
assert.throws(()=>api.resolveCaptureLabAsset({catalog:{...catalog,storage:{...catalog.storage,repository:'other/fork'}},assetId:cases[0],commit:PIN}),/repository/i);
assert.throws(()=>api.resolveCaptureLabAsset({catalog:{...catalog,assets:[...catalog.assets,catalog.assets.find(x=>x.id===cases[0])]},assetId:cases[0],commit:PIN}),/duplicate/i);
assert.throws(()=>api.resolveCaptureLabAsset({catalog:{...catalog,assets:catalog.assets.map(x=>x.id===cases[0]?{...x,resource:{...x.resource,file:'../secrets'}}:x)},assetId:cases[0],commit:PIN}),/path|file|unsafe/i);
assert.throws(()=>api.resolveCaptureLabAsset({catalog:{...catalog,assets:catalog.assets.map(x=>x.id===cases[0]?{...x,resource:{...x.resource,file:'capture/nope.svg'}}:x)},assetId:cases[0],commit:PIN}),/mime|format|extension/i);
assert.throws(()=>api.resolveCaptureLabAsset({catalog:{...catalog,assets:catalog.assets.map(x=>x.id===cases[0]?{...x,compatibility:{uses:['editor']}}:x)},assetId:cases[0],commit:PIN}),/compatible|capture|usage/i);
console.log(JSON.stringify({scenario:'Pinned Lab author visuals via sole Core asset resolver',assetsVerified:cases.length,commit:PIN,atlasFrames:atlas.frameCount,unchangedDungeon:true}));
