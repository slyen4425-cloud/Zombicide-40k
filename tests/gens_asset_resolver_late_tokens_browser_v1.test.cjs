const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const rel=pathname==='/'?'/preview.html':pathname;
  const file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end('not found');return}
    res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
    res.end(data)
  })
});

async function prepare(page){
  await page.goto(page.__url,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
  await page.waitForFunction(()=>typeof window.openGensFamily==='function'&&typeof window.startConfiguredGame==='function'&&!!window.GensAssetResolverV1,null,{timeout:60000});
}
async function openFamily(page,family){
  const card=page.locator('button.gensRootModeCard.'+family);
  await card.waitFor({state:'visible'});
  await card.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
}
async function selectDungeon(page){
  const id='game_profile_dungeon_demo';
  await page.waitForFunction(()=>typeof window.gensProfileContentFamily155==='function'&&typeof window.activeGameProfileId==='function',null,{timeout:60000});
  await openFamily(page,'adventure');
  let card=page.locator('#gensFamilyGames [data-rpg-profile="'+id+'"] .gensUniverseMainBtn');
  await card.waitFor({state:'visible'});
  const sw=await page.evaluate(id=>({
    active:activeGameProfileId(),
    from:gensProfileContentFamily155(activeGameProfileId()),
    to:gensProfileContentFamily155(id)
  }),id);
  if(sw.active&&sw.active!==id&&sw.from!==sw.to){
    await Promise.all([
      page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000}),
      card.click()
    ]);
    await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
    await page.waitForFunction(()=>typeof window.openGensFamily==='function'&&typeof window.gensProfileContentFamily155==='function'&&!!window.GensAssetResolverV1,null,{timeout:60000});
    await openFamily(page,'adventure');
    card=page.locator('#gensFamilyGames [data-rpg-profile="'+id+'"] .gensUniverseMainBtn');
    await card.waitFor({state:'visible'});
    await card.click();
  }else{
    await card.click();
  }
  await page.waitForFunction(id=>typeof activeGameProfileId==='function'&&activeGameProfileId()===id&&getComputedStyle(document.getElementById('gensGameHome')).display!=='none',id,{timeout:30000});
}
async function startDungeon(page){
  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameSetup .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');
  const first=page.locator('#participantList input[type="checkbox"]').first();
  if(!(await first.isChecked()))await first.check();
  await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
  await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();
  await page.waitForFunction(()=>!!window.DungeonCore01&&!!localStorage.getItem('gensrpg_dungeon_runtime_v2'),null,{timeout:15000});
}
async function enterFirstRoom(page){
  const explore=page.locator('#dc01Explore');
  await explore.waitFor({state:'visible'});
  await explore.click();
  const ok=page.locator('#dc200ModalOk');
  try{await ok.waitFor({state:'visible',timeout:6000});await ok.click()}catch(e){}
  await page.waitForFunction(()=>{
    try{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      return Number(x?.room)>=1&&!!x?.last&&document.querySelectorAll('#dc047RoomBoard .dc047Grid>.dc047Cell').length>0;
    }catch(e){return false}
  },null,{timeout:15000});
}

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[late-token-assets] WATCHDOG');process.exit(1)},120000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR',serviceWorkers:'block'});
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  const page=await context.newPage();
  page.__url='http://127.0.0.1:'+port+'/preview.html';
  page.setDefaultTimeout(25000);
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED|NS_BINDING_ABORTED/.test(m.text()))errors.push(m.text())});
  page.on('dialog',async d=>{try{await d.accept()}catch(e){}});
  try{
    await prepare(page);
    await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1'&&!!window.GensAssetResolverV1,null,{timeout:60000});
    await selectDungeon(page);
    await startDungeon(page);
    await enterFirstRoom(page);

    await page.evaluate(()=>{
      const h=window.CHARS?.dungeon_aldren;
      if(h){h.image='';h.avatar=''}
      window.DungeonCore01?.render?.();
    });
    await page.waitForFunction(()=>!!document.querySelector('.dc310Hero img'),null,{timeout:10000});

    const state=await page.evaluate(()=>{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      const hero='dungeon_aldren';
      const heroImg=document.querySelector('.dc310Hero img');
      const enemies=(typeof loadActiveEnemies==='function'?loadActiveEnemies():[]).filter(e=>!e.removed&&!e.defeated&&Number(e.hp)>0&&Number(e.dungeonRoom||0)===Number(x?.room||0));
      const first=enemies.find(e=>Number.isInteger(Number(x?.enemyCells?.[e.id])));
      let enemySrc='',enemyExpected='',enemyId='';
      if(first){
        enemyId=String(first.enemyId||'');
        const pos=Number(x.enemyCells[first.id]);
        const cell=document.querySelectorAll('#dc047RoomBoard .dc047Grid>.dc047Cell')[pos];
        enemySrc=cell?.querySelector('.dc310Enemy img')?.getAttribute('src')||'';
        enemyExpected=window.GensAssetResolverV1.dungeonCreaturePath(enemyId);
      }
      return {
        heroSrc:heroImg?.getAttribute('src')||'',
        heroExpected:window.GensAssetResolverV1.dungeonHeroPath(hero),
        enemyId,enemySrc,enemyExpected,
        core310:typeof window.dungeonDebug310==='function'?window.dungeonDebug310():null
      };
    });

    console.log('[late-token-assets]',JSON.stringify(state,null,2));
    assert.equal(state.heroSrc,state.heroExpected,'final Core 3.10 hero token must keep the canonical Aldren art');
    assert.ok(state.enemyId,'first generated Dungeon room must expose at least one live enemy for token parity');
    assert.ok(/^dng_/i.test(state.enemyId),'characterization expects a canonical built-in Dungeon enemy');
    assert.equal(state.enemySrc,state.enemyExpected,'final Core 3.10 enemy token must keep the canonical Dungeon enemy art');
    assert.equal(errors.length,0,'browser console/page errors');
  }finally{
    clearTimeout(watchdog);
    await context.close();await browser.close();await new Promise(r=>server.close(r));
  }
})().catch(e=>{console.error(e);process.exitCode=1});
