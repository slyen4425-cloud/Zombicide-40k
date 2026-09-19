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
  await page.waitForFunction(()=>
    typeof openGensFamily==='function' &&
    typeof window.DungeonRoomCreator100?.upsertRoom==='function' &&
    typeof window.DungeonWorldBuilder167821?.createDungeon==='function' &&
    typeof window.DungeonRoomTemplateContent167828?.openEditor==='function' &&
    typeof window.DungeonRoomVisualConfig167826?.openEditor==='function' &&
    typeof window.DungeonRoomContentUI167831?.install==='function' &&
    typeof window.DungeonRoomGridCapture167830?.bindGrid==='function'
  ,null,{timeout:60000});
}
async function openEditor(page){
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
  await page.locator('#gensGameHomeActions .homeEditorsBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('editorHub')).display!=='none');
  await page.locator('#dungeonAdvancedEditorBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('dungeonAdvancedEditor')).display!=='none');
}
async function openChest(page,cell){
  const el=page.locator('#drc100Grid [data-drc-index="'+cell+'"]');await el.waitFor({state:'visible'});await el.click();
}

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[object-config-editor] WATCHDOG');process.exit(1)},140000);
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
    await ready(page,port);await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await page.reload({waitUntil:'domcontentloaded',timeout:60000});await ready(page,port);await openEditor(page);
    const fixture=await page.evaluate(()=>{
      const R=DungeonRoomCreator100,B=DungeonWorldBuilder167821;
      const room=R.createRoom({id:'reg_config_room',name:'Régression config objet',width:5,height:3,theme:'stone'});
      room.cells=room.cells.map(c=>({...c,terrain:'floor',object:null}));room.cells[12].object='entry';room.cells[2].object='exit';room.cells[7].object='chest';R.upsertRoom(room);
      const world=B.createDungeon({name:'Régression config objet'}),added=B.addRoomInstance(world.id,room.id,'Salle config');
      return {roomId:room.id,worldId:world.id,nodeId:added.node.id};
    });

    const launch=page.locator('#drc100Launcher button[onclick="DungeonRoomCreator100.open()"]');await launch.waitFor({state:'visible'});await launch.click();
    await page.waitForFunction(()=>document.getElementById('drc100Modal')?.classList.contains('open'));
    await page.evaluate(id=>DungeonRoomCreator100.editRoom(id),fixture.roomId);
    await page.waitForFunction(()=>!!document.querySelector('#drc100Grid [data-drc-index="7"]'));

    // Cycle 1: direct template configuration must use the modern object selector.
    await page.locator('#drt167828Toggle').click();
    const beforeTemplate=await page.locator('#drc100Grid [data-drc-index="7"]').evaluate(el=>({configured:el.classList.contains('drt167828Configured'),bg:getComputedStyle(el).backgroundColor}));
    assert.equal(beforeTemplate.configured,false,'a placed object with only automatic defaults must not look configured');
    await openChest(page,7);
    const first=await page.evaluate(()=>({
      modal:document.getElementById('drt167828Modal')?.classList.contains('open')||false,
      modern:!!document.getElementById('dui167831Itemtemplate'),
      legacyTextareaVisible:(()=>{const e=document.getElementById('drtItems');return !!e&&getComputedStyle(e).display!=='none'})(),
      templateOpen:String(DungeonRoomTemplateContent167828.openEditor||'').slice(0,1200),
      templatePatched:!!DungeonRoomTemplateContent167828.__dui167831Patched
    }));
    assert.equal(first.modal,true);assert.equal(first.modern,true,'first direct configuration must use modern item dropdown');assert.equal(first.legacyTextareaVisible,false,'legacy item-ID textarea must be hidden on first direct configuration');
    await page.locator('#drt167828Modal button[onclick="DungeonRoomTemplateContent167828.saveActive()"]').click();
    await page.waitForFunction(()=>!document.getElementById('drt167828Modal')?.classList.contains('open'));
    const configuredTemplate=await page.locator('#drc100Grid [data-drc-index="7"]').evaluate(el=>({configured:el.classList.contains('drt167828Configured'),bg:getComputedStyle(el).backgroundColor}));
    assert.equal(configuredTemplate.configured,true,'saved object must receive configured state');
    assert.notEqual(configuredTemplate.bg,beforeTemplate.bg,'saved object must use a visibly different configured color');
    await page.evaluate(()=>DungeonRoomCreator100.close());
    await page.waitForFunction(()=>!document.getElementById('drc100Modal')?.classList.contains('open'));

    // Cycle 2: reopen the same editor and same room.
    await launch.click();await page.waitForFunction(()=>document.getElementById('drc100Modal')?.classList.contains('open'));
    await page.evaluate(id=>DungeonRoomCreator100.editRoom(id),fixture.roomId);
    await page.waitForFunction(()=>!!document.querySelector('#drc100Grid [data-drc-index="7"]'));
    await page.locator('#drt167828Toggle').click();
    const reopenedConfigured=await page.locator('#drc100Grid [data-drc-index="7"]').evaluate(el=>({configured:el.classList.contains('drt167828Configured'),bg:getComputedStyle(el).backgroundColor}));
    assert.equal(reopenedConfigured.configured,true,'configured color must survive closing and reopening the Room Creator');
    assert.equal(reopenedConfigured.bg,configuredTemplate.bg,'configured color must be derived from persisted content');
    await openChest(page,7);
    const second=await page.evaluate(()=>({
      modern:!!document.getElementById('dui167831Itemtemplate'),
      legacyTextareaVisible:(()=>{const e=document.getElementById('drtItems');return !!e&&getComputedStyle(e).display!=='none'})(),
      templatePatched:!!DungeonRoomTemplateContent167828.__dui167831Patched
    }));
    assert.equal(second.modern,true,'reopened direct configuration must keep modern item dropdown');
    assert.equal(second.legacyTextareaVisible,false,'reopened direct configuration must not fall back to item-ID textarea');
    await page.evaluate(()=>DungeonRoomTemplateContent167828.closeEditor());
    await page.locator('#drt167828Toggle').click(); // leave direct mode

    // The per-zone path is another real Config objet entry point and must use the same modern UI.
    await page.locator('#drt167828Advanced').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('drv167826Panel')).display!=='none');
    await page.locator('#drv167826Toggle').click();
    await openChest(page,7);
    const zone=await page.evaluate(()=>({
      modal:document.getElementById('drv167826Modal')?.classList.contains('open')||false,
      modern:!!document.getElementById('dui167831Itemzone'),
      legacyTextareaVisible:(()=>{const e=document.getElementById('drv167826Items');return !!e&&getComputedStyle(e).display!=='none'})(),
      visualOpen:String(DungeonRoomVisualConfig167826.openEditor||'').slice(0,1200),
      visualPatched:!!DungeonRoomVisualConfig167826.__dui167831Patched,
      activateCell:String(DungeonRoomVisualConfig167826.activateCell||'').slice(0,900)
    }));
    console.log('[object-config-editor] state',JSON.stringify({first,second,zone},null,2));
    assert.equal(zone.modal,true,'zone configuration modal must open');
    assert.equal(zone.modern,true,'zone Config objet must use modern item dropdown');
    assert.equal(zone.legacyTextareaVisible,false,'zone Config objet must never expose legacy item-ID textarea');
    await page.locator('#drv167826Modal button[onclick="DungeonRoomVisualConfig167826.saveActive()"]').click();
    await page.waitForFunction(()=>!document.getElementById('drv167826Modal')?.classList.contains('open'));
    const configuredZone=await page.locator('#drc100Grid [data-drc-index="7"]').evaluate(el=>({configured:el.classList.contains('drv167826Configured'),bg:getComputedStyle(el).backgroundColor}));
    assert.equal(configuredZone.configured,true,'zone-specific save must mark the object configured');
    assert.notEqual(configuredZone.bg,beforeTemplate.bg,'zone configured object must use the configured color');
    assert.deepEqual(errors,[]);
  }finally{
    clearTimeout(watchdog);server.closeAllConnections?.();server.closeIdleConnections?.();server.close();await context.close();await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1});
