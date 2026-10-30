'use strict';
// Capture V2 current-code sentinel: the old 4-module browser script is a
// historical V1 contract and must not reintroduce its retired seed/profile.
// Real production index, real Shell navigation and browser-local storage.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8',
 '.mjs':'text/javascript;charset=utf-8','.css':'text/css;charset=utf-8',
 '.json':'application/json;charset=utf-8','.webmanifest':'application/manifest+json'};
const server=http.createServer(async(req,res)=>{
 try{
  const rel=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname).replace(/^\\/+/, '')||'index.html';
  if(rel.split('/').includes('..')){res.writeHead(403).end();return;}
  const file=path.resolve(root,rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
  const body=await fs.readFile(file);
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream',
    'cache-control':'no-store'}).end(body);
 }catch(e){res.writeHead(404).end('not found');}
});
test('real Shell: Survie, Dungeon, PvP and clean Capture remain isolated through V2 reopen',
 {timeout:120000},async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser,context;
 try{
  browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  context=await browser.newContext({
    viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,
    hasTouch:true,locale:'fr-FR',serviceWorkers:'block'
  });
  await context.addInitScript(()=>{
    window.supabase={createClient:()=>({})};
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto('http://127.0.0.1:'+server.address().port+'/index.html',
    {waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>window.GensCaptureV2&&
    window.GensShellModuleLaunchV1&&document.querySelectorAll('button.gensRootModeCard').length===4,
    null,{timeout:60000});
  await page.evaluate(()=>localStorage.setItem('__capture_v2_regression_sentinel','untouched'));
  const prior=await page.evaluate(()=>({
    session:localStorage.getItem('z40k_session_active_v1'),
    dungeon:localStorage.getItem('gensrpg_dungeon_runtime_v2'),
    state:localStorage.getItem('gensrpg_dungeon_state_v1')
  }));
  const rootBack=async()=>{
    await page.locator('#gensFamilyHome button[onclick="showGensRootHome()"]').tap();
    await page.locator('#gensRootHome').waitFor({state:'visible'});
  };
  for(const family of ['survival','adventure','pvp']){
    await page.locator('button.gensRootModeCard.'+family).tap();
    await page.locator('#gensFamilyHome').waitFor({state:'visible'});
    assert.equal(await page.locator('#gensCaptureV2Root').count(),0,family+' must not mount Capture');
    assert.equal(await page.evaluate(()=>window.GensCaptureV2.status().active),false);
    if(family==='adventure'){
      assert.equal(await page.locator('#gensFamilyGames [data-rpg-profile="game_profile_dungeon_demo"]').count(),1);
    }
    if(family==='pvp')assert.match(await page.locator('#gensFamilyGames').textContent(),/PVP — À VENIR/);
    await rootBack();
  }
  for(let i=0;i<2;i++){
    await page.locator('button.gensRootModeCard.capture').tap();
    await page.locator('#gensCaptureV2Root').waitFor({state:'visible'});
    assert.equal(await page.locator('#captureGameHub').count(),0);
    assert.equal(await page.locator('#gensGameHome:visible').count(),0);
    assert.equal(await page.locator('#pregameSetup:visible').count(),0);
    assert.equal(await page.evaluate(()=>window.GensShellModuleLaunchV1.activeModule()),'capture');
    assert.equal(await page.evaluate(()=>window.GensCaptureV2.status().active),true);
    await page.locator('#gensCaptureV2Root [data-capture-v2-view="creature"]').tap();
    const frame=page.locator('#gensCaptureV2Root iframe[data-capture-v2-native="combat"]');
    await frame.waitFor({state:'attached'});
    assert.match(await frame.getAttribute('src'),
      /vendor\\/combat-lab\\/examples\\/dom-demo\\/capture-editor-v2\\.html/);
    await page.getByRole('button',{name:'Accueil Capture'}).tap();
    assert.equal(await page.locator('#gensCaptureV2Root iframe').count(),0,'native iframe disposed');
    await page.getByRole('button',{name:'Quitter le mode'}).tap();
    await page.locator('#gensRootHome').waitFor({state:'visible'});
    assert.equal(await page.locator('#gensCaptureV2Root').count(),0,'clean module unmounted');
    assert.equal(await page.evaluate(()=>window.GensCaptureV2.status().active),false);
  }
  const after=await page.evaluate(()=>({
    session:localStorage.getItem('z40k_session_active_v1'),
    dungeon:localStorage.getItem('gensrpg_dungeon_runtime_v2'),
    state:localStorage.getItem('gensrpg_dungeon_state_v1'),
    witness:localStorage.getItem('__capture_v2_regression_sentinel')
  }));
  assert.deepEqual({session:after.session,dungeon:after.dungeon,state:after.state},prior,
    'navigation alone must not mutate existing Survival/Dungeon state');
  assert.equal(after.witness,'untouched','unrelated saved data must remain untouched');
  assert.deepEqual(errors.filter(e=>/GensCaptureV2|Duplicate Capture|Competing Capture/.test(e)),[]);
  console.log('Capture V2 four-mode mobile non-interference PASS',after);
 }finally{
  await context?.close();await browser?.close();
  server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
 }
});
