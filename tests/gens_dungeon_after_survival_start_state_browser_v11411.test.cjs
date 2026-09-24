const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium,firefox}=require('playwright');

const root=path.join(__dirname,'..');
const browserName=String(process.env.GENSRPG_BROWSER||'chromium').toLowerCase();
const browserType=browserName==='firefox'?firefox:chromium;

const mime={
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json',
  '.webmanifest':'application/manifest+json','.png':'image/png',
  '.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp',
  '.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg'
};

const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const rel=pathname==='/'?'/preview.html':pathname;
  const file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end('not found');return}
    res.writeHead(200,{
      'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream',
      'cache-control':'no-store'
    });
    res.end(data);
  });
});

const SURVIVAL_ID='game_profile_zombicide_base';
const DUNGEON_ID='game_profile_dungeon_demo';

async function preparePage(context,port,errors){
  const page=await context.newPage();
  page.setDefaultTimeout(25000);
  page.setDefaultNavigationTimeout(30000);
  page.on('pageerror',e=>errors.push('pageerror:'+String(e)));
  page.on('console',m=>{
    if(m.type()!=='error')return;
    const value=m.text();
    if(/Failed to load resource|ERR_FAILED|NS_BINDING_ABORTED/.test(value))return;
    errors.push('console:'+value);
  });
  page.on('dialog',async d=>{try{await d.accept()}catch(e){}});
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
  await page.waitForFunction(()=>
    typeof window.openGensFamily==='function' &&
    typeof window.openGensBuiltInGame==='function' &&
    typeof window.startConfiguredGame==='function' &&
    typeof window.gensProfileContentFamily155==='function'
  ,null,{timeout:60000});
  return page;
}

async function clearStorageAndReload(page){
  await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
  await page.waitForFunction(()=>typeof window.openGensFamily==='function'&&typeof window.startConfiguredGame==='function',null,{timeout:60000});
}

async function openFamily(page,family){
  const rootCard=page.locator('button.gensRootModeCard.'+family);
  await rootCard.waitFor({state:'visible'});
  await rootCard.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
}

async function selectProfile(page,family,selector,profileId){
  await openFamily(page,family);
  let card=page.locator(selector);
  await card.waitFor({state:'visible'});
  const sw=await page.evaluate(id=>({
    active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
    from:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(activeGameProfileId()):'',
    to:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(id):''
  }),profileId);

  if(sw.active&&sw.active!==profileId&&sw.from!==sw.to){
    await Promise.all([
      page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000}),
      card.click()
    ]);
    await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
    await page.waitForFunction(()=>typeof window.openGensFamily==='function'&&typeof window.gensProfileContentFamily155==='function',null,{timeout:60000});
    await openFamily(page,family);
    card=page.locator(selector);
    await card.waitFor({state:'visible'});
    await card.click();
  }else{
    await card.click();
  }

  await page.waitForFunction(id=>
    typeof activeGameProfileId==='function' &&
    activeGameProfileId()===id &&
    getComputedStyle(document.getElementById('gensGameHome')).display!=='none'
  ,profileId,{timeout:30000});
}

async function chooseFirstParticipantAndStart(page){
  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');

  const setup=page.locator('#pregameSetup .sessionSetupBtn[onclick="openSessionHeroSetup()"]');
  await setup.waitFor({state:'visible'});
  await setup.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');

  const first=page.locator('#participantList input[type="checkbox"]').first();
  await first.waitFor({state:'visible'});
  if(!(await first.isChecked()))await first.check();

  await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');

  await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();
}

async function waitSurvivalStarted(page){
  await page.waitForFunction(()=>
    localStorage.getItem('z40k_session_active_v1')==='1' &&
    document.getElementById('menu') &&
    getComputedStyle(document.getElementById('menu')).display!=='none'
  ,null,{timeout:15000});
}

