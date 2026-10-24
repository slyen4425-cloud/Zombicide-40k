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
    mark('open-survival-hero');
    const heroPick=page.locator('#menu .charPick').first();
    await heroPick.waitFor({state:'visible'});await heroPick.click();
    await page.waitForFunction(()=>{
      const b=document.getElementById('searchItemBtn');if(!b)return false;
      const r=b.getBoundingClientRect();return r.width>0&&r.height>0;
    },null,{timeout:5000}).catch(()=>{});
    await page.waitForTimeout(100);

    mark('characterize');
    const state=await page.evaluate(()=>{
      const isVisible=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)>0&&r.width>0&&r.height>0};
      const textOf=el=>String(el?.textContent||el?.value||el?.getAttribute?.('aria-label')||el?.title||'').replace(/\s+/g,' ').trim();
      const candidates=[...document.querySelectorAll('button,[role="button"],input[type="button"],input[type="submit"],a,.btn')].map(el=>{
        const s=getComputedStyle(el),r=el.getBoundingClientRect(),text=textOf(el);
        return {tag:el.tagName,id:el.id||'',cls:String(el.className||''),text,visible:isVisible(el),display:s.display,visibility:s.visibility,opacity:s.opacity,pointerEvents:s.pointerEvents,zIndex:s.zIndex,disabled:!!el.disabled,rect:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)],onclick:el.getAttribute?.('onclick')||''};
      });
      const searchNodes=candidates.filter(x=>/fouill|search|loot/i.test(x.text+' '+x.id+' '+x.cls+' '+x.onclick));
      const searchButton=document.getElementById('searchItemBtn');
      const searchAncestors=[];
      for(let el=searchButton;el&&searchAncestors.length<12;el=el.parentElement){
        const s=getComputedStyle(el),r=el.getBoundingClientRect();
        searchAncestors.push({
          tag:el.tagName,id:el.id||'',cls:String(el.className||''),
          display:s.display,visibility:s.visibility,opacity:s.opacity,pointerEvents:s.pointerEvents,
          position:s.position,zIndex:s.zIndex,overflow:s.overflow,
          hidden:!!el.hidden,ariaHidden:el.getAttribute?.('aria-hidden')||'',
          rect:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]
        });
      }
      const globalNames=Object.getOwnPropertyNames(window).filter(k=>/fouill|search|loot/i.test(k)).sort();
      const globalFns=globalNames.filter(k=>typeof window[k]==='function').map(k=>({name:k,source:String(window[k]).slice(0,1200)}));
      const searchOwnerRefs=Object.getOwnPropertyNames(window).filter(k=>{
        try{return typeof window[k]==='function'&&/searchItemBtn|searchBtn/.test(String(window[k]))}catch(e){return false}
      }).sort().map(k=>({name:k,source:String(window[k]).slice(0,1800)}));
      const images=[...document.querySelectorAll('img')].map(img=>{const s=getComputedStyle(img),r=img.getBoundingClientRect();return {id:img.id||'',cls:String(img.className||''),alt:img.alt||'',src:img.getAttribute('src')||'',currentSrc:img.currentSrc||'',complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight,visible:isVisible(img),display:s.display,visibility:s.visibility,opacity:s.opacity,rect:[Math.round(r.x),Math.round(r.y),Math.round(r.width),Math.round(r.height)]}});
      const brokenImages=images.filter(x=>x.src&&x.complete&&x.naturalWidth===0);
      const emptyVisibleImages=images.filter(x=>x.visible&&!x.src);
      const menu=document.getElementById('menu');
      return {
        activeProfile:typeof activeGameProfileId==='function'?activeGameProfileId():'',
        activeStyle:typeof getActiveGameProfile==='function'?getActiveGameProfile()?.gameStyle||'':'',
        family:typeof gensSelectedFamily==='undefined'?'':String(gensSelectedFamily||''),
        dungeonMode:typeof isDungeonMode==='function'?!!isDungeonMode():null,
        menu:{display:menu?getComputedStyle(menu).display:'absent',className:menu?.className||'',text:String(menu?.innerText||'').replace(/\s+/g,' ').slice(0,6000)},
        searchNodes,searchAncestors,globalFns,searchOwnerRefs,
        buttons:candidates.filter(x=>x.visible).slice(0,120),
        images:images.slice(0,200),brokenImages,emptyVisibleImages
      };
    });
    const diagnostic={state,badAssets:[...new Map(badAssets.map(x=>[(x.status+'|'+x.url),x])).values()],errors};
    console.log('[survival-search-art] diagnostic='+JSON.stringify(diagnostic,null,2));

    assert.equal(state.family,'survival','true Shell path must remain in Survival');
    assert.equal(state.dungeonMode,false,'Survival diagnosis must not run through Dungeon');
    const visibleSearch=state.searchNodes.filter(x=>x.visible&&/fouill/i.test(x.text));
    assert.equal(visibleSearch.length,1,'Survival must expose exactly one existing Fouiller action in the opened hero sheet');

    mark('exercise-search');
    const searchBefore=await page.evaluate(()=>({found:typeof state!=='undefined'?state?.found??null:null,deck:document.body.innerText.match(/Pioche\s*:\s*(\d+) cartes/i)?.[1]||''}));
    await page.locator('#searchItemBtn').click();
    const searchAfter=await page.evaluate(()=>({found:typeof state!=='undefined'?state?.found??null:null,deck:document.body.innerText.match(/Pioche\s*:\s*(\d+) cartes/i)?.[1]||'',foundText:String(document.body.innerText||'').replace(/\s+/g,' ').slice(0,7000)}));
    console.log('[survival-search-art] search-action='+JSON.stringify({before:searchBefore,after:searchAfter},null,2));
    assert.ok(searchAfter.found&&searchAfter.found!==searchBefore.found,'clicking the real Fouiller button must resolve through the existing searchItem() action');

    mark('verify-survival-hero-arts');
    const heroArts=await page.evaluate(()=>[...document.querySelectorAll('#participantList img.participantAvatar')]
      .map(img=>({src:img.getAttribute('src')||'',complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight}))
      .filter(x=>/assets\/img_0[1-6]_/.test(x.src)));
    assert.equal(heroArts.length,6,'the real Survival participant renderer must expose all six built-in hero arts');
    assert.ok(heroArts.every(x=>x.complete&&x.naturalWidth>0&&x.naturalHeight>0),'all six built-in Survival hero arts must decode');

    mark('verify-survival-item-arts');
    await page.locator('#sheet .topbar button[onclick="goMenu()"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('menu')).display!=='none');
    await page.locator('#menu button[onclick="openDeckSetup()"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('objectManager')).display!=='none');
    await page.waitForFunction(()=>document.querySelectorAll('#deckConfig img').length>0);
    await page.evaluate(async()=>{
      const imgs=[...document.querySelectorAll('#deckConfig img')]
        .filter(img=>/assets\/img_(?:0[7-9]|1\d|2[0-6])_/.test(img.getAttribute('src')||''));
      await Promise.all(imgs.map(img=>img.decode?.().catch(()=>null)));
    });
    const itemArts=await page.evaluate(()=>[...document.querySelectorAll('#deckConfig img')]
      .map(img=>({src:img.getAttribute('src')||'',complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight}))
      .filter(x=>/assets\/img_(?:0[7-9]|1\d|2[0-6])_/.test(x.src)));
    assert.equal(itemArts.length,20,'the real Survival deck renderer must expose the twenty built-in item/search-event arts');
    assert.ok(itemArts.every(x=>x.complete&&x.naturalWidth>0&&x.naturalHeight>0),'all built-in Survival item arts must decode');
    await page.locator('#objectManager .topbar button[onclick="closeObjectManager()"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('menu')).display!=='none');

    mark('verify-survival-enemy-arts');
    await page.locator("#menu button[onclick=\"openZombieManager('menu')\"]").click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('zombieManager')).display!=='none');
    await page.waitForFunction(()=>document.querySelectorAll('#zombieReserve img.zombieThumb').length>0);
    await page.evaluate(async()=>{
      const imgs=[...document.querySelectorAll('#zombieReserve img.zombieThumb')]
        .filter(img=>/assets\/img_(?:2[6-9]|3[0-2])_/.test(img.getAttribute('src')||''));
      await Promise.all(imgs.map(img=>img.decode?.().catch(()=>null)));
    });
    const enemyArts=await page.evaluate(()=>[...document.querySelectorAll('#zombieReserve img.zombieThumb')]
      .map(img=>({src:img.getAttribute('src')||'',complete:img.complete,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight}))
      .filter(x=>/assets\/img_(?:2[6-9]|3[0-2])_/.test(x.src)));
    assert.equal(enemyArts.length,7,'the real Survival reserve renderer must expose all seven built-in enemy arts');
    assert.ok(enemyArts.every(x=>x.complete&&x.naturalWidth>0&&x.naturalHeight>0),'all built-in Survival enemy arts must decode');

    const expected=Array.from({length:32},(_,i)=>String(i+1).padStart(2,'0'));
    const loaded=[...heroArts,...itemArts,...enemyArts].map(x=>(x.src.match(/assets\/img_(\d{2})_/)||[])[1]).filter(Boolean);
    assert.deepEqual([...new Set(loaded)].sort(),expected,'real Survival renderers must collectively load img_01 through img_32 with no cross-module fallback');

    const brokenSurvivalArts=badAssets.filter(x=>/\/assets\/img_\d+_/i.test(x.url||''));
    assert.deepEqual(brokenSurvivalArts,[],'Survival built-in art links must resolve without 404');
    assert.deepEqual(errors,[],'Survival search/art scenario must not raise browser runtime errors');
  }finally{
    clearTimeout(watchdog);server.closeAllConnections?.();server.closeIdleConnections?.();server.close();await context.close();await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1});
