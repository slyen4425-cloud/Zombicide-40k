const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const DUNGEON_ID='game_profile_dungeon_demo';
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

async function waitPreview(page){
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
  await page.waitForFunction(()=>
    typeof window.openGensFamily==='function' &&
    typeof window.startConfiguredGame==='function' &&
    typeof window.gensProfileContentFamily155==='function' &&
    typeof window.openHeroCreator==='function' &&
    typeof window.closeHeroCreator==='function' &&
    typeof window.DungeonCore01?.openHero==='function'
  ,null,{timeout:60000});
}

async function openAdventure(page){
  const b=page.locator('button.gensRootModeCard.adventure');
  await b.waitFor({state:'visible'});
  await b.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
}

async function selectDungeon(page){
  await openAdventure(page);
  let card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');
  await card.waitFor({state:'visible'});
  const sw=await page.evaluate(pid=>({
    active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
    from:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(activeGameProfileId()):'',
    to:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(pid):''
  }),DUNGEON_ID);
  if(sw.active&&sw.active!==DUNGEON_ID&&sw.from!==sw.to){
    await Promise.all([
      page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000}),
      card.click()
    ]);
    await waitPreview(page);
    await openAdventure(page);
    card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');
    await card.waitFor({state:'visible'});
  }
  await card.click();
  await page.waitForFunction(id=>
    typeof activeGameProfileId==='function'&&activeGameProfileId()===id&&
    getComputedStyle(document.getElementById('gensGameHome')).display!=='none'
  ,DUNGEON_ID,{timeout:30000});
}

async function startDungeon(page){
  await selectDungeon(page);
  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');

  await page.locator('#pregameSetup .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');

  const first=page.locator('#participantList input[type="checkbox"]').first();
  await first.waitFor({state:'visible'});
  if(!(await first.isChecked()))await first.check();

  await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();

  await page.waitForFunction(()=>{
    let rt=null;try{rt=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')}catch(e){}
    return Array.isArray(rt?.participants)&&rt.participants.length>0 &&
      localStorage.getItem('z40k_session_active_v1')==='1' &&
      getComputedStyle(document.getElementById('gensDungeonCore01')).display!=='none';
  },null,{timeout:15000});

  return await page.evaluate(()=>{
    const rt=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
    return String(rt.participants[0]);
  });
}

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[stats-editor-ingame] WATCHDOG');process.exit(1)},180000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({
    viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,
    locale:'fr-FR',serviceWorkers:'block'
  });
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  const page=await context.newPage();
  page.setDefaultTimeout(25000);
  page.setDefaultNavigationTimeout(30000);
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror:'+String(e)));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED|NS_BINDING_ABORTED/.test(m.text()))errors.push('console:'+m.text())});
  page.on('dialog',async d=>{try{await d.accept()}catch(e){}});
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());

  try{
    await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
    await waitPreview(page);
    await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await waitPreview(page);

    const hero=await startDungeon(page);

    await page.waitForFunction(()=>
      !!window.GensCleanRpgStats167874 &&
      !!window.GensHeroEditorDynamic167897 &&
      typeof window.GensHeroEditorDynamic167897.gameStatValues==='function'
    ,null,{timeout:15000});

    // Real hero editor: read the definition/base value from the editor UI.
    await page.evaluate(id=>window.openHeroCreator(id),hero);
    await page.waitForFunction(()=>document.getElementById('heroCreatorModal')?.classList.contains('open'));
    await page.waitForFunction(()=>!!document.querySelector('#hcCanonicalStatsFields167897 [data-gens-canonical-hero-stat="force"]'),null,{timeout:10000});

    const editor=await page.evaluate(id=>{
      const input=document.querySelector('#hcCanonicalStatsFields167897 [data-gens-canonical-hero-stat="force"]');
      return {
        hero:id,
        input:Number(input?.value),
        definition:Number(CHARS?.[id]?.dungeonStats?.force),
        legacy:Number(document.getElementById('hcRpgForce')?.value)
      };
    },hero);

    assert.equal(editor.input,editor.definition,'real editor Force field must read the hero definition');
    assert.equal(editor.legacy,editor.definition,'legacy hidden field must remain synchronized with the canonical editor value');

    await page.evaluate(()=>window.closeHeroCreator());

    // Real in-game hero sheet.
    await page.evaluate(id=>window.DungeonCore01.openHero(id),hero);
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('sheet')).display!=='none');
    await page.waitForFunction(()=>document.querySelectorAll('#dungeonAttributeGrid .dungeonStatBox').length>0);
    await page.waitForTimeout(250);

    const sheet=await page.evaluate(id=>{
      const def=window.GensCleanRpgStats167874.def('force');
      const expected=window.GensHeroEditorDynamic167897.gameStatValues(def);
      const boxes=[...document.querySelectorAll('#dungeonAttributeGrid .dungeonStatBox')];
      const box=boxes.find(b=>b.querySelector('[data-attr="force"]'));
      const visibleSmalls=[...(box?.querySelectorAll('small')||[])]
        .filter(el=>getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden')
        .map(el=>({text:(el.textContent||'').trim(),canonical:el.hasAttribute('data-canonical-stat-values'),policy:el.hasAttribute('data-upgrade-policy-note'),explanation:el.hasAttribute('data-clean-stat-explanation')}));
      const canonical=box?.querySelector('[data-canonical-stat-values]')||null;
      return {
        hero:id,
        expected,
        definition:Number(CHARS?.[id]?.dungeonStats?.force),
        state:Number(state?.rpgAttributes?.force),
        large:Number(box?.querySelector('span')?.textContent),
        canonicalExists:!!canonical,
        canonicalVisible:!!canonical&&getComputedStyle(canonical).display!=='none'&&getComputedStyle(canonical).visibility!=='hidden',
        canonicalText:(canonical?.textContent||'').trim(),
        visibleSmalls
      };
    },hero);

    assert.equal(sheet.expected.base,editor.input,'sheet Base héros must come from the same value shown by the editor');
    assert.equal(sheet.large,sheet.expected.total,'large in-game stat must equal the canonical current total');
    assert.equal(sheet.canonicalExists,true,'real stat card must expose an explicit Base héros / Total line');
    assert.equal(sheet.canonicalVisible,true,'Base héros / Total line must be visible');
    assert.equal(
      sheet.canonicalText,
      'Base héros '+sheet.expected.base+' · Total '+sheet.expected.total,
      'real card must label editor base and canonical total explicitly'
    );

    const ambiguous=sheet.visibleSmalls.filter(x=>
      !x.canonical && !x.policy && !x.explanation && /^Base\s/i.test(x.text)
    );
    assert.deepEqual(
      ambiguous,
      [],
      'real card must not keep a second unlabeled legacy Base line beside Base héros / Total'
    );

    assert.deepEqual(errors,[],'Stats editor -> in-game display scenario must not raise runtime errors');

    console.log(JSON.stringify({
      scenario:'Stats editor definition -> canonical runtime -> in-game card',
      editor,
      sheet
    },null,2));
  }finally{
    clearTimeout(watchdog);
    server.closeAllConnections?.();
    server.closeIdleConnections?.();
    server.close();
    await context.close();
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
