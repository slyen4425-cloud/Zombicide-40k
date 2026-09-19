const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const SURVIVAL_ID='game_profile_zombicide_base';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const rel=pathname==='/'?'/preview.html':pathname,file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end('not found');return}
    res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
    res.end(data);
  });
});

async function prepare(page,port){
  await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
  await page.waitForFunction(()=>typeof openGensFamily==='function'&&typeof openGensBuiltInGame==='function'&&typeof startConfiguredGame==='function',null,{timeout:30000});
}

async function openSurvival(page){
  const rootCard=page.locator('button.gensRootModeCard.survival');
  await rootCard.waitFor({state:'visible'});await rootCard.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
  const exact=page.locator('#gensFamilyGames button.gensFamilyGameCard[onclick*="'+SURVIVAL_ID+'"]');
  const card=await exact.count()?exact.first():page.locator('#gensFamilyGames button.gensFamilyGameCard:not(.disabled)').first();
  await card.waitFor({state:'visible'});await card.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensGameHome')).display!=='none');
}

async function startSurvival(page){
  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameHeroStep')).display!=='none');
  await page.locator('#pregameHeroStep .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');
  const first=page.locator('#participantList input[type="checkbox"]').first();
  await first.waitFor({state:'visible'});if(!(await first.isChecked()))await first.check();
  await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();
  await page.waitForFunction(()=>localStorage.getItem('z40k_session_active_v1')==='1',null,{timeout:15000});
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('menu')).display!=='none',null,{timeout:15000});
}

(async()=>{
  let stage='boot';
  const mark=s=>{stage=s;console.log('[survival-search-art]',s)};
  const watchdog=setTimeout(()=>{console.error('[survival-search-art] WATCHDOG '+stage);process.exit(1)},150000);
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR',serviceWorkers:'block'});
  await context.addInitScript(()=>{try{localStorage.clear();sessionStorage.clear()}catch(e){}window.supabase={createClient:()=>({})}});
  const page=await context.newPage();page.setDefaultTimeout(25000);
  const errors=[],badAssets=[];
  page.on('pageerror',e=>errors.push('pageerror:'+String(e)));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED|NS_BINDING_ABORTED/.test(m.text()))errors.push('console:'+m.text())});
  page.on('response',r=>{const u=r.url();if(r.status()>=400&&/\.(?:png|jpe?g|webp|gif|svg)(?:\?|$)/i.test(u))badAssets.push({status:r.status(),url:u})});
  page.on('requestfailed',r=>{const u=r.url();if(/\.(?:png|jpe?g|webp|gif|svg)(?:\?|$)/i.test(u))badAssets.push({status:'failed',url:u,error:r.failure()?.errorText||''})});
  page.on('dialog',async d=>{try{await d.dismiss()}catch(e){}});
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());

  try{
    mark('prepare');await prepare(page,port);
    mark('open-survival');await openSurvival(page);
    mark('start-survival');await startSurvival(page);
    await page.waitForTimeout(250);

    mark('characterize');
    const state=await page.evaluate(()=>{
      const isVisible=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0&&r.width>0&&r.height>0};
      const textOf=el=>String(el?.textContent||el?.value||el?.getAttribute?.('aria-label')||el?.title||'').replace(/\s+/g,' ').trim();
      const candidates=[...document.querySelectorAll('button,[role="button"],input[type="button"],input[type="submit"],a,.btn')].map(el=>{
        const s=getComputedStyle(el),r=el.getBoundingClientRect(),text=textOf(el);
        return {tag:el.tagName,id:el.id||'',cls:String(el.className||''),text,visible:isVisible(el),display:s.display,visibility:s.visibility,opacity:s.opacity,pointerEvents:s.pointerEvents,zIndex:s.zIndex,disabled:!!el.disabled,rect:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)],onclick:el.getAttribute?.('onclick')||''};
      });
      const searchNodes=candidates.filter(x=>/fouill|search|loot/i.test(x.text+' '+x.id+' '+x.cls+' '+x.onclick));
      const globalNames=Object.getOwnPropertyNames(window).filter(k=>/fouill|search|loot/i.test(k)).sort();
      const globalFns=globalNames.filter(k=>typeof window[k]==='function').map(k=>({name:k,source:String(window[k]).slice(0,1200)}));
      const images=[...document.querySelectorAll('img')].map(img=>{const s=getComputedStyle(img),r=img.getBoundingClientRect();return {id:img.id||'',cls:String(img.className||''),alt:img.alt||'',src:img.getAttribute('src')||'',currentSrc:img.currentSrc||'',complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,visible:isVisible(img),display:s.display,visibility:s.visibility,opacity:s.opacity,rect:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]}});
      const brokenImages=images.filter(x=>x.src&&x.complete&&x.naturalWidth===0);
      const emptyVisibleImages=images.filter(x=>x.visible&&!x.src);
      const menu=document.getElementById('menu');
      return {
        activeProfile:typeof activeGameProfileId==='function'?activeGameProfileId():'',
        activeStyle:typeof getActiveGameProfile==='function'?getActiveGameProfile()?.gameStyle||'':'',
        family:window.GensSurvivalModeIsolation1678104?.storedFamily?.()||'',
        dungeonMode:typeof isDungeonMode==='function'?!!isDungeonMode():null,
        menu:{display:menu?getComputedStyle(menu).display:'absent',className:menu?.className||'',text:String(menu?.innerText||'').replace(/\s+/g,' ').slice(0,6000)},
        searchNodes,globalFns,
        buttons:candidates.filter(x=>x.visible).slice(0,120),
        images:images.slice(0,200),brokenImages,emptyVisibleImages
      };
    });
    const diagnostic={state,badAssets:[...new Map(badAssets.map(x=>[(x.status+'|'+x.url),x])).values()],errors};
    console.log('[survival-search-art] diagnostic='+JSON.stringify(diagnostic,null,2));

    assert.equal(state.family,'survival','true Shell path must remain in Survival');
    assert.equal(state.dungeonMode,false,'Survival diagnosis must not run through Dungeon');
    const visibleSearch=state.searchNodes.filter(x=>x.visible&&/fouill/i.test(x.text));
    assert.ok(visibleSearch.length>0,'RED: Survival must expose its existing Fouiller action visibly in the real game UI');
  }finally{
    clearTimeout(watchdog);server.closeAllConnections?.();server.closeIdleConnections?.();server.close();await context.close();await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1});
