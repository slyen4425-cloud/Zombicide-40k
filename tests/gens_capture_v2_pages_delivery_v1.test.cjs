'use strict';
// Release acceptance for the NEW real Capture entry, never the removed Phase9 Hub.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {execFileSync}=require('node:child_process');
const test=require('node:test');
const root=path.resolve(__dirname,'..');
const site=path.resolve(process.env.CAPTURE_V2_SITE||'_site');
const combat=path.resolve(process.env.COMBAT_LAB_ROOT||'combat-lab');
const exploration=path.resolve(process.env.EXPLORATION_LAB_ROOT||'exploration-lab');
const pins=JSON.parse(fs.readFileSync(path.join(root,'assets/gensrpg/capture-v2/source-pins-v1.json')));
const manifest=JSON.parse(fs.readFileSync(path.join(site,'assets/gensrpg/capture-v2/delivery-manifest.json')));
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const sha=dir=>execFileSync('git',['-C',dir,'rev-parse','HEAD'],{encoding:'utf8'}).trim();
const source=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const published=rel=>fs.readFileSync(path.join(site,rel),'utf8');
const scripts=html=>[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(m=>m[1]);
test('Capture V2 release uses two exact approved main sources, never a parallel authority',()=>{
 assert.equal(manifest.schema,'gensrpg-capture-v2-main-only-transport-v1');
 assert.equal(manifest.legacyCaptureRuntime,false);
 assert.equal(pins.legacyCaptureRuntime,false);
 for(const [name,folder] of [['combat',combat],['exploration',exploration]]){
  assert.equal(manifest[name].ref,'main');
  assert.equal(pins[name].ref,'main');
  assert.equal(manifest[name].sha,pins[name].sha);
  assert.equal(manifest[name].sha,sha(folder));
  assert.equal(manifest[name].repository,pins[name].repository);
 }
 assert.deepEqual(manifest.featuresDeferred,pins.featuresDeferred);
 assert.ok(manifest.featuresDeferred.includes('encounters'));
 assert.ok(manifest.featuresDeferred.includes('XP'));
});
test('Exploration sees ONE official Combat-main Showcase bundle, never duplicate author rules',()=>{
 const output='vendor/exploration-lab/combat-preview/data/capture/showcase/encounter-bundle.v1.json';
 assert.ok(fs.existsSync(path.join(site,output)),
   'Real 2.5D bootstrap must receive the official Combat main Showcase at its exact native URL');
 assert.equal(manifest.combatEncounterBundle?.path,output);
 assert.equal(manifest.combatEncounterBundle?.owner,'combat');
 assert.equal(manifest.combatEncounterBundle?.sourceSha,pins.combat.sha);
 const bytes=fs.readFileSync(path.join(site,output));
 assert.equal(manifest.combatEncounterBundle.sha256,hash(bytes));
 assert.equal(manifest.combatEncounterBundle.size,bytes.length);
 const bundle=JSON.parse(bytes.toString('utf8'));
 assert.equal(bundle.schema,'capture-author-encounter-bundle-v1');
 assert.equal(bundle.version,1);
 assert.equal(bundle.authorSha,pins.combat.sha);
 assert.equal(bundle.engineSha,pins.combat.sha);
 assert.ok(Array.isArray(bundle.creatureTransfers)&&bundle.creatureTransfers.length>0);
 assert.ok(Array.isArray(bundle.skillTransfers)&&bundle.skillTransfers.length>0);
 assert.ok(bundle.creatureTransfers.every(x=>x.schema==='capture-creature-transfer-v1'));
 assert.ok(bundle.skillTransfers.every(x=>x.schema==='capture-skill-transfer-v1'));
});

test('both main-native tools retain their ORIGINAL bytes and browser sources',()=>{
 assert.ok(manifest.transport.length>=8,'missing native author/browser files');
 const visited=new Set();
 for(const record of manifest.transport){
  assert.ok(record.owner==='combat'||record.owner==='exploration');
  assert.ok(record.path.startsWith(pins[record.owner].path));
  assert.ok(!visited.has(record.path),'duplicate owner path');
  visited.add(record.path);
  const rel=record.path.slice(pins[record.owner].path.length);
  const original=fs.readFileSync(path.join(record.owner==='combat'?combat:exploration,rel));
  const copy=fs.readFileSync(path.join(site,record.path));
  assert.equal(record.size,copy.length,record.path);
  assert.equal(record.sha256,hash(copy),record.path);
  assert.deepEqual(copy,original,'no replicated or altered native owner: '+record.path);
 }
 for(const rel of [
  'vendor/combat-lab/examples/dom-demo/capture-editor-v2.html',
  'vendor/combat-lab/examples/dom-demo/bestiary.html',
  'vendor/combat-lab/src/ui/capture-combat-preview-v1.js',
  'vendor/exploration-lab/index.html',
  'vendor/exploration-lab/builder.html',
  'vendor/exploration-lab/sculpt-lab.html',
  'vendor/exploration-lab/play.html',
  'vendor/exploration-lab/src/play/exploration-play-session.js',
  'vendor/exploration-lab/src/play/exploration-play-entry.js',
  'vendor/exploration-lab/src/sculpt-lab-main.js',
  'vendor/exploration-lab/world-assembler.html',
  'vendor/exploration-lab/src/main.js'
 ])assert.ok(visited.has(rel),'missing native contract: '+rel);
});
test('Aventure loads byte-identical public-certified Combat visuals, never a floating catalogue',()=>{
 const pin=JSON.parse(fs.readFileSync(path.join(root,
  'approved-public-preview/tools/capture_v2_pages_preview_pin.json'),'utf8'));
 const visual=pin.officialVisuals;
 assert.equal(pin.schema,'gensrpg-capture-v2-pages-source-pin-v1');
 assert.equal(visual.repository,'slyen4425-cloud/GenSrpg_labo_combat_dynamique');
 assert.equal(visual.ref,'global-assets');
 assert.match(visual.sha,/^[0-9a-f]{40}$/);
 assert.equal(sha(path.join(root,'approved-adventure-visuals')),visual.sha);
 const file='data/assets/catalog/global-visual-assets.v1.json';
 const sourceBytes=fs.readFileSync(path.join(root,'approved-adventure-visuals',file));
 const publicBytes=fs.readFileSync(path.join(site,
  'vendor/exploration-lab/capture-assets',file));
 assert.deepEqual(publicBytes,sourceBytes,
  'Aventure must fetch the same immutable visual catalog as the public certified Bestiary');
 const catalog=JSON.parse(publicBytes.toString('utf8'));
 assert.equal(catalog.catalogId,'gensrpg-global-visual-assets');
 assert.ok(catalog.assets.length>0);
});
test('official published creature front portraits are physically present, immutable and not duplicated',()=>{
 const catalog=JSON.parse(fs.readFileSync(path.join(site,
  'vendor/exploration-lab/capture-assets/data/assets/catalog/global-visual-assets.v1.json'),'utf8'));
 const bundle=JSON.parse(fs.readFileSync(path.join(site,
  'vendor/exploration-lab/combat-preview/data/capture/showcase/encounter-bundle.v1.json'),'utf8'));
 const byId=new Map(catalog.assets.map(asset=>[asset.id,asset]));
 const expected=new Set();
 for(const transfer of bundle.creatureTransfers){
  const id=transfer?.draft?.presentation?.visual?.front?.assetId;
  const asset=byId.get(id);
  if(!asset||asset.mediaType!=='image'||
     !['sprite','portrait'].includes(asset.assetType)||
     Number(asset.resource?.frameCount??1)!==1)continue;
  const file=asset.resource?.file;
  const allowedPath = /^(?:capture|core)\/[A-Za-z0-9_./-]+\.(?:png|webp|jpg|jpeg)$/i;
  if(typeof file!=='string'||!allowedPath.test(file)||
   file.split('/').includes('..'))throw Error('Unsafe published portrait resource');
  expected.add(file);
 }
 assert.ok(expected.size>0,'published Bestiary must have at least one ready portrait');
 const mediaRoot=path.join(site,'vendor/exploration-lab/capture-assets/assets/library');
 for(const file of expected){
  const original=fs.readFileSync(path.join(root,'approved-adventure-visuals/assets/library',file));
  const shipped=fs.readFileSync(path.join(mediaRoot,file));
  assert.ok(shipped.byteLength>0,'published portrait must not be an empty placeholder');
  assert.deepEqual(shipped,original,'published Combat portrait must match its immutable author');
 }
 const list=dir=>fs.existsSync(dir)?fs.readdirSync(dir,{recursive:true,withFileTypes:true})
  .filter(item=>item.isFile()).map(item=>item.name):[];
 assert.ok(list(mediaRoot).length<=Math.max(expected.size*2,expected.size+8),
  'no full duplicated asset library may be shipped for a small portrait selection');
});

test('actual Pages root has ONLY Capture V2 entry and its existing four-mode Shell',()=>{
 const page=published('index.html');
 const origin=source('index.html');
 const before=scripts(origin),after=scripts(page);
 for(const list of [before,after]){
  assert.equal(list.filter(s=>/^assets\/gensrpg\/capture\//.test(s)).length,0,
   'legacy Capture script cannot be active in the actual site');
  assert.equal(list.filter(s=>s==='assets/gensrpg/capture-v2/identity-v1.js').length,1);
  assert.equal(list.filter(s=>s==='assets/gensrpg/capture-v2/shell-entry-v1.js').length,1);
 }
 assert.equal(page.includes('id="captureGameHub"'),false);
 assert.ok(page.includes('assets/gensrpg/shell/module-launch-final-authority-v1.js'));
 for(const module of [
  'assets/gensrpg/survival/entry-v1.js',
  'assets/gensrpg/dungeon/entry-v1.js',
  'assets/gensrpg/pvp/shell-composition-v1.js'
 ])assert.ok(after.some(s=>s.startsWith(module)),'unrelated mode lost: '+module);
 assert.ok(!fs.existsSync(path.join(site,'assets/gensrpg/capture/runtime-data')));
 assert.ok(!fs.existsSync(path.join(site,'capture-world-2v2-test.html')));
 assert.ok(!fs.existsSync(path.join(root,'vendor/combat-lab')));
 assert.ok(!fs.existsSync(path.join(root,'vendor/exploration-lab')));
});
test('Capture V2 does not mutate the user PWA cache or persistent profiles',()=>{
 const sw=source('service-worker.js');
 assert.ok(!sw.includes('vendor/combat-lab/'));
 assert.ok(!sw.includes('vendor/exploration-lab/'));
 assert.ok(!sw.includes('assets/gensrpg/capture-v2/delivery-manifest.json'));
 const v2=source('assets/gensrpg/capture-v2/shell-entry-v1.js');
 assert.doesNotMatch(v2,/localStorage|sessionStorage|indexedDB|captureStartBattleAutomatic|captureWorldState|gen(?:s|srpg)_capture_world/i);
 assert.match(v2,/shell\.register\("capture",start\)/);
});

test('native preview artifact is self-contained, not rescued by the GitHub checkout',()=>{
  // A local server that falls back to the source tree hides missing deployed
  // files. Each first-party entry must be physically inside the _site tree.
  for(const required of [
    'index.html','service-worker.js','manifest.webmanifest',
    'assets/gensrpg/capture-v2/identity-v1.js',
    'assets/gensrpg/capture-v2/shell-entry-v1.js',
    'assets/gensrpg/shell/module-launch-final-authority-v1.js',
    'assets/dungeon/dungeon-room-creator-100.js',
    'vendor/exploration-lab/sculpt-lab.html',
    'vendor/exploration-lab/play.html',
    'vendor/exploration-lab/src/play/exploration-play-session.js',
    'vendor/combat-lab/examples/dom-demo/capture-editor-v2.html'
  ])assert.ok(fs.statSync(path.join(site,required)).isFile(),
    'Native preview must physically ship '+required);
  for(const raw of scripts(published('index.html'))){
    const rel=raw.split(/[?#]/,1)[0];
    if(!rel.startsWith('assets/'))continue;
    assert.ok(fs.existsSync(path.join(site,rel)),
      'Native preview cannot fetch this missing source from local checkout: '+rel);
  }
  assert.ok(!fs.existsSync(path.join(site,'assets/gensrpg/capture')),
    'The retired Capture owner must never enter the artifact');
});
