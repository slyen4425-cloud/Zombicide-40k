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
 assert.equal(source.exploration.sha,'26a0f15f97db0d39d91dca13999d537b8f8af7dc',
   'ship certified Exploration main with the sculpt palette, cleaned bridges and stair profiles');
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
  // #522 official Exploration main CI 45043998646 & Pages 45043998629 GREEN.
  // Exact renderer Git blob independently verified identical on both main refs.
  const certifiedNov22MultiplayerOverlapSha='77bebb83ff176f49edff7ae49c03ba48c28202ca';
  // #521 certified Exploration main: CI 45050483870, Pages 45050483881.
  // Same exact native height renderer blob, not a PWA fork.
  const certifiedNov22SculptPaletteSha='a8d9f8bd61bee7a14ab4e71e6cedc85250457f5c';
  const certifiedNov22FiveTerrainTexturesSha='1b69d62a88e77c545ab9a476a6a2b7f81ad4dd90';
  const certifiedNov23AutoPortalsSha='98e3f67700494d76ab12628ee52d498e7cc24606';
  const certifiedNov23NavigationAllowSha='b0f52e23bea6e9eaf359fc7faf206c13386bdb4a';
  const certifiedNov23StairsAuthoringSha='35dbe475e53abcc7ba8f4c5ee3be972390232584';
  const certifiedMerchantDialogSha='d55dd4d4f565baefc66bc5ccbde2f10e501f67fe';
  const certifiedUniversePlaySha='46e2e1e11cfd841232998d452dbf4f235f2b482c';
  const certifiedWildEncounterSha='bdac9bade51cb908fe0e7a5fc8d06ac3f2a8d874';
  const certifiedWildBehaviorSha='52c0736f16b4bf75209a3839255135786719188c';
const certifiedHudSha='46654efe2b7d084d8ae891362e5d4e2999c3ab8c'; // #550: CI 45554656523, Pages 45554656527, identical renderer blob.
const certifiedDirectMerchantSha='afdd45a4ab4065c0921b160a38a948ca3663e62f'; // #552: CI 45569743090, Pages 45569743151, identical renderer blob.
const certifiedFinalMerchantSha='55aac7cef63134e6f92355bf530c8967d08d0d10'; // #553: CI 45586658460, Pages 45586658600, identical renderer blob.
const certifiedLightingSha='18acbbf28e82973e3d0cf3935fe3a56cf47c159b'; // certified #555 renderer 82e230a2095bceecfdc7e566d3bddaf63f3c2dbc
const certifiedDoorPromptSha='1333b74a5306bb07473f3c1f58be18804b9a5a75'; // #557 certified CSS-only transition visual, native south renderer Git blob unchanged.
const certifiedDecorAssetsSha='da445a85caa11d3d0503a3fc1227cad4e6b11471'; // #558 CI 45680415618 + Pages 45680415517 GREEN.
 const certifiedWildVictorySha='afb8d878f4c0b60c61aef4bf59306d518481efe6'; // #559 main CI 45703174726 + Pages 45703174709 GREEN; same renderer blob.