async function settleDungeonLaunch(page){
  try{
    await page.waitForFunction(()=>{
      const session=localStorage.getItem('z40k_session_active_v1')==='1';
      const runtime=!!localStorage.getItem('gensrpg_dungeon_runtime_v2');
      const core=document.getElementById('gensDungeonCore01');
      const coreVisible=!!(core&&getComputedStyle(core).display!=='none');
      return session||runtime||coreVisible;
    },null,{timeout:12000});
  }catch(e){}
  await page.waitForTimeout(1200);
}

async function returnActiveGameToRootWithoutClosing(page){
  await page.evaluate(()=>{
    if(typeof window.backHomeFromGame!=='function')throw new Error('backHomeFromGame owner absent');
    window.backHomeFromGame();
  });
  await page.waitForFunction(()=>{
    const menu=document.getElementById('menu');
    const game=document.getElementById('gensGameHome');
    const root=document.getElementById('gensRootHome');
    return (menu&&getComputedStyle(menu).display!=='none')||
      (game&&getComputedStyle(game).display!=='none')||
      (root&&getComputedStyle(root).display!=='none');
  },null,{timeout:10000});
  await page.evaluate(()=>{
    const root=document.getElementById('gensRootHome');
    if(root&&getComputedStyle(root).display!=='none')return;
    if(typeof window.showGensRootHome!=='function')throw new Error('showGensRootHome owner absent');
    window.showGensRootHome();
  });
  await page.waitForFunction(()=>{
    const root=document.getElementById('gensRootHome');
    return !!root&&getComputedStyle(root).display!=='none';
  },null,{timeout:10000});
}

