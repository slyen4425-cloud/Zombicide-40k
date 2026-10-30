'use strict';
// Real browser gate for the ONE Lab editor/bestiary shipped from pinned Combat main.
// This is not the game entry gate: index.html's buttons have separate owner tests.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const https=require('node:https');
const {mkdtempSync,readFileSync,rmSync}=require('node:fs');
const {tmpdir}=require('node:os');
const {execFileSync}=require('node:child_process');
const path=require('node:path');
const {chromium,firefox}=require('playwright');

const root=path.resolve(__dirname,'..');
const site=path.resolve(process.env.CAPTURE_LAB_DELIVERY_SITE||'_site');
const prefix='/Zombicide-40k/';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8','.json':'application/json',
 '.css':'text/css; charset=utf-8','.webp':'image/webp','.png':'image/png'};
const entry=`<!doctype html><html lang="fr"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"></head><body>
<script>window.GensCaptureV1={isProfile:p=>p?.mode==='capture'};
window.getActiveGameProfile=()=>({mode:'capture'});</script>
<script src="${prefix}assets/gensrpg/capture/lab-ownership-port-v1.js"></script>
<script type="module" src="${prefix}assets/gensrpg/capture/capture-lab-author-entry-v1.mjs"></script>
</body></html>`;

async function withBrowser(engine,run){
 const requests=[],missing=[];
 // Production enforces HTTPS. Serve an isolated locally signed HTTPS origin,
 // not an HTTP test exception that would weaken the real author contract.
 const sslDir=mkdtempSync(path.join(tmpdir(),'capture-lab-author-https-'));
 const keyFile=path.join(sslDir,'key.pem'),certFile=path.join(sslDir,'cert.pem');
 execFileSync('openssl',['req','-x509','-newkey','rsa:2048','-nodes',
  '-keyout',keyFile,'-out',certFile,'-days','1','-subj','/CN=127.0.0.1'],
  {stdio:'ignore'});
 const server=https.createServer({key:readFileSync(keyFile),cert:readFileSync(certFile)},async(req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(pathname===prefix+'ci-author-entry'){
   res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(entry);return;
  }
  if(!pathname.startsWith(prefix)){
   missing.push(pathname);res.writeHead(404).end();return;
  }
  const relative=pathname.slice(prefix.length);
  if(!relative||relative.split('/').includes('..')){res.writeHead(403).end();return;}
  for(const dir of [site,root]){
   const target=path.resolve(dir,relative);
   if(!target.startsWith(dir+path.sep))continue;
   try{
    const data=await fs.readFile(target);
    res.writeHead(200,{'Content-Type':mime[path.extname(target)]||'application/octet-stream',
     'Cache-Control':'no-store'}).end(data);return;
   }catch{}
  }
  missing.push(relative);res.writeHead(404).end();
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let browser,context;
 const origin='https://127.0.0.1:'+server.address().port;
 try{
  browser=await engine.launch({headless:true});
  context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true,ignoreHTTPSErrors:true});
  const page=await context.newPage();
  page.setDefaultTimeout(25000);
  page.on('request',request=>requests.push(request.url()));
  await page.goto(origin+prefix+'ci-author-entry');
  await page.waitForFunction(()=>typeof globalThis.GensCaptureLabAuthorUiV1?.open==='function');
  await run({page,origin,requests,missing});
 }finally{
  await context?.close();await browser?.close();
  server.closeAllConnections();await new Promise(ok=>server.close(ok));
  rmSync(sslDir,{recursive:true,force:true});
 }
}

for(const [name,engine] of [['Chromium',chromium],['Firefox',firefox]]){
 test(name+': four official Capture editor/bestiary domains load from pinned Combat main vendor',{timeout:130000},async()=>{
  await withBrowser(engine,async({page,origin,requests,missing})=>{
   for(const [kind,expected] of [
    ['creature','creature'],['skill','skills'],['rules','combat'],['bestiary',null]
   ]){
    const opened=await page.evaluate(kind=>GensCaptureLabAuthorUiV1.open(kind),kind);
    assert.equal(opened,true);
    const host=page.locator('#gensCaptureLabAuthorHost');
    await host.waitFor();
    const iframe=host.locator('iframe');
    const iframeSrc=await iframe.getAttribute('src');
    const target=new URL(iframeSrc);
    assert.equal(target.origin,origin,'editor must be same-origin');
    assert.ok(target.pathname.startsWith(prefix+'vendor/combat-lab/examples/dom-demo/'),
     'Lab editor must be the byte-pinned main checkout, never sibling gh-pages');
    assert.equal(target.searchParams.get('tab'),expected);
    const frame=page.frameLocator('#gensCaptureLabAuthorHost iframe');
    if(kind==='bestiary'){
     await frame.getByRole('heading',{name:'Bestiaire',exact:true}).waitFor();
     await frame.locator('[data-bestiary]').waitFor();
    }else{
     await frame.getByRole('heading',{name:'Éditeur de combat'}).waitFor();
     await frame.locator('[data-editor-tab="'+expected+'"]').waitFor();
    }
    assert.equal(await page.evaluate(()=>GensCaptureLabOwnershipPortV1.status().editorKind),kind);
    await host.getByRole('button',{name:'Retour au jeu'}).click();
    await host.waitFor({state:'detached'});
    assert.equal(await page.evaluate(()=>GensCaptureLabOwnershipPortV1.status().installed),false);
   }
   assert.ok(requests.some(url=>url.includes(prefix+'vendor/combat-lab/src/')),
    'real Lab editor code should load, not just an iframe template');
   assert.ok(!requests.some(url=>url.includes('/GenSrpg_labo_combat_dynamique/')),
    'author UI must not request another branch/publication');
   assert.ok(!missing.some(url=>/capture-editor-v2.html|bestiary.html|capture-editor-v2.js/.test(url)),
    'actual native author HTML/JS must exist in the signed published vendor');
  });
 });
}
