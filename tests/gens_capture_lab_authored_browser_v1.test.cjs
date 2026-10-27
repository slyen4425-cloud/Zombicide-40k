'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium,firefox}=require('playwright');
const root=path.resolve(process.env.CAPTURE_LAB_PREVIEW_ROOT||'_site/capture-lab-preview');
const mime={'.html':'text/html','.json':'application/json','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.webp':'image/webp'};
for(const [name,engine] of [['Chromium',chromium],['Firefox',firefox]]){
 test(name+': true authored Loup/Voltige encounter → official Core → flee/zone on landscape touch',{timeout:45000},async t=>{
  const server=http.createServer(async(req,res)=>{
   try{
    const url=new URL(req.url,'http://localhost');
    const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    const bytes=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(bytes);
   }catch{res.writeHead(404).end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  let browser,page;
  try{
   browser=await engine.launch({headless:true});
   const context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true});
   await context.addInitScript(()=>localStorage.setItem('gensrpg_game_profiles_v1','{"other":"preserved"}'));
   page=await context.newPage();page.setDefaultTimeout(12000);
   const errors=[],outgoing=[];
   page.on('pageerror',x=>errors.push(x.message));
   page.on('request',req=>{if(!req.url().startsWith(origin+'/'))outgoing.push(req.url());});
   await page.goto(origin+'/capture-lab-authored-preview.html');
   await page.getByRole('status').filter({hasText:'Rejoins'}).waitFor();
   const right=page.getByRole('button',{name:'Déplacement →',exact:true});
   await right.tap();
   await page.locator('#battle-host:not([hidden])').waitFor();
   assert.equal(await page.locator('.fighter').count(),2);
   assert.ok(await page.getByRole('heading',{name:'Loup volcanique'}).isVisible());
   assert.ok(await page.getByRole('heading',{name:'Voltige'}).isVisible());
   assert.equal(await page.getByRole('button',{name:'Fuir',exact:true}).count(),1);
   const characterImages=page.locator('img[data-author-asset-id]');
   assert.equal(await characterImages.count(),2,'author player back and opponent front are rendered');
   const imgs=await characterImages.evaluateAll(nodes=>nodes.map(n=>({id:n.dataset.authorAssetId,src:n.src,alt:n.alt})));
   assert.ok(imgs.some(x=>x.id==='pack:capture:creature-loup-volcanique-player-01'));
   assert.ok(imgs.some(x=>x.id==='pack:capture:creature-voltige-opponent-01'));
   for(const row of imgs)assert.match(row.src,/\/[0-9a-f]{40}\/assets\/library\/capture\/creatures\//);
   for(const button of ['Griffe','Boule de feu','Fuir'])assert.ok(await page.getByRole('button',{name:button,exact:true}).count()>=1,button);
   const playerBar=page.getByRole('progressbar',{name:'PV de Loup volcanique'});
   assert.equal(await playerBar.getAttribute('max'),'150','real authored Lab HP, never historical 18/24');
   assert.equal(await playerBar.evaluate(n=>n.value),150);
   const playerEnergy=page.locator('.fighter').first().locator('p').last();
   assert.match(await playerEnergy.textContent(),/Énergie 10 \/ 10/);
   await page.getByRole('button',{name:'Boule de feu',exact:true}).tap();
   await page.getByText('Action en préparation…').waitFor();
   await page.waitForFunction(()=>{
     const p=document.querySelector('.fighter p:last-child');
     return p&&/Énergie ([0-9]+) \/ 10/.test(p.textContent)&&Number(p.textContent.match(/Énergie ([0-9]+)/)[1])<10;
   },null,{timeout:8000});
   await page.getByRole('button',{name:'Fuir',exact:true}).tap();
   await page.locator('#zone-host[data-last-outcome="flee"]:not([hidden])').waitFor();
   assert.equal(await right.isEnabled(),true);
   assert.equal(await page.evaluate(()=>localStorage.getItem('gensrpg_game_profiles_v1')),'{"other":"preserved"}');
   assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
   assert.deepEqual(errors,[]);
   // Only immutable official Lab media can leave the local preview server.
   assert.ok(outgoing.every(url=>/^https:\/\/raw\.githubusercontent\.com\/slyen4425-cloud\/GenSrpg_labo_combat_dynamique\/[0-9a-f]{40}\/assets\/library\//.test(url)),
    'never request unpinned/unknown repositories');
   await page.evaluate(()=>dispatchEvent(new PageTransitionEvent('pagehide',{persisted:false})));
   assert.equal(await page.evaluate(()=>globalThis.GensCaptureLabOwnershipPortV1.status().installed),false);
   await context.close();
  }catch(error){if(page)t.diagnostic(await page.locator('body').innerText().catch(()=>''));throw error;}
  finally{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 });
}