async function dungeonSnapshot(page,label){
  return page.evaluate(label=>{
    const parse=k=>{try{return JSON.parse(localStorage.getItem(k)||'null')}catch(e){return {parseError:String(e)}}};
    const rt=parse('gensrpg_dungeon_runtime_v2');
    const ds=parse('gensrpg_dungeon_state_v1');
    const visible=el=>{
      if(!el)return false;
      const s=getComputedStyle(el),r=el.getBoundingClientRect();
      return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)!==0&&r.width>0&&r.height>0;
    };
    const gridLike=[...document.querySelectorAll(
      '#dc047RoomBoard .dc047Grid'
    )].filter(visible).map(el=>({
      tag:el.tagName,id:el.id||'',class:String(el.className||'').slice(0,180),
      cells:el.querySelectorAll(':scope > .dc047Cell').length,
      text:(el.innerText||'').trim().replace(/\s+/g,' ').slice(0,180)
    }));
    const returnControls=[...document.querySelectorAll('button,a')]
      .filter(visible)
      .map(el=>(el.innerText||el.textContent||'').trim().replace(/\s+/g,' '))
      .filter(t=>/retour/i.test(t)&&/salle|pi[eè]ce|zone|for[eê]t|donjon/i.test(t))
      .slice(0,20);
    const movementTexts=[...document.querySelectorAll('button,[role="button"],div,span')]
      .filter(visible)
      .map(el=>(el.innerText||'').trim().replace(/\s+/g,' '))
      .filter(t=>t&&/mouvement|d[eé]placement|case/i.test(t)&&t.length<180)
      .slice(0,30);
    return {
      label,
      activeProfile:typeof activeGameProfileId==='function'?activeGameProfileId():'',
      family:window.GensSurvivalModeIsolation1678104?.storedFamily?.()||'',
      dungeonMode:typeof isDungeonMode==='function'?!!isDungeonMode():null,
      session:localStorage.getItem('z40k_session_active_v1'),
      bodyClass:document.body.className,
      coreDisplay:document.getElementById('gensDungeonCore01')?getComputedStyle(document.getElementById('gensDungeonCore01')).display:'absent',
      runtime:{
        room:rt?.room??null,
        index:rt?.index??null,
        lastKind:rt?.last?.kind??null,
        lastRoom:rt?.last?.room??null,
        participants:Array.isArray(rt?.participants)?rt.participants:[],
        positions:rt?.positions??null,
        remaining:rt?.remaining??null,
        heroRooms:rt?.heroRooms??null,
        roomStateKeys:rt?.roomStates?Object.keys(rt.roomStates):[],
        branchStateKeys:rt?.heroBranchStates?Object.keys(rt.heroBranchStates):[]
      },
      dungeonState:ds,
      gridLike,
      returnControls,
      movementTexts,
      visibleButtons:[...document.querySelectorAll('button')].filter(visible).slice(0,50).map(el=>({
        text:(el.innerText||el.textContent||'').trim().replace(/\s+/g,' ').slice(0,160),
        id:el.id||'',
        class:String(el.className||'').slice(0,160),
        onclick:el.getAttribute('onclick')||''
      })),
      visibleDialogs:[...document.querySelectorAll('[role="dialog"],.modal,.popup,[class*="modal" i],[class*="popup" i]')]
        .filter(visible).slice(0,30).map(el=>({
          id:el.id||'',
          class:String(el.className||'').slice(0,160),
          text:(el.innerText||'').trim().replace(/\s+/g,' ').slice(0,700)
        })),
      authorities:{
        captureContext:typeof window.isCaptureContext138==='function'?!!window.isCaptureContext138():null,
        capturePregame:typeof window.gensCapturePregameMode==='function'?!!window.gensCapturePregameMode():null,
        pureCapture:typeof window.gensPureCaptureSheetMode==='function'?!!window.gensPureCaptureSheetMode():null,
        activeProfileShape:(()=>{
          const p=typeof window.getActiveGameProfile==='function'?window.getActiveGameProfile():null;
          return {
            id:p?.id||'',
            family:typeof window.gensCurrentContentFamily==='function'?window.gensCurrentContentFamily():'',
            gameplayProfile:p?.rpgUniverse?.gameplay?.profile??null,
            gameplayCapture:p?.rpgUniverse?.gameplay?.modules?.capture??null,
            topCapture:p?.modules?.capture??null,
            captureCombatPresent:!!p?.rpgUniverse?.captureCombat
          };
        })(),
        startConfiguredGame:String(window.startConfiguredGame||'').slice(0,1200),
        coreStart:String(window.DungeonCore01?.start||'').slice(0,1200),
        coreShow:String(window.DungeonCore01?.show||'').slice(0,1200),
        coreRender:String(window.DungeonCore01?.render||'').slice(0,1600),
        coreExplore:String(window.DungeonCore01?.explore||'').slice(0,1600),
        coreStartFlags:{
          dc318:!!window.DungeonCore01?.start?.__dc318,
          dlr:!!window.DungeonCore01?.start?.__dlr167835,
          dar:!!window.DungeonCore01?.start?.__dar167839
        },
        coreRenderFlags:{
          dlr:!!window.DungeonCore01?.render?.__dlr167835,
          dwr:!!window.DungeonCore01?.render?.__dwr167838,
          dsr:!!window.DungeonCore01?.render?.__dsr167877
        },
        coreExploreFlags:{
          dlr:!!window.DungeonCore01?.explore?.__dlr167835,
          drr:!!window.DungeonCore01?.explore?.__drr167822,
          dwr:!!window.DungeonCore01?.explore?.__dwr167823,
          dar:!!window.DungeonCore01?.explore?.__dar167839
        },
        debug200:typeof window.dungeonDebug200==='function'?window.dungeonDebug200():null,
        legacyCore:parse('gensrpg_dungeon_core02_v1')
      },
      dc200Modal:(()=>{
        const m=document.getElementById('dc200Modal');
        const title=document.getElementById('dc200ModalTitle');
        const body=document.getElementById('dc200ModalBody');
        if(!m)return null;
        const st=getComputedStyle(m);
        return {
          class:String(m.className||''),
          display:st.display,
          visibility:st.visibility,
          opacity:st.opacity,
          title:(title?.innerText||title?.textContent||'').trim().replace(/\s+/g,' ').slice(0,300),
          body:(body?.innerText||body?.textContent||'').trim().replace(/\s+/g,' ').slice(0,900)
        };
      })(),
      coreText:(document.getElementById('gensDungeonCore01')?.innerText||'').trim().replace(/\s+/g,' ').slice(0,3200)
    };
  },label);
}