const certifiedWorldQuotaSha='c3dd13358b1f4f3c8a2e8b29e40a1b5134061901'; // #560 CI 45759990513, Pages 45759990509; same renderer.
const certifiedLivingWaterSha='98f76585c6109e46558d364e6ac697ed4319963e';
const certifiedGreenHeroSha='3ed0c06e0ffdc798a011ecfcafe9037712864d9c';
const certifiedGraphicIndexedDbSha='26a0f15f97db0d39d91dca13999d537b8f8af7dc'; // #568 CI 46045210248 + HTTPS GREEN, without unvalidated roads.
const certifiedErgonomieSha='7dd03a1aa718e6e71ecfb95519db430a002e0bff'; // #563 renderer byte-identical; CI 45826547569 / Pages 45826547034 SUCCESS, exact HTTPS verified.
const certifiedTesterDoorsSha='e17fc0f9cd17c67755024653691fe4653048d305'; // #554: CI 45624477145, Pages 45624477116 and 45640176867 SUCCESS, identical renderer blob.
 // The stair fix changes navigation and sprite presentation only. Its
 // canonical south terrain renderer remains byte-identical to recoveredWorld.
 const expectedOfficialRendererBlob=explorationSha===certifiedGraphicIndexedDbSha?'0ad5f4d95840eed5204063eb76cff073c591ffee':[certifiedLivingWaterSha,certifiedGreenHeroSha,certifiedGraphicIndexedDbSha].includes(explorationSha)?'f9dc12bd8979625828347b51f0805853da44f3f4':[certifiedLightingSha,certifiedDoorPromptSha,certifiedDecorAssetsSha,certifiedWildVictorySha,certifiedWorldQuotaSha,certifiedErgonomieSha,certifiedLivingWaterSha,certifiedGreenHeroSha,certifiedGraphicIndexedDbSha].includes(explorationSha)?'82e230a2095bceecfdc7e566d3bddaf63f3c2dbc': [certifiedUniversePlaySha,certifiedWildEncounterSha,certifiedWildBehaviorSha,certifiedHudSha,certifiedDirectMerchantSha,certifiedFinalMerchantSha,certifiedTesterDoorsSha,certifiedLightingSha,certifiedDoorPromptSha,certifiedDecorAssetsSha,certifiedWildVictorySha,certifiedWorldQuotaSha,certifiedErgonomieSha,certifiedLivingWaterSha,certifiedGreenHeroSha,certifiedGraphicIndexedDbSha].includes(explorationSha)
   ?'19b0c9822048381793cd705f7cfcb2d4cdc207fa'
   :[certifiedNov23NavigationAllowSha,certifiedNov23StairsAuthoringSha,certifiedMerchantDialogSha].includes(explorationSha)
   ?'98c70979a719b2bad48a35df972bb880b6a62f5e'
   :[recoveredWorldExplorationSha,stairsExplorationSha,certifiedNov21ExplorationSha,certifiedNov22NpcExplorationSha,certifiedNov22CleanedAssetsSha,certifiedNov22NpcInlineSha,certifiedNov22MultiplayerOverlapSha,certifiedNov22SculptPaletteSha,certifiedNov22FiveTerrainTexturesSha,certifiedNov23AutoPortalsSha,certifiedNov23NavigationAllowSha,certifiedNov23StairsAuthoringSha,certifiedMerchantDialogSha,certifiedUniversePlaySha,certifiedWildEncounterSha,certifiedWildBehaviorSha,certifiedHudSha,certifiedDirectMerchantSha,certifiedFinalMerchantSha,certifiedTesterDoorsSha,certifiedLightingSha,certifiedDoorPromptSha,certifiedDecorAssetsSha,certifiedWildVictorySha,certifiedWorldQuotaSha,certifiedErgonomieSha,certifiedLivingWaterSha,certifiedGreenHeroSha,certifiedGraphicIndexedDbSha].includes(explorationSha)
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
   '4df91fdc4d5eedcf421e4767e175cba80e469bb1',pixelExplorationSha,warmupAudioExplorationSha,crossfadeExplorationSha,authorExportCameraExplorationSha,fringeRoadExplorationSha,recoveredWorldExplorationSha,stairsExplorationSha,certifiedNov21ExplorationSha,certifiedNov22NpcExplorationSha,certifiedNov22CleanedAssetsSha,certifiedNov22NpcInlineSha,certifiedNov22MultiplayerOverlapSha,certifiedNov22SculptPaletteSha,certifiedNov22FiveTerrainTexturesSha,certifiedNov23AutoPortalsSha,certifiedNov23NavigationAllowSha,certifiedNov23StairsAuthoringSha,certifiedMerchantDialogSha,certifiedUniversePlaySha,certifiedWildEncounterSha,certifiedWildBehaviorSha,certifiedHudSha,certifiedDirectMerchantSha,certifiedFinalMerchantSha,certifiedTesterDoorsSha,certifiedLightingSha,certifiedDoorPromptSha,certifiedDecorAssetsSha,certifiedWildVictorySha,certifiedWorldQuotaSha,certifiedErgonomieSha,certifiedLivingWaterSha,certifiedGreenHeroSha,certifiedGraphicIndexedDbSha].includes(explorationSha),
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
 if([fringeRoadExplorationSha,recoveredWorldExplorationSha,stairsExplorationSha,certifiedNov21ExplorationSha,certifiedNov22NpcExplorationSha,certifiedNov22CleanedAssetsSha,certifiedNov22NpcInlineSha,certifiedNov22MultiplayerOverlapSha,certifiedNov22SculptPaletteSha,certifiedNov22FiveTerrainTexturesSha,certifiedNov23AutoPortalsSha,certifiedNov23NavigationAllowSha,certifiedNov23StairsAuthoringSha,certifiedMerchantDialogSha,certifiedUniversePlaySha,certifiedWildEncounterSha,certifiedWildBehaviorSha,certifiedHudSha,certifiedDirectMerchantSha,certifiedFinalMerchantSha,certifiedTesterDoorsSha,certifiedLightingSha,certifiedDoorPromptSha,certifiedDecorAssetsSha,certifiedWildVictorySha,certifiedWorldQuotaSha,certifiedErgonomieSha,certifiedLivingWaterSha,certifiedGreenHeroSha,certifiedGraphicIndexedDbSha].includes(explorationSha)){
  assert.match(sculpt,/drawDecorativeFringeObjects\('back'\)/);
  assert.match(sculpt,/drawDecorativeFringeObjects\('front'\)/);
  const north=sculpt.indexOf("drawDecorativeFringeObjects('back');");
  const hero=sculpt.indexOf('drawNavigationActor();',north);
  const south=sculpt.indexOf("drawDecorativeFringeObjects('front');",hero);
  assert.ok(north>=0&&hero>north&&south>hero,
   'a southern tree must layer in front of the player but own no collision');
  if([recoveredWorldExplorationSha,stairsExplorationSha,certifiedNov21ExplorationSha,certifiedNov22NpcExplorationSha,certifiedNov22CleanedAssetsSha,certifiedNov22NpcInlineSha,certifiedNov22MultiplayerOverlapSha,certifiedNov22SculptPaletteSha,certifiedNov22FiveTerrainTexturesSha,certifiedNov23AutoPortalsSha,certifiedNov23NavigationAllowSha,certifiedNov23StairsAuthoringSha,certifiedMerchantDialogSha,certifiedUniversePlaySha,certifiedWildEncounterSha,certifiedWildBehaviorSha,certifiedHudSha,certifiedDirectMerchantSha,certifiedFinalMerchantSha,certifiedTesterDoorsSha,certifiedLightingSha,certifiedDoorPromptSha,certifiedDecorAssetsSha,certifiedWildVictorySha,certifiedWorldQuotaSha,certifiedErgonomieSha,certifiedLivingWaterSha,certifiedGreenHeroSha,certifiedGraphicIndexedDbSha].includes(explorationSha)){
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
  assert.doesNotMatch(npcHtml,/id="npc-merchant-choice"/);
  const sculptHtml=read(trial,'vendor/exploration-lab/sculpt-lab.html').toString('utf8');
  assert.match(sculptHtml,/id="npc-merchant-configure"/);
  assert.doesNotMatch(sculptHtml,/<select[^>]*id="[^"]*merchant[^"]*"/);
  assert.match(explorer,/inlineMerchantId=merchantIdDraft\|\|'merchant-'\+selected\.id/);
  assert.match(app,/merchantScope:embeddedMerchantScope/);
  assert.match(economy,/scopedId\?\?editedId\?\?/);
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
 assert.ok(app.includes('const entries=library?(await library.list()).slice(0,12):[]'),
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
 assert.equal(pins.combat.sha,'3e2082ebcc396414c1fbe0c54ac24e0382ddd3b5');
 assert.equal(pins.combat.certifiedCiRun,45897517488);
 assert.equal(provenance.combat.sha,pins.combat.sha);
 assert.equal(delivery.combat.sha,pins.combat.sha);
 assert.equal(previewPin.officialVisuals.sha,'3169aaf8ead839683b40d9a17ce4ad1b8ff8cfb6');
 assert.equal(previewPin.officialVisuals.certifiedCiRun,45683905164);
 assert.ok(adapter.includes('export '));
 assert.match(economy,/adventureMerchantPriceV1/);
});

test('PWA stages Vipfer five Steel skills and exactly the eight approved author media references',()=>{
 const source=json(trial,'assets/gensrpg/capture-v2/source-pins-v1.json');
 const bundle=json(trial,'assets/gensrpg/capture-v2/delivery-manifest.json');
 assert.equal(source.combat.sha,'3e2082ebcc396414c1fbe0c54ac24e0382ddd3b5');
 assert.equal(source.combat.certifiedCiRun,45897517488);
 assert.equal(bundle.combat.sha,source.combat.sha,'the real staged combat must match the certified pin');
 assert.equal(previewPin.officialVisuals.sha,'3169aaf8ead839683b40d9a17ce4ad1b8ff8cfb6');
 const slugs=['morsure-ressort','etreinte-acier','mue-tranchante','couronne-eclats','broyeur-serpentin'];
 const ids=slugs.map(slug=>'vipfer-'+slug);
 const creature=json(trial,'vendor/combat-lab/data/capture/showcase/Vipfer.capture-creature-transfer-v1.json');
 assert.deepEqual(creature.draft.skillIds,ids);
 assert.deepEqual(creature.loadout.slots.map(slot=>slot.skillId),ids);
 const approved={'morsure-ressort':'impact','mue-tranchante':'cast','couronne-eclats':'travel'};
 for(const slug of slugs){
  const id='vipfer-'+slug;
  const skill=json(trial,'vendor/combat-lab/data/capture/showcase/'+id+'.capture-skill-transfer-v1.json').draft;
  assert.equal(skill.id,id);
  assert.equal(skill.definition.id,id);
  assert.equal(skill.definition.element,'steel');
  assert.equal(skill.presentation.visual.icon.assetId,'pack:capture:icon-skill-vipfer-'+slug+'-v1');
  const slot=approved[slug];
  if(slot){
   assert.equal(skill.presentation.visual[slot].assetId,'pack:capture:sprite-skill-vipfer-'+slug+'-v1');
  }else{
   assert.deepEqual(Object.keys(skill.presentation.visual),['icon'],
    'Étreinte et Broyeur must not import rejected silhouette animations');
  }
  if(slug==='couronne-eclats')assert.equal(skill.definition.salvo.shots,3);
 }
 // The legacy root Combat directory remains protected for the historical
 // capture-world-2v2-test URL; the new Vipfer source is staged in this preview.
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
 if(css.includes('[data-capture-v2-exit]')){
  assert.match(portrait,/display:flex;justify-content:center/);
  assert.match(css,/header > \.gensCaptureReturnToMain\{display:none!important\}/);
  assert.match(css,/data-menu="editors"\] > header > \[data-capture-v2-exit\]\{display:none!important\}/);
  assert.match(css,/data-menu="universes"\]\{\s*background:radial-gradient/);
 }else{
  assert.match(portrait,/grid-template-columns:max-content minmax\(0,1fr\)/);
  assert.match(portrait,/grid-column:1\/-1/);
  assert.match(portrait,/\.gensCaptureReturnToMain\{/);
 }
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

test('five new Exploration terrain WebPs are shipped ONCE with stable native material IDs',()=>{
  const owner='vendor/exploration-lab/';
  const manifest=json(trial,owner+'assets/exploration/materials/forest/manifest.v1.json');
  const registry=read(trial,owner+'src/materials/material-pack-v1.js').toString('utf8');
  const adapter=read(trial,owner+'src/assets/material-asset-adapter.js').toString('utf8');
  const painter=read(trial,owner+'src/world/sculpt-surface-paint.js').toString('utf8');
  const html=read(trial,owner+'sculpt-lab.html').toString('utf8');
  const paint=html.match(/<select id="surface-material">([\s\S]*?)<\/select>/)?.[1]??'';
  const base=html.match(/<select id="material">([\s\S]*?)<\/select>/)?.[1]??'';
  const rows=[["grass.forest.tall","texture.grass.forest.tall.01","terrain_haute_herbe_01.webp","forest","9a127bde4f600d1fbb77fc8cb1a03f7bc05d569576805e98ad461bb59627a49b"],["grass.forest.flowers","texture.grass.forest.flowers.01","terrain_herbe_fleurie_01.webp","forest","6cef9ed6c7e12b67f1e9d2cb1ab2ba7d3f13908ef6e111a32797462ae92bfff0"],["ground.snow.rocky","texture.ground.snow.rocky.01","terrain_neige_rocheuse_01.webp","snow","2e336b9446c335b0cf5f1913b45dbae5a137cb691ab77bd2ff7dbc57337cda35"],["ground.dirt.textured","texture.ground.dirt.textured.01","terrain_sol_terre_01.webp","plain","e3d1958b076497b6b56b29a582792ad583a42d94cff7d2206efae5af691f1440"],["ground.volcanic.rocky","texture.ground.volcanic.rocky.01","terrain_sol_volcanique_01.webp","volcano","d14a157801e96c4a0e7121cb044799c1bfe17ea15125aa9e63029f417faf2cbc"]];
  const provenance=json(trial,'release-provenance.v1.json');
  assert.equal(provenance.exploration.sha,'26a0f15f97db0d39d91dca13999d537b8f8af7dc');
  for(const [materialId,assetId,filename,family,hash] of rows){
    const rel=owner+'assets/exploration/materials/forest/surfaces/'+filename;
    required(trial,rel);
    const bytes=read(trial,rel);
    assert.equal(bytes.toString('ascii',0,4),'RIFF',filename);
    assert.equal(bytes.toString('ascii',8,12),'WEBP',filename);
    assert.equal(sha256(bytes),hash,filename);
    const m=manifest.files.find(item=>item.assetId===assetId);
    assert.equal(m?.sha256,hash);
    assert.equal(m?.bytes,bytes.length);
    assert.equal(m?.width,128);assert.equal(m?.height,128);
    assert.ok(registry.includes("id: '"+materialId+"'"),materialId);
    assert.ok(registry.includes("terrainFamilyId: '"+family+"'"),materialId);
    assert.ok(adapter.includes("id:'"+assetId+"'"),assetId);
    assert.ok(painter.includes("id:'"+materialId+"'"),materialId);
    assert.ok(paint.includes('value="'+materialId+'"'),'paint '+materialId);
    assert.ok(base.includes('value="'+materialId+'"'),'base '+materialId);
    assert.equal(fs.existsSync(path.join(trial,'assets/exploration/materials/forest/surfaces',filename)),false,
      'no parallel terrain asset library outside official Exploration');
  }
  assert.ok(base.includes('value="ground.volcanic_ash_lava"'),'historical volcanic base remains');
  assert.equal(fs.existsSync(path.join(trial,owner+'GENSRPG_Exploration_5_textures_2026-11-22.zip')),false);
  assert.equal(fs.existsSync(path.join(site,'GENSRPG_Exploration_5_textures_2026-11-22.zip')),false);
});

test('the PWA physically ships the generic author description and zone/trail editor, not species-specific code',()=>{
 const pinned=json(trial,'assets/gensrpg/capture-v2/source-pins-v1.json');
 assert.equal(pinned.combat.sha,'3e2082ebcc396414c1fbe0c54ac24e0382ddd3b5');
 assert.equal(pinned.exploration.sha,'26a0f15f97db0d39d91dca13999d537b8f8af7dc');
 const explanation=read(trial,'vendor/combat-lab/src/ui/capture-skill-explanation-v1.js').toString('utf8');
 const editor=read(trial,'vendor/combat-lab/src/ui/capture-editor-human-v2.js').toString('utf8');
 assert.match(explanation,/if\(d\.salvo\)/,'auto description must show configured salvo count');
 assert.match(explanation,/s\.contactDamage>0/,'fixed melee retaliation must not print 0%');
 for(const selector of ['data-skill-zone-trail-enabled','data-skill-zone-trail-index',
    'data-skill-zone-trail-count'])assert.ok(editor.includes(selector),
    'generic trajectory-zone author setting missing: '+selector);
 const fire=json(trial,'vendor/combat-lab/data/capture/showcase/polocendre-trainee-feu.capture-skill-transfer-v1.json');
 const zones=fire.draft.definition.effects.filter(effect=>effect.kind==='persistent_zone');
 assert.equal(zones.length,3);
 assert.deepEqual(zones.map(zone=>[zone.trailIndex,zone.trailCount,zone.tickEffect.amount]),
   [[1,3,5],[2,3,5],[3,3,5]]);
 const volley=json(trial,'vendor/combat-lab/data/capture/showcase/vipfer-couronne-eclats.capture-skill-transfer-v1.json');
 assert.deepEqual(volley.draft.definition.salvo,{shots:3,shotDurationMs:550,gapMs:150});
 assert.equal(volley.draft.definition.effects.find(effect=>effect.kind==='damage').amount,12);
});

test('published 2.5D portals auto-cross their canonical trigger and preserve editable marker visuals',()=>{
  const dir='vendor/exploration-lab/';
  const main=read(trial,dir+'src/sculpt-lab-main.js').toString('utf8');
  const doc=read(trial,dir+'src/world/portal-model.js').toString('utf8');
  const html=read(trial,dir+'sculpt-lab.html').toString('utf8');
  const markers=read(trial,dir+'src/builder/sculpt-world-portal-markers.js').toString('utf8');
  const renderer=read(trial,dir+'src/render/portal-renderer.js').toString('utf8');
  assert.match(main,/findPortalEnteredDuringMove\(sculptWorldDraft,sculptWorldAreaId/);
  assert.match(main,/void traverseSculptWorldPortal\(\)/);
  assert.match(doc,/export function findPortalEnteredDuringMove\(/);
  assert.match(doc,/visual\.marker === 'shadow'/);
  assert.match(doc,/textureMaterialId/);
  assert.match(markers,/showHidden=false/);
  assert.match(renderer,/drawPortalArt/);
  for(const id of ['object-waypoint-marker-mode','object-waypoint-marker-texture',
    'object-waypoint-marker-save'])assert.ok(html.includes('id="'+id+'"'));
  assert.doesNotMatch(main,/secondPortalState|duplicatePortalLibrary/);
});

test('PWA stages the approved Vipfer buff sprite tied to its native 8-second defense status and opponent HUD',()=>{
 const mue=json(trial,'vendor/combat-lab/data/capture/showcase/vipfer-mue-tranchante.capture-skill-transfer-v1.json').draft;
 const defense=mue.definition.effects.find(e=>e.kind==='apply_status'&&e.status.kind==='stat_modifier');
 const riposte=mue.definition.effects.find(e=>e.kind==='apply_status'&&e.status.kind==='damage_reflection');
 assert.equal(defense.status.durationMs,8000);
 assert.equal(defense.status.deltaPoints,200);
 assert.equal(riposte.status.contactDamage,25);
 assert.equal(riposte.status.consumeOnContact,true);
 const visual=mue.presentation.statusVisuals[defense.status.id];
 assert.equal(visual.mode,'sprite');
 assert.equal(visual.sprite.playbackMode,'hold-last');
 assert.equal(visual.sprite.assetId,mue.presentation.visual.cast.assetId);
 const html=read(trial,'vendor/combat-lab/examples/dom-demo/capture-editor-v2.html').toString('utf8');
 const code=read(trial,'vendor/combat-lab/src/ui/combat-2v2-test-ui.js').toString('utf8');
 const css=read(trial,'vendor/combat-lab/examples/dom-demo/capture-editor-v2.css').toString('utf8');
 assert.match(html,/data-combat-hud-widget="opponent-skill-loadout"/);
 assert.match(html,/<details class="combat-test-enemy-skills"/);
 assert.match(code,/projectOpponentSkillLoadoutV1/);
 assert.match(code,/rosterController\?\.skillIdsFor\(actorId\)/);
 assert.match(code,/skillCooldownRemainingMs\(state,actorId,id\)/);
 assert.match(css,/\.combat-test-enemy-skills__body\s*\{/);
 assert.ok(!html.includes('data-combat-enemy-skill-activate'));
});

test('the same Exploration collision authority ships the three navigation modes and invisible physical corridors',()=>{
 const root='vendor/exploration-lab/';
 const html=read(trial,root+'sculpt-lab.html').toString('utf8');
 const main=read(trial,root+'src/sculpt-lab-main.js').toString('utf8');
 const model=read(trial,root+'src/world/sculpt-height-model.js').toString('utf8');
 const render=read(trial,root+'src/render/sculpt-height-renderer.js').toString('utf8');
 const collision=read(trial,root+'src/core/sculpt-navigation-collision.js').toString('utf8');
 const stair=read(trial,root+'src/core/sculpt-stair-traversal.js').toString('utf8');
 for(const id of ['navigation-zones-tools','nav-zone-block','nav-zone-allow','nav-zone-normal'])
  assert.equal((html.match(new RegExp('id="'+id+'"','g'))??[]).length,1);
 assert.match(main,/appendSculptNavigationAllowedCorridor/);
 assert.match(main,/removeSculptNavigationAllowedCorridorAt/);
 assert.match(model,/navigationOnly:true/);
 assert.match(model,/appendSculptTerrainRamp\(terrain/);
 assert.match(render,/if\(ramp.navigationOnly\)continue/);
 assert.match(collision,/sculptStairCorridor/);
 assert.match(stair,/sculptStairAt/);
 assert.doesNotMatch(main,/secondNavigationCollision/);
 // The already published auto-portal links and markers remain present.
 assert.match(main,/findPortalEnteredDuringMove\(sculptWorldDraft,sculptWorldAreaId/);
 assert.match(html,/id="object-waypoints-panel"/);
});

test('published Capture carries the opt-in potion import and actual merchant stock from #635/#636',()=>{
 const base='assets/gensrpg/capture-v2/';
 const html=read(trial,base+'adventure.html').toString('utf8');
 const app=read(trial,base+'adventure-app-v1.mjs').toString('utf8');
 const editor=read(trial,base+'adventure-economy-editor-v1.mjs').toString('utf8');
 const economy=read(trial,base+'adventure-economy-v1.mjs').toString('utf8');
 const shop=read(trial,base+'adventure-merchant-play-v1.mjs').toString('utf8');
 assert.equal((html.match(/id="adventure-item-import-potions"/g)||[]).length,1);
 assert.match(app,/\$\('adventure-item-import-potions'\)\.addEventListener\('click'/);
 assert.match(editor,/itemStocksDraft/);
 assert.match(economy,/merchant\.itemStocks/);
 assert.match(shop,/state\.merchantStocks/);
 const pins=json(trial,base+'source-pins-v1.json');
 assert.equal(pins.combat.sha,'3e2082ebcc396414c1fbe0c54ac24e0382ddd3b5');
 assert.equal(pins.exploration.sha,'26a0f15f97db0d39d91dca13999d537b8f8af7dc');
});

test('both owners explain missing merchant links in the assembled PWA',()=>{
 const explorer=read(trial,'vendor/exploration-lab/src/sculpt-lab-main.js').toString('utf8');
 const capture=read(trial,'assets/gensrpg/capture-v2/adventure-merchant-play-v1.mjs').toString('utf8');
 assert.match(explorer,/Aucune boutique associée à ce marchand/);
 assert.match(capture,/Boutique introuvable dans les règles de cette partie/);
});

test('PWA ships the single merchant repair and wild-defeat lifetime, not another gameplay owner',()=>{
 const base='assets/gensrpg/capture-v2/';
 const app=read(trial,base+'adventure-app-v1.mjs').toString('utf8');
 const bridge=read(trial,base+'adventure-playing-party-grant-v1.mjs').toString('utf8');
 const contract=read(trial,base+'adventure-contract-v1.mjs').toString('utf8');
 const merchant=read(trial,base+'adventure-merchant-play-v1.mjs').toString('utf8');
 const source=read(trial,base+'adventure-rules-draft-v1.mjs').toString('utf8');
 const world=read(trial,'vendor/exploration-lab/src/sculpt-lab-main.js').toString('utf8');
 const reader=read(trial,'vendor/exploration-lab/src/encounters/adventure-playing-party-v1.js').toString('utf8');
 const projected=read(trial,'vendor/exploration-lab/src/actors/npc-wild-defeat-projection-v1.js').toString('utf8');
 assert.match(contract,/wildVictories:\[\.\.\.\(state\.wildVictories\?\?\[\]\),wild\]/,
  'only the official Combat receipt may persist an actor victory');
 assert.match(bridge,/wildVictories:normalizeAdventureWildVictoriesV1\(session\.wildVictories\)/);
 assert.match(reader,/wildVictories=Object\.freeze\(/);
 assert.match(world,/projectDefeatedPlacedWildV1\(authored,/,
  'the renderer and collisions must share one filtered actor projection');
 assert.match(projected,/actor\?\.npc\?\.kind!=='wild'/,
  'trainer and merchant NPCs must never disappear because of wild wins');
 assert.match(source,/reconcileAuthoredMerchantForSessionV1/);
 assert.match(app,/repairMissingMerchant:async/);
 assert.match(merchant,/await repairMissingMerchant/);
 assert.doesNotMatch(projected,/localStorage|sessionStorage|deleteActor|removeWorldActor/);
});

test('the shipped game connects the same universe to the Bestiary, navigation and native fight',()=>{
 const base='assets/gensrpg/capture-v2/',explorer='vendor/exploration-lab/';
 const launch=read(trial,base+'adventure-app-v1.mjs').toString('utf8');
 assert.match(launch,/readCaptureUniverseEncounterSourceV1\(\{/);
 assert.match(launch,/storage:universeWorldStorage,world/);
 assert.match(launch,/url\.searchParams\.set\('universe',selectedUniverseId\)/);
 const collection=read(trial,base+'adventure-play-sheet-view-v1.mjs').toString('utf8');
 assert.match(launch,/collection,universeId:selectedUniverseId/);
 assert.match(collection,/page\.searchParams\.set\('universe',universeId\)/);
 const combat='src/adapters/input/capture/capture-universe-encounter-source-v1.js';
 const owner=read(trial,'vendor/combat-lab/'+combat);
 assert.deepEqual(read(trial,explorer+'combat-preview/'+combat),owner);
 const bridge=read(trial,explorer+'combat-preview/examples/dom-demo/exploration-encounter.js').toString('utf8');
 assert.match(bridge,/selectCaptureEncounterBundleV1/);
 const editor=read(trial,explorer+'sculpt-lab.html').toString('utf8');
 assert.match(editor,/id="actor-route-draw"/);
 assert.match(editor,/value="footbridge"/);
});


test('certified HUD editor, native encounter handoff and four author-validated Veuve jaune atlases ship through existing owners',()=>{
 const combat='vendor/combat-lab/';
 const explorer='vendor/exploration-lab/';
 const editor=read(trial,combat+'examples/dom-demo/capture-editor-v2.html').toString('utf8');
 // Combat #401 replaced the old form with the native visual authoring surface.
 for(const selector of ['data-hud-layout-preview','data-hud-author-toolbar','data-hud-author-profile','data-hud-author-drag','data-hud-author-add-slot','data-hud-author-add-column','data-hud-author-portraits-local','data-hud-author-portraits-opponent','data-hud-author-apply','data-hud-author-test'])assert.ok(editor.includes(selector),selector);
 assert.doesNotMatch(editor,/data-hud-layout-profile/,'obsolete competing authoring form must not return');
 required(trial,combat+'src/contracts/capture-hud-layout-v1.js');
 const author=read(trial,combat+'src/ui/capture-hud-visual-author-v1.js').toString('utf8');
 const preview=read(trial,combat+'src/ui/capture-hud-layout-preview-v1.js').toString('utf8');
 assert.match(author,/mountCaptureHudVisualAuthorV1/);
 assert.match(author,/data-hud-author-apply/);
 assert.match(author,/data-hud-author-test/);
 assert.match(preview,/mountCaptureHudLayoutPreviewV1/);
 assert.equal(fs.existsSync(path.join(trial,combat+'src/ui/capture-hud-layout-editor-v1.js')),false,'retired parallel editor must not ship');
 const handoff=read(trial,explorer+'combat-preview/examples/dom-demo/exploration-encounter.js').toString('utf8');
 assert.match(handoff,/hudLayout/);
 const media=explorer+'capture-assets/assets/library/capture/creatures/veuve_jaune/animations/';
 const expected={
  'attack-opponent-6f-20261125.webp':'70f57aa1927fc7adabf5590b0158a40a09aff367',
  'attack-player-9f-20261125.webp':'f2a4fd616d335b1ff1137ddcec256eddf76db563',
  'movement-opponent-5f-20261125.webp':'b07de3a498687dc16c79b1c9946bf36b9f275853',
  'movement-player-6f-20261125.webp':'ebd9f0a275d2a0b656dc307842ded15cbe308f00'};
 for(const [file,blob] of Object.entries(expected)){
  const bytes=read(trial,media+file);
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.equal(crypto.createHash('sha1').update('blob '+bytes.length+String.fromCharCode(0)).update(bytes).digest('hex'),blob);
 }
});


test('PWA ships native manual building doors and Capture-owned merchant Tester',()=>{
 const sculpt=read(trial,'vendor/exploration-lab/src/sculpt-lab-main.js').toString('utf8');
 const html=read(trial,'vendor/exploration-lab/sculpt-lab.html').toString('utf8');
 const portals=read(trial,'vendor/exploration-lab/src/world/portal-model.js').toString('utf8');
 const merchant=read(trial,'assets/gensrpg/capture-v2/adventure-merchant-play-v1.mjs').toString('utf8');
 assert.match(portals,/isManualBuildingPortal/);
 assert.match(portals,/resolvePortalWaypoint/);
 assert.match(sculpt,/openEditorMerchantTest/);
 assert.match(sculpt,/arrivalPortalId/);
 assert.match(html,/id="npc-merchant-test-frame"/);
 assert.match(merchant,/openPreview/);
});

test('Dracendre 24 real idle frames are shipped by the one canonical visual library and V11 showcase',()=>{
 const catalog=json(trial,'vendor/exploration-lab/capture-assets/data/assets/catalog/global-visual-assets.v1.json');
 assert.equal(catalog.counts.assets,555);
 assert.equal(catalog.counts.sprites,305);
 const dracendre=json(trial,'vendor/combat-lab/data/capture/showcase/crea_dracendre.capture-creature-transfer-v1.json').draft;
 assert.equal(dracendre.id,'crea_dracendre');
 assert.equal(dracendre.presentation.version,11);
 const idle=dracendre.presentation.visual.idle;
 assert.equal(idle.mode,'both');
 for(const view of ['front','back'])assert.equal(idle[view].displayScale,1.2);
 for(const [role,side,digest] of [
  ['opponent','face','f65b7bf068d04a7dda64748a3e12a8ae8c70f65432ccaa0ff46c31b9b8beaf46'],
  ['player','dos','164f839b07d537e84755eff03e54711694d4701a5aceaf5ff4c89b4cdf767275']
 ]){
  const id='pack:capture:creature-braisombre-idle-'+role+'-gif-v1';
  assert.equal(idle[side==='face'?'frontAssetId':'backAssetId'],id);
  const asset=catalog.assets.find(x=>x.id===id);
  assert.ok(asset,'GIF asset must exist in the single catalog');
  const gif=read(trial,'vendor/exploration-lab/capture-assets/assets/library/'+asset.resource.file);
  assert.equal(gif.subarray(0,6).toString('ascii'),'GIF89a');
  assert.equal(gif.readUInt16LE(6),512);assert.equal(gif.readUInt16LE(8),512);
  assert.equal(sha256(gif),digest,'original author 12-frame idle must not be changed');
 }
 for(const [slot,id] of [
  ['movement','pack:capture:creature-braisombre-movement-face-12-v1'],
  ['movementBack','pack:capture:creature-braisombre-movement-dos-12-v1'],
  ['rangedAttack','pack:capture:creature-braisombre-attack-face-12-v1'],
  ['rangedAttackBack','pack:capture:creature-braisombre-attack-dos-12-v1']
 ])assert.equal(dracendre.presentation.visual[slot].assetId,id);
});
test('Veuve jaune retains all four author-approved view actions in the certified PWA',()=>{
 const creature=json(trial,'vendor/combat-lab/data/capture/showcase/veuve-jaune.capture-creature-transfer-v1.json').draft;
 assert.equal(creature.id,'veuve-jaune');
 for(const [slot,id] of [
  ['movement','pack:capture:creature-veuve-jaune-movement-opponent-5-20261125'],
  ['movementBack','pack:capture:creature-veuve-jaune-movement-player-6-20261125'],
  ['rangedAttack','pack:capture:creature-veuve-jaune-attack-opponent-6-20261125'],
  ['rangedAttackBack','pack:capture:creature-veuve-jaune-attack-player-9-20261125']
 ])assert.equal(creature.presentation.visual[slot].assetId,id);
 assert.deepEqual(creature.presentation.visual.rangedAttackPlacement.back,{x:0,y:-20});
 assert.equal(creature.combat.maxHp,110);
});

test('85 certified Genesis decor WebPs ship once with their exact native definitions',()=>{
 const owner='vendor/exploration-lab/';
 const manifestPath='assets/exploration/objects/manifest.genesis-decor-20261125.json';
 const raw=read(trial,owner+manifestPath);
 assert.equal(crypto.createHash('sha1').update('blob '+raw.length+String.fromCharCode(0)).update(raw).digest('hex'),'7da7dc825f189df7e82cbf50952b1a1ca1862f62');
 const m=JSON.parse(raw);
 assert.equal(m.assetCount,85);assert.equal(m.sourceCount,77);assert.equal(m.bytes,4298742);
 assert.equal(m.assets.length,85);
 assert.equal(new Set(m.assets.map(x=>x.sha256)).size,85);
 assert.equal(new Set(m.assets.map(x=>x.assetId)).size,85);
 assert.equal(m.assets.filter(x=>x.traversable).length,32);
 const registry=read(trial,owner+'src/objects/object-definition-catalog.js').toString('utf8');
 const adapter=read(trial,owner+'src/assets/world-object-asset-adapter.js').toString('utf8');
 for(const rec of m.assets){
  const bytes=read(trial,owner+rec.file);
  assert.equal(bytes.length,rec.bytes,rec.file);
  assert.equal(sha256(bytes),rec.sha256,rec.file);
  assert.equal(bytes.toString('ascii',8,12),'WEBP');
  assert.ok(registry.includes(rec.definitionId),rec.definitionId);
  assert.ok(adapter.includes(rec.assetId)&&adapter.includes(rec.file),rec.assetId);
  assert.equal(fs.existsSync(path.join(trial,rec.file)),false,'no parallel decor copy');
  assert.equal(fs.existsSync(path.join(site,rec.file)),false,'no root decor copy');
  assert.equal(fs.existsSync(path.join(trial,owner+rec.archive)),false,'source archives excluded');
  assert.equal(fs.existsSync(path.join(site,rec.archive)),false);
 }
});


test('World Builder quota fix ships exact native storage owners',()=>{
 const owner='vendor/exploration-lab/';
 for(const [file,expected] of [["src/storage/world-document-web-storage-codec-v1.js","959dc6461a6d6d96ea38f009a2f4c810d413f2d2"],["src/builder/world-assembler-handoff.js","6964ad0d1c18c89b25f61485f66446335b0c605e"],["src/builder/exploration-world-document-library-v1.js","817c14a2072df06011b024dc18aefb5f02a908e2"],["src/storage/world-document-release-access-v1.js","702459a960960fc3474b7b1ba42796ca83bcc362"],["src/storage/world-document-indexeddb-store-v1.js","2d006661573225b5068ed3f00bd196de03bafded"],["src/storage/world-document-transactional-owner-v1.js","31d75b018cd04e56fdb070faa881aca4f873e11e"]]){
  const bytes=read(trial,owner+file);
  assert.equal(crypto.createHash('sha1').update('blob '+bytes.length+String.fromCharCode(0)).update(bytes).digest('hex'),expected,file);
 }
});

// Mandatory physical gate for this certified release.
test('approved water/lava atlases travel once through the canonical Exploration owner',()=>{
 assert.equal(explorationSha,'26a0f15f97db0d39d91dca13999d537b8f8af7dc');
 const owner='vendor/exploration-lab/';
 const dir='assets/exploration/materials/forest/water/animated/';
 const sizes={eau_bleue_profonde:740465,eau_turquoise:971091,eau_riviere:650338,eau_marais:649825,lave:1000934};
 let sum=0;
 assert.deepEqual(fs.readdirSync(path.join(trial,owner+dir)).sort(),Object.keys(sizes).map(x=>x+'.png').sort());
 for(const [name,size] of Object.entries(sizes)){
  const b=read(trial,owner+dir+name+'.png');
  assert.equal(b.length,size);assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');
  assert.equal(b.readUInt32BE(16),1008);assert.equal(b.readUInt32BE(20),756);sum+=b.length;
  assert.equal(fs.existsSync(path.join(trial,dir,name+'.png')),false);
 }
 assert.equal(sum,4012653);
 for(const base of [site,trial,path.join(trial,owner)])
  assert.equal(fs.existsSync(path.join(base,'Genesis_textures_animees_eau_lave.zip')),false);
 const html=read(trial,owner+'sculpt-lab.html').toString('utf8');
 assert.match(html,/value="water\.lava"/);assert.match(html,/id="water-fps"/);assert.match(html,/id="water-foam"/);
 const sprites=read(trial,owner+'src/render/animated-surface-sprites-v1.js').toString('utf8');
 assert.match(sprites,/loadAnimatedSurfaceAtlas/);
});

// Byte-exact replacement of the 48 canonical walking frames from #565.
test('green hero walk frames are the exact certified Exploration blobs, without author archive duplication',()=>{
 const owner='vendor/exploration-lab/';
 const expected={
  "assets/exploration/actors/official/02_heros_vert/frames/E/00.png": "634f800c7517bcc7e5cf5a2ab08ea4c698fc23eb",
  "assets/exploration/actors/official/02_heros_vert/frames/E/01.png": "b49642d62056fdb227c4f0546e56490d086d0c55",
  "assets/exploration/actors/official/02_heros_vert/frames/E/02.png": "ab479e214694bcd5a7e029777cc888a9bd108c7a",
  "assets/exploration/actors/official/02_heros_vert/frames/E/03.png": "ce68a91f05830d2028f68d143db4feb992030fad",
  "assets/exploration/actors/official/02_heros_vert/frames/E/04.png": "8c354e4a49052237668b8972f7b10edbfc5518f1",
  "assets/exploration/actors/official/02_heros_vert/frames/E/05.png": "ee0d5220ccbab0ffbc503f3621e5887600a5e244",
  "assets/exploration/actors/official/02_heros_vert/frames/N/00.png": "bbb79f2af544263625e28faefe83ce68d7bdc300",
  "assets/exploration/actors/official/02_heros_vert/frames/N/01.png": "f60b8386cbd62ae1eb85c04fbf8f866ca1e71146",
  "assets/exploration/actors/official/02_heros_vert/frames/N/02.png": "ab5e07eec42b257b7dd9d6fa3893fce00952b5c6",
  "assets/exploration/actors/official/02_heros_vert/frames/N/03.png": "a29b6452e90c42fdde8eba54754e6884c003dae3",
  "assets/exploration/actors/official/02_heros_vert/frames/N/04.png": "52e199761bc14a5a9cd12a86512f778e1ca81e1b",
  "assets/exploration/actors/official/02_heros_vert/frames/N/05.png": "2e5a181e30e20001f004a00a72376643aba92ebd",
  "assets/exploration/actors/official/02_heros_vert/frames/NE/00.png": "5cf21e8e2f1b89d274d4d56337326bf558af9e9d",
  "assets/exploration/actors/official/02_heros_vert/frames/NE/01.png": "1670e5fd6e155d7e30c6ac400abf1cd611517104",
  "assets/exploration/actors/official/02_heros_vert/frames/NE/02.png": "8f0c686ef70258c19be5143171ee6d812bec0ab9",
  "assets/exploration/actors/official/02_heros_vert/frames/NE/03.png": "97bb9db76c3dacae888226c71d30634bae4ca578",
  "assets/exploration/actors/official/02_heros_vert/frames/NE/04.png": "827b4e8c1b16225b7560afb0a43eaa8106314350",
  "assets/exploration/actors/official/02_heros_vert/frames/NE/05.png": "f7ce4733b49d7d001398bad7898d40ea11e09d56",
  "assets/exploration/actors/official/02_heros_vert/frames/NW/00.png": "111a6bf0893770463737116a0536e7c7c4d09dad",
  "assets/exploration/actors/official/02_heros_vert/frames/NW/01.png": "4584f91481e31bc300a40c82bbdcab9a827150cf",
  "assets/exploration/actors/official/02_heros_vert/frames/NW/02.png": "621fa1d63b5369fae5888485324fe06ee7f117bf",
  "assets/exploration/actors/official/02_heros_vert/frames/NW/03.png": "a5129e1bfba5e3a13f70aff16e71f8503f1adf02",
  "assets/exploration/actors/official/02_heros_vert/frames/NW/04.png": "c2af881fc889fc4a42619881c783d9740c86086e",
  "assets/exploration/actors/official/02_heros_vert/frames/NW/05.png": "e131191af7cd74ff7abfe8c1dca3905248f21f1c",
  "assets/exploration/actors/official/02_heros_vert/frames/S/00.png": "eddce64b56703eb7149270a18349a48a1f50172c",
  "assets/exploration/actors/official/02_heros_vert/frames/S/01.png": "24cfbe29c8905192696a8b32eadd04fb68dc6f51",
  "assets/exploration/actors/official/02_heros_vert/frames/S/02.png": "312487c3ee0430e0bd13c8a585fcff1a19c4292b",
  "assets/exploration/actors/official/02_heros_vert/frames/S/03.png": "e8d9281615fceaa1c8e406864ff38fd8cd53032c",
  "assets/exploration/actors/official/02_heros_vert/frames/S/04.png": "72a223b1b7d552e1d3a960d1fe28f08ed1f8b9cb",
  "assets/exploration/actors/official/02_heros_vert/frames/S/05.png": "18aa1ac60ca9fea482e5f913299e3e61692cd114",
  "assets/exploration/actors/official/02_heros_vert/frames/SE/00.png": "e1257d5dc2d8fa5ca18dfb5bb74bdb5c79775506",
  "assets/exploration/actors/official/02_heros_vert/frames/SE/01.png": "126d53f4c7029090373f48ce9ca203e012124219",
  "assets/exploration/actors/official/02_heros_vert/frames/SE/02.png": "a5866d1c661f3770ec8923c9041290e40da0cb91",
  "assets/exploration/actors/official/02_heros_vert/frames/SE/03.png": "aad173987dc7956aab4f3d70ffcfe44bcad50ac4",
  "assets/exploration/actors/official/02_heros_vert/frames/SE/04.png": "5b2d05ce7b4f4ab1f8ee3367d38c647b3164e109",
  "assets/exploration/actors/official/02_heros_vert/frames/SE/05.png": "fb4964c11b5e9f01cab7743e4ed7f84dfb818951",
  "assets/exploration/actors/official/02_heros_vert/frames/SW/00.png": "c4e51577994c4d873c96200426c370e86a233e41",
  "assets/exploration/actors/official/02_heros_vert/frames/SW/01.png": "b565e9abe2e75348b6471a646b5f77bd46b8f624",
  "assets/exploration/actors/official/02_heros_vert/frames/SW/02.png": "f1ac16a6675a062292cd208f246645a165653c39",
  "assets/exploration/actors/official/02_heros_vert/frames/SW/03.png": "9e2a297526aec5c437631ac070b36e6aaf4a47b5",
  "assets/exploration/actors/official/02_heros_vert/frames/SW/04.png": "af90c7b11feadf9fc293da0979cf9150b92c6211",
  "assets/exploration/actors/official/02_heros_vert/frames/SW/05.png": "e9afc9de5f7c9fa152351ea8597ed95a5d6d51ed",
  "assets/exploration/actors/official/02_heros_vert/frames/W/00.png": "b4fa816b4aed1658e89e54faba00794c018b8f8d",
  "assets/exploration/actors/official/02_heros_vert/frames/W/01.png": "2019cc64cd4a66df24ecaeb50e459ccf5e3fcf9c",
  "assets/exploration/actors/official/02_heros_vert/frames/W/02.png": "0319407556b07ba499a4f642ec240a31e236d2c9",
  "assets/exploration/actors/official/02_heros_vert/frames/W/03.png": "090f1f362685591e676267fbb6047b2466e0da2b",
  "assets/exploration/actors/official/02_heros_vert/frames/W/04.png": "72d21f94a93b142c716a8960a18007866ee7fe5a",
  "assets/exploration/actors/official/02_heros_vert/frames/W/05.png": "e3b0e7aed561807af1eed48fc5d1665932cb7504"
};
 assert.equal(Object.keys(expected).length,48);
 for(const [rel,hash] of Object.entries(expected)){
  const b=read(trial,owner+rel);
  assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a',rel);
  assert.equal(b.readUInt32BE(16),128,rel);assert.equal(b.readUInt32BE(20),160,rel);
  assert.equal(crypto.createHash('sha1').update('blob '+b.length+String.fromCharCode(0)).update(b).digest('hex'),hash,rel);
  assert.equal(fs.existsSync(path.join(trial,rel)),false,rel);
 }
 for(const root of [site,trial,path.join(trial,owner)])assert.equal(fs.existsSync(path.join(root,'GenSRPG_heros_vert_complet_test_jeu.zip')),false);
});

test('PWA adopts the single durable WorldDocument owner and native graphical library',()=>{
 const owner='vendor/exploration-lab/';
 const access=read(trial,owner+'src/storage/world-document-release-access-v1.js').toString('utf8');
 const capture=read(trial,'assets/gensrpg/capture-v2/world-native-access-v1.mjs').toString('utf8');
 assert.match(access,/WORLD_DOCUMENT_RELEASE_OWNER_V1='indexeddb'/);
 assert.match(capture,/access\?\.durable!==true/);
 assert.doesNotMatch(capture,/readWorldAssemblerDraft|contract==='legacy'/);
 for(const rel of ['src/assets/sculpt-graphic-catalog-v1.js','src/assets/graphic-library-import-v1.js','src/assets/graphic-library-backup-v1.js','src/objects/object-library-picker-v1.js'])required(trial,owner+rel);
 for(const base of [site,trial,path.join(trial,owner)])assert.equal(fs.existsSync(path.join(base,'Genesis_Bordures_Routes_v1.zip')),false);
});


test('all fourteen certified road border WebP files travel once through native Exploration',()=>{
 const owner='vendor/exploration-lab/',dir='assets/exploration/materials/road-borders/';
 const names=[...['naturelle','cailloux','pierre_taillee','beton','bois','neige'].map(n=>'bandes/bordure_'+n+'.webp'),...Array.from({length:8},(_,i)=>'sprites_cailloux/caillou_'+String(i+1).padStart(2,'0')+'.webp')];
 let sum=0;for(const name of names){const b=read(trial,owner+dir+name);assert.equal(b.subarray(0,4).toString(),'RIFF');assert.equal(b.subarray(8,16).toString(),'WEBPVP8L');sum+=b.length;assert.equal(fs.existsSync(path.join(trial,dir,name)),false);}
 assert.equal(sum,415644);
 for(const base of [site,trial,path.join(trial,owner)])assert.equal(fs.existsSync(path.join(base,'Genesis_Bordures_Routes_v1.zip')),false);
 for(const name of ['road-border-renderer-v1.js','road-border-contour-v3.js'])required(trial,owner+'src/render/'+name);
});
