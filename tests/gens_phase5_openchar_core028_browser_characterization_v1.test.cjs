'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const indexSource=fs.readFileSync(path.join(root,'index.html'),'utf8');
const deployWorkflow=fs.readFileSync(path.join(root,'.github','workflows','main.yml'),'utf8');
const marker=/<script\b[^>]*\bid=["']dungeonCore028HeroExploreGuard["'][^>]*>[\s\S]*?<\/script>/i;
assert.match(indexSource,marker,'exact S2 index must contain Dungeon Core 0.28 before characterization');

const modulesStart=deployWorkflow.indexOf('          modules = [');
const modulesEnd=deployWorkflow.indexOf('          html = index.read_text',modulesStart);
assert.ok(modulesStart>=0&&modulesEnd>modulesStart,'deploy workflow module block must exist');
const moduleBlock=deployWorkflow.slice(modulesStart,modulesEnd);
const moduleTags=[...moduleBlock.matchAll(/'(<script src="[^"]+"><\/script>)'/g)].map(m=>m[1]);
assert.ok(moduleTags.length>0,'GitHub Pages deploy workflow must expose module tags');

let composed=indexSource;
const perfTag='<script src="assets/gensrpg/gens-mobile-combat-performance-16781022.js"></script>';
composed=composed.replace(perfTag+'\\n','').replace(perfTag,'');
for(const tag of moduleTags){
  if(!composed.includes(tag))composed=composed.replace('</body>',tag+'\\n</body>');
}
const withoutCore028=composed.replace(marker,'');
assert.doesNotMatch(withoutCore028,/dungeonCore028HeroExploreGuard/,'characterization page must remove Core 0.28 entirely');
assert.ok(withoutCore028.includes('dungeon-world-builder-167821.js?v=167821'),'characterization must use the full Pages-style composition');

const DUNGEON_ID='game_profile_dungeon_demo';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg'};

const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(pathname==='/'||pathname==='/__openchar_without_core028.html'){
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
    res.end(withoutCore028);return;
  }
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end('not found');return}
    res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
    res.end(data);
  });
});

async function ready(page){
  await page.waitForFunction(()=>
    typeof window.openGensFamily==='function' &&
    typeof window.startConfiguredGame==='function' &&
    typeof window.DungeonCore01?.openHero==='function' &&
    typeof window.openChar==='function'
  ,null,{timeout:60000});
}

async function selectDungeon(page){
  const adventure=page.locator('button.gensRootModeCard.adventure');
  await adventure.waitFor({state:'visible'});await adventure.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
  let card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');
  await card.waitFor({state:'visible'});
  const sw=await page.evaluate(id=>({
    active:activeGameProfileId?.()||'',
    from:gensProfileContentFamily155?.(activeGameProfileId?.())||'',
    to:gensProfileContentFamily155?.(id)||''
  }),DUNGEON_ID);
  if(sw.active&&sw.active!==DUNGEON_ID&&sw.from!==sw.to){
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000}),card.click()]);
    await ready(page);
    const a2=page.locator('button.gensRootModeCard.adventure');await a2.waitFor({state:'visible'});await a2.click();
    card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');
    await card.waitFor({state:'visible'});
  }
  await card.click();
  await page.waitForFunction(id=>activeGameProfileId?.()===id&&getComputedStyle(document.getElementById('gensGameHome')).display!=='none',DUNGEON_ID,{timeout:30000});
}

async function startDungeon(page){
  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameSetup .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');
  const first=page.locator('#participantList input[type="checkbox"]').first();
  await first.waitFor({state:'visible'});if(!(await first.isChecked()))await first.check();
  await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();
  await page.waitForFunction(()=>{
    let rt=null;try{rt=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')}catch(e){}
    const core=document.getElementById('gensDungeonCore01');
    return Array.isArray(rt?.participants)&&rt.participants.length>0&&core&&getComputedStyle(core).display!=='none';
  },null,{timeout:20000});
}

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[openchar-core028] WATCHDOG');process.exit(1)},150000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR',serviceWorkers:'block'});
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  const page=await context.newPage();
  page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(30000);
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror:'+String(e)));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED|NS_BINDING_ABORTED/.test(m.text()))errors.push('console:'+m.text())});
  page.on('dialog',async d=>{try{await d.accept()}catch(e){}});
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());

  try{
    await page.goto('http://127.0.0.1:'+port+'/__openchar_without_core028.html',{waitUntil:'domcontentloaded',timeout:60000});
    await ready(page);
    await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await ready(page);

    const guard=await page.evaluate(()=>({
      remover:typeof window.dc028RemoveHeroExplore,
      openChar:String(window.openChar).slice(0,800)
    }));
    assert.equal(guard.remover,'undefined','Core 0.28 remover must truly be absent in characterization');
    assert.doesNotMatch(guard.openChar,/dc028RemoveHeroExplore/,'openChar must not be wrapped by Core 0.28 in characterization');

    await selectDungeon(page);await startDungeon(page);

    const hero=await page.evaluate(()=>{
      const rt=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      return String(rt?.participants?.[0]||'');
    });
    assert.ok(hero,'Dungeon must provide a real participant');

    await page.evaluate(id=>window.DungeonCore01.openHero(id),hero);
    await page.waitForFunction(()=>{
      const s=document.getElementById('sheet');
      return s&&getComputedStyle(s).display!=='none';
    },null,{timeout:10000});

    await page.waitForTimeout(350);

    const sheet=await page.evaluate(()=>({
      bodyClass:document.body.className,
      current:String(window.current||''),
      buttons:[...document.querySelectorAll('#sheet button')].map(btn=>({
        text:(btn.textContent||'').replace(/\s+/g,' ').trim(),
        onclick:btn.getAttribute('onclick')||'',
        display:getComputedStyle(btn).display,
        visibility:getComputedStyle(btn).visibility
      })),
      tabs:document.getElementById('dungeonSheetTabs')?getComputedStyle(document.getElementById('dungeonSheetTabs')).display:'absent'
    }));

    const explorers=sheet.buttons.filter(b=>
      /explorer/i.test(b.text) ||
      /exploreDungeonRoom|DungeonCore01\.explore/i.test(b.onclick)
    );
    assert.deepEqual(explorers,[],
      'current Dungeon sheet must not recreate Explorer without Core 0.28; offenders='+JSON.stringify(explorers));
    assert.notEqual(sheet.tabs,'none','Dungeon sheet tabs must still render without Core 0.28');
    assert.deepEqual(errors,[],'characterization must not raise browser/runtime errors');

    console.log(JSON.stringify({
      scenario:'Phase 5 openChar Core 0.28 redundancy characterization',
      removedOwner:'dungeonCore028HeroExploreGuard',
      hero,
      explorerButtons:explorers,
      remainingOpenCharOwner:'Capture 139 over native Shell openChar',
      result:'Core 0.28 openChar wrapper not required by current Dungeon sheet render'
    }));
  }finally{
    clearTimeout(watchdog);
    server.closeAllConnections?.();server.closeIdleConnections?.();server.close();
    await context.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