function fingerprint(s){
  return {
    activeProfile:s.activeProfile,
    family:s.family,
    dungeonMode:s.dungeonMode,
    session:s.session,
    room:s.runtime.room,
    index:s.runtime.index,
    lastKind:s.runtime.lastKind,
    lastRoom:s.runtime.lastRoom,
    participants:s.runtime.participants,
    positions:s.runtime.positions,
    remaining:s.runtime.remaining,
    heroRooms:s.runtime.heroRooms,
    roomStateKeys:s.runtime.roomStateKeys,
    branchStateKeys:s.runtime.branchStateKeys,
    dungeonStateRoom:s.dungeonState?.room??null,
    dungeonStateLastKind:s.dungeonState?.last?.kind??null,
    dungeonStateLastRoom:s.dungeonState?.last?.room??null,
    returnControls:s.returnControls,
    gridVisible:s.gridLike.length>0
  };
}

async function runScenario(port,survivalFirst){
  const errors=[];
  const launchArgs=browserName==='chromium'?{headless:true,args:['--disable-dev-shm-usage']}:{headless:true};
  const browser=await browserType.launch(launchArgs);
  const context=await browser.newContext({
    viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,
    locale:'fr-FR',serviceWorkers:'block'
  });
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  let page;
  try{
    page=await preparePage(context,port,errors);
    await clearStorageAndReload(page);

    if(survivalFirst){
      await selectProfile(
        page,'survival',
        '#gensFamilyGames button.gensFamilyGameCard[onclick*="'+SURVIVAL_ID+'"]',
        SURVIVAL_ID
      );
      await chooseFirstParticipantAndStart(page);
      await waitSurvivalStarted(page);

      await page.close();
      page=await preparePage(context,port,errors);
    }

    await selectProfile(
      page,'adventure',
      '#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn',
      DUNGEON_ID
    );
    await chooseFirstParticipantAndStart(page);
    await settleDungeonLaunch(page);

    const snap=await dungeonSnapshot(page,survivalFirst?'after-survival':'fresh-direct');
    console.log('[dungeon-after-survival] launch-'+(survivalFirst?'after-survival':'fresh-direct'),JSON.stringify(snap,null,2));
    return {snap,errors};
  }finally{
    await context.close();
    await browser.close();
  }
}

