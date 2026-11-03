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
  assert.equal(await buttons.count(),9,
   'eight native Lab entry points plus one GenSrpg-owned Adventure settings view, without extra editors');
  // Aventure is the ninth, GenSrpg-owned screen; the original eight native
  // Lab destinations keep their exact URLs and full-screen contracts.
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="adventure"]').tap();
  const adventureFrame=page.frameLocator('#gensCaptureV2Root iframe[data-capture-v2-native="capture"]');
  await adventureFrame.locator('#adventure-xp-base').waitFor({timeout:15000});
  await adventureFrame.locator('#adventure-create').waitFor({timeout:15000});
  // Real published Bestiary data must populate this UI, not a mock species
  // registry. Create and reopen a native Capture-only save from the genuine
  // (SHA-pinned) Combat catalogue. The old Tester is not a game session.
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

  await adventureFrame.locator('#adventure-xp-base').fill('777');
  await adventureFrame.locator('#adventure-create').tap();
  const saved=await adventureFrame.locator('#adventure-save-summary').textContent();
  assert.match(saved,/niveau 1.*0 XP.*configuration enregistrée/,
   'a real Capture-owned save must be created, not just an editor test');
  const stored=await adventureFrame.locator('#adventure-create').evaluate(()=>{
   const saved=localStorage.getItem('gensrpg.capture.v2.adventure.save.v1');
   return saved?JSON.parse(saved):null;
  });
  assert.equal(stored?.schema,'gensrpg-capture-adventure-save-v1');
  assert.equal(stored?.rules?.xp?.baseVictoryXp,777);
  assert.equal(stored?.party?.active?.speciesId,
   await adventureFrame.locator('#adventure-starter').inputValue());
  assert.ok(stored?.party?.active?.instanceId);
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
  await page.waitForFunction(()=>{
    const f=document.querySelector('#gensCaptureV2Root iframe');
    try{return !!f?.contentWindow?.__sculptPlayProbe?.().active &&
      f.contentWindow.__sculptPlayProbe().playing &&
      f.contentDocument.querySelector('#sculpt-canvas')?.width>300;}catch{return false;}
  },null,{timeout:60000});
  const launched=await page.locator('#gensCaptureV2Root iframe').evaluate(frame=>{
    const w=frame.contentWindow;
    return {session:new URL(w.location.href).searchParams.get('adventureSession'),
      src:w.location.pathname,probe:w.__sculptPlayProbe?.()};
  });
  assert.equal(launched.session,stored.sessionId);
  assert.match(launched.src,/vendor\/exploration-lab\/sculpt-lab\.html$/);
  assert.equal(launched.probe.editorHidden,true);
  const scopedBefore=await page.evaluate(id=>{
    const raw=localStorage.getItem('gensrpg.exploration.play.navigation.v1:'+id);
    return raw?JSON.parse(raw):null;
  },stored.sessionId);
  assert.equal(scopedBefore?.worldId,'gen-ci-capture-world');
  assert.equal(scopedBefore?.sessionId,stored.sessionId);
  assert.equal(await page.evaluate(()=>localStorage.getItem('gensrpg.exploration.play.navigation.v1')),null,
    'GenSRPG must not reuse the standalone native checkpoint');
  await resumed.locator('#play-menu-button').tap();
  await resumed.locator('#play-continue:not([disabled])').waitFor({timeout:30000});
  assert.equal(await resumed.locator('#play-new').isVisible(),false,
    'Exploration may never create/reset a GenSRPG-owned AdventureSession');
  await resumed.locator('#play-continue').tap();
  await page.waitForFunction(()=>{
    try{return document.querySelector('#gensCaptureV2Root iframe')?.contentWindow?.__sculptPlayProbe?.().active;}catch{return false;}
  },null,{timeout:60000});
  const scopedAfter=await page.evaluate(id=>{
    const raw=localStorage.getItem('gensrpg.exploration.play.navigation.v1:'+id);
    return raw?JSON.parse(raw):null;
  },stored.sessionId);
  assert.equal(scopedAfter.worldId,scopedBefore.worldId);
  assert.equal(scopedAfter.sessionId,stored.sessionId);
  assert.equal(await page.evaluate(()=>localStorage.getItem('gensrpg.world-assembler.document.v1')),authored,
    'native game cannot mutate the World Builder authored document');
  const playingSave=await page.evaluate(()=>{
    const raw=localStorage.getItem('gensrpg.capture.v2.adventure.save.v1');
    return raw?JSON.parse(raw):null;
  });
  assert.equal(playingSave?.status,'playing');
  assert.equal(playingSave?.world?.mapRef,'gen-ci-capture-world');
  assert.equal(playingSave?.world?.position,null,'Exploration alone owns coordinates');

  await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').tap();
  assert.equal(await page.locator('#gensCaptureV2Root iframe').count(),0);
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
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="bestiary"]').tap();
  await page.frameLocator('#gensCaptureV2Root iframe').locator('[data-bestiary]').waitFor({timeout:25000});
  await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').tap();
  await page.locator('#gensCaptureV2Root [data-capture-v2-view="explore"]').tap();
  await page.frameLocator('#gensCaptureV2Root iframe').locator('#sculpt-canvas').waitFor({timeout:25000});
  // Return from a Lab restores Capture home; second Lab gets full screen too.
  await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').tap();
  assert.equal(await page.evaluate(()=>window.GensCaptureV2.status().view),null);
  assert.equal(await page.locator('#gensCaptureV2Root iframe').count(),0);
  assert.equal(await page.locator('#gensCaptureV2Root > nav').isVisible(),true);
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
