const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
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

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[phase6-survival-skill-library] WATCHDOG');process.exit(1)},120000);
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
  page.on('console',m=>{
    if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED|NS_BINDING_ABORTED/.test(m.text()))errors.push('console:'+m.text());
  });
  page.on('dialog',async d=>{try{await d.accept()}catch(e){}});
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());

  try{
    await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
    await page.waitForFunction(()=>typeof openGensFamily==='function'&&typeof openEditorHub==='function'&&typeof openAbilityLibrary==='function',null,{timeout:60000});

    await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});

    const survival=page.locator('button.gensRootModeCard.survival');
    await survival.waitFor({state:'visible'});
    await survival.click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');

    const games=page.locator('#gensFamilyGames button.gensFamilyGameCard:not(.disabled)');
    await games.first().waitFor({state:'visible'});
    await games.first().click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensGameHome')).display!=='none');

    await page.evaluate(()=>{
      localStorage.setItem('z40k_skill_library_v2',JSON.stringify([{
        id:'qa_survival_custom_skill',
        name:'Sentinelle Survie QA',
        type:'text',
        desc:'Compétence personnalisée Survie de sentinelle.'
      }]));
    });

    const editors=page.locator('#gensGameHome .homeEditorsBtn');
    await editors.waitFor({state:'visible'});
    await editors.click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('editorHub')).display!=='none');

    const contextState=await page.evaluate(()=>({
      family:String(window.gensSelectedFamily||''),
      activeId:typeof activeGameProfileId==='function'?activeGameProfileId():'',
      gameStyle:typeof getActiveGameProfile==='function'?(getActiveGameProfile()?.gameStyle||''):'',
      isRpg:typeof editorHubIsRpgContext==='function'?editorHubIsRpgContext():null
    }));
    assert.ok(contextState.activeId,'fixture must keep a real active Survival profile');
    assert.notEqual(contextState.gameStyle,'dungeon','fixture active profile must be non-Dungeon');
    assert.equal(contextState.isRpg,false,'editor hub must resolve as Survival context');

    const skills=page.locator('#abilityLibraryHubCard');
    await skills.waitFor({state:'visible'});
    await skills.click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('abilityLibraryModal')).display!=='none');

    const initial=await page.evaluate(()=>({
      tabs:[...document.querySelectorAll('#abilityLibraryTabs button')].map(b=>({text:(b.textContent||'').trim(),active:b.classList.contains('primary')})),
      list:(document.getElementById('abilityLibraryList')?.innerText||'').replace(/\s+/g,' ').trim(),
      libraryTab:String(window.gensAbilityLibraryTab||'')
    }));

    assert.ok(initial.tabs.some(t=>/Survie/i.test(t.text)),'the shared skill library must expose a Survival tab');
    assert.equal(initial.libraryTab,'survival','opening Skills from the Survival editor hub must default to Survival');
    assert.ok(initial.tabs.some(t=>/Survie/i.test(t.text)&&t.active),'Survival tab must be visibly active');
    for(const name of ['Tourelle','Extermination','Soins intensifs','Sentinelle Survie QA']){
      assert.match(initial.list,new RegExp(name,'i'),'Survival library must show '+name);
    }

    const rpgTab=page.locator('#abilityLibraryTabs button').filter({hasText:'RPG'});
    await rpgTab.click();
    await page.waitForFunction(()=>String(window.gensAbilityLibraryTab||'')==='rpg');

    const rpg=await page.evaluate(()=>({
      list:(document.getElementById('abilityLibraryList')?.innerText||'').replace(/\s+/g,' ').trim(),
      tabs:[...document.querySelectorAll('#abilityLibraryTabs button')].map(b=>({text:(b.textContent||'').trim(),active:b.classList.contains('primary')}))
    }));
    assert.match(rpg.list,/Frappe puissante|\+1 Force/i,'RPG tab must keep the existing RPG ability catalogue');
    assert.ok(rpg.tabs.some(t=>/RPG/i.test(t.text)&&t.active),'RPG tab must remain selectable after the Survival view');
    assert.deepEqual(errors,[],'Survival skill-library routing must not raise browser/runtime errors');

    console.log(JSON.stringify({
      scenario:'Phase 6 Survival skill library from real editor hub',
      contextState,
      initial,
      rpgVisible:true
    }));
  }finally{
    clearTimeout(watchdog);
    server.closeAllConnections?.();server.closeIdleConnections?.();server.close();
    await context.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1;});
