'use strict';
// Release gate for one physically isolated HTTPS preview from the EXISTING
// GitHub Pages publisher. Never substitute html-preview or the old Capture.
// All checks read the assembled _site produced by the real publisher.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const site=path.resolve(process.env.GENSRPG_PAGES_SITE||'_site');
const rel='preview/capture-v2-pr225';
const trial=path.join(site,rel);
const previewPin=JSON.parse(fs.readFileSync(path.join(root,'tools/capture_v2_pages_preview_pin.json')));
const previewSha=previewPin.sha;
const publisherSha=process.env.GITHUB_SHA;
assert.match(publisherSha||'',/^[a-f0-9]{40}$/,'Pages build release SHA is required');
// Compare the release against its ONE immutable approved candidate,
 // not a second hardcoded list of older Lab SHAs that becomes stale.
const candidateSources=JSON.parse(fs.readFileSync(
 path.join(trial,'assets/gensrpg/capture-v2/source-pins-v1.json')));
const combatSha=candidateSources.combat.sha;
const explorationSha=candidateSources.exploration.sha;
const sha256=buf=>crypto.createHash('sha256').update(buf).digest('hex');
const read=(base,p)=>fs.readFileSync(path.join(base,p));
const json=(base,p)=>JSON.parse(read(base,p));
const required=(base,p)=>assert.ok(fs.statSync(path.join(base,p)).isFile(),p);
test('production root remains intact and preview exists ONLY in its isolated Pages subdirectory',()=>{
  for(const f of ['index.html','service-worker.js','manifest.webmanifest'])required(site,f);
  for(const f of ['index.html','service-worker.js','manifest.webmanifest','assets/gensrpg/capture-v2/shell-entry-v1.js',
   'assets/gensrpg/capture-v2/source-pins-v1.json','assets/gensrpg/capture-v2/adventure.html',
   'vendor/combat-lab/examples/dom-demo/capture-editor-v2.html',
   'vendor/exploration-lab/sculpt-lab.html','vendor/exploration-lab/npc-editor.html','vendor/exploration-lab/play.html',
   'vendor/exploration-lab/src/sculpt-lab-main.js'])required(trial,f);
  const provenance=json(trial,'release-provenance.v1.json');
  assert.equal(provenance.schema,'gensrpg-capture-v2-isolated-pages-preview-v1');
  assert.equal(provenance.source.commit,previewSha);
  assert.equal(provenance.publisherCommit,publisherSha,'public preview PWA must update for every Pages SHA');
  assert.equal(provenance.source.ref,'approved-immutable-commit');
  assert.equal(provenance.publicPath,'/'+rel+'/');
  assert.equal(provenance.productionRootSha256,sha256(read(site,'index.html')),
    'publisher must never replace production root with the draft Capture app');
  assert.equal(provenance.previewIndexSha256,sha256(read(trial,'index.html')));
  assert.notEqual(provenance.productionRootSha256,provenance.previewIndexSha256);
  assert.equal(provenance.legacyCaptureRuntime,false);
  const html=read(trial,'index.html').toString('utf8');
  assert.match(html,/assets\/gensrpg\/capture-v2\/shell-entry-v1\.js/);
  assert.doesNotMatch(html,/<script[^>]+src=["']assets\/gensrpg\/capture\//);
  assert.equal(fs.existsSync(path.join(trial,'assets/gensrpg/capture/runtime-data')),false);
});
test('author PNG is transported only inside Capture, byte-identical to certified Combat main',()=>{
 const png='assets/library/capture/file_0000000089ec81f4a7bdfd03220f487c.png';
 const shipped='vendor/combat-lab/'+png;
 required(trial,shipped);
 const image=read(trial,shipped);
 assert.equal(image.length,3195270);
 assert.equal(crypto.createHash('sha1')
  .update('blob '+image.length+String.fromCharCode(0)).update(image).digest('hex'),
  '787a24def6d8c1865f337ce6d5fd485a7274bf02',
  'the public image must be the approved author file, not a resized or stale substitute');
 const manifest=json(trial,'assets/gensrpg/capture-v2/delivery-manifest.json');
 const media=manifest.transport.filter(x=>x.path===shipped);
 assert.equal(media.length,1,'one owner, one image transport');
 assert.equal(media[0].role,'capture-loading-art');
 assert.equal(media[0].size,image.length);
 const shell=read(trial,'assets/gensrpg/capture-v2/shell-entry-v1.js').toString('utf8');
 const css=read(trial,'assets/gensrpg/capture-v2/adventure-style-v1.css').toString('utf8');
 assert.ok(shell.includes(shipped));
 assert.ok(css.includes('../../../'+shipped));
 assert.match(css,/background-size:contain,cover/);
 assert.equal(fs.existsSync(path.join(site,'assets/library/capture/file_0000000089ec81f4a7bdfd03220f487c.png')),false,
  'the image must not escape the Capture preview to the global root');
});

test('preview PWA never shares the production cache namespace or cleanup authority',()=>{
 const production=read(site,'service-worker.js').toString('utf8');
 const candidate=read(trial,'service-worker.js').toString('utf8');
 assert.match(production,/const CACHE_NAME = "gensrpg-cache-/,
   'the existing root worker stays byte-for-byte the production owner');
 assert.match(candidate,/const CACHE_NAME = "gensrpg-preview-capture-v2-[0-9a-f]{12}";/,
   'preview has a distinct deterministic cache namespace');
 assert.match(candidate,/name\.startsWith\("gensrpg-preview-capture-v2-"\)\s*&&\s*name!==CACHE_NAME/,
   'preview worker must never delete production PWA cache names during activation');
 assert.doesNotMatch(candidate,/name\.startsWith\("gensrpg-cache-"\)/,
   'unbounded production cache cleanup is forbidden from an isolated preview');
 const manifest=json(trial,'manifest.webmanifest');
 assert.equal(manifest.start_url,'./');
 assert.equal(manifest.scope,'./');
 assert.equal(manifest.id,'./',
   'preview PWA identity must remain relative to its isolated public path');
 assert.equal(json(trial,'release-provenance.v1.json').previewServiceWorkerSha256,
   sha256(read(trial,'service-worker.js')));
 assert.equal(json(trial,'release-provenance.v1.json').productionServiceWorkerSha256,
   sha256(read(site,'service-worker.js')));
});
test('actual preview service worker activation cannot delete production caches',async()=>{
 // Execute the actual SW activate callback, not a copy of its cleanup
 // algorithm. The minimal CacheStorage fixture exposes a collision with the
 // installed stable PWA on the SAME origin.
 const vm=require('node:vm');
 const worker=read(trial,'service-worker.js').toString('utf8');
 const current='gensrpg-preview-capture-v2-'+publisherSha.slice(0,12);
 const previous='gensrpg-preview-capture-v2-previous';
 const production='gensrpg-cache-16.78.118-capture-v2-scoped-cache-cleanup';
 const keys=[production,current,previous];
 let activation=null,waited=null;
 const deleted=[];
 const scope={
   self:{
     addEventListener(name,listener){if(name==='activate')activation=listener;},
     clients:{claim:async()=>{}},registration:{scope:'https://example.invalid/preview/capture-v2-pr225/'},
     skipWaiting(){}
   },
   caches:{
     keys:async()=>keys.slice(),
     delete:async name=>{deleted.push(name);return true;}
   },
   console
 };
 vm.runInNewContext(worker,scope,{filename:'actual-staged-preview-service-worker.js'});
 assert.equal(typeof activation,'function','real preview SW must install its activation listener');
 activation({waitUntil(promise){waited=promise;}});
 assert.ok(waited&&typeof waited.then==='function');
 await waited;
 assert.deepEqual(deleted,[previous],
   'preview SW may remove old preview cache versions only; installed production stays untouched');
});
test('exact official Lab main files and derived Showcase have one owner and verified checksums',()=>{
  const source=json(trial,'assets/gensrpg/capture-v2/source-pins-v1.json');
  const delivery=json(trial,'assets/gensrpg/capture-v2/delivery-manifest.json');
  const provenance=json(trial,'release-provenance.v1.json');
  assert.equal(source.schema,'gensrpg-capture-v2-official-main-pins-v1');
  assert.equal(source.legacyCaptureRuntime,false);
  assert.equal(source.combat.ref,'main');
  assert.equal(source.exploration.ref,'main');
  assert.ok(Number.isSafeInteger(source.combat.certifiedCiRun)&&source.combat.certifiedCiRun>0);
  assert.ok(Number.isSafeInteger(source.exploration.certifiedCiRun)&&source.exploration.certifiedCiRun>0);
  assert.equal(source.combat.sha,combatSha);
  assert.equal(source.exploration.sha,explorationSha);
  assert.equal(delivery.combat.sha,combatSha);
  assert.equal(delivery.exploration.sha,explorationSha);
  assert.equal(provenance.combat.sha,combatSha);
  assert.equal(provenance.exploration.sha,explorationSha);
  assert.equal(delivery.legacyCaptureRuntime,false);
  assert.equal(delivery.combatEncounterBundle.owner,'combat');
  const bundle=delivery.combatEncounterBundle;
  const bytes=read(trial,bundle.path);
  assert.equal(bundle.sourceSha,combatSha);
  assert.equal(bundle.sha256,sha256(bytes));
  const payload=JSON.parse(bytes.toString('utf8'));
  assert.equal(payload.authorSha,combatSha);
  assert.equal(payload.engineSha,combatSha);
  const authors=new Map(payload.creatureTransfers.map(record=>[record.draft?.id,record]));
  assert.equal(authors.size,payload.creatureTransfers.length,
    'official encounter bundle must not duplicate Showcase identities');
  for(const [id,element,icon] of [
    ['Vipfer','steel','pack:capture:creature-vipfer-icon-01'],
    ['polocendre','fire','pack:capture:creature-cheval-de-feu-icon-v1']
  ]){
    const creature=authors.get(id);
    assert.ok(creature,'new author species missing in the actual shipped encounter bundle: '+id);
    assert.deepEqual(creature.draft.elements,[element]);
    assert.equal(creature.draft.capture.rarity,'mythic');
    assert.equal(creature.draft.presentation.visual.icon?.assetId,icon);
    assert.equal(creature.loadout.slots.length,5);
  }
  const polocendre=authors.get('polocendre');
  const newSkills=[
    'polocendre-charge','polocendre-trainee-feu','polocendre-coup-sabot',
    'cap_fire_atk_5','polocendre-ruee-explosive'
  ];
  assert.deepEqual(polocendre.draft.skillIds,newSkills,
    'published PWA must equip Polocendre with its four authored skills and the single existing Vague incendiaire');
  assert.deepEqual(polocendre.loadout.slots.map(slot=>slot.skillId),newSkills,
    'published PWA must preserve the exact five combat slots without fallback to demo fireball');
  for(const skillId of newSkills.filter(id=>id.startsWith('polocendre-'))){
    const transfer='vendor/combat-lab/data/capture/showcase/'+skillId+'.capture-skill-transfer-v1.json';
    const saved=JSON.parse(read(trial,transfer).toString('utf8'));
    assert.equal(saved.draft.id,skillId,'Combat owns the canonical authored ability '+skillId);
  }
  const fireWave=JSON.parse(read(trial,
    'vendor/combat-lab/data/capture/showcase/cap_fire_atk_5.capture-skill-transfer-v1.json').toString('utf8')).draft;
  assert.equal(fireWave.id,'cap_fire_atk_5','Vague incendiaire must preserve its canonical ID');
  assert.equal(fireWave.presentation.visual.icon.assetId,'pack:capture:icon-skill-fireball-01',
    'PWA must ship the fireball skill icon, not the old dome');
  assert.equal(fireWave.presentation.visual.travel.assetId,'pack:capture:sprite-fire-bubble-expansion-01');
  assert.equal(fireWave.definition.effects[0].amount,25);
  const horse=polocendre.draft.presentation.visual;
  assert.deepEqual(['movement','movementBack','rangedAttack','rangedAttackBack']
    .map(key=>horse[key]?.frameCount),[6,7,5,5],
    'PWA must ship the approved horse animation frame counts');
  const recorded=new Set();
  for(const record of delivery.transport){
    assert.match(record.path,/^vendor\/(combat-lab|exploration-lab)\//);
    assert.ok(!record.path.includes('..'));
    assert.ok(!recorded.has(record.path),'duplicate native owner transport');
    recorded.add(record.path);
    assert.equal(record.sha256,sha256(read(trial,record.path)),record.path);
  }
  assert.ok(delivery.transport.length>=8);
});
test('Capture editor combat previews reuse the ONE signed Lab transport with music and SFX',()=>{
 const shell=read(trial,'assets/gensrpg/capture-v2/shell-entry-v1.js').toString('utf8');
 const canonical='vendor/exploration-lab/combat-preview/';
 for(const item of ['creature','skills','combat','music','bestiary']){
  const target=item==='bestiary'?'bestiary.html':'capture-editor-v2.html?tab='+item;
  assert.ok(shell.includes('path:"'+canonical+'examples/dom-demo/'+target+'"'),
   'Capture '+item+' must use the already shipped Combat+audio owner');
 }
 assert.equal(shell.includes('path:"vendor/combat-lab/examples/dom-demo/'),false,
  'the light editor-only package does not own any active Capture editor route');
 for(const name of ['capture-editor-v2.html','bestiary.html']){
  const owner='examples/dom-demo/'+name;
  assert.equal(sha256(read(trial,'vendor/combat-lab/'+owner)),
   sha256(read(trial,canonical+owner)),
   'one SHA-pinned Combat editor source must be reused, never modified or forked: '+name);
 }
 // Preserve the EXACT original Combat JS in the verified light transport.
 // The PWA's single generated editor route differs by ONLY a nonblocking
 // fullscreen-await seam; engine, rules, media and authored data stay intact.
 const original=read(trial,'vendor/combat-lab/examples/dom-demo/capture-editor-v2.js').toString('utf8');
 const staged=read(trial,canonical+'examples/dom-demo/capture-editor-v2.js').toString('utf8');
 const blocked='    await displayModePromise;\n';
 const nonblocking='    // PWA Android: fullscreen can settle only after system Back. Never gate battle launch.\n'+
  '    void displayModePromise.catch(error => console.warn("PWA fullscreen unavailable", error));\n';
 assert.equal(staged.includes(blocked),false,'PWA must not await Android fullscreen to open the fight');
 assert.equal(staged.split(nonblocking).length,2,'one and only one PWA launch integration seam');
 assert.equal(staged.replace(nonblocking,blocked),original,
  'the staged PWA editor must be identical to the official Combat source except the launch seam');
 const bank=canonical+'assets/runtime/';
 for(const file of [
  'audio/music-v1/battle-01-cb4ed87d.mp3',
  'audio/music-v1/victory-01-0b52ce2b.mp3',
  'audio-test/fire_cast.mp3',
  'audio-test/melee_impact.mp3',
  'audio-test/teleport.mp3'
 ]){
  required(trial,bank+file);
  assert.ok(read(trial,bank+file).length>100,'Official audio is empty: '+file);
 }
 const privateDir=path.join(trial,bank,'audio/private-v1');
 assert.ok(fs.readdirSync(privateDir).some(name=>name.endsWith('.mp3')),
  'private creature and skill SFX must survive the release packaging');
 assert.equal(fs.existsSync(path.join(trial,'vendor/combat-lab/assets/runtime/audio/private-v1')),false,
  'do not add a second private sound bank to the lightweight editor package');
});

test('PWA carries exact cleaned bridge and stair binaries with stable native IDs',()=>{
 const base='vendor/exploration-lab/assets/exploration/objects/';
 const bridges=json(trial,base+'bridges/manifest.v1.json');
 const stairs=json(trial,base+'stairs/manifest.v1.json');
 const cleaned=bridges.files.filter(x=>['wood_rustic','castle'].includes(x.family)&&x.assetId.includes('_2p5d.'));
 assert.equal(cleaned.length,8);
 for(const entry of cleaned){
  assert.equal(entry.runtimeProfile,'mobile-webp-512x512-lossless-v75',entry.assetId);
  const b=read(trial,'vendor/exploration-lab/'+entry.path);
  assert.equal(b.length,entry.bytes,entry.assetId);
  assert.equal(sha256(b),entry.sha256,entry.assetId);
  assert.equal(b.toString('ascii',0,4),'RIFF');
  assert.equal(b.toString('ascii',8,12),'WEBP');
 }
 for(const variant of ['front','oblique','side','side_alt']){
  const assetId='object.stairs.earth_log_path_2p5d.'+variant+'.01';
  const found=stairs.files.filter(x=>x.assetId===assetId);
  assert.equal(found.length,1,'exactly one '+assetId);
  const b=read(trial,'vendor/exploration-lab/'+found[0].path);
  assert.equal(b.length,found[0].bytes);
  assert.equal(sha256(b),found[0].sha256);
  assert.equal(b.toString('ascii',0,4),'RIFF');
  assert.equal(b.toString('ascii',8,12),'WEBP');
 }
 const adapter=read(trial,'vendor/exploration-lab/src/assets/world-object-asset-adapter.js').toString('utf8');
 const catalog=read(trial,'vendor/exploration-lab/src/objects/object-definition-catalog.js').toString('utf8');
 assert.ok(adapter.includes("'object.stairs.earth_log_path_2p5d.side_alt.01'"));
 assert.ok(catalog.includes("id: 'side_alt', label: 'Côté · Profil A'"));
 assert.equal(fs.existsSync(path.join(trial,'assets/exploration/objects/bridges')),false,
  'no competing bridge visual directory outside native Exploration owner');
 assert.equal(fs.existsSync(path.join(trial,'ponts_nettoyes_labo_exploration_2026-11-22.zip')),false);
});

test('native World Builder map exporter and in-game 200% dezoom are shipped once from certified Exploration',()=>{
 const source=json(trial,'assets/gensrpg/capture-v2/source-pins-v1.json');
 assert.equal(source.exploration.sha,'1553c0e8f9bab89f5c1badfa64c5d41fb75cff73',
   'ship the certified 22 Nov Exploration main with cleaned bridges and both stair side profiles');
 const helper='vendor/exploration-lab/src/builder/world-assembler-map-preset-export-v1.js';
 required(trial,helper);
 const page=read(trial,'vendor/exploration-lab/world-assembler.html').toString('utf8');
 const app=read(trial,'vendor/exploration-lab/src/builder/world-assembler-main.js').toString('utf8');
 const exported=read(trial,helper).toString('utf8');
 const library=read(trial,'vendor/exploration-lab/src/builder/sculpt-map-preset-library.js').toString('utf8');
 const projection=read(trial,'vendor/exploration-lab/src/render/sculpt-camera-projection.js').toString('utf8');
 const game=read(trial,'vendor/exploration-lab/src/sculpt-lab-main.js').toString('utf8');
 assert.match(page,/id="export-selected-map-preset"/);
 assert.match(page,/id="export-world"/);
 assert.match(app,/exportWorldAreaAsMapPresetV1\(draft,selectedId\)/);
 assert.match(exported,/createSculptMapPreset\(scene/);
 assert.match(library,/decorativeFringe/);
 assert.match(projection,/SCULPT_PLAY_CAMERA_ZOOM=Object\.freeze\(\{min:\.5,max:2\.4,default:1\.75\}\)/);
 assert.match(game,/navigationTesting\?sculptPlayableCameraZoom\(requestedZoom\)/);
 assert.match(game,/navigationTesting\?sculptPlayableCameraZoom\(desiredZoom\)/);
 assert.doesNotMatch(page,/id="world-map-preset-select"/);
});

test('south 2.5D renderer is BYTE-IDENTICAL to the certified Exploration main (no fork)',()=>{
 const provenance=json(trial,'release-provenance.v1.json');
 const owner=provenance.explorationSouthRenderer;
 const official='vendor/exploration-lab/src/render/sculpt-height-renderer.js';
 assert.equal(owner?.path,official);
 assert.equal(owner?.repository,'slyen4425-cloud/laboratoire_dynamique_exploration-');
 // The old pinned Explorer needed one exact renderer patch; newer official
 // Explorer already contains it and must remain byte-identical at release.
 assert.equal(owner?.mainSha,explorationSha==='13bbd8230d8dfcef612586974b2dcb54e18e16c4'
   ? 'ea336f885fa7fb7e1ea43ebf95c58504874d852a' : explorationSha);
 const pixelExplorationSha='1efa72151701a144687fbece77aad8e4a1052d42';
 const warmupAudioExplorationSha='42d0f9608c17f6d56d65038ac895564252126d5e';
 const crossfadeExplorationSha='e0175760e686c4c911e0b91d5614aab2d0b708fe';
 const authorExportCameraExplorationSha='f17e4aea75a49da42f7c9b945cc26e8934fc1424';
 const fringeRoadExplorationSha='0128e69c290b43014a5a899804c588d805e2b4b0';
 const recoveredWorldExplorationSha='da4420cef7ff4666d93fb492f246518e0c6803f9';
 const stairsExplorationSha='2cb75a601cadcd26d33ffdd093a07badaaa9e86f';
  const certifiedNov21ExplorationSha='abe51d7f0634684d29772e0730719b2eb347fa98';
  const certifiedNov22NpcExplorationSha='c3b69270919923d130c74af1a8577fa40476eff2';
  const certifiedNov22CleanedAssetsSha='de86b04f35f96df3783f1f953c7f138bc44a28f8';
  const certifiedNov22NpcInlineSha='1553c0e8f9bab89f5c1badfa64c5d41fb75cff73';
 // The stair fix changes navigation and sprite presentation only. Its
 // canonical south terrain renderer remains byte-identical to recoveredWorld.
 const expectedOfficialRendererBlob=[recoveredWorldExplorationSha,stairsExplorationSha,certifiedNov21ExplorationSha,certifiedNov22NpcExplorationSha,certifiedNov22CleanedAssetsSha,certifiedNov22NpcInlineSha].includes(explorationSha)
   ?'6c101756bdf9c58a9ae8cf3fe104e49575145748'
   :explorationSha===fringeRoadExplorationSha
    ?'1a0869afc5b258e8f403f43cd26b3f417a6c8786'
    :[pixelExplorationSha,warmupAudioExplorationSha,crossfadeExplorationSha,authorExportCameraExplorationSha].includes(explorationSha)
    ?'53545186122ce963f66cdb15172d8b145728caa7'
    :'e20f6ccf4c717574f0e0260bc481c839e66444f8';
 assert.equal(owner?.officialBlobSha,expectedOfficialRendererBlob);
 assert.equal(provenance.exploration.sha,explorationSha,
   'the complete native Exploration checkout must match the source pin');
 assert.ok(['13bbd8230d8dfcef612586974b2dcb54e18e16c4',
   '4df91fdc4d5eedcf421e4767e175cba80e469bb1',pixelExplorationSha,warmupAudioExplorationSha,crossfadeExplorationSha,authorExportCameraExplorationSha,fringeRoadExplorationSha,recoveredWorldExplorationSha,stairsExplorationSha,certifiedNov21ExplorationSha,certifiedNov22NpcExplorationSha,certifiedNov22CleanedAssetsSha,certifiedNov22NpcInlineSha].includes(explorationSha),
   'release must reject unreviewed Exploration main SHAs');
 const bytes=read(trial,official);
 const gitBlob=crypto.createHash('sha1')
   .update('blob '+bytes.length+String.fromCharCode(0)).update(bytes).digest('hex');
 assert.equal(gitBlob,owner.officialBlobSha,
   'released south renderer differs from official Exploration main owner');
 const text=bytes.toString('utf8');
 assert.match(text,/ctx\.fillStyle=!drawOuterSouthRim&&pattern\?pattern:baseColor;/);
 assert.doesNotMatch(text,/ctx\.fillStyle=baseColor;ctx\.fillRect\(0,0,totalWidth,totalHeight\)/,
  'the old flat-color south backing MUST NOT be present in published PWA');
 // All native scene entry points already consume this one renderer path.
 const sculpt=read(trial,'vendor/exploration-lab/src/sculpt-lab-main.js').toString('utf8');
 assert.match(sculpt,/drawOuterSouthRim:false/);
 assert.match(sculpt,/drawDecorativeFringeTerrain\(\)/);
 if([fringeRoadExplorationSha,recoveredWorldExplorationSha,stairsExplorationSha,certifiedNov21ExplorationSha,certifiedNov22NpcExplorationSha,certifiedNov22CleanedAssetsSha,certifiedNov22NpcInlineSha].includes(explorationSha)){
  assert.match(sculpt,/drawDecorativeFringeObjects\('back'\)/);
  assert.match(sculpt,/drawDecorativeFringeObjects\('front'\)/);
  const north=sculpt.indexOf("drawDecorativeFringeObjects('back');");
  const hero=sculpt.indexOf('drawNavigationActor();',north);
  const south=sculpt.indexOf("drawDecorativeFringeObjects('front');",hero);
  assert.ok(north>=0&&hero>north&&south>hero,
   'a southern tree must layer in front of the player but own no collision');
  if([recoveredWorldExplorationSha,stairsExplorationSha,certifiedNov21ExplorationSha,certifiedNov22NpcExplorationSha,certifiedNov22CleanedAssetsSha,certifiedNov22NpcInlineSha].includes(explorationSha)){
   assert.doesNotMatch(text,/ctx.fillRect\(rect.x,rect.y,rect.width,rect.height\)/,
    'no per-tile translucent altitude paint on a raised road or grass');
   assert.match(text,/for\(const \{side,opacity\} of info.contactShadows\)/,
    'actual cliff shadows remain after removing the tint');
   assert.match(sculpt,/downloadWorldSculptRecovery\(/);
   assert.match(sculpt,/worldLinkedBuildingWouldDisappear\(/);
   const adapter=read(trial,'vendor/exploration-lab/src/builder/sculpt-world-area-link.js').toString('utf8');
   assert.match(adapter,/snapshotSculptWorldAreaForRecovery\(/);
   assert.match(sculpt,/world-recovery\.json/);
  }else{
   assert.match(text,/const rect=sculptPaintCellBoundsV1\(ctx,x,y,w,h\)/);
   assert.match(text,/ctx.fillRect\(rect.x,rect.y,rect.width,rect.height\)/);
  }
  assert.doesNotMatch(text,/ctx.fillRect\(x-1,y-1,w\+2,h\+2\)/);
 }
});

test('published preview carries exactly one item library, healing potions and PNJ merchant link',()=>{
 const shell=read(trial,'assets/gensrpg/capture-v2/shell-entry-v1.js').toString('utf8');
 const contract=read(trial,'assets/gensrpg/capture-v2/adventure-contract-v1.mjs').toString('utf8');
 const app=read(trial,'assets/gensrpg/capture-v2/adventure-app-v1.mjs').toString('utf8');
 const economy=read(trial,'assets/gensrpg/capture-v2/adventure-economy-editor-v1.mjs').toString('utf8');
 const html=read(trial,'assets/gensrpg/capture-v2/adventure.html').toString('utf8');
 const explorer=read(trial,'vendor/exploration-lab/src/actors/npc-editor-v1.js').toString('utf8');
 assert.match(shell,/label:"Bibliothèque d’objets"/);
 assert.match(shell,/label:"Drops \/ Ressources"/);
 assert.doesNotMatch(shell,/\["items","drops","merchant"\]/,
   'The separate merchant navigation must be absent');
  assert.match(shell,/\["items","drops"\]/);
 assert.match(contract,/item\.potion\.heal/);
 assert.match(contract,/item\.potion\.revive/);
 assert.match(app,/useAdventureConsumableV1/);
 assert.match(html,/id="adventure-library-view"/);
 assert.match(html,/id="adventure-drops-view"/);
 assert.match(economy,/function focusMerchant\(merchantId\)/);
 const npcHtml=read(trial,'vendor/exploration-lab/npc-editor.html').toString('utf8');
  assert.match(explorer,/url\.searchParams\.set\('embed','npc'\)/);
  assert.match(explorer,/gensrpg\.capture\.v2\.npc\.merchant\.saved\.v1/);
  assert.match(npcHtml,/id="npc-merchant-frame"/);
  assert.match(npcHtml,/id="npc-merchant-config"/);
  assert.match(html,/id="adventure-fragment-species"/);
  assert.match(html,/id="adventure-loot-global-rewards"/);
  assert.match(html,/id="adventure-drop-focused-portrait"/);
  assert.match(app,/isEmbeddedNpcMerchant/);
  assert.match(app,/onMerchantCommitted:merchantId/);
  assert.match(economy,/onMerchantCommitted\(merchant\.id\)/);
});

test('the existing single Pages publisher remains the only deployment authority',()=>{
  const text=read(root,'.github/workflows/main.yml').toString('utf8');
  assert.match(text,/name: Deploy GenSrpG to GitHub Pages/);
  assert.match(text,/uses: actions\/deploy-pages@v4/);
  assert.match(text,/github\.ref == 'refs\/heads\/main'/);
  assert.ok(text.includes('ref: ${{ steps.preview_pin.outputs.sha }}'),
    'preview checkout must derive only from the canonical immutable release pin');
  assert.match(text,/node tools\/stage_capture_v2_pages_preview\.mjs/);
  assert.doesNotMatch(text,/ref: work\/gensrpg-capture-clean-replacement-/);
});

test('preview transport can include the official Jouer entry from its certified Explorer checkout',()=>{
  const flow=read(root,'.github/workflows/main.yml').toString('utf8');
  const stage=read(root,'tools/stage_capture_v2_pages_preview.mjs').toString('utf8');
  const sparse=[...flow.matchAll(/path: preview-exploration-lab\n\s+sparse-checkout: \|\n((?: {12,}\S[^\n]*\n)+)/g)];
  assert.equal(sparse.length,2);
  for(const [,files] of sparse)assert.match(files,/^\s*play\.html\s*$/m);
  assert.match(stage,/for\(const filename of \[[^\]]*'play\.html'[^\]]*\]\)/);
   assert.match(stage,/const from=path\.join\(exploration,filename\);/);
   assert.match(stage,/if\(filename==='npc-editor\.html'&&!fs\.existsSync\(from\)\)/,
     'missing canonical NPC page must fail the build instead of publishing a broken menu');
   assert.match(stage,/if\(fs\.existsSync\(from\)\)fs\.copyFileSync\(from,path\.join\(exploreDest,filename\)\)/);
});


test('Adventure advanced start-level and gold settings are physically present in the PWA',()=>{
 const html=read(trial,'assets/gensrpg/capture-v2/adventure.html').toString('utf8');
 const app=read(trial,'assets/gensrpg/capture-v2/adventure-app-v1.mjs').toString('utf8');
 const contract=read(trial,'assets/gensrpg/capture-v2/adventure-contract-v1.mjs').toString('utf8');
 assert.equal(html.split('id="adventure-starter-level"').length,2);
 assert.equal(html.split('id="adventure-gold-multiplier"').length,2);
 assert.ok(app.includes('startLevel:numberFrom(idField.starterLevel)'));
 assert.ok(app.includes('currencyMultiplier:numberFrom(idField.goldMultiplier)'));
 assert.ok(app.includes('progressionCore:window.GensProgressionV1'));
 assert.ok(contract.includes('export function adventureStartingXpForLevelV1('));
 assert.ok(contract.includes('export function calculateAdventureVictoryCurrencyV1('));
});

test('Creator and default 50% items exist in ONE official Capture source',()=>{
 const shell=read(trial,'assets/gensrpg/capture-v2/shell-entry-v1.js').toString('utf8');
 const creator=read(trial,'assets/gensrpg/capture-v2/shell-creator-presentation-v1.mjs').toString('utf8');
 const item=read(trial,'assets/gensrpg/capture-v2/item-templates-v1.mjs').toString('utf8');
 const app=read(trial,'assets/gensrpg/capture-v2/adventure-app-v1.mjs').toString('utf8');
 assert.equal(shell.split('creator.dataset.captureV2Menu="creator"').length,2,
  'one Creator button in the existing module home');
 assert.ok(shell.includes('path:"vendor/exploration-lab/npc-editor.html"'),
  'Creator must preserve the existing native NPC route');
 assert.ok(shell.includes('shell-creator-presentation-v1.mjs'),
  'Creator module must be lazy-loaded without parallel game state');
 assert.ok(creator.includes('createCaptureShellCreatorV1('));
 assert.ok(item.includes('chancePercent:50,minQuantity:1,maxQuantity:1'));
 assert.ok(item.includes('saleValue:100'));
 assert.ok(app.includes('adventure-starter-level'));
 const adventure=read(trial,'assets/gensrpg/capture-v2/adventure.html').toString('utf8');
 assert.ok(creator.includes("await loading.add('launch',artInput.files)"),
  'Creator alone must be able to add art to the canonical gallery');
 assert.ok(creator.includes('const images=await loading.list()'),
  'Creator must still show all old zone/combat-tagged images');
 assert.ok(!creator.includes('scene.value'),
  'Creator exposes ONE common gallery, not rival loading-scene authorities');
 assert.ok(!adventure.includes('id="adventure-loading-art-files"'),
  'in-game preparation must not expose a second art editor');
 assert.ok(!app.includes('refreshLoadingArtEditor'),
  'the adventure owns playback, never configuration');
 assert.ok(app.includes('const entries=(await library.list()).slice(0,12)'),
  'all existing illustrations remain readable across the three loading contexts');
});

test('Creator audio choices reuse only the shipped official audio library without copying another engine',()=>{
 const creator=read(trial,'assets/gensrpg/capture-v2/shell-creator-presentation-v1.mjs').toString('utf8');
 const catalog=read(trial,'assets/gensrpg/capture-v2/shell-official-audio-catalog-v1.mjs').toString('utf8');
 const combat='vendor/exploration-lab/combat-preview/';
 const metadata=json(trial,combat+'data/presentation/audio/private-audio-runtime.v1.json');
 assert.equal(metadata.schema,'gensrpg-private-audio-runtime-v1');
 assert.equal(metadata.entries.length,metadata.count);
 assert.ok(metadata.count>=200,'full official sound library must be present');
 assert.ok(metadata.entries.some(entry=>entry.roles.includes('ui')),
  'UI sound effects must exist in the official library');
 required(trial,combat+'src/assets/private-audio-runtime-library-v1.js');
 required(trial,combat+'src/assets/soundtrack-runtime-library-v1.js');
 required(trial,combat+'src/assets/soundtrack-starter-catalog-v1.js');
 required(trial,'vendor/exploration-lab/src/audio/exploration-soundtrack-v1.js');
 for(const item of metadata.entries)
  required(trial,combat+'assets/runtime/audio/'+item.runtimeFile);
 for(const name of ['battle-01-cb4ed87d.mp3','victory-01-0b52ce2b.mp3'])
  required(trial,combat+'assets/runtime/audio/music-v1/'+name);
 for(const i of [1,2,3,4])
  required(trial,'vendor/exploration-lab/assets/runtime/audio/exploration-v1/exploration-0'+i+'.mp3');
 assert.match(creator,/async putCatalog\(universeId,slot,assetId,name\)/);
 assert.match(creator,/loadCaptureShellOfficialAudioCatalogV1/);
 assert.match(creator,/▶ Préécouter/);
 assert.match(creator,/await media\.put\(universe,slot,file\.files\[0\]\)/);
 assert.match(catalog,/private-audio-runtime\.v1\.json/);
 assert.match(catalog,/soundtrackRuntimeAssetV1/);
 assert.match(catalog,/privateAudioRuntimeAssetV1/);
 assert.equal(fs.existsSync(path.join(trial,'vendor/combat-lab/assets/runtime/audio/private-v1')),false,
  'never copy the signed Combat sound bank to a second location');
});

test('NPC editor is the canonical native Exploration page with one visible Capture menu route',()=>{
 const npc=read(trial,'vendor/exploration-lab/npc-editor.html').toString('utf8');
 const sculpt=read(trial,'vendor/exploration-lab/sculpt-lab.html').toString('utf8');
 const shell=read(trial,'assets/gensrpg/capture-v2/shell-entry-v1.js').toString('utf8');
 required(trial,'vendor/exploration-lab/src/actors/npc-editor-v1.js');
 assert.ok(npc.includes('<h1>👥 Éditeur de PNJ — Monster InvoC</h1>'));
 assert.match(npc,/id="npc-role"/);
 assert.match(npc,/id="npc-allow-flee"/);
 assert.match(sculpt,/id="actor-npc-workshop-open"/);
 assert.ok(sculpt.includes('href="./npc-editor.html"'));
 assert.equal(shell.split('path:"vendor/exploration-lab/npc-editor.html"').length,2);
 assert.match(shell,/id:"npc",title:"PNJ"/);
 assert.match(shell,/current!=="builder"&&current!=="world"&&current!=="npc"/,
  'NPC editor must reuse same-origin merchant and reward catalog bridge');
});

test('the physical published preview contains the single native 2.5D destination and the player menu',()=>{
 const shell=read(trial,'assets/gensrpg/capture-v2/shell-entry-v1.js').toString('utf8');
 const css=read(trial,'assets/gensrpg/capture-v2/shell-style-v1.css').toString('utf8');
 const game=read(trial,'assets/gensrpg/capture-v2/adventure.html').toString('utf8');
 assert.match(shell,/dataset\.captureV2Menu="editors"/,'the menu must offer Éditeurs, not nine loose shortcuts');
 assert.match(shell,/dataset\.captureV2View="adventure"/,'the menu must offer one Jouer entry');
 assert.equal([...shell.matchAll(/path:"vendor\/exploration-lab\/sculpt-lab\.html"/g)].length,1,
  'the duplicate Exploration Tester and Sculpt routes must not reach publication');
 assert.doesNotMatch(shell,/\bexplore:\{label:/);
 for(const id of ['world','combat'])assert.ok(shell.includes('id:"'+id+'"'),
  'the editors must group the official World and Combat native screens');
 assert.match(css,/gensCaptureV2MainMenu/);
 assert.match(css,/gensCaptureV2Editors/);
 assert.match(game,/<h1>Jouer<\/h1>/);
 assert.match(game,/<details id="adventure-rules-panel"/);
 assert.match(game,/<details id="adventure-loot-panel"/);
});


test('isolated HTTPS Jouer has creator-owned unlimited level caps, Core XP bands and the real Combat stat budget',()=>{
 const game=read(trial,'assets/gensrpg/capture-v2/adventure.html').toString('utf8');
 const app=read(trial,'assets/gensrpg/capture-v2/adventure-app-v1.mjs').toString('utf8');
 const contract=read(trial,'assets/gensrpg/capture-v2/adventure-contract-v1.mjs').toString('utf8');
 const core=read(trial,'assets/gensrpg/core/progression-v1.js').toString('utf8');
 const playing=read(trial,'assets/gensrpg/capture-v2/adventure-playing-party-grant-v1.mjs').toString('utf8');
 const exploration=read(trial,'vendor/exploration-lab/src/encounters/adventure-playing-party-v1.js').toString('utf8');
 const combat=read(trial,'vendor/combat-lab/src/ui/capture-encounter-combat-source-v1.js').toString('utf8');
 assert.match(game,/id="adventure-level-max"/);
 assert.match(game,/id="adventure-hero-max-level"/);
 for(const id of ['adventure-level-max','adventure-hero-max-level']){
  const field=game.match(new RegExp('<input[^>]+id="'+id+'"[^>]*>'))?.[0];
  assert.ok(field,'creator must see '+id);
  assert.doesNotMatch(field,/max="100"/,'no 100 hard cap on '+id);
 }
 for(const id of ['adventure-xp-bands','adventure-stat-points-per-level','adventure-gm-enabled','adventure-combat-hp-percent'])
  assert.ok(game.includes('id="'+id+'"'),'real game creator setting missing: '+id);
 assert.doesNotMatch(game,/id="adventure-stat-wallet"/,
  'stat allocation belongs to the playing sheet, never to game setup');
 assert.match(game,/data-adventure-sheet-tab="stats"/,
  'the in-game creature stat allocation tab remains available');
 assert.match(app,/allocatePlayingSheetStat/,
  'the original Core-backed in-game allocation owner remains active');
 assert.match(contract,/SHOWCASE_ADVENTURE_RULES_V1/);
 assert.match(core,/progressInBands/);
 assert.match(app,/extendFinalXpBandToCap/);
 assert.doesNotMatch(app,/upper\.max\s*=\s*100\b/);
 assert.match(playing,/saved\.level>session\.rules\.progression\.maxLevel/);
 assert.match(contract,/combat:\{hpMultiplier:0\.25,defeatPolicy:'restore'\}/,
  'showcase HP and defeat recovery policies must both be explicit and editable');
 assert.match(game,/id="adventure-defeat-policy"/,'creator must be able to choose KO persistence');
 assert.match(game,/<option value="keep-ko">/,'creator must be able to preserve KO for later healing items');
 assert.match(app,/hpPercent:'adventure-combat-hp-percent'/);
 assert.match(playing,/combatHpMultiplier:multiplier/,'native playing grant keeps the game-wide HP policy');
 assert.match(exploration,/combatHpMultiplier/,'official Exploration must carry the same rule');
 assert.match(combat,/hpMultiplier/,'official Combat alone applies HP to both sides');
 assert.doesNotMatch(exploration,/active\.level\s*>\s*100\b/);
 assert.doesNotMatch(combat,/participant\.level\s*>\s*100\b/);
 const pins=json(trial,'assets/gensrpg/capture-v2/source-pins-v1.json');
 assert.equal(json(trial,'release-provenance.v1.json').source.commit,previewSha);
 assert.equal(pins.exploration.sha,explorationSha);
 assert.equal(pins.combat.sha,combatSha);
});


test('published World Builder retains independent incoming portals in the official Exploration owner',()=>{
 const html=read(trial,'vendor/exploration-lab/sculpt-lab.html').toString('utf8');
 const sculpt=read(trial,'vendor/exploration-lab/src/sculpt-lab-main.js').toString('utf8');
 const world=read(trial,'vendor/exploration-lab/src/builder/world-builder-draft.js').toString('utf8');
 const controls=read(trial,'vendor/exploration-lab/src/builder/sculpt-world-spawn-controls-v1.js').toString('utf8');
 assert.ok(html.includes('id="object-waypoint-arrivals"'));
 assert.ok(html.includes('id="object-waypoint-arrival-place"'));
 assert.ok(world.includes('ensureWorldPortalIndependentArrivalV1'));
 assert.ok(controls.includes('describeWorldAreaIncomingPortalsForEditorV1'));
 assert.ok(sculpt.includes('ensureWorldPortalIndependentArrivalV1'));
});
test('published merchant + Combat PNJ share the certified owner and the 25-media catalog',()=>{
 const pins=json(trial,'assets/gensrpg/capture-v2/source-pins-v1.json');
 const provenance=json(trial,'release-provenance.v1.json');
 const delivery=json(trial,'assets/gensrpg/capture-v2/delivery-manifest.json');
 const adapter=read(trial,'vendor/combat-lab/src/adapters/input/capture/capture-npc-opponent-instance-v1.js').toString('utf8');
 const economy=read(trial,'assets/gensrpg/capture-v2/adventure-economy-v1.mjs').toString('utf8');
 assert.equal(pins.combat.sha,'34c17c15f4ca8b457a94e49fa2f3fcfb8ca93ca0');
 assert.equal(pins.combat.certifiedCiRun,45016265619);
 assert.equal(provenance.combat.sha,pins.combat.sha);
 assert.equal(delivery.combat.sha,pins.combat.sha);
 assert.equal(previewPin.officialVisuals.sha,'b807389811c5a7e5236b9fdc96b7f155168d7fd7');
 assert.equal(previewPin.officialVisuals.certifiedCiRun,44925994443);
 assert.ok(adapter.includes('export '));
 assert.match(economy,/adventureMerchantPriceV1/);
});

test('publisher includes checked merchant catalog and canonical percent-price model only in Capture',()=>{
 const files=['assets/gensrpg/capture-v2/adventure-economy-v1.mjs',
  'assets/gensrpg/capture-v2/adventure-economy-editor-v1.mjs',
  'assets/gensrpg/capture-v2/adventure-merchant-play-v1.mjs'];
 const [core,editor,play]=files.map(p=>read(trial,p).toString('utf8'));
 const html=read(trial,'assets/gensrpg/capture-v2/adventure.html').toString('utf8');
 assert.match(core,/export function adventureMerchantPriceV1/);
 assert.match(core,/sellPercent/);
 assert.match(core,/buyPercent/);
 assert.match(editor,/adventure-merchant-library/);
 assert.match(editor,/getRules\(\)\.loot\.items/);
 assert.match(play,/adventureMerchantPriceV1/);
 assert.match(html,/id="adventure-merchant-sell-percent"/);
 assert.match(html,/id="adventure-merchant-buy-percent"/);
 assert.equal(fs.existsSync(path.join(site,'assets/gensrpg/capture-v2/adventure-economy-v1.mjs')),false,
  'Capture merchant economy must not leak to production root');
});

test('published Capture creator keeps audio active in native editors but silent inside Adventure gameplay',()=>{
 const shell=read(trial,'assets/gensrpg/capture-v2/shell-entry-v1.js').toString('utf8');
 const creator=read(trial,'assets/gensrpg/capture-v2/shell-creator-presentation-v1.mjs').toString('utf8');
 const pin=json(trial,'assets/gensrpg/capture-v2/source-pins-v1.json');
 assert.ok(pin.combat.sha&&pin.exploration.sha,'certified Lab pins unchanged');
 assert.match(shell,/function bindNativeEditorAudio\(nativeFrame,nativeKind\)/);
 assert.match(shell,/editorDoc\.addEventListener\('click',onClick,true\)/);
 assert.match(shell,/if\(kind==='adventure'\)bindAdventureMenuPresentation\(frame\)/);
 assert.match(shell,/if\(playing\(\)\)creatorOwner\?\.leaveHome\(\)/);
 assert.match(shell,/else creatorOwner\?\.enterHome\(\)/);
 assert.match(shell,/if\(nativeKind==="adventure"\)return/);
 assert.match(shell,/editorDoc\.removeEventListener\('click',onClick,true\)/);
 assert.match(creator,/function startAmbient\(\)/);
 assert.match(creator,/doc\.addEventListener\('pointerdown',resumeOnGesture,true\)/);
 assert.match(creator,/doc\.removeEventListener\('pointerdown',resumeOnGesture,true\)/);
 assert.match(creator,/ambienceEnabled:true/);
 assert.doesNotMatch(shell,/new Audio\(/);
 assert.equal(fs.existsSync(path.join(trial,'vendor/combat-lab/assets/runtime/audio/private-v1')),false);
});


test('published Capture menus keep the creator image and ambience while preserving native game isolation',()=>{
 const creator=read(trial,'assets/gensrpg/capture-v2/shell-creator-presentation-v1.mjs').toString('utf8');
 const shell=read(trial,'assets/gensrpg/capture-v2/shell-entry-v1.js').toString('utf8');
 const menuCss=read(trial,'assets/gensrpg/capture-v2/shell-style-v1.css').toString('utf8');
 const adventureCss=read(trial,'assets/gensrpg/capture-v2/adventure-style-v1.css').toString('utf8');
 assert.ok(shell.includes('function bindAdventureMenuPresentation(nativeFrame)'),
  'Jouer preparation must stay application UI until actual world entry');
 assert.ok(shell.includes("attributeFilter:['data-adventure-playing']"),
  'only Adventure-owned play status may toggle app ambience');
 assert.ok(shell.includes("if(playing())creatorOwner?.leaveHome();"));
 assert.ok(shell.includes("else creatorOwner?.enterHome();"));
 assert.ok(shell.includes("if(kind==='adventure')bindAdventureMenuPresentation(frame);"));
 assert.ok(creator.includes('wallpaper:()=>backgroundUrl?Object.freeze('));
 assert.ok(menuCss.includes('rgba(28,88,96,.81)'),
  'main menu buttons must be mildly translucent');
 assert.ok(menuCss.includes('[data-menu="main"] > .gensCaptureV2MainMenu button'),
  'the translucency is scoped to main menu only');
 assert.ok(adventureCss.includes('body[data-capture-shell-wallpaper="true"]:not([data-adventure-playing="true"]) main'));
 assert.ok(!shell.includes('new Audio('),'do not create a rival player');
 assert.ok(!creator.includes('soundPlayers.set(\'game\''),'never create gameplay audio');
});

test('published PC enemy reserve HUD stays beside enemy names and wallpapers keep whole art in portrait',()=>{
 const combatCss=read(trial,'vendor/combat-lab/examples/dom-demo/capture-editor-v2.css').toString('utf8');
 const shell=read(trial,'assets/gensrpg/capture-v2/shell-style-v1.css').toString('utf8');
 const game=read(trial,'assets/gensrpg/capture-v2/adventure-style-v1.css').toString('utf8');
 const pc=combatCss.slice(combatCss.indexOf('/* PC-only combat legibility.'),
   combatCss.indexOf('/* Canonical skill recolor controls:'));
 assert.ok(pc.length>400,'certified PC geometry rules must be shipped');
 assert.match(pc,/right:\s*calc\(min\(15\.5rem,\s*26%\)\s*\+\s*1\.4rem\)/,
   'enemy reserve tab is outside the card using its canonical PC width');
 assert.match(pc,/\.combat-test-enemy-reserves__body\s*\{\s*left:\s*auto;\s*right:\s*0;/,
   'opened enemy bench cannot cover the visible enemy name');
 assert.match(shell,/background-size:cover,contain,cover/,
   'Capture Shell menu must show the complete image and an edge-filling background');
 assert.match(shell,/background-size:contain,100% 100%,cover/,
   'Capture Shell load must retain uncut foreground in portrait and landscape');
 assert.match(game,/background-size:cover,contain,cover/,
   'Adventure preparation wallpaper must keep its full source image');
 assert.match(game,/background-size:contain,100% 100%,cover/,
   'custom loading images remain complete at all screen ratios');
});

test('PWA portrait Capture menu paints ONE opaque wallpaper without exposing GenSRPG below it',()=>{
 const css=read(trial,'assets/gensrpg/capture-v2/shell-style-v1.css').toString('utf8');
 const gameCss=read(trial,'assets/gensrpg/capture-v2/adventure-style-v1.css').toString('utf8');
 const home=css.match(/#gensCaptureV2Root\[data-view="home"\]\[data-creator-wallpaper="true"\]\{([\s\S]*?)\n\}/)?.[1];
 assert.ok(home,'real published Capture home wallpaper exists');
 assert.match(home,/background-color:#08121b/,'Capture must mask the root GenSRPG hub under transparent art');
 assert.match(home,/background-size:cover,contain,cover/,'complete illustration remains uncropped');
 assert.equal((home.match(/var\(--capture-home-art\)/g)||[]).length,1,
  'no duplicate enlarged Kitsune behind the full art');
 assert.match(home,/radial-gradient\(/,'gutter fill must be gradient rather than another art projection');
 const preparation=gameCss.match(/body\[data-capture-shell-wallpaper="true"\]:not\(\[data-adventure-playing="true"\]\) main\{([\s\S]*?)\n\}/)?.[1];
 assert.ok(preparation);
 assert.match(preparation,/background-color:#08131c/);
 assert.equal((preparation.match(/var\(--capture-shell-wallpaper\)/g)||[]).length,1,
  'Jouer setup menu must not recreate the duplicated image');
 const portrait=css.match(/@media \(orientation:portrait\) and \(max-width:650px\)\{([\s\S]*?)\n\}/)?.[1];
 assert.ok(portrait,'real portrait header layout is published');
 assert.match(portrait,/grid-template-columns:max-content minmax\(0,1fr\)/);
 assert.match(portrait,/grid-column:1\/-1/);
 assert.match(portrait,/\.gensCaptureReturnToMain\{/);
});

test('merchant and monster drops use one shipped Capture item catalog and original fragment controls',()=>{
 const base='assets/gensrpg/capture-v2/';
 const html=read(trial,base+'adventure.html').toString('utf8');
 const economy=read(trial,base+'adventure-economy-v1.mjs').toString('utf8');
 const merchant=read(trial,base+'adventure-economy-editor-v1.mjs').toString('utf8');
 const shop=read(trial,base+'adventure-merchant-play-v1.mjs').toString('utf8');
 const app=read(trial,base+'adventure-app-v1.mjs').toString('utf8');
 assert.match(html,/id="adventure-merchant-category"/);
 for(const kind of ['resource','usable','fragment'])
  assert.ok(html.includes('value="'+kind+'">'),
   'missing official item library category '+kind);
 assert.match(economy,/fragmentPrices/);
 assert.match(economy,/adventureMerchantPriceV1/);
 assert.match(merchant,/getPublishedSpecies/);
 assert.match(merchant,/fragmentPricesDraft/);
 assert.match(shop,/merchant\.fragmentPrices/);
 assert.match(html,/id="adventure-drop-fragment-summary"/);
 assert.match(html,/id="adventure-drop-new"/);
 assert.equal((html.match(/id="adventure-monster-fragments-panel"/g)||[]).length,1,
  'existing fragment override controls must not be duplicated');
 assert.match(app,/function focusSelectedMonsterDrop\(\)/);
 assert.match(app,/autoFocusedDropIndex/);
 assert.match(app,/\$\('adventure-drop-fragment-settings'\)\.append\(controls\)/);
 assert.equal(fs.existsSync(path.join(site,base+'adventure-economy-editor-v1.mjs')),false,
  'canonical merchant editor must stay scoped to the Capture preview');
});
