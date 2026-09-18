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
    res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
    res.end(data);
  });
});

const visible=async(locator)=>locator.evaluate(el=>{
  const s=getComputedStyle(el),r=el.getBoundingClientRect();
  return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)!==0&&r.width>0&&r.height>0;
});

async function prepare(page,port){
  await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
  await page.waitForFunction(()=>
    typeof window.openGensFamily==='function' &&
    typeof window.openGensBuiltInGame==='function' &&
    typeof window.openEditorHub==='function' &&
    typeof window.openDungeonAdvancedEditor==='function'
  ,null,{timeout:60000});
}

async function openDungeonGameHome(page){
  const adventure=page.locator('button.gensRootModeCard.adventure');
  await adventure.waitFor({state:'visible'});
  await adventure.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
  let card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');
  await card.waitFor({state:'visible'});
  const sw=await page.evaluate(id=>({
    active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
    from:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(activeGameProfileId()):'',
    to:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(id):''
  }),DUNGEON_ID);
  if(sw.active&&sw.active!==DUNGEON_ID&&sw.from!==sw.to){
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000}),card.click()]);
    await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
    await page.waitForFunction(()=>typeof window.openGensFamily==='function'&&typeof window.gensProfileContentFamily155==='function',null,{timeout:60000});
    const adventure2=page.locator('button.gensRootModeCard.adventure');
    await adventure2.waitFor({state:'visible'});await adventure2.click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
    card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');
    await card.waitFor({state:'visible'});await card.click();
  }else{
    await card.click();
  }
  await page.waitForFunction(id=>
    typeof activeGameProfileId==='function'&&activeGameProfileId()===id&&
    getComputedStyle(document.getElementById('gensGameHome')).display!=='none'
  ,DUNGEON_ID,{timeout:30000});
}

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[dungeon-builder-visibility] WATCHDOG');process.exit(1)},120000);
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
    await prepare(page,port);
    await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});

    await openDungeonGameHome(page);
    const editors=page.locator('#gensGameHomeActions .homeEditorsBtn');
    await editors.waitFor({state:'visible'});await editors.click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('editorHub')).display!=='none');

    const dungeonEditorButton=page.locator('#dungeonAdvancedEditorBtn');
    await dungeonEditorButton.waitFor({state:'visible'});
    await dungeonEditorButton.click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('dungeonAdvancedEditor')).display!=='none');

    // Give the existing click-lifecycle installers one event-loop turn.
    await page.waitForTimeout(150);
    await page.waitForFunction(()=>typeof window.GensRpgTacticalRuntimeFixes1678111?.hideRuntimeTabs==='function',null,{timeout:30000});

    const state=await page.evaluate(()=>({
      active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
      family:typeof gensSelectedFamily==='string'?gensSelectedFamily:'',
      session:localStorage.getItem('z40k_session_active_v1'),
      roomApi:!!window.DungeonRoomCreator100,
      builderApi:!!window.DungeonWorldBuilder167821,
      roomLauncher:!!document.getElementById('drc100Launcher'),
      builderLauncher:!!document.getElementById('drc300Launch'),
      roomModal:!!document.getElementById('drc100Modal'),
      builderModal:!!document.getElementById('drc300Modal'),
      roomLauncherHtml:document.getElementById('drc100Launcher')?.outerHTML?.slice(0,1200)||'',
      builderParent:document.getElementById('drc300Launch')?.parentElement?.id||'',
      scripts:[...document.querySelectorAll('script[src]')].map(s=>s.getAttribute('src')||'').filter(s=>/dungeon-room-creator|dungeon-world-builder/.test(s))
    }));
    console.log('[dungeon-builder-visibility] editor-state',JSON.stringify(state,null,2));

    assert.equal(state.active,DUNGEON_ID,'real Dungeon profile must remain selected');
    assert.notEqual(state.session,'1','structural Dungeon editor characterization must run outside an active game');
    assert.equal(state.roomApi,true,'Dungeon Room Creator API must be loaded in preview composition');
    assert.equal(state.builderApi,true,'Dungeon World Builder API must be loaded in preview composition');
    assert.equal(state.roomLauncher,true,'Dungeon editor must contain the Room Creator launcher');
    assert.equal(state.builderLauncher,true,'Dungeon editor must contain CONSTRUIRE UN DONJON');
    assert.equal(state.roomModal,true,'Room Creator modal must be mounted');
    assert.equal(state.builderModal,true,'Dungeon Builder modal must be mounted');
    assert.equal(state.builderParent,'drc100Launcher','Dungeon Builder launcher must remain owned by the Room Creator launcher');

    const ownership=await page.evaluate(()=>{
      const launcher=document.getElementById('drc100Launcher');
      const existing=document.getElementById('dc047RoomBoard');
      const previous=existing?{display:existing.style.display,html:existing.innerHTML}:null;
      const board=existing||document.createElement('div');
      if(!existing){board.id='dc047RoomBoard';document.body.appendChild(board)}
      board.style.display='block';board.style.width='120px';board.style.height='120px';
      board.innerHTML='<div class="dc047Grid" style="width:100px;height:100px"></div>';
      window.GensRpgTacticalRuntimeFixes1678111.hideRuntimeTabs(window);
      const during={
        hidden:launcher?.hasAttribute('data-v111-hidden-tab')||false,
        display:launcher?.style.getPropertyValue('display')||'',
        priority:launcher?.style.getPropertyPriority('display')||''
      };
      if(existing){board.style.display=previous.display;board.innerHTML=previous.html}else board.remove();
      window.GensRpgTacticalRuntimeFixes1678111.hideRuntimeTabs(window);
      return during;
    });
    assert.deepEqual(ownership,{hidden:false,display:'',priority:''},'Tactical V111 must never take display ownership of the structural Dungeon editor launcher');

    const build=page.locator('#drc300Launch');
    assert.equal(await visible(build),true,'CONSTRUIRE UN DONJON must be visible in the Dungeon editor');
    await build.click();
    await page.waitForFunction(()=>document.getElementById('drc300Modal')?.classList.contains('open'));
    assert.match(await page.locator('#drc300Modal').innerText(),/Constructeur de donjon/i,'real Dungeon Builder modal must open');

    const rooms=page.locator('#drc100Launcher .drc100Launch');
    assert.equal(await visible(rooms),true,'Room Creator launcher must remain visible next to Dungeon Builder');

    assert.deepEqual(errors,[],'Dungeon Builder editor path must not raise browser/runtime errors');
    console.log(JSON.stringify({scenario:'Dungeon Builder visibility through real editor path',state}));
  }finally{
    clearTimeout(watchdog);
    server.closeAllConnections?.();server.closeIdleConnections?.();server.close();
    await context.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
