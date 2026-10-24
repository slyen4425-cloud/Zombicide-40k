'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const type={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
  const name=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const file=path.resolve(root,'.'+(name==='/'?'/preview.html':name));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end('not found');return}
    res.writeHead(200,{'content-type':type[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(data);
  });
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 try{
  const context=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,locale:'fr-FR',serviceWorkers:'block'});
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  const page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(String(e).slice(0,300)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
  await page.waitForFunction(()=>typeof window.openGensFamily==='function'&&typeof window.loadGameProfilesRaw==='function',null,{timeout:60000});
  const seeded=await page.evaluate(()=>{
    const arr=loadGameProfilesRaw();
    const dungeon=arr.find(x=>String(x.id)==='game_profile_dungeon_demo');
    if(!dungeon)throw Error('Missing built-in Dungeon seed');
    const cloned=Array.from({length:4},()=>JSON.parse(JSON.stringify(dungeon)));
    const items=[...arr.slice(),...cloned];
    localStorage.setItem('gensrpg_game_profiles_v1',JSON.stringify(items));
    const raw=localStorage.getItem('gensrpg_game_profiles_v1');
    openGensFamily('adventure');
    return {raw,ids:items.map(x=>x.id)};
  });
  const cards=page.locator('#gensFamilyGames [data-rpg-profile="game_profile_dungeon_demo"]');
  await cards.first().waitFor({state:'visible'});
  assert.equal(await cards.count(),1,'five saved copies must render one Dungeon card');
  const count=await page.evaluate(()=>JSON.parse(localStorage.getItem('gensrpg_game_profiles_v1')).filter(x=>x.id==='game_profile_dungeon_demo').length);
  assert.equal(count,5,'all original stored copies must remain untouched');
  assert.equal(await page.evaluate(()=>localStorage.getItem('gensrpg_game_profiles_v1')),seeded.raw,'Shell must never rewrite raw saved profile bytes');
  const edit=cards.locator('.gensUniverseCardActions button').first();
  assert.equal(await edit.isVisible(),true,'edit action remains visible');
  await edit.click();
  await page.locator('#rpgUniverseEditorModal').waitFor({state:'visible',timeout:15000});
  await page.evaluate(()=>closeRpgUniverseEditor());
  await page.evaluate(()=>openGensFamily('capture'));
  assert.equal(await page.locator('#gensFamilyGames [data-rpg-profile="game_profile_dungeon_demo"]').count(),0,'Dungeon not shown in Capture family');
  await page.evaluate(()=>openGensFamily('adventure'));
  assert.equal(await cards.count(),1,'menu re-entry must remain idempotent');
  assert.equal(await page.evaluate(()=>localStorage.getItem('gensrpg_game_profiles_v1')),seeded.raw,'editor open-close must leave profile array unchanged');
  assert.deepEqual(errors,[], 'unexpected browser errors');
  console.log(JSON.stringify({scenario:'real Shell Dungeon profile duplicated five times in Chrome mobile',visibleDungeon:1,persistedDungeon:count,storageUnchanged:true,editorAction:true,captureIsolation:true},null,2));
  await context.close();
 } finally{server.closeAllConnections?.();server.close();await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
