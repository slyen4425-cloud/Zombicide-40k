'use strict';
// Real app gate: open the FOUR-MODE GenSrpg root, choose Capture, and use
// the two unchanged, main-pinned Lab UIs. No legacy Capture harness / fake data.
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
const {PNG}=require('pngjs');
const root=path.resolve(__dirname,'..');
const vendor=path.resolve(process.env.CAPTURE_V2_SITE||'_site');
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8',
 '.mjs':'text/javascript;charset=utf-8','.json':'application/json;charset=utf-8',
 '.css':'text/css;charset=utf-8','.webmanifest':'application/manifest+json',
 '.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml',
 '.mp3':'audio/mpeg','.wav':'audio/wav'};
const server=http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,'http://localhost');
  const rel=decodeURIComponent(url.pathname).replace(/^\/+/,'')||'index.html';
  if(rel.split('/').includes('..')){res.writeHead(403).end();return;}
  let file,body;
  // The browser must consume ONLY the built preview artifact. Falling back
  // to the Git checkout hides 404s that would recur in Android / HTTPS.
  for(const folder of [vendor]){
   const candidate=path.resolve(folder,rel);
   if(!candidate.startsWith(folder+path.sep))continue;
   try{body=await fs.readFile(candidate);file=candidate;break;}catch{}
  }
  if(!body){res.writeHead(404).end('Missing real file: '+rel);return;}
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream',
    'Cache-Control':'no-store'}).end(body);
 }catch(e){res.writeHead(500).end(String(e));}
});
test('real four-mode root enters the NEW Capture Shell and opens original pinned Labs, no old Hub',
 {timeout:185000},async()=>{
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let browser,context;
 const errors=[];
 try{
  browser=await chromium.launch({headless:true});
  context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true,
   serviceWorkers:'block',locale:'fr-FR'});
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  const page=await context.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',
   {waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>!!window.GensCaptureV2&&
   !!window.GensShellModuleLaunchV1&&
   document.querySelectorAll('button.gensRootModeCard').length===4,null,{timeout:60000});
  assert.equal(await page.locator('button.gensRootModeCard').count(),4);
  assert.equal(await page.locator('#captureGameHub').count(),0);
  assert.equal(await page.evaluate(()=>window.GensCaptureV1.VERSION),'2.0.0');
  assert.equal(await page.evaluate(()=>window.GensCaptureV2.status().active),false);
  // Each other original module keeps its independent Shell navigation.
  for(const other of ['survival','adventure','pvp']){
    await page.locator('button.gensRootModeCard.'+other).tap();
    await page.locator('#gensFamilyHome').waitFor({state:'visible'});
    assert.equal(await page.locator('#gensCaptureV2Root').count(),0,
     other+' must never start the Capture runtime');
    await page.locator('#gensFamilyHome button[onclick="showGensRootHome()"]').tap();
    await page.locator('#gensRootHome').waitFor({state:'visible'});
  }
  // The original four-mode Capture card must start the NEW module directly.
  // There is deliberately no old RPG Universe profile / pregame / starter flow.
  await page.locator('button.gensRootModeCard.capture').tap();
  await page.locator('#gensCaptureV2Root').waitFor({state:'visible'});
  assert.equal(await page.evaluate(()=>window.GensShellModuleLaunchV1.activeModule()),'capture');
  assert.equal(await page.locator('#gensFamilyHome:visible').count(),0);
  assert.equal(await page.locator('#pregameSetup:visible').count(),0);
  assert.equal(await page.locator('#gensGameHome:visible').count(),0);
  assert.equal(await page.locator('#gensCaptureV2Root iframe').count(),0);
  const buttons=page.locator('#gensCaptureV2Root [data-capture-v2-view]');
  assert.equal(await buttons.count(),10,
   'eight native Lab destinations including the real hero editor, one item editor and one game');
  assert.equal(await page.locator('#gensCaptureV2Root [data-editor-group="economy"] [data-capture-v2-view="items"]').count(),1,
   'one official item editor is grouped under Objets et économie');
  assert.equal(await page.locator('#gensCaptureV2Root > nav.gensCaptureV2MainMenu > button').count(),2,
   'the game home shows only Jouer and Éditeurs');
  assert.equal(await page.locator('#gensCaptureV2Root [data-editor-group="world"] button').count(),2,
   'Carte du monde and native Terrain 2.5D live in the SAME menu group');
  assert.equal(await page.locator('#gensCaptureV2Root [data-capture-v2-view="explore"]').count(),0,
   'the old duplicate Exploration 2.5D entry must be gone');
  await page.locator('#gensCaptureV2Root [data-capture-v2-menu="editors"]').tap();
  assert.equal(await page.locator('#gensCaptureV2Root [data-editor-group="heroes"] [data-capture-v2-view="heroes"]').count(),1,
   'hero editor appears once, in the Héros editor group');
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="heroes"]').tap();
  assert.equal(await page.evaluate(()=>window.GensCaptureV2.status().view),'heroes');
  const heroFrame=page.frameLocator('#gensCaptureV2Root iframe[data-capture-v2-native="exploration"]');
  await heroFrame.locator('#hero-official-grid .hero-preset').first().waitFor({timeout:45000});
  assert.equal(await heroFrame.locator('#hero-official-grid .hero-preset').count(),12,
   'all twelve original official hero models must be offered in the same native Exploration editor');
  assert.equal(await heroFrame.locator('input#hero-image[type="file"]').count(),1,
   'author may still import any PNG/WebP of their own, without being restricted to presets');
  await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').tap();
  assert.equal(await page.evaluate(()=>window.GensCaptureV2.status().view),null);
  // The single Adventure game entry and eight genuinely distinct Lab
  // destinations preserve the original native URLs and fullscreen.
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="adventure"]').tap();
  const adventureFrame=page.frameLocator('#gensCaptureV2Root iframe[data-capture-v2-native="capture"]');
  // Native Adventure is a type=module iframe; its DOM can exist BEFORE
  // the module has loaded the published Bestiary and initialized rules.
  // Wait for the real official catalog before validating its preset values.
  try {
    await adventureFrame.locator('#adventure-create:not([disabled])')
     .waitFor({timeout:25000});
  } catch(error) {
    // Preserve the strict real-catalogue gate. Its true failure reason must be
    // visible in CI rather than reduced to an unhelpful 25-second timeout.
    const observed=await adventureFrame.locator('body').evaluate(body=>({
      status:body.querySelector('#adventure-status')?.textContent,
      statusError:body.querySelector('#adventure-status')?.dataset.error,
      bestiary:body.querySelector('#adventure-bestiary-count')?.textContent,
      starterOptions:[...body.querySelectorAll('#adventure-starter option')]
       .map(o=>({value:o.value,disabled:o.disabled,label:o.textContent})).slice(0,12)
    })).catch(e=>({frameError:String(e)}));
    throw new Error('Official Bestiary starter never became playable: '+
      JSON.stringify({observed,pageErrors:errors})+'; '+String(error));
  }
  assert.equal(await adventureFrame.locator('#adventure-advanced-panel').getAttribute('open'),null,
   'simple mode starts with all advanced settings closed');
  const nativeHeroes=adventureFrame.locator('#adventure-official-hero-grid .adventure-official-hero-card');
  await nativeHeroes.first().waitFor({state:'visible',timeout:45000});
  assert.equal(await nativeHeroes.count(),12,
   'the first game preparation displays all twelve official Exploration heroes');
  assert.equal(await adventureFrame.locator('#adventure-hero-choice').count(),1,
   'the official hero gallery uses the one existing AdventureSession selector');
  // Tap a real published model and prove it installs only the chosen 8-direction
  // HeroDefinition in the one native Exploration IndexedDB before game creation.
  await nativeHeroes.first().tap();
  await page.waitForFunction(()=>{
   const doc=document.querySelector('#gensCaptureV2Root iframe[data-capture-v2-native="capture"]')?.contentDocument;
   return /^hero\.user\.[a-f0-9-]{36}$/.test(doc?.querySelector('#adventure-hero-choice')?.value??'');
  },null,{timeout:45000});
  assert.equal(await nativeHeroes.first().getAttribute('aria-pressed'),'true');
  assert.equal(await adventureFrame.locator('#adventure-player-alias').isVisible(),true,
   'Hero nickname is in the immediately visible new-game section');
  const initialStarter=await adventureFrame.locator('#adventure-starter').inputValue();
  await adventureFrame.locator('#adventure-starter-cards .adventure-starter-card').first().tap();
  await adventureFrame.locator('#adventure-starter-picker').waitFor({state:'visible'});
  const realOfficialCards=adventureFrame.locator('#adventure-starter-gallery .adventure-gallery-card:not([disabled])');
  assert.ok(await realOfficialCards.count()>0,'the illustrated picker reads official playable creatures');
  await realOfficialCards.first().tap();
  assert.equal(await adventureFrame.locator('#adventure-starter').inputValue(),initialStarter,
    'visual selection writes the original canonical starter field');
  assert.equal(await adventureFrame.locator('#adventure-starter-picker').isVisible(),false,
    'the real Bestiary modal closes after a selection');
  await adventureFrame.locator('#adventure-advanced-panel > summary').tap();
  assert.equal(await adventureFrame.locator('#adventure-advanced-panel').getAttribute('open'),'',
    'advanced settings must be visibly accessible in one gesture');
  assert.equal(await adventureFrame.locator('#adventure-rules-panel').getAttribute('open'),null,
   'new game opens without developer settings exposed by default');
  assert.equal(await adventureFrame.locator('#adventure-loot-panel').getAttribute('open'),null);
  await adventureFrame.locator('#adventure-rules-panel > summary').tap();
  await adventureFrame.locator('#adventure-xp-base').waitFor({timeout:15000});
  // Real game preset, sourced from the existing Core rules and Combat registry.
  assert.equal(await adventureFrame.locator('#adventure-xp-mode').inputValue(),'custom');
  assert.equal(await adventureFrame.locator('#adventure-level-max').inputValue(),'100');
  assert.equal(await adventureFrame.locator('#adventure-stat-points-per-level').inputValue(),'20');
  assert.equal(await adventureFrame.locator('#adventure-xp-bands .xp-band-row').count(),5);
  assert.equal(await adventureFrame.locator('#adventure-xp-bands .xp-band-row').first()
   .locator('[data-xp-band-cost]').inputValue(),'2000');
  // Full real-browser regression: before a first game exists, edit and SAVE
  // creator settings, close the official nested Adventure UI and reopen it.
  // In-memory form state disappears at iframe teardown. Only Core Storage
  // may recover the authored rules; there must still be no playable save.
  await adventureFrame.locator('#adventure-xp-base').fill('733');
  await adventureFrame.locator('#adventure-loot-panel > summary').tap();
  await adventureFrame.locator('#adventure-save-rules').tap();
  // Creator choices must be saved independently before any game, on the REAL
  // nested Adventure screen, not via a helper that bypasses its button.
  await adventureFrame.locator('#adventure-creator-panel > summary').tap();
  await adventureFrame.locator('#adventure-gm-enabled').check();
  await adventureFrame.locator('#adventure-join-enabled').check();
  await adventureFrame.locator('#adventure-guest-edit-progression').check();
  await adventureFrame.locator('#adventure-guest-edit-rewards').check();
  await adventureFrame.locator('#adventure-guest-allocate-stats').uncheck();
  await adventureFrame.locator('#adventure-save-control').tap();
  const pregameCreator=await adventureFrame.locator('#adventure-save-control').evaluate(()=>{
    const raw=localStorage.getItem('gensrpg.capture.v2.adventure.creator-draft.v1');
    return raw?JSON.parse(raw):null;
  });
  assert.equal(pregameCreator?.settings?.hostIsGameMaster,true);
  assert.equal(pregameCreator?.settings?.joinEnabled,true);
  assert.equal(pregameCreator?.settings?.guestPermissions?.editRewards,true);
  assert.equal(pregameCreator?.settings?.guestPermissions?.allocateOwnCreatureStats,false);
  const pregameDraft=await adventureFrame.locator('#adventure-save-rules').evaluate(()=>{
    const draft=localStorage.getItem('gensrpg.capture.v2.adventure.rules-draft.v1');
    const game=localStorage.getItem('gensrpg.capture.v2.adventure.save.v1');
    return {draft:draft?JSON.parse(draft):null,game};
  });
  assert.equal(pregameDraft.draft?.xp?.baseVictoryXp,733,
   'creator draft must be written to existing Core Storage before first game');
  assert.equal(pregameDraft.game,null,
   'a saved settings draft must never create or overwrite a playable game');
  await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').tap();
  assert.equal(await page.locator('#gensCaptureV2Root iframe').count(),0);
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="adventure"]').tap();
  await adventureFrame.locator('#adventure-create:not([disabled])').waitFor({timeout:25000});
  assert.equal(await adventureFrame.locator('#adventure-xp-base').inputValue(),'733',
   'pre-game creator settings must survive actual iframe teardown and re-entry');
  await adventureFrame.locator('#adventure-advanced-panel > summary').tap();
  await adventureFrame.locator('#adventure-rules-panel > summary').tap();
  assert.equal(await adventureFrame.locator('#adventure-gm-enabled').isChecked(),true,
   'creator MJ preference must survive real iframe teardown before first game');
  assert.equal(await adventureFrame.locator('#adventure-join-enabled').isChecked(),true);
  assert.equal(await adventureFrame.locator('#adventure-guest-edit-rewards').isChecked(),true);
  assert.equal(await adventureFrame.locator('#adventure-guest-allocate-stats').isChecked(),false);
  await adventureFrame.locator('#adventure-creator-panel > summary').tap();
  await adventureFrame.locator('#adventure-gm-enabled').check();
  await adventureFrame.locator('#adventure-join-enabled').check();
  await adventureFrame.locator('#adventure-guest-edit-progression').check();
  await adventureFrame.locator('#adventure-create').waitFor({timeout:15000});
  // Real published Bestiary data must populate this UI, not a mock species
  // registry. Create and reopen a native Capture-only save from the genuine
  // (SHA-pinned) Combat catalogue. The old Tester is not a game session.
  const species=await adventureFrame.locator('#adventure-starter option:not([disabled])').count();
  assert.ok(species>=1,'at least one official Bestiary creature is playable');

  // Executed against the ACTUAL pinned Combat Bestiary and Exploration
  // Encounter Catalog, not a copied list of supposed published species.
  const publication=await adventureFrame.locator('#adventure-create').evaluate(async()=>{
    const [
      {captureBestiaryCardsV1},
      {projectCaptureShowcaseEncounterSourceV1},
      {createCaptureCreatureCatalogProvider},
      {createPublishedEncounterCatalogV1}
    ]=await Promise.all([
      import('../../../vendor/combat-lab/src/ui/capture-bestiary-cards-v1.js'),
      import('../../../vendor/exploration-lab/src/capture/capture-showcase-encounter-source-v1.js'),
      import('../../../vendor/exploration-lab/src/capture/capture-creature-catalog-provider.js'),
      import('./adventure-encounter-catalog-v1.mjs')
    ]);
    const json=async rel=>{
      const response=await fetch(new URL(rel,document.baseURI),{cache:'no-store'});
      if(!response.ok)throw Error('Official source missing HTTP '+response.status+': '+rel);
      return response.json();
    };
    const [bundle,assets,stats,skills,manifest]=await Promise.all([
      json('../../../vendor/exploration-lab/combat-preview/data/capture/showcase/encounter-bundle.v1.json'),
      json('../../../vendor/exploration-lab/capture-assets/data/assets/catalog/global-visual-assets.v1.json'),
      json('../../../vendor/combat-lab/data/capture/monster-capture-stat-registry.v1.json'),
      json('../../../vendor/combat-lab/data/combat/skills/catalog.v1.json'),
      json('./delivery-manifest.json')
    ]);
    if(bundle.authorSha!==manifest.combat.sha||bundle.engineSha!==manifest.combat.sha)
      throw Error('Author bundle differs from official Combat SHA');
    const official=captureBestiaryCardsV1({
      creatureTransfers:bundle.creatureTransfers,skillTransfers:bundle.skillTransfers,
      assetCatalog:assets,statRegistry:stats,nativeSkills:skills.entries??[]
    });
    const native=createCaptureCreatureCatalogProvider(
      projectCaptureShowcaseEncounterSourceV1(bundle.creatureTransfers));
    const filtered=createPublishedEncounterCatalogV1({
      bestiaryCards:official,captureCatalog:native
    });
    const allowed=new Set(official.filter(c=>c.skills?.some(s=>s.state==='ready')).map(c=>c.id));
    const records=filtered.listCreatures();
    return {
      combatSha:manifest.combat.sha,
      officialCount:official.length,sourceCount:native.listCreatures().length,
      filteredCount:records.length,
      leaked:records.filter(c=>!allowed.has(c.id)).map(c=>c.id),
      changed:records.filter(c=>native.resolveCreature(c.id)?.spawnChance!==c.spawnChance ||
        JSON.stringify(native.resolveCreature(c.id)?.elements)!==JSON.stringify(c.elements)).map(c=>c.id),
      nonPublishedIds:native.listCreatures().filter(c=>!allowed.has(c.id)).map(c=>c.id),
      survivors:records.map(c=>c.id)
    };
  });
  assert.ok(publication.officialCount>=1,'Bestiary must originate from native Combat');
  assert.ok(publication.sourceCount>=publication.filteredCount);
  assert.deepEqual(publication.leaked,[],'Never spawn an unpublished Combat creature');
  assert.deepEqual(publication.changed,[],'Exploration owns rarity and elements, no rewritten gameplay');
  assert.equal(publication.survivors.length,publication.filteredCount);

  assert.equal(await adventureFrame.locator('#adventure-hero-xp-enabled').isChecked(),false,
    'Capture hero has no XP by default');
  await adventureFrame.locator('#adventure-hero-xp-enabled').check();
  await adventureFrame.locator('#adventure-hero-xp-share').fill('35');
  await adventureFrame.locator('#adventure-hero-xp-per-level').fill('400');
  await adventureFrame.locator('#adventure-hero-talent-points').fill('2');
  await adventureFrame.locator('#adventure-xp-base').fill('777');
  // The rules-only draft screen was torn down above; type the player's name
  // in the current NEW-game screen immediately before the authoritative save.
  await adventureFrame.locator('#adventure-player-alias').fill('Mira');
  await adventureFrame.locator('#adventure-starter-count').selectOption('3');
  assert.equal(await adventureFrame.locator('#adventure-starter-reserve select').count(),2,
   'selecting three creatures must provide two genuine reserve choices');
  await adventureFrame.locator('#adventure-create').tap();
  const saved=await adventureFrame.locator('#adventure-save-summary').textContent();
  assert.match(saved,/niveau 1.*0 XP.*configuration enregistrée/,
   'a real Capture-owned save must be created, not just an editor test');
  const stored=await adventureFrame.locator('#adventure-create').evaluate(()=>{
   const index=JSON.parse(localStorage.getItem('gensrpg.capture.v2.adventure.portfolio.v1')||'null');
   if(!index?.selectedSessionId)return null;
   const saved=localStorage.getItem('gensrpg.capture.v2.adventure.slot.v1:'+index.selectedSessionId);
   return saved?JSON.parse(saved):null;
  });
  assert.equal(stored?.schema,'gensrpg-capture-adventure-save-v1');
  assert.equal(stored.hero?.displayName,'Mira',
   'The new-game nickname belongs to AdventureSession, not the template hero');
  assert.match(saved,/Héros Mira/);
  assert.equal(stored?.rules?.xp?.baseVictoryXp,777);
  assert.equal(stored?.rules?.heroProgression?.enabled,true,
    'real Aventure editor must persist author hero opt-in');
  assert.equal(stored?.rules?.heroProgression?.xpGainPercent,35);
  assert.equal(stored?.rules?.heroProgression?.xpPerLevel,400);
  assert.equal(stored?.rules?.progression?.xpCurveMode,'custom');
  assert.equal(stored?.rules?.progression?.statPointsPerLevel,20);
  assert.equal(stored?.rules?.progression?.maxLevel,100);
  assert.equal(stored?.rules?.progression?.xpBands?.[0]?.xpPerLevel,2000);
  assert.equal(stored?.sessionControl?.hostIsGameMaster,true);
  assert.equal(stored?.sessionControl?.joinEnabled,true);
  assert.equal(stored?.sessionControl?.guestPermissions?.editProgression,true);
  assert.equal(stored?.sessionControl?.guestPermissions?.editRewards,true);
  assert.equal(stored?.sessionControl?.guestPermissions?.allocateOwnCreatureStats,false);
  assert.equal(stored?.party?.active?.statAllocations?.health,undefined);
  assert.equal(stored?.hero?.progression?.level,1);
  assert.equal(stored?.hero?.progression?.xp,0);
  assert.equal(stored?.party?.active?.speciesId,
   await adventureFrame.locator('#adventure-starter').inputValue());
  assert.ok(stored?.party?.active?.instanceId);
  assert.equal(stored?.party?.reserve?.length,2,'same canonical save must keep both reserve creatures');
  // Real web app smoke: a second adventure MUST NOT overwrite the first,
  // and loading an earlier save must restore its exact saved rules.
  const firstSession=stored.sessionId;
  const firstOriginal=await adventureFrame.locator('#adventure-create').evaluate(id=>
   localStorage.getItem('gensrpg.capture.v2.adventure.slot.v1:'+id),firstSession);
  await adventureFrame.locator('#adventure-xp-base').fill('123');
  await adventureFrame.locator('#adventure-create').tap();
  const second=await adventureFrame.locator('#adventure-create').evaluate(()=>{
   const index=JSON.parse(localStorage.getItem('gensrpg.capture.v2.adventure.portfolio.v1'));
   return JSON.parse(localStorage.getItem(
    'gensrpg.capture.v2.adventure.slot.v1:'+index.selectedSessionId));
  });
  assert.notEqual(second.sessionId,firstSession,'new game requires a new unique session');
  assert.equal(second.rules.xp.baseVictoryXp,123);
  const unchanged=await adventureFrame.locator('#adventure-create').evaluate(id=>
   localStorage.getItem('gensrpg.capture.v2.adventure.slot.v1:'+id),firstSession);
  assert.equal(unchanged,firstOriginal,'second game must never mutate the first save bytes');
  await adventureFrame.locator('#adventure-save-select').selectOption(firstSession);
  await adventureFrame.locator('#adventure-save-load').tap();
  assert.equal(await adventureFrame.locator('#adventure-xp-base').inputValue(),'777');
  const restored=await adventureFrame.locator('#adventure-create').evaluate(()=>
   JSON.parse(localStorage.getItem('gensrpg.capture.v2.adventure.portfolio.v1')).selectedSessionId);
  assert.equal(restored,firstSession);
  const adventureSrc=await page.locator('#gensCaptureV2Root iframe').getAttribute('src');
  assert.match(adventureSrc,/assets\/gensrpg\/capture-v2\/adventure\.html$/,
    'GenSrpg owns the Adventure configuration, not the Combat/Exploration Labs');
  assert.equal(await page.locator('#gensCaptureV2Root > nav').isVisible(),false);
  await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').tap();
  assert.equal(await page.locator('#gensCaptureV2Root iframe').count(),0);
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="adventure"]').tap();
  const resumed=page.frameLocator('#gensCaptureV2Root iframe[data-capture-v2-native="capture"]');
  await resumed.locator('#adventure-save-summary').waitFor({timeout:15000});
  await page.waitForFunction(()=>{
   const doc=document.querySelector('#gensCaptureV2Root iframe')?.contentDocument;
   return doc?.querySelector('#adventure-xp-base')?.value==='777' &&
    /niveau 1.*0 XP/.test(doc?.querySelector('#adventure-save-summary')?.textContent??'');
  },null,{timeout:20000});
  assert.equal(await resumed.locator('#adventure-xp-base').inputValue(),'777',
   'saved Adventure settings must survive reopening the owned screen');
  assert.equal(await resumed.locator('#adventure-gm-enabled').isChecked(),true,
   'host MJ choice must be restored from saved Core, not just input state');
  assert.equal(await resumed.locator('#adventure-join-enabled').isChecked(),true);
  assert.equal(await resumed.locator('#adventure-guest-edit-progression').isChecked(),true);
  assert.equal(await resumed.locator('#adventure-stat-wallet').count(),0,
   'preparing an adventure must never expose creature stat allocation');
  assert.equal(await resumed.locator('[data-adventure-sheet-tab="stats"]').count(),1,
   'the existing in-game sheet alone must keep the stats tab');

  // Native game handoff — no made-up map, no reused Tester. First prove the
  // actual GenSRPG origin has no WorldDocument and will not create a fake one.
  await resumed.locator('#adventure-play').tap();
  assert.match(await resumed.locator('#adventure-status').textContent(),/World Builder|monde jouable/i);
  assert.equal(await resumed.locator('#adventure-play').isVisible(),true);
  const authored=await resumed.locator('#adventure-play').evaluate(async()=>{
    // The genuine World Builder model/serializer owns the data. This is not
    // a parallel test terrain or a fabricated runtime world.
    const [{createBlankWorldBuilderDraft},{saveWorldAssemblerDraft}]=await Promise.all([
      import('../../../vendor/exploration-lab/src/builder/world-builder-draft.js'),
      import('../../../vendor/exploration-lab/src/builder/world-assembler-handoff.js')
    ]);
    const world=createBlankWorldBuilderDraft({id:'gen-ci-capture-world',width:36*28,height:24*21});
    saveWorldAssemblerDraft(localStorage,world);
    return localStorage.getItem('gensrpg.world-assembler.document.v1');
  });
  assert.ok(authored&&authored.includes('gen-ci-capture-world'),'canonical WorldDocument was not saved');
  await resumed.locator('#adventure-play').tap();
  // Preserve the real-world assertion; if it fails, log the native iframe
  // state instead of guessing whether this is a slow boot or a contract error.
  try{
    await page.waitForFunction(()=>{
      const f=document.querySelector('#gensCaptureV2Root iframe')?.contentDocument?.querySelector('#adventure-play-frame');
      try{return !!f?.contentWindow?.__sculptPlayProbe?.().active &&
        f.contentWindow.__sculptPlayProbe().playing &&
        f.contentDocument.querySelector('#sculpt-canvas')?.width>300;}catch{return false;}
    },null,{timeout:15000});
  }catch(error){
    const state=await page.evaluate(async()=>{
      const doc=document.querySelector('#gensCaptureV2Root iframe')?.contentDocument;
      const native=doc?.querySelector('#adventure-play-frame');
      let probe=null,href=null,canvas=null;
      try{probe=native?.contentWindow?.__sculptPlayProbe?.()??null;
        href=native?.contentWindow?.location?.href??null;
        canvas=native?.contentDocument?.querySelector('#sculpt-canvas')?.width??null;
      }catch(failure){probe={error:String(failure)};}
      const raw=localStorage.getItem('gensrpg.world-assembler.document.v1');
      const worldStorage={bytes:raw?.length??0,areas:null,id:null,loaded:null,error:null};
      if(raw){
        try{
          const json=JSON.parse(raw);worldStorage.id=json.id;
          worldStorage.areas=json.areas?.length??null;
          const owner=await import('/vendor/exploration-lab/src/builder/world-builder-draft.js');
          const imported=owner.importWorldBuilderDocument(raw);
          worldStorage.loaded=imported?.areas?.length??null;
        }catch(error){worldStorage.error=String(error);}
      }
      return {playExists:!!native,playSrc:native?.getAttribute('src')??null,
        href,probe,canvas,worldStorage,
        nativeStartError:native?.contentDocument?.querySelector('#play-start-error-message')?.textContent??null,
        nativeStartErrorVisible:native?.contentDocument?.querySelector('#play-start-error')?.hidden===false,
        selectedWorldId:doc?.querySelector('#adventure-world-select')?.value??null,
        adventureStatus:doc?.querySelector('#adventure-status')?.textContent??null,
        adventureSave:doc?.querySelector('#adventure-save-summary')?.textContent??null};
    });
    throw new Error('Real scoped Adventure map never started: '+JSON.stringify(state)+
      ' / page errors '+JSON.stringify(errors)+' / '+error.message);
  }
  const launched=await resumed.locator('#adventure-play-frame').evaluate(frame=>{
    const w=frame.contentWindow;
    return {session:new URL(w.location.href).searchParams.get('adventureSession'),
      src:w.location.pathname,probe:w.__sculptPlayProbe?.()};
  });
  assert.equal(launched.session,stored.sessionId);
  assert.equal(launched.probe?.heroDisplayName,'Mira',
   'The exact saved hero nickname must reach the official Exploration renderer');
  assert.match(launched.src,/vendor\/exploration-lab\/sculpt-lab\.html$/);
  assert.equal(launched.probe.editorHidden,true);
  const playArea=await resumed.locator('#adventure-play-frame').evaluate(frame=>{
    const rect=frame.getBoundingClientRect();
    return {x:rect.x,y:rect.y,width:rect.width,height:rect.height,
     vw:innerWidth,vh:innerHeight};
  });
  assert.ok(Math.abs(playArea.x)<=2&&Math.abs(playArea.y)<=2,
   'Exploration must start at the full viewport origin');
  assert.ok(Math.abs(playArea.width-playArea.vw)<=3&&
   Math.abs(playArea.height-playArea.vh)<=3,
   'native Exploration gameplay must fill the mobile landscape viewport');
  assert.equal(await resumed.locator('#adventure-fullscreen').isVisible(),true,
   'manual fullscreen action must remain accessible in native gameplay');

  // A game in progress must expose the official GenSRPG character sheet without
  // unmounting or restarting the native Exploration play frame.
  await resumed.locator('#adventure-open-sheet').tap();
  await resumed.locator('#adventure-play-sheet').waitFor({state:'visible'});
  // Opening the in-map sheet now lands directly on the team, as requested.
  // Keep the original Hero view regression by selecting its native tab.
  assert.match(await resumed.locator('#adventure-sheet-content').textContent(),
   /Équipe · ordre de départ au combat|CRÉATURE DE L’ÉQUIPE/);
  assert.equal(await resumed.locator('[data-adventure-sheet-tab="team"]').getAttribute('aria-selected'),'true');
  assert.equal(await resumed.locator('#adventure-sheet-content .sheet-roster-pick').count(),3,
   'the native map team sheet must show all three saved creatures');
  assert.match(await resumed.locator('#adventure-open-sheet').textContent(),/Équipe \(3\)/);
  await resumed.locator('#adventure-sheet-content .sheet-roster-pick').nth(1).tap();
  assert.equal(await resumed.locator('#adventure-sheet-content .sheet-roster-pick[aria-pressed="true"]').count(),1,
   'selecting a reserve creature must update the same team sheet');
  await resumed.locator('[data-adventure-sheet-tab="hero"]').tap();
  assert.match(await resumed.locator('#adventure-sheet-content').textContent(),
   /Héros|Progression/);
  await resumed.locator('[data-adventure-sheet-tab="team"]').tap();
  assert.match(await resumed.locator('#adventure-sheet-content').textContent(),
   /Créature active|Lumilo|Niveau/);
  const officialPortrait=resumed.locator('[data-capture-official-portrait]');
  await officialPortrait.waitFor({state:'visible',timeout:15000});
  const artwork=await officialPortrait.evaluate(async image=>{
   try{await image.decode();}catch{/* Assertion below explains missing/corrupt native art. */}
   return {url:image.src,complete:image.complete,width:image.naturalWidth};
  });
  assert.match(artwork.url,/\/vendor\/exploration-lab\/capture-assets\/assets\/library\/(?:capture|core)\//);
  assert.ok(artwork.complete&&artwork.width>0,
   'native Bestiary front portrait should decode from the published real asset, not a placeholder');
  await resumed.locator('[data-adventure-sheet-tab="inventory"]').tap();
  assert.match(await resumed.locator('#adventure-sheet-content').textContent(),
   /Mon sac|pièces|inventaire/);
  await resumed.locator('[data-adventure-sheet-tab="stats"]').tap();
  assert.match(await resumed.locator('#adventure-sheet-content').textContent(),
   /Points à répartir/);
  assert.equal(await resumed.locator('#adventure-sheet-content .sheet-stat-actions button:enabled').count(),0,
   'no free stats may be assigned at creature level one');
  const sameWhileOpen=await resumed.locator('#adventure-play-frame').evaluate(frame=>({
    current:frame.contentWindow.location.href,
    playing:frame.contentWindow.__sculptPlayProbe?.().playing
  }));
  assert.equal(sameWhileOpen.playing,true,'opening sheet must not stop Exploration');
  await resumed.locator('#adventure-close-sheet').tap();
  assert.equal(await resumed.locator('#adventure-play-sheet').isVisible(),false);
  const sameAfterClose=await resumed.locator('#adventure-play-frame').evaluate(frame=>({
    current:frame.contentWindow.location.href,
    playing:frame.contentWindow.__sculptPlayProbe?.().playing
  }));
  assert.deepEqual(sameAfterClose,sameWhileOpen,
   'returning to world must keep the original native Exploration session');

  // Read the transient grant with the REAL Exploration main reader, not a
  // duplicate GenSRPG validity check. The sender must use the identical
  // published Combat Bestiary cards and never enable an unpublished species.
  const delivered=await resumed.locator('#adventure-play-frame').evaluate(
   async(frame,args)=>{
    const child=frame.contentWindow;
    const {readScopedAdventurePublishedEncountersV1,
      adventurePublishedEncounterStorageKeyV1}=await import(
      '/vendor/exploration-lab/src/encounters/adventure-published-encounters-v1.js');
    const key=adventurePublishedEncounterStorageKeyV1(args.sessionId);
    const raw=child.sessionStorage.getItem(key);
    const allowed=readScopedAdventurePublishedEncountersV1({
      storage:child.sessionStorage,sessionId:args.sessionId,worldId:args.worldId,
      authorSha:args.combatSha,engineSha:args.combatSha
    });
    return {raw:raw?JSON.parse(raw):null,ids:allowed,
      runtimeCount:child.__sculptEncounterProbe?.().playPublishedCount??null};
  },{sessionId:stored.sessionId,worldId:'gen-ci-capture-world',
     combatSha:publication.combatSha});
  assert.ok(delivered.raw,'official Adventure must write a same-origin transient publication grant');
  assert.equal(delivered.raw.worldId,'gen-ci-capture-world');
  assert.equal(delivered.raw.sessionId,stored.sessionId);
  assert.equal(delivered.raw.combatSha,publication.combatSha);
  assert.deepEqual([...delivered.ids].sort(),[...publication.survivors].sort(),
    'real Exploration may only encounter the published and ready Combat species');
  assert.equal(delivered.runtimeCount,publication.filteredCount,
    'native Sculpt must consume the actual published-only grant');
  const nativeParty=await resumed.locator('#adventure-play-frame').evaluate(
    (frame,sessionId)=>{
      const raw=frame.contentWindow.sessionStorage.getItem(
        'gensrpg.capture.v2.active-party.v1:'+sessionId);
      return raw?JSON.parse(raw):null;
    },stored.sessionId);
  assert.equal(nativeParty?.schema,'gensrpg.capture.v2.active-party.v1');
  assert.equal(nativeParty?.sessionId,stored.sessionId);
  assert.equal(nativeParty?.worldId,'gen-ci-capture-world');
  assert.equal(nativeParty?.partyRef,'adventure-party:'+stored.sessionId,
    'the real game must never hand the static Tester party to Combat');
  assert.equal(nativeParty?.combatSha,publication.combatSha);
  assert.equal(nativeParty?.active?.instanceId,stored.party.active.instanceId);
  assert.equal(nativeParty?.active?.speciesId,stored.party.active.speciesId);
  assert.equal(nativeParty?.active?.level,stored.party.active.level);
  assert.equal(nativeParty?.active?.hp,stored.party.active.hp);
  assert.equal(await page.evaluate(id=>localStorage.getItem(
    'gensrpg.capture.v2.active-party.v1:'+id),stored.sessionId),null,
    'actual-party projection is transient and must not become a second save');
  assert.equal(await page.evaluate(id=>localStorage.getItem(
    'gensrpg.capture.v2.published-encounters.v1:'+id),stored.sessionId),null,
    'derived encounter grant must never be persisted in Core localStorage');

  const scopedBefore=await page.evaluate(id=>{
    const raw=localStorage.getItem('gensrpg.exploration.play.navigation.v1:'+id);
    return raw?JSON.parse(raw):null;
  },stored.sessionId);
  assert.equal(scopedBefore?.worldId,'gen-ci-capture-world');
  assert.equal(scopedBefore?.sessionId,stored.sessionId);
  assert.equal(await page.evaluate(()=>localStorage.getItem('gensrpg.exploration.play.navigation.v1')),null,
    'GenSRPG must not reuse the standalone native checkpoint');
  const playFrame=resumed.frameLocator('#adventure-play-frame');
  // The game Menu now commits the official Exploration checkpoint and returns
  // to the real Monster Capture title, not the obsolete standalone play.html.
  await playFrame.locator('#play-menu-button').tap();
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="adventure"]')
    .waitFor({state:'visible',timeout:15000});
  assert.equal(await page.evaluate(()=>window.GensCaptureV2.status().view),null,
    'the native Menu must return to the real Capture title');
  assert.equal(await page.locator('#gensCaptureV2Root iframe').count(),0,
    'return to title must dispose the live game without a second renderer');
  const afterTitle=await page.evaluate(id=>{
    const raw=localStorage.getItem('gensrpg.exploration.play.navigation.v1:'+id);
    return raw?JSON.parse(raw):null;
  },stored.sessionId);
  assert.equal(afterTitle?.sessionId,stored.sessionId,
    'native Exploration must persist the same scoped checkpoint before exit');
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="adventure"]').tap();
  await resumed.locator('#adventure-save-summary').waitFor({timeout:15000});
  await page.waitForFunction(id=>{
    const doc=document.querySelector('#gensCaptureV2Root iframe')?.contentDocument;
    return doc?.querySelector('#adventure-play:not([disabled])') &&
      doc.querySelector('#adventure-save-summary')?.textContent?.includes(id.slice(0,8));
  },stored.sessionId,{timeout:20000});
  assert.equal(await resumed.locator('#adventure-play').isVisible(),true,
    'returning to the title must allow the saved AdventureSession to resume');
  await resumed.locator('#adventure-play').tap();
  await page.waitForFunction(()=>{
    try{return document.querySelector('#gensCaptureV2Root iframe')?.contentDocument?.querySelector('#adventure-play-frame')?.contentWindow?.__sculptPlayProbe?.().active;}catch{return false;}
  },null,{timeout:15000});
  const scopedAfter=await page.evaluate(id=>{
    const raw=localStorage.getItem('gensrpg.exploration.play.navigation.v1:'+id);
    return raw?JSON.parse(raw):null;
  },stored.sessionId);
  assert.equal(scopedAfter.worldId,scopedBefore.worldId);
  assert.equal(scopedAfter.sessionId,stored.sessionId);
  assert.equal(await page.evaluate(()=>localStorage.getItem('gensrpg.world-assembler.document.v1')),authored,
    'native game cannot mutate the World Builder authored document');
  const playingSave=await page.evaluate(id=>{
    const raw=localStorage.getItem('gensrpg.capture.v2.adventure.slot.v1:'+id);
    return raw?JSON.parse(raw):null;
  },stored.sessionId);
  assert.equal(playingSave?.status,'playing');
  assert.equal(playingSave?.world?.mapRef,'gen-ci-capture-world');
  assert.equal(playingSave?.world?.position,null,'Exploration alone owns coordinates');

  // Exercise the live same-origin port with a normalized test envelope in
  // the real durable Exploration journal. Real Combat is tested separately.
  const port=await playFrame.locator('#sculpt-canvas').evaluate(async(canvas,args)=>{
    const {saveCombatHandoff,readCombatHandoff,consumeCombatResult}=await import(
      './src/encounters/combat-handoff-store.js');
    const {createCaptureEncounterSnapshot}=await import('./src/encounters/capture-encounter-contract.js');
    const send=(kind,sessionId=args.sessionId)=>new Promise(resolve=>{
      const target=window.frameElement;
      if(!target)throw Error('Adventure result port requires its official host iframe');
      const claimed=!target.dispatchEvent(new CustomEvent('gensrpg.capture.v2.adventure-combat-commit.v1',{
        cancelable:true,detail:{kind,sessionId,respond:resolve}
      }));
      if(!claimed)throw Error('The Adventure owner did not claim the request');
    });
    const scope={sessionId:args.sessionId};
    const point=window.__sculptPlayProbe();
    const snapshot=createCaptureEncounterSnapshot({
      encounterId:'browser-result-1',returnToken:'browser-return-1',
      source:'terrain-random',playerPartyRef:'adventure-party:'+args.sessionId,
      opponentCreatureId:args.speciesId,rulesetId:'capture.standard.1v1',
      areaId:point.areaId,terrainFamilyId:'forest',elementId:'nature'
    });
    const here=new URL(location.href);here.searchParams.set('combatReturn','1');
    const empty=await send('commit');
    saveCombatHandoff(localStorage,{
      snapshot,returnState:{areaId:point.areaId,x:point.actor.x,y:point.actor.y,returnUrl:here.href},
      result:{encounterId:snapshot.encounterId,returnToken:snapshot.returnToken,outcome:'fled',
        partyState:{activeCreatureId:args.speciesId,activeInstanceId:args.instanceId,hp:17}}
    },scope);
    const ready=await send('ready');
    const wrong=await send('commit','other-session');
    const [first,repeated]=await Promise.all([send('commit'),send('commit')]);
    const pending=readCombatHandoff(localStorage,scope);
    const grant=JSON.parse(sessionStorage.getItem('gensrpg.capture.v2.active-party.v1:'+args.sessionId));
    const consumed=consumeCombatResult(localStorage,{...scope,receipt:first.receipt});
    return {ready,wrong,empty,first,repeated,pending:pending?.result?.outcome,grant,consumed:consumed?.result?.outcome};
  },{sessionId:stored.sessionId,speciesId:stored.party.active.speciesId,instanceId:stored.party.active.instanceId});
  assert.deepEqual(port.ready,{ready:true});
  assert.match(port.wrong.error,/partie/i);
  assert.match(port.empty.error,/Aucun résultat/);
  assert.equal(port.first.receipt.persisted,true);
  assert.equal(port.first.receipt.applied,true);
  assert.equal(port.repeated.receipt.applied,false);
  assert.equal(port.grant.active.hp,17);
  assert.equal(port.pending,'fled','only Exploration may consume its journal');
  assert.equal(port.consumed,'fled');
  const battleSave=await page.evaluate(id=>JSON.parse(
    localStorage.getItem('gensrpg.capture.v2.adventure.slot.v1:'+id)
  ),stored.sessionId);
  assert.equal(battleSave.party.active.hp,17);
  assert.equal(battleSave.party.active.xp,0);
  assert.deepEqual(battleSave.processedEncounterKeys,['browser-result-1:browser-return-1']);

  await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').tap();
  assert.equal(await page.locator('#gensCaptureV2Root iframe').count(),0);
  await page.locator('#gensCaptureV2Root [data-capture-v2-menu="editors"]').tap();
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="creature"]').tap();
  const iframe=page.locator('#gensCaptureV2Root iframe[data-capture-v2-native="combat"]');
  await iframe.waitFor({state:'visible'});
  // Native tool fills viewport; hub remains available only after explicit return.
  assert.equal(await page.locator('#gensCaptureV2Root > nav').isVisible(),false);
  assert.equal(await page.locator('#gensCaptureV2Root > header').isVisible(),false);
  assert.equal(await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').isVisible(),true);
  assert.equal(await iframe.getAttribute('allow'),'fullscreen',
    'native Combat main must be allowed to request fullscreen');
  assert.equal(await iframe.getAttribute('allowfullscreen'),'',
    'fullscreen permission must also cover embedded Android Chromium');
  const fullSize=await page.evaluate(()=>{
    const rect=document.querySelector('#gensCaptureV2Root iframe').getBoundingClientRect();
    return {width:rect.width,height:rect.height,vw:innerWidth,vh:innerHeight};
  });
  assert.ok(fullSize.width>=fullSize.vw-3,'native Lab must span viewport width');
  assert.ok(fullSize.height>=fullSize.vh-52,'native Lab must span viewport height, less return bar');
  assert.match(await iframe.getAttribute('src'),/vendor\/combat-lab\/examples\/dom-demo\/capture-editor-v2\.html[?]tab=creature$/);
  const official=page.frameLocator('#gensCaptureV2Root iframe');
  await official.locator('[data-capture-editor-human]').waitFor({timeout:25000});
  // Static HTML appears before its real JS owner has attached listeners:
  // wait for native setTab() to populate the other tab states.
  await official.locator('[data-editor-tab="skills"][data-active="false"]').waitFor({timeout:25000});
  // No alternate skill/rule editor: exercise the REAL author UI's tabs.
  await official.locator('[data-editor-tab="skills"]').tap();
  try{
    await official.locator('[data-editor-panel="skills"]:visible').waitFor({timeout:3500});
  }catch(error){
    const diagnostic=await official.locator('[data-capture-editor-human]').evaluate(root=>({
      status:root.querySelector('[data-editor-status]')?.textContent,
      tone:root.querySelector('[data-editor-status]')?.dataset?.tone,
      tab:[...root.querySelectorAll('[data-editor-tab]')].map(x=>({id:x.dataset.editorTab,active:x.dataset.active})),
      panels:[...root.querySelectorAll('[data-editor-panel]')].map(x=>({id:x.dataset.editorPanel,hidden:x.hidden}))
    }));
    throw new Error('Native Combat main editor failed to activate Skills: '+JSON.stringify(diagnostic)+' / '+errors.join(' | '),{cause:error});
  }
  await official.locator('[data-editor-tab="combat"]').tap();
  await official.locator('[data-editor-panel="combat"]:visible').waitFor({timeout:3500});
  const captureReturnDock=await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').boundingBox();
  assert.ok(captureReturnDock.y<65 && captureReturnDock.x>fullSize.vw*.5,
    'Capture return control must avoid the native Combat footer and its lower-right test action');
  // The Android bug was not an editor-tab bug: clicking the REAL native
  // "Tester en combat" used to leave a tiny combat inside the GenSrpg Hub.
  // Exercise the unchanged Combat main preview lifecycle from the four-mode
  // root, without generating any alternative creature, arena or combat model.
  const nativeTestButton=official.locator('[data-editor-test-combat]:not([disabled])');
  await nativeTestButton.waitFor({state:'visible',timeout:30000});
  await nativeTestButton.tap();
  const nativeBattle=official.locator('[data-capture-preview-shell]:visible');
  await nativeBattle.waitFor({timeout:30000});
  await nativeBattle.locator('[data-combat-demo]:visible').waitFor({timeout:30000});
  const realArena=nativeBattle.locator('[data-combat-arena]:visible');
  await realArena.waitFor({timeout:15000});
  const combatBounds=await realArena.evaluate(arena=>{
    const shell=document.querySelector('[data-capture-preview-shell]');
    const game=shell?.querySelector('[data-combat-demo]');
    const box=arena.getBoundingClientRect();
    const gameBox=game?.getBoundingClientRect();
    const shellBox=shell?.getBoundingClientRect();
    return {
      viewport:{w:innerWidth,h:innerHeight},
      shell:{w:shellBox?.width,h:shellBox?.height},
      game:{w:gameBox?.width,h:gameBox?.height},
      arena:{w:box.width,h:box.height},
      frameFullscreen:!!document.fullscreenElement,
      combatActors:arena.querySelectorAll('[data-preview-actor-ui]').length
    };
  });
  assert.ok(combatBounds.combatActors>0,
    'real Combat main must mount actor UI rather than an empty presentation shell');
  assert.ok(combatBounds.arena.w>=combatBounds.viewport.w*.65 &&
    combatBounds.arena.h>=combatBounds.viewport.h*.65,
    'native combat arena is too small inside the full-screen Capture iframe: '+
    JSON.stringify({combatBounds,errors:errors.slice(-12)}));
  assert.ok(combatBounds.shell.w>=combatBounds.viewport.w*.95 &&
    combatBounds.shell.h>=combatBounds.viewport.h*.95,
    'Combat main preview shell must occupy the actual landscape viewport: '+
    JSON.stringify(combatBounds));
  console.log('GENSRPG_CAPTURE_V2_NATIVE_COMBAT_ARENA',JSON.stringify(combatBounds));
  await nativeBattle.locator('[data-preview-back-editor]').tap();
  await official.locator('[data-capture-editor-human]:visible').waitFor({timeout:15000});
  assert.equal(await official.locator('[data-combat-demo]').count(),0,
    'original Combat preview lifecycle must dispose its battle on editor return');
  assert.equal(await official.locator('body').getAttribute('data-editor-view'),'editor',
    'native Combat editor must restore ownership after its preview closes');
  // All shortcuts use the SAME original editor source; only its native ?tab= changes.
  for(const tab of ['skills','combat','music']){
    await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').tap();
    await page.locator('#gensCaptureV2Root [data-capture-v2-menu="editors"]').tap();
    await page.locator('#gensCaptureV2Root [data-capture-v2-view="'+tab+'"]').tap();
    const native=page.locator('#gensCaptureV2Root iframe[data-capture-v2-native="combat"]');
    const expected='vendor/combat-lab/examples/dom-demo/capture-editor-v2.html?tab='+tab;
    assert.ok((await native.getAttribute('src')).endsWith(expected),
      'native Lab Combat main URL must select '+tab);
    const editor=page.frameLocator('#gensCaptureV2Root iframe');
    await editor.locator('[data-editor-tab="'+tab+'"][data-active="true"]').waitFor({timeout:25000});
    await editor.locator('[data-editor-panel="'+tab+'"]:visible').waitFor({timeout:25000});
  }
  await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').tap();
  await page.locator('#gensCaptureV2Root [data-capture-v2-menu="editors"]').tap();
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="bestiary"]').tap();
  await page.frameLocator('#gensCaptureV2Root iframe').locator('[data-bestiary]').waitFor({timeout:25000});
  await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').tap();
  await page.locator('#gensCaptureV2Root [data-capture-v2-menu="editors"]').tap();
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="world"]').tap();
  await page.frameLocator('#gensCaptureV2Root iframe').locator('#world-name').waitFor({timeout:25000});
  // Two DISTINCT editor owners grouped under one Monde menu.
  await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').tap();
  assert.equal(await page.evaluate(()=>window.GensCaptureV2.status().view),null);
  assert.equal(await page.locator('#gensCaptureV2Root iframe').count(),0);
  assert.equal(await page.locator('#gensCaptureV2Root > nav').isVisible(),true);
  await page.locator('#gensCaptureV2Root [data-capture-v2-menu="editors"]').tap();
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="builder"]').tap();
  const builderFrame=page.locator('#gensCaptureV2Root iframe[data-capture-v2-native="exploration"]');
  await builderFrame.waitFor({state:'visible'});
  await page.frameLocator('#gensCaptureV2Root iframe').locator('#sculpt-canvas').waitFor({timeout:25000});
  // Browser-gate: the real build serves Combat+Exploration at one origin.
  // A present canvas DOM element is insufficient: original 2.5D MUST paint
  // terrain. Canvas readback is forbidden when the native art is CORS-tainted,
  // so inspect the actual Chromium compositor screenshot instead.
  const nativeCanvas=page.frameLocator('#gensCaptureV2Root iframe').locator('#sculpt-canvas');
  const boot=await nativeCanvas.evaluate(async canvas=>{
    const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
    for(let n=0;n<75;n++){
      const ready=typeof window.__sculptLabProbe==='function';
      if(ready&&canvas.width>300&&canvas.height>150)return {ready,w:canvas.width,h:canvas.height};
      await sleep(300);
    }
    return {ready:typeof window.__sculptLabProbe==='function',w:canvas.width,h:canvas.height};
  });
  assert.ok(boot.ready&&boot.w>300&&boot.h>150,
    'Capture V2 same-origin native 2.5D never finished map bootstrap: '+
    JSON.stringify({boot,pageErrors:errors.slice(-12)}));
  await page.waitForTimeout(300);
  const png=PNG.sync.read(await nativeCanvas.screenshot({animations:'disabled',timeout:45000}));
  const colors=new Set();let lit=0;
  for(let yi=1;yi<=11;yi++)for(let xi=1;xi<=11;xi++){
    const x=Math.min(png.width-1,Math.floor(png.width*xi/12));
    const y=Math.min(png.height-1,Math.floor(png.height*yi/12));
    const k=(y*png.width+x)*4;
    const r=png.data[k],g=png.data[k+1],b=png.data[k+2];
    colors.add(r+','+g+','+b);if(r+g+b>80)lit++;
  }
  assert.ok(png.width>300&&png.height>150&&colors.size>=4&&lit>=8,
    'Capture V2 must render actual, varied terrain pixels in landscape: '+
    JSON.stringify({w:png.width,h:png.height,colors:colors.size,lit,errors:errors.slice(-12)}));
  console.log('GENSRPG_CAPTURE_V2_NATIVE_MAP_PIXELS',JSON.stringify({
    width:png.width,height:png.height,distinctColors:colors.size,visibleSamples:lit,
    source:'official-Exploration-main',combatShowcase:'official-Combat-main'
  }));
  // True native Tester (not merely a painted Builder canvas): exercise the
  // official Exploration main button, one active navigation loop, and return.
  // No GenSrpg-supplied actor, gameplay rules or synthetic terrain.
  const sculptFrame=page.frameLocator('#gensCaptureV2Root iframe');
  const tester=sculptFrame.locator('#navigation-toggle');
  await tester.tap();
  assert.equal(await tester.getAttribute('aria-pressed'),'true',
    'Tester must enter the native Exploration movement session');
  await sculptFrame.locator('#navigation-stick:visible').waitFor({timeout:6000});
  await sculptFrame.locator('#navigation-hud:visible').waitFor({timeout:6000});
  const navigating=await nativeCanvas.evaluate(async()=>{
    const sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
    for(let i=0;i<30;i++){
      const metrics=document.querySelector('#navigation-metrics')?.textContent||'';
      if(metrics.includes(' FPS '))return {
        enabled:document.body.classList.contains('navigation-testing'),
        status:document.querySelector('#navigation-status')?.textContent||'',
        metrics
      };
      await sleep(120);
    }
    return {enabled:document.body.classList.contains('navigation-testing'),
      status:document.querySelector('#navigation-status')?.textContent||'',
      metrics:document.querySelector('#navigation-metrics')?.textContent||''};
  });
  assert.equal(navigating.enabled,true,'native navigation mode must remain active');
  assert.match(navigating.status,/Case [0-9]+ \/ [0-9]+/,
    'native collision/movement owner must expose a real terrain position');
  assert.match(navigating.metrics,/[0-9]+ FPS/,
    'the native Explorer navigation animation loop must run frames');
  await tester.tap();
  assert.equal(await tester.getAttribute('aria-pressed'),'false',
    'leaving Tester must restore the same native editor');
  assert.equal(await sculptFrame.locator('#navigation-stick').isVisible(),false,
    'Tester joystick must be released on exit');
  assert.equal(await nativeCanvas.evaluate(canvas=>
    document.body.classList.contains('navigation-testing')),false,
    'the native navigation runtime must be disposed');
  const builderSize=await builderFrame.boundingBox();
  assert.ok(builderSize.width>=925 && builderSize.height>=422,
    'World Builder must fill landscape, never render below eight buttons');
  assert.equal(await page.locator('#gensCaptureV2Root > nav').isVisible(),false);
  assert.ok((await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').boundingBox()).height<=40,
    "Return control must float without taking 42px away from the editor");
  assert.equal(await page.locator('button.gensRootModeCard').count(),4);
  await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').tap();
  await page.getByRole('button',{name:'Quitter le mode'}).tap();
  assert.equal(await page.locator('#gensCaptureV2Root').count(),0);
  assert.equal(await page.evaluate(()=>window.GensCaptureV2.status().active),false);
  // No assertion about XP/encounters or Lab session/save ownership: deferred.
  assert.deepEqual(errors.filter(x=>/GensCaptureV2|Competing Capture|Duplicate Capture/.test(x)),[]);
 }finally{
  await context?.close();await browser?.close();
  server.closeAllConnections();
  await new Promise(ok=>server.close(ok));
 }
});
