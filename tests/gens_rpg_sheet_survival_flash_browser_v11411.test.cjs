const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const DUNGEON_ID='game_profile_dungeon_demo';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const rel=pathname==='/'?'/preview.html':pathname,file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('not found');return}res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});res.end(data)});
});

async function ready(page,port){
  await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
  await page.waitForFunction(()=>typeof openGensFamily==='function'&&typeof startConfiguredGame==='function'&&typeof window.DungeonCore01?.render==='function',null,{timeout:60000});
}
async function openDungeonHome(page){
  const adventure=page.locator('button.gensRootModeCard.adventure');await adventure.waitFor({state:'visible'});await adventure.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
  let card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');await card.waitFor({state:'visible'});
  const sw=await page.evaluate(id=>({active:activeGameProfileId?.()||'',from:gensProfileContentFamily155?.(activeGameProfileId?.())||'',to:gensProfileContentFamily155?.(id)||''}),DUNGEON_ID);
  if(sw.active&&sw.active!==DUNGEON_ID&&sw.from!==sw.to){
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000}),card.click()]);
    await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
    const a2=page.locator('button.gensRootModeCard.adventure');await a2.waitFor({state:'visible'});await a2.click();
    card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');await card.waitFor({state:'visible'});await card.click();
  }else await card.click();
  await page.waitForFunction(id=>activeGameProfileId?.()===id&&getComputedStyle(document.getElementById('gensGameHome')).display!=='none',DUNGEON_ID,{timeout:30000});
}
async function startDungeon(page){
  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameSetup .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');
  const first=page.locator('#participantList input[type="checkbox"]').first();await first.waitFor({state:'visible'});if(!(await first.isChecked()))await first.check();
  await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();
  await page.waitForFunction(()=>{
    let rt=null;try{rt=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')}catch(e){}
    const core=document.getElementById('gensDungeonCore01');
    return Array.isArray(rt?.participants)&&rt.participants.length>0&&core&&getComputedStyle(core).display!=='none';
  },null,{timeout:20000});
  await page.waitForFunction(()=>!!document.querySelector('#dc01Heroes .dc01Hero'),null,{timeout:15000});
}
(async()=>{
  const watchdog=setTimeout(()=>{console.error('[rpg-sheet-flash] WATCHDOG');process.exit(1)},120000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR',serviceWorkers:'block'});
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  const page=await context.newPage();page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(30000);
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror:'+String(e)));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED|NS_BINDING_ABORTED/.test(m.text()))errors.push('console:'+m.text())});
  page.on('dialog',async d=>{try{await d.accept()}catch(e){}});
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  try{
    await ready(page,port);await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await page.reload({waitUntil:'domcontentloaded',timeout:60000});await ready(page,port);
    await openDungeonHome(page);await startDungeon(page);

    const cardDiag=await page.evaluate(()=>{
      const card=document.querySelector('#dc01Heroes .dc01Hero');
      const clickables=card?[card,...card.querySelectorAll('button,[role="button"],[onclick],a')]:[];
      const globals=Object.keys(window).filter(k=>/^(?:open|show|render|apply).*(?:char|hero|sheet)|(?:char|hero|sheet).*(?:open|show|render)$/i.test(k)&&typeof window[k]==='function').sort();
      return {cardHtml:card?.outerHTML?.slice(0,5000)||'',clickables:clickables.map(el=>({tag:el.tagName,id:el.id||'',cls:String(el.className||''),text:(el.textContent||'').trim().slice(0,120),onclick:el.getAttribute?.('onclick')||'',hasOnclick:typeof el.onclick==='function'})),globals};
    });
    console.log('[rpg-sheet-flash] hero-card',JSON.stringify(cardDiag,null,2));

    await page.evaluate(()=>{
      const sheet=document.getElementById('sheet');
      window.__rpgSheetTrace=[];window.__rpgSheetCalls=[];
      const visible=el=>!!el&&getComputedStyle(el).display!=='none'&&getComputedStyle(el).visibility!=='hidden'&&getComputedStyle(el).opacity!=='0';
      window.__rpgSheetSnap=phase=>{
        const s=document.getElementById('sheet'),z=document.getElementById('zombicideSkillPanel'),tabs=document.getElementById('dungeonSheetTabs'),tree=document.getElementById('dungeonSkillTreePanel');
        window.__rpgSheetTrace.push({phase,t:performance.now(),sheetVisible:visible(s),sheetDisplay:s?getComputedStyle(s).display:'absent',bodyClass:document.body.className,current:String(window.current||''),zombicideVisible:visible(z),zombicideDisplay:z?getComputedStyle(z).display:'absent',dungeonTabsVisible:visible(tabs),dungeonTabsDisplay:tabs?getComputedStyle(tabs).display:'absent',dungeonTreeVisible:visible(tree),text:(s?.innerText||'').replace(/\s+/g,' ').trim().slice(0,500),ids:s?[...s.querySelectorAll('[id]')].map(x=>x.id).filter(Boolean).slice(0,120):[]});
      };
      const names=['openChar','openCharacter','openHeroSheet','showHeroSheet','renderCharacterSheet','renderDungeonHeroSheet','renderDungeonHeroStats','renderDungeonAttributes','applyDungeonSheetTabs','renderDungeonSkillTree'];
      for(const name of names){const old=window[name];if(typeof old!=='function'||old.__rpgSheetTraceWrap)continue;const w=function(){window.__rpgSheetCalls.push({name,phase:'enter',t:performance.now(),current:String(window.current||'')});window.__rpgSheetSnap('call:'+name+':before');const out=old.apply(this,arguments);window.__rpgSheetSnap('call:'+name+':after');window.__rpgSheetCalls.push({name,phase:'exit',t:performance.now(),current:String(window.current||'')});return out};w.__rpgSheetTraceWrap=true;w.__original=old;window[name]=w}
      if(sheet){window.__rpgSheetObserver=new MutationObserver(()=>window.__rpgSheetSnap('mutation'));window.__rpgSheetObserver.observe(sheet,{subtree:true,childList:true,attributes:true,characterData:true})}
      window.__rpgSheetSnap('before-click');
    });

    const clicked=await page.evaluate(()=>{
      const card=document.querySelector('#dc01Heroes .dc01Hero');if(!card)return {ok:false,why:'no-card'};
      const candidates=[...card.querySelectorAll('button,[role="button"],[onclick],a'),card];
      let el=candidates.find(x=>/openChar|openHero|showHero|sheet/i.test(x.getAttribute?.('onclick')||''))||candidates.find(x=>typeof x.onclick==='function')||card;
      el.click();
      window.__rpgSheetSnap('sync-after-click');
      requestAnimationFrame(()=>{window.__rpgSheetSnap('raf1');requestAnimationFrame(()=>window.__rpgSheetSnap('raf2'))});
      setTimeout(()=>window.__rpgSheetSnap('timeout0'),0);
      return {ok:true,tag:el.tagName,id:el.id||'',cls:String(el.className||''),text:(el.textContent||'').trim().slice(0,120),onclick:el.getAttribute?.('onclick')||''};
    });
    assert.equal(clicked.ok,true,'real Dungeon hero card must be available');
    await page.waitForFunction(()=>{const s=document.getElementById('sheet');return s&&getComputedStyle(s).display!=='none'},null,{timeout:10000});
    await page.waitForTimeout(250);

    const trace=await page.evaluate(()=>{window.__rpgSheetSnap('final');window.__rpgSheetObserver?.disconnect?.();return {trace:window.__rpgSheetTrace||[],calls:window.__rpgSheetCalls||[],family:typeof gensSelectedFamily==='undefined'?'':String(gensSelectedFamily||''),active:window.activeGameProfileId?.()||'',dungeonMode:!!window.isDungeonMode?.()}}).catch(e=>({evalError:String(e)}));
    trace.clicked=clicked;
    console.log('[rpg-sheet-flash] trace',JSON.stringify(trace,null,2));
    assert.ok(trace,'trace must be readable');
    assert.equal(trace.family,'adventure');assert.equal(trace.active,DUNGEON_ID);assert.equal(trace.dungeonMode,true);
    const visibleSheet=trace.trace.filter(x=>x.sheetVisible);
    assert.ok(visibleSheet.length>0,'real hero sheet must become visible');
    const paintPhases=new Set(['sync-after-click','raf1','raf2','timeout0','final']);
    const paintVisible=visibleSheet.filter(x=>paintPhases.has(x.phase));
    assert.ok(paintVisible.some(x=>x.phase==='raf1')&&paintVisible.some(x=>x.phase==='raf2'),'the regression must sample real animation-frame boundaries');
    const survivalFrames=paintVisible.filter(x=>x.zombicideVisible);
    assert.equal(survivalFrames.length,0,'RPG sheet must never paint a Survival/Zombicide skill panel; frames='+JSON.stringify(survivalFrames));
    const openAfter=trace.trace.find(x=>x.phase==='call:openChar:after');
    assert.ok(openAfter&&openAfter.sheetVisible,'openChar must finish with the real hero sheet visible');
    assert.equal(openAfter.zombicideVisible,false,'openChar must finish with Survival/Zombicide skills already hidden before the browser can paint');
    const final=trace.trace.at(-1);assert.equal(final.sheetVisible,true);assert.equal(final.dungeonTabsVisible,true,'final Dungeon hero sheet must expose Dungeon tabs');
    assert.deepEqual(errors,[],'browser console/page errors');
  }finally{
    clearTimeout(watchdog);await context.close();await browser.close();await new Promise(r=>server.close(r));
  }
})().catch(e=>{console.error(e);process.exitCode=1});
