'use strict';

const assert=require('node:assert/strict');
const {chromium}=require('playwright');

const repo=process.env.GITHUB_REPOSITORY||'slyen4425-cloud/Zombicide-40k';
const sha=process.env.GITHUB_SHA;
assert.match(String(sha||''),/^[0-9a-f]{40}$/,'GITHUB_SHA must identify the exact immutable preview commit');

const target='https://html-preview.github.io/?url=https://github.com/'+repo+'/blob/'+sha+'/preview.html';
const CAPTURE_ID='gp_mt7ker7t_m2iw9';
const DUNGEON_ID='game_profile_dungeon_demo';

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({
    viewport:{width:412,height:915},
    deviceScaleFactor:2.625,
    isMobile:true,
    hasTouch:true,
    locale:'fr-FR',
    serviceWorkers:'block'
  });
  const page=await context.newPage();
  page.setDefaultTimeout(45000);
  page.setDefaultNavigationTimeout(60000);

  const pageErrors=[];
  const consoleErrors=[];
  const failed=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText||''}));
  page.on('dialog',d=>d.accept().catch(()=>{}));

  try{
    const response=await page.goto(target,{waitUntil:'domcontentloaded'});
    assert.ok(response&&response.ok(),'external preview host must return a successful document');

    await page.waitForFunction(()=>(
      /GenSrpG/i.test(document.title||'') &&
      (!!document.getElementById('gensRootHome')||!!document.getElementById('menu')) &&
      typeof window.GensCaptureV1==='object' &&
      typeof window.GensCaptureSessionStartV1==='object' &&
      typeof window.startConfiguredGame==='function'
    ));

    const state=await page.evaluate(()=>({
      title:document.title,
      ready:document.documentElement?.dataset?.gensrpgPreviewReady||'',
      root:!!document.getElementById('gensRootHome'),
      menu:!!document.getElementById('menu'),
      captureEntry:typeof window.GensCaptureV1,
      captureSessionOwner:typeof window.GensCaptureSessionStartV1,
      startConfiguredGame:typeof window.startConfiguredGame,
      bodyText:(document.body?.innerText||'').slice(0,300),
      href:location.href
    }));

    assert.match(state.title,/GenSrpG/i,'external preview must execute HTML instead of showing source text');
    assert.equal(state.captureEntry,'object','external preview must load GensCaptureV1');
    assert.equal(state.captureSessionOwner,'object','external preview must load the Capture session-start owner');
    assert.equal(state.startConfiguredGame,'function','final Shell launch authority must be active');
    assert.ok(state.root||state.menu,'external preview must render the real GenSrpG shell/menu');
    assert.ok(!state.bodyText.startsWith('<!doctype html>'),'external preview must not expose preview.html as plain text');
    const transportBootErrors={page:[...pageErrors],console:[...consoleErrors],failed:[...failed]};
    console.log('[external-preview] transport-boot '+JSON.stringify(transportBootErrors));
    pageErrors.length=0;consoleErrors.length=0;failed.length=0;

    // Régressions utilisateur réelles : la preview externe doit préserver
    // le pool Capture complet et le vrai Builder Dungeon après un reload contrôlé.
    await page.evaluate(()=>{try{localStorage.clear();sessionStorage.clear()}catch(e){}});
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>(
      /GenSrpG/i.test(document.title||'') &&
      typeof window.openGensFamily==='function' &&
      typeof window.GensCaptureV1==='object' &&
      typeof window.gensProfileContentFamily155==='function'
    ));

    let captureCardText='';

    async function openAdventureProfile(profileId){
      const adventure=page.locator('button.gensRootModeCard.adventure');
      await adventure.waitFor({state:'visible'});
      await adventure.click();
      await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');

      let card=page.locator('#gensFamilyGames [data-rpg-profile="'+profileId+'"] .gensUniverseMainBtn');
      await card.waitFor({state:'visible'});

      const sw=await page.evaluate(id=>({
        active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
        from:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(activeGameProfileId()):'',
        to:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(id):''
      }),profileId);

      if(sw.active&&sw.active!==profileId&&sw.from!==sw.to){
        await Promise.all([
          page.waitForNavigation({waitUntil:'domcontentloaded',timeout:45000}),
          card.click()
        ]);
        await page.waitForFunction(()=>(
          /GenSrpG/i.test(document.title||'') &&
          typeof window.openGensFamily==='function' &&
          typeof window.gensProfileContentFamily155==='function'
        ));
        const adventure2=page.locator('button.gensRootModeCard.adventure');
        await adventure2.waitFor({state:'visible'});
        await adventure2.click();
        await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
        card=page.locator('#gensFamilyGames [data-rpg-profile="'+profileId+'"] .gensUniverseMainBtn');
        await card.waitFor({state:'visible'});
      }

      if(profileId===CAPTURE_ID)captureCardText=String(await card.textContent()||'').replace(/\s+/g,' ').trim();
      await card.click();
      await page.waitForFunction(id=>(
        typeof activeGameProfileId==='function' &&
        activeGameProfileId()===id &&
        getComputedStyle(document.getElementById('gensGameHome')).display!=='none'
      ),profileId);
    }

    await openAdventureProfile(CAPTURE_ID);
    const captureIdentity=await page.evaluate(()=>({
      family:typeof gensSelectedFamily==='string'?gensSelectedFamily:'',
      contentFamily:typeof gensCurrentContentFamily==='function'?gensCurrentContentFamily():'',
      dungeonMode:typeof isDungeonMode==='function'?!!isDungeonMode():null,
      starterSource:typeof gensStarterCreatures==='function'?gensStarterCreatures().length:-1
    }));
    assert.equal(captureIdentity.contentFamily,'creature','Capture must keep its creature content family');
    assert.equal(captureIdentity.dungeonMode,false,'Capture must remain outside Dungeon runtime identity');
    assert.ok(captureIdentity.starterSource>1,'Capture starter source must contain multiple creatures');

    await page.locator('#gensGameHomeActions .newGameBtn').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
    await page.locator('#pregameHeroStep .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');

    const trainer=page.locator('#participantList input[type="checkbox"]').first();
    await trainer.waitFor({state:'visible'});
    if(!(await trainer.isChecked()))await trainer.check();
    const trainerId=await page.evaluate(()=>(
      typeof normalizeGameParticipants==='function' ? String(normalizeGameParticipants()[0]||'') : ''
    ));
    assert.ok(trainerId,'Capture regression test must resolve the selected trainer through the real participant owner');

    const choices=page.locator('#participantList .captureStarterChoice');
    await choices.first().waitFor({state:'visible'});
    const starterUiCount=await choices.count();
    const starterPoolCount=await page.evaluate(()=>typeof gensCaptureStarterPool==='function'?gensCaptureStarterPool().length:-1);
    assert.ok(starterPoolCount>1,'Capture runtime pool must expose multiple starter creatures');
    assert.equal(starterUiCount,starterPoolCount,'Capture pre-game must render the complete starter pool');

    await choices.first().click();
    await page.waitForFunction(id=>typeof gensCaptureStarterIdsForHero==='function'&&gensCaptureStarterIdsForHero(id).length>=1,trainerId);
    const selected=await page.evaluate(id=>gensCaptureStarterIdsForHero(id),trainerId);
    assert.ok(selected.length>=1,'Capture must preserve a valid starter selection');
    console.log('[external-preview] capture-card '+JSON.stringify({text:captureCardText,starterSource:captureIdentity.starterSource,starterPoolCount,starterUiCount,selected:selected.length}));

    await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameHeroStep')).display!=='none');
    await page.locator('#pregameHeroStep .pregameBackStep').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensGameHome')).display!=='none');
    await page.locator('#gensGameHome .homeTop button.back').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
    await page.locator('#gensFamilyHome .homeTop button.back').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensRootHome')).display!=='none');

    await openAdventureProfile(DUNGEON_ID);
    await page.locator('#gensGameHomeActions .homeEditorsBtn').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('editorHub')).display!=='none');

    const dungeonEditor=page.locator('#dungeonAdvancedEditorBtn');
    await dungeonEditor.waitFor({state:'visible'});
    await dungeonEditor.click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('dungeonAdvancedEditor')).display!=='none');
    await page.waitForTimeout(300);
    const preBuilderState=await page.evaluate(()=>({
      active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
      family:typeof gensSelectedFamily==='string'?gensSelectedFamily:'',
      contentFamily:typeof gensCurrentContentFamily==='function'?gensCurrentContentFamily():'',
      mode151:typeof gensMode151==='function'?gensMode151():'',
      dungeonMode:typeof isDungeonMode==='function'?!!isDungeonMode():null,
      captureClass:document.body.classList.contains('gensCapturePregame'),
      pureCapture:document.body.classList.contains('gens-pure-capture'),
      dungeonTheme:document.body.classList.contains('gensDungeonTheme'),
      roomApi:!!window.DungeonRoomCreator100,
      builderApi:!!window.DungeonWorldBuilder167821,
      roomLauncher:!!document.getElementById('drc100Launcher'),
      builderLauncher:!!document.getElementById('drc300Launch'),
      advancedDisplay:document.getElementById('dungeonAdvancedEditor')?getComputedStyle(document.getElementById('dungeonAdvancedEditor')).display:'absent',
      scripts:[...document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src')||'').filter(s=>/dungeon-room-creator|dungeon-world-builder/.test(s))
    }));
    console.log('[external-preview] builder-prestate '+JSON.stringify(preBuilderState));
    assert.equal(preBuilderState.active,DUNGEON_ID,'Dungeon profile must be active before Builder diagnostics');
    assert.equal(preBuilderState.dungeonMode,true,'Capture -> Dungeon must restore canonical Dungeon identity before editor load');
    assert.equal(preBuilderState.captureClass,false,'Capture pre-game class must be cleared before Dungeon editor');
    assert.equal(preBuilderState.pureCapture,false,'pure Capture class must be cleared before Dungeon editor');
    assert.equal(preBuilderState.roomApi,true,'Capture -> Dungeon must retain Dungeon Room Creator API');
    assert.equal(preBuilderState.builderApi,true,'Capture -> Dungeon must retain Dungeon World Builder API');
    assert.equal(preBuilderState.roomLauncher,true,'Capture -> Dungeon must mount Room Creator launcher');
    assert.equal(preBuilderState.builderLauncher,true,'Capture -> Dungeon must mount Dungeon Builder launcher');

    const builderState=await page.evaluate(()=>({
      active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
      family:typeof gensSelectedFamily==='string'?gensSelectedFamily:'',
      roomApi:!!window.DungeonRoomCreator100,
      builderApi:!!window.DungeonWorldBuilder167821,
      launcher:!!document.getElementById('drc300Launch'),
      launcherText:document.getElementById('drc300Launch')?.textContent||'',
      launcherDisplay:document.getElementById('drc300Launch')?getComputedStyle(document.getElementById('drc300Launch')).display:'absent'
    }));
    assert.equal(builderState.active,DUNGEON_ID,'Dungeon profile must be active for Builder test');
    assert.equal(builderState.roomApi,true,'external preview must load Dungeon Room Creator');
    assert.equal(builderState.builderApi,true,'external preview must load Dungeon World Builder');
    assert.equal(builderState.launcher,true,'external preview must mount Dungeon Builder launcher');
    assert.notEqual(builderState.launcherDisplay,'none','Dungeon Builder launcher must stay visible');
    assert.match(builderState.launcherText,/CONSTRUIRE|DONJON/i,'Dungeon Builder launcher must remain identifiable');

    await page.locator('#drc300Launch').click();
    await page.waitForFunction(()=>document.getElementById('drc300Modal')?.classList.contains('open'));

    assert.deepEqual(pageErrors,[],'external user paths must not raise page errors');
    assert.deepEqual(consoleErrors,[],'external user paths must not raise console errors');

    console.log(JSON.stringify({
      scenario:'exact external GenSrpG preview',
      target,
      sha,
      state,
      captureRegression:{starterPool:'multiple',cardText:captureCardText,starterSelection:'valid'},
      dungeonRegression:{builder:'visible-and-openable'},
      requestFailures:failed.slice(0,12)
    },null,2));
  }finally{
    await context.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
})().catch(e=>{console.error(e);process.exitCode=1});
