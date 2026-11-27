'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs/promises'),path=require('node:path');
const {chromium}=require('playwright');
const vendor=path.resolve(process.env.CAPTURE_V2_SITE||'_site');
const mime={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8',
 '.mjs':'text/javascript;charset=utf-8','.json':'application/json;charset=utf-8',
 '.css':'text/css;charset=utf-8','.svg':'image/svg+xml',
 '.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg'};
const server=http.createServer(async(req,res)=>{
 try{
  const rel=decodeURIComponent(new URL(req.url,'http://localhost').pathname)
   .replace(/^\/+/, '')||'index.html';
  if(rel.split('/').includes('..')){res.writeHead(403).end();return;}
  const file=path.resolve(vendor,rel);
  if(!file.startsWith(vendor+path.sep)){res.writeHead(403).end();return;}
  const bytes=await fs.readFile(file);
  res.writeHead(200,{'Content-Type':mime[path.extname(file)]??'application/octet-stream',
   'Cache-Control':'no-store'}).end(bytes);
 }catch(e){res.writeHead(404).end('Official release file unavailable: '+String(e));}
});
test('two real independent universes survive reload, native Combat/World/Hero/Rules owners never share a catalog',
 {timeout:185000},async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true,
  serviceWorkers:'block',locale:'fr-FR'});
 let page,errors=[];
 try{
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  page=await context.newPage();
  page.on('pageerror',e=>errors.push(String(e)));
  const base='http://127.0.0.1:'+server.address().port+'/index.html';
  await page.goto(base,{waitUntil:'domcontentloaded'});
  await page.locator('button.gensRootModeCard.capture').tap();
  const lib=page.locator('#gensCaptureV2Root');
  const legacy=lib.locator('[data-capture-universe-select="monster-invoc"]');
  await legacy.waitFor({timeout:35000});
  const rawBefore=await page.evaluate(()=>localStorage.getItem('gensrpg.capture.v2.adventure.save.v1'));
  assert.equal(await lib.locator('iframe').count(),0,'do not autostart a game');
  await legacy.tap();
  assert.equal(await lib.getAttribute('data-menu'),'main');
  await lib.locator('[data-capture-v2-menu="universes"]').tap();
  await lib.locator('[data-capture-universe-create="true"]').tap();
  await lib.locator('.capture-universe-form input').fill('Manga');
  await lib.locator('.capture-universe-form button[type="submit"]').tap();
  await lib.locator('[data-capture-v2-menu="editors"]').waitFor({state:'visible',timeout:65000});
  assert.equal(await lib.getAttribute('data-menu'),'main');
  const first=await page.evaluate(()=>{
   const x=JSON.parse(localStorage.getItem('gensrpg.capture.v2.universes.index.v1'));
   return x.projects.find(p=>p.name==='Manga')?.id;
  });
  assert.match(first,/^unv_[a-z0-9-]{8,80}$/);
  await lib.locator('[data-capture-v2-menu="editors"]').tap();
  assert.equal(await lib.locator('.gensCaptureV2EditorGroup').count(),5);
  assert.equal(await lib.locator('.gensCaptureV2EditorGroup[open]').count(),0);
  await lib.locator('[data-editor-group="world"] > summary').tap();
  assert.equal(await lib.locator('[data-editor-group="world"] [data-capture-v2-view="builder"]').isVisible(),true);
  await lib.locator('[data-editor-group="combat"] > summary').tap();
  assert.equal(await lib.locator('[data-editor-group="world"] [data-capture-v2-view="builder"]').isVisible(),false);
  assert.equal(await lib.locator('[data-capture-v2-exit]').isVisible(),false);
  assert.equal(await lib.locator('header [data-capture-v2-menu-back="main"]').isVisible(),true);
  await lib.locator('[data-editor-group="combat"] [data-capture-v2-view="creature"]').tap();
  const frame=lib.frameLocator('iframe[data-capture-v2-native="combat"]');
  await frame.locator('[data-capture-universe-project-editor]').waitFor({timeout:45000});
  assert.equal(await frame.locator('[data-capture-universe-project-editor]').count(),1);
  await lib.locator('.gensCaptureV2NativeBack').tap();
  await lib.locator('[data-capture-v2-menu="universes"]').tap();
  await lib.locator('[data-capture-universe-create="true"]').tap();
  await lib.locator('.capture-universe-form input').fill('Héros');
  await lib.locator('.capture-universe-form button[type="submit"]').tap();
  await lib.locator('[data-capture-v2-menu="editors"]').waitFor({state:'visible',timeout:65000});
  const readWorlds=async()=>page.evaluate(async()=>{
   const p=JSON.parse(localStorage.getItem('gensrpg.capture.v2.universes.index.v1'));
   const {openWorldDocumentReleaseAccessV1}=await import('/vendor/exploration-lab/src/storage/world-document-release-access-v1.js');
   const access=await openWorldDocumentReleaseAccessV1({storage:localStorage,sessionStorage});
   if(!access.durable||!access.projects)throw Error('Native durable world projects required');
   return Promise.all(p.projects.map(async project=>{
    const rows=await access.projects.list(project.id);
    const documents=await Promise.all(rows.map(async row=>(await access.projects.load(project.id,row.id)).id));
    return {id:project.id,worldIds:documents};
   }));
  });
  const worlds=await readWorlds();
  const state=await page.evaluate(()=>{
   const p=JSON.parse(localStorage.getItem('gensrpg.capture.v2.universes.index.v1'));
   const combat=k=>JSON.parse(localStorage.getItem('gensrpg.combat.capture.universe.database.v1:'+k));
   const heroes=JSON.parse(localStorage.getItem('gensrpg.exploration.universe-heroes.index.v1'));
   const rules=k=>localStorage.getItem('gensrpg.capture.v2.universe.scope.v1:'+k+
    ':gensrpg.capture.v2.adventure.rules-draft.v1');
   return {p,combat: p.projects.map(x=>combat(x.id)),heroes,
    rules:p.projects.map(x=>rules(x.id)),legacySave:localStorage.getItem('gensrpg.capture.v2.adventure.save.v1')};
  });
  assert.deepEqual(state.p.projects.map(p=>p.name).sort(),['Héros','Manga']);
  assert.equal(state.p.projects.every(p=>p.status==='ready'),true);
  assert.equal(state.combat.every(x=>x.database.creatures.length===0),true,
   'blank worlds may have own hero/manga persons, never copied Monster InvoC monsters');
  assert.equal(worlds.length,2);
  assert.ok(worlds.every(project=>project.worldIds.length===1));
  assert.notEqual(worlds[0].worldIds[0],worlds[1].worldIds[0]);
  assert.equal(state.heroes.projects.length,2);
  assert.equal(state.rules.every(Boolean),true);
  assert.equal(state.legacySave,rawBefore,'legacy session bytes preserved');
  await page.reload({waitUntil:'domcontentloaded'});
  assert.deepEqual(await readWorlds(),worlds,'Both official IndexedDB project documents survive a real page reload');
  await page.locator('button.gensRootModeCard.capture').tap();
  await lib.locator('[data-capture-universe-select="'+first+'"]').waitFor({timeout:35000});
  await lib.locator('[data-capture-universe-select="'+first+'"]').tap();
  await lib.locator('[data-capture-v2-view="adventure"]').tap();
  const adventure=lib.frameLocator('iframe[data-capture-v2-native="capture"]');
  await adventure.locator('#adventure-start-new').waitFor({timeout:30000});
  const frameUrl=await lib.locator('iframe[data-capture-v2-native="capture"]').getAttribute('src');
  assert.match(frameUrl,new RegExp('universe='+first));
  assert.equal(errors.length,0,errors.join('\n').slice(0,2500));
 }finally{
  await context.close();await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
});
