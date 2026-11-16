'use strict';
// Real Pages root, not preview.html: Dungeon Rooms -> authored World Builder -> PLAY selection.
// The test never clears the user's storage and uses only a fresh isolated Chromium context.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(process.argv[2]||path.join(__dirname,'..'));
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg'};
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const file=path.resolve(root,'.'+(name==='/'?'/index.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return;}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('missing');return;}
    res.writeHead(200,{'content-type':types[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});res.end(data);
  });
});
const DUNGEON_ID='game_profile_dungeon_demo';
async function ready(page){
  await page.waitForFunction(()=>typeof window.openGensFamily==='function'&&typeof window.openEditorHub==='function'&&
    typeof window.DungeonRoomCreator100?.createRoom==='function'&&
    typeof window.DungeonWorldBuilder167821?.createDungeon==='function'&&
    typeof window.DungeonWorldSessionBridge167832?.renderBuiltWorlds==='function'&&
    typeof window.DungeonAuthoredRuntime167839?.startConfigured==='function',null,{timeout:60000});
}
async function dungeonHome(page){
  await page.locator('button.gensRootModeCard.adventure').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
  let card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');
  await card.waitFor({state:'visible'});
  const state=await page.evaluate(id=>({
    active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
    from:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(activeGameProfileId()):'',
    to:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(id):''
  }),DUNGEON_ID);
  if(state.active&&state.active!==DUNGEON_ID&&state.from!==state.to){
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000}),card.click()]);
    await ready(page);
    await page.locator('button.gensRootModeCard.adventure').click();
    card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');
    await card.waitFor({state:'visible'});
  }
  await card.click();
  await page.waitForFunction(id=>typeof activeGameProfileId==='function'&&activeGameProfileId()===id&&
    getComputedStyle(document.getElementById('gensGameHome')).display!=='none',DUNGEON_ID,{timeout:30000});
}
(async()=>{
  const watchdog=setTimeout(()=>{console.error('Dungeon root-path browser test timed out');process.exit(1)},150000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const ctx=await browser.newContext({viewport:{width:915,height:412},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR',serviceWorkers:'block'});
  await ctx.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  const page=await ctx.newPage();
  page.setDefaultTimeout(25000);
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('dialog',d=>d.accept().catch(()=>{}));
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  try{
    await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',{waitUntil:'domcontentloaded',timeout:60000});
    await ready(page);
    const initial=await page.evaluate(()=>({
      bridgeScripts:[...document.querySelectorAll('script[src]')].filter(s=>(s.getAttribute('src')||'').includes('dungeon-world-session-bridge-167832.js')).length,
      rootModules:{rooms:!!window.DungeonRoomCreator100,builder:!!window.DungeonWorldBuilder167821,selection:!!window.DungeonWorldSessionBridge167832}
    }));
    assert.equal(initial.bridgeScripts,1,'root Pages must boot one official world-selection owner only');
    const created=await page.evaluate(()=>{
      const R=window.DungeonRoomCreator100,B=window.DungeonWorldBuilder167821;
      const room=R.upsertRoom(R.createRoom({name:'Salle témoin Paysage',width:6,height:5}));
      const dungeon=B.createDungeon({name:'Donjon témoin construit'});
      B.addRoomInstance(dungeon.id,room.id);
      const valid=B.validation(B.findDungeon(dungeon.id));
      return {roomId:room.id,dungeonId:dungeon.id,valid};
    });
    assert.equal(created.valid.valid,true,JSON.stringify(created.valid));
    await dungeonHome(page);
    await page.locator('#gensGameHomeActions .homeEditorsBtn').click();
    await page.locator('#dungeonAdvancedEditorBtn').waitFor({state:'visible'});
    await page.locator('#dungeonAdvancedEditorBtn').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('dungeonAdvancedEditor')).display!=='none');
    const roomsButton=page.locator('#drc100Launcher button[onclick="DungeonRoomCreator100.open()"]');
    await roomsButton.waitFor({state:'visible'});
    await roomsButton.click();
    await page.waitForFunction(()=>document.getElementById('drc100Modal')?.classList.contains('open'));
    await page.evaluate(()=>window.DungeonRoomCreator100.close());
    const builderButton=page.locator('#drc300Launch');
    await builderButton.waitFor({state:'visible'});
    await builderButton.click();
    await page.waitForFunction(()=>document.getElementById('drc300Modal')?.classList.contains('open'));
    assert.match(await page.locator('#drc300Modal').innerText(),/Donjon témoin construit/);
    await page.evaluate(()=>window.DungeonWorldBuilder167821.close());
    await page.evaluate(()=>closeDungeonAdvancedEditor());
    await page.evaluate(()=>closeEditorHub());
    await page.locator('#gensGameHomeActions .newGameBtn').click();
    const setup=page.locator('#sessionDungeonSetupBtn');
    await setup.waitFor({state:'visible'});
    await setup.click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionDungeonSetup')).display!=='none');
    const section=page.locator('#dws167832Section');
    await section.waitFor({state:'visible'});
    const text=await section.innerText();
    assert.match(text,/MES DONJONS CONSTRUITS/,'the existing authored worlds must be prominent before the built-in adventures');
    assert.match(text,/Donjon témoin construit/,'the real saved World Builder graph must be selectable from PLAY');
    assert.equal(await page.evaluate(()=>document.getElementById('sessionDungeonLibrary')?.firstElementChild?.id),'dws167832Section');
    assert.equal(await page.locator('#dws167832OpenRooms').isVisible(),true);
    assert.equal(await page.locator('#dws167832OpenBuilder').isVisible(),true);
    await page.locator('#dws167832Section [data-dws-world="'+created.dungeonId+'"]').click();
    const selected=await page.evaluate(()=>({primary:window.DungeonWorldSessionBridge167832.primary(),authored:!!window.DungeonAuthoredRuntime167839}));
    assert.equal(selected.primary.kind,'world');
    assert.equal(selected.primary.id,created.dungeonId);
    assert.equal(selected.authored,true);
    assert.ok((await page.locator('#sessionDungeonLibrary > .gameProfileCard').count())>0,'generated adventures must remain separately accessible');
    await page.reload({waitUntil:'domcontentloaded'});
    await ready(page);
    const persisted=await page.evaluate(id=>({
      rooms:window.DungeonRoomCreator100.loadLibrary().some(r=>r.name==='Salle témoin Paysage'),
      worlds:window.DungeonWorldBuilder167821.loadLibrary().some(d=>d.id===id),
      primary:window.DungeonWorldSessionBridge167832.primary()
    }),created.dungeonId);
    assert.equal(persisted.rooms,true,'room templates must persist across reload');
    assert.equal(persisted.worlds,true,'built worlds must persist across reload');
    assert.equal(persisted.primary.id,created.dungeonId,'authored selection must persist across reload');
    console.log(JSON.stringify({scenario:'Real published GenSRPG root: rooms → built dungeon → PLAY',created,initial,persisted,viewport:'915x412'}));
  }finally{
    clearTimeout(watchdog);
    await ctx.close();
    await browser.close();
    server.closeAllConnections?.();server.closeIdleConnections?.();server.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1});
