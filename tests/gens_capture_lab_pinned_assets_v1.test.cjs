'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {execFileSync}=require('node:child_process');
const authority=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../docs/GENSRPG_CAPTURE_LAB_STAGED_FILES_2026-10-27.json'),'utf8'));
const PIN=authority.authoredAssetsPin;
const APPROVED_REPO=authority.authoredAssetsRepository;
const opts=(catalog,assetId,commit=PIN,usage='capture')=>({catalog,assetId,commit,approvedCommit:PIN,approvedRepository:APPROVED_REPO,usage});
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
 const a=api.resolveCaptureLabAsset(opts(catalog,id));
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
const atlas=api.resolveCaptureLabAsset(opts(catalog,loup.movement.assetId));
assert.equal(atlas.frameCount,12);
assert.equal(atlas.frameMs,80);
assert.equal(atlas.format,'sprite-strip');
const before=JSON.stringify(catalog);
api.resolveCaptureLabAsset(opts(catalog,loup.back.assetId));
assert.equal(JSON.stringify(catalog),before,'Core must never change author catalog');
assert.equal(api.dungeonHeroPath('dungeon_aldren'),'assets/dungeon/creatures/dng_aldren.png');
assert.equal(api.resolve({module:'dungeon',kind:'item',id:'dng_bow'}),'assets/dungeon/creatures/dng_bow.png');

const valid=(id)=>api.resolveCaptureLabAsset(opts(catalog,id));
assert.throws(()=>valid('pack:capture:missing'),/unknown|missing/i);
assert.throws(()=>api.resolveCaptureLabAsset(opts(catalog,cases[0],'global-assets')),/commit|sha/i);
assert.throws(()=>api.resolveCaptureLabAsset(opts(catalog,cases[0],'f'.repeat(40))),/approved|pinned|commit|sha/i);
assert.throws(()=>api.resolveCaptureLabAsset(opts(catalog,'core:arena-forest-01',PIN,'dungeon')),/usage|Capture|compatible/i);
assert.throws(()=>api.resolveCaptureLabAsset(opts({...catalog,storage:{...catalog.storage,repository:'other/fork'}},cases[0])),/repository/i);
assert.throws(()=>api.resolveCaptureLabAsset(opts({...catalog,assets:[...catalog.assets,catalog.assets.find(x=>x.id===cases[0])]},cases[0])),/duplicate/i);
assert.throws(()=>api.resolveCaptureLabAsset(opts({...catalog,assets:catalog.assets.map(x=>x.id===cases[0]?{...x,resource:{...x.resource,file:'../secrets'}}:x)},cases[0])),/path|file|unsafe/i);
assert.throws(()=>api.resolveCaptureLabAsset(opts({...catalog,assets:catalog.assets.map(x=>x.id===cases[0]?{...x,resource:{...x.resource,file:'capture/nope.svg'}}:x)},cases[0])),/mime|format|extension/i);
assert.throws(()=>api.resolveCaptureLabAsset(opts({...catalog,assets:catalog.assets.map(x=>x.id===cases[0]?{...x,compatibility:{uses:['editor']}}:x)},cases[0])),/compatible|capture|usage/i);
console.log(JSON.stringify({scenario:'Pinned Lab author visuals via sole Core asset resolver',assetsVerified:cases.length,commit:PIN,atlasFrames:atlas.frameCount,unchangedDungeon:true}));