async function runDirectDungeonRoomGridScenario(port){
  const errors=[];
  const launchArgs=browserName==='chromium'?{headless:true,args:['--disable-dev-shm-usage']}:{headless:true};
  const browser=await browserType.launch(launchArgs);
  const context=await browser.newContext({
    viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,
    locale:'fr-FR',serviceWorkers:'block'
  });
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  let page;
  try{
    page=await preparePage(context,port,errors);
    await clearStorageAndReload(page);
    await selectProfile(page,'adventure','#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn',DUNGEON_ID);
    await chooseFirstParticipantAndStart(page);
    await settleDungeonLaunch(page);
    const entrance=await dungeonSnapshot(page,'direct-dungeon-grid-control-entrance');
    const explore=page.locator('#dc01Explore');
    await explore.waitFor({state:'visible'});
    await explore.click();
    await page.waitForTimeout(1800);
    const continueBtn=page.locator('#dc200ModalOk');
    if(await continueBtn.count()){
      await continueBtn.waitFor({state:'visible',timeout:5000});
      await continueBtn.click();
      await page.waitForTimeout(1800);
    }
    if(!(await page.evaluate(()=>{
      try{const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');return Number(x?.room)>=1&&!!x?.last}catch(e){return false}
    }))){
      await page.evaluate(()=>window.DungeonCore01?.explore?.());
      await page.waitForTimeout(1200);
    }
    const room=await dungeonSnapshot(page,'direct-dungeon-grid-control-room');
    return {entrance,room,errors};
  }finally{
    await context.close();
    await browser.close();
  }
}

async function runSameOpenSurvivalToDungeonScenario(port){
  const errors=[];
  const launchArgs=browserName==='chromium'?{headless:true,args:['--disable-dev-shm-usage']}:{headless:true};
  const browser=await browserType.launch(launchArgs);
  const context=await browser.newContext({
    viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,
    locale:'fr-FR',serviceWorkers:'block'
  });
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  let page;
  try{
    page=await preparePage(context,port,errors);
    await clearStorageAndReload(page);

    await selectProfile(page,'survival','#gensFamilyGames button.gensFamilyGameCard[onclick*="'+SURVIVAL_ID+'"]',SURVIVAL_ID);
    await chooseFirstParticipantAndStart(page);
    await waitSurvivalStarted(page);

    const beforeReturn=await page.evaluate(()=>({
      href:location.href,
      active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
      family:window.GensSurvivalModeIsolation1678104?.storedFamily?.()||''
    }));

    await returnActiveGameToRootWithoutClosing(page);

    await selectProfile(page,'adventure','#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn',DUNGEON_ID);
    await chooseFirstParticipantAndStart(page);
    await settleDungeonLaunch(page);

    const entrance=await dungeonSnapshot(page,'same-open-dungeon-entrance');
    const explore=page.locator('#dc01Explore');
    await explore.waitFor({state:'visible'});
    await explore.click();
    await page.waitForTimeout(1800);

    const continueBtn=page.locator('#dc200ModalOk');
    if(await continueBtn.count()){
      await continueBtn.waitFor({state:'visible',timeout:5000});
      await continueBtn.click();
      await page.waitForTimeout(1800);
    }
    if(!(await page.evaluate(()=>{
      try{const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');return Number(x?.room)>=1&&!!x?.last}catch(e){return false}
    }))){
      await page.evaluate(()=>window.DungeonCore01?.explore?.());
      await page.waitForTimeout(1200);
    }
    const room=await dungeonSnapshot(page,'same-open-dungeon-room');
    return {beforeReturn,entrance,room,errors};
  }finally{
    await context.close();
    await browser.close();
  }
}

async function runPersistedDungeonThenSurvivalScenario(port){
  const errors=[];
  const launchArgs=browserName==='chromium'?{headless:true,args:['--disable-dev-shm-usage']}:{headless:true};
  const browser=await browserType.launch(launchArgs);
  const context=await browser.newContext({
    viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,
    locale:'fr-FR',serviceWorkers:'block'
  });
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  let page;
  try{
    page=await preparePage(context,port,errors);
    await clearStorageAndReload(page);

    await selectProfile(
      page,'adventure',
      '#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn',
      DUNGEON_ID
    );
    await chooseFirstParticipantAndStart(page);
    await settleDungeonLaunch(page);

    const entrance=await dungeonSnapshot(page,'persisted-control-entrance');
    console.log('[dungeon-after-survival] persisted-control-entrance',JSON.stringify(entrance,null,2));
    assert.equal(Number(entrance.dungeonState?.room),0,'real prior Dungeon must begin at room 0 before exploring');
    assert.equal(entrance.dungeonState?.last??null,null,'real prior Dungeon entrance must have no generated room yet');

    const explore=page.locator('#dc01Explore');
    await explore.waitFor({state:'visible'});
    await explore.click();
    await page.waitForTimeout(1800);

    const afterExplore=await dungeonSnapshot(page,'after-first-explore-click');
    console.log('[dungeon-after-survival] after-first-explore',JSON.stringify(afterExplore,null,2));

    const continueBtn=page.locator('#dc200ModalOk');
    await continueBtn.waitFor({state:'visible',timeout:5000});
    await continueBtn.click();
    await page.waitForTimeout(1800);

    const afterContinue=await dungeonSnapshot(page,'after-first-explore-continue');
    console.log('[dungeon-after-survival] after-first-continue',JSON.stringify(afterContinue,null,2));

    if(!(Number(afterContinue.dungeonState?.room)>=1 && afterContinue.dungeonState?.last)){
      await page.evaluate(()=>window.DungeonCore01?.explore?.());
      await page.waitForTimeout(1200);
      const afterDirectExplore=await dungeonSnapshot(page,'after-direct-owner-explore');
      console.log('[dungeon-after-survival] after-direct-owner-explore',JSON.stringify(afterDirectExplore,null,2));
      assert.ok(
        Number(afterDirectExplore.dungeonState?.room)>=1 && afterDirectExplore.dungeonState?.last,
        'characterization: direct DungeonCore01.explore() also failed to create room 1'
      );
    }

    const persisted=await dungeonSnapshot(page,'persisted-room-before-survival');

    const effectClose=page.locator('#effectModal.open .effectClose');
    if(await effectClose.count()){
      await effectClose.click();
      await page.waitForFunction(()=>!document.getElementById('effectModal')?.classList.contains('open'));
    }

    // This scenario characterizes NEW GAME reset after a previously persisted Dungeon.
    // It is not a combat-exit test. If the randomly generated room legitimately opened
    // Tactical V2, close it through its public owner before invoking the canonical Dungeon
    // Save & Quit owner, so the fixture does not depend on random encounter generation.
    await page.evaluate(()=>{
      if(document.querySelector('.gtv2Overlay[data-gens-tactical-v2="1"]')){
        window.GensRpgTacticalCombatV2Ui?.close?.();
      }
      window.DungeonCore01?.quit?.();
    });
    await page.waitForFunction(()=>{
      const root=document.getElementById('gensRootHome');
      const core=document.getElementById('gensDungeonCore01');
      return root&&getComputedStyle(root).display!=='none'&&core&&getComputedStyle(core).display==='none';
    },null,{timeout:10000});

    await selectProfile(
      page,'survival',
      '#gensFamilyGames button.gensFamilyGameCard[onclick*="'+SURVIVAL_ID+'"]',
      SURVIVAL_ID
    );
    await chooseFirstParticipantAndStart(page);
    await waitSurvivalStarted(page);

    await page.close();
    page=await preparePage(context,port,errors);

    await selectProfile(
      page,'adventure',
      '#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn',
      DUNGEON_ID
    );
    await chooseFirstParticipantAndStart(page);
    await settleDungeonLaunch(page);

    const afterNewGame=await dungeonSnapshot(page,'new-dungeon-after-persisted-dungeon-and-survival');
    return {entrance,persisted,afterNewGame,errors};
  }finally{
    await context.close();
    await browser.close();
  }
}

(async()=>{
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  try{
    const control=await runScenario(port,false);
    const afterSurvival=await runScenario(port,true);
    const persistedThenSurvival=await runPersistedDungeonThenSurvivalScenario(port);
    const directRoomGrid=await runDirectDungeonRoomGridScenario(port);
    const sameOpen=await runSameOpenSurvivalToDungeonScenario(port);

    console.log(JSON.stringify({
      scenario:'Dungeon new game after Survival characterization',
      browser:browserName,
      control:control.snap,
      afterSurvival:afterSurvival.snap,
      persistedThenSurvival,
      directRoomGrid,
      sameOpen,
      controlErrors:control.errors,
      afterSurvivalErrors:afterSurvival.errors
    },null,2));

    assert.equal(control.snap.activeProfile,DUNGEON_ID);
    assert.equal(control.snap.family,'adventure');
    assert.equal(control.snap.dungeonMode,true);
    assert.equal(afterSurvival.snap.activeProfile,DUNGEON_ID);
    assert.equal(afterSurvival.snap.family,'adventure');
    assert.equal(afterSurvival.snap.dungeonMode,true);

    assert.equal(control.snap.session,'1','fresh direct Dungeon must activate the common session');
    assert.equal(Number(control.snap.dungeonState?.room),0,'fresh direct Dungeon must start at room 0');
    assert.equal(control.snap.dungeonState?.last??null,null,'fresh direct Dungeon must have no generated room at the entrance');
    assert.equal(afterSurvival.snap.session,'1','Dungeon after Survival must activate the common session');
    assert.equal(Number(afterSurvival.snap.dungeonState?.room),0,'Dungeon after Survival must start at room 0');
    assert.equal(afterSurvival.snap.dungeonState?.last??null,null,'Dungeon after Survival must have no generated room on a clean browser');

    assert.deepEqual(
      fingerprint(afterSurvival.snap),
      fingerprint(control.snap),
      'Dungeon new-game initial state must be identical after Survival and on a fresh direct launch'
    );

    const restarted=persistedThenSurvival.afterNewGame;
    assert.equal(restarted.session,'1','new Dungeon after an old saved Dungeon and Survival must activate the session');
    assert.equal(Number(restarted.dungeonState?.room),0,'NEW GAME must reset a previously persisted Dungeon room back to the entrance');
    assert.equal(restarted.dungeonState?.last??null,null,'NEW GAME must remove the previously persisted generated room');
    assert.deepEqual(restarted.returnControls,control.snap.returnControls,'NEW GAME must not keep stale room-return controls');
    assert.equal(restarted.gridLike.length>0,control.snap.gridLike.length>0,'NEW GAME must restore the same initial grid surface as a clean launch');

    assert.equal(sameOpen.beforeReturn.active,SURVIVAL_ID,'same-open characterization must really start from Survival');
    assert.equal(sameOpen.beforeReturn.family,'survival','same-open characterization must retain Survival family before returning home');
    assert.equal(sameOpen.entrance.activeProfile,DUNGEON_ID,'same-open transition must activate the Dungeon profile');
    assert.equal(sameOpen.entrance.family,'adventure','same-open transition must activate Adventure family');
    assert.ok(Number(directRoomGrid.room.runtime.room)>=1,'direct Dungeon control must reach a generated Dungeon room');
    assert.ok(directRoomGrid.room.runtime.lastKind,'direct Dungeon control must retain the generated room');
    assert.equal(directRoomGrid.room.gridLike.length>0,true,'direct Dungeon control must expose the real visible Dungeon grid surface');
    assert.ok(Number(sameOpen.room.runtime.room)>=1,'same-open Survival -> Dungeon must reach a generated Dungeon room');
    assert.ok(sameOpen.room.runtime.lastKind,'same-open Survival -> Dungeon must retain the generated room');
    assert.equal(
      sameOpen.room.gridLike.length>0,
      directRoomGrid.room.gridLike.length>0,
      'Survival -> Dungeon without manually closing/reopening the link must expose the same real grid surface as direct Dungeon'
    );

    assert.deepEqual(control.errors,[],'fresh direct Dungeon must not raise browser errors');
    assert.deepEqual(afterSurvival.errors,[],'Dungeon after Survival must not raise browser errors');
    assert.deepEqual(persistedThenSurvival.errors,[],'persisted Dungeon -> Survival -> new Dungeon must not raise browser errors');
    assert.deepEqual(directRoomGrid.errors,[],'direct Dungeon room-grid control must not raise browser errors');
    assert.deepEqual(sameOpen.errors,[],'same-open Survival -> Dungeon must not raise browser errors');
  }finally{
    server.closeAllConnections?.();server.closeIdleConnections?.();server.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
