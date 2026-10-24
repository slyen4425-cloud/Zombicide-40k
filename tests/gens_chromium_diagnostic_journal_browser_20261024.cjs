'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,firefox}=require('playwright');
const root=path.join(__dirname,'..'),KEY='gensrpg_mobile_diag_v1';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg'};
assert.ok(fs.statSync(path.join(root,'index.html')).size>1000000,'diagnostic must use full real production index');
const src=fs.readFileSync(path.join(root,'diagnostic-shell.js'),'utf8');
assert.match(src,/fetch\(u\.href,\{cache:"no-store"\}\)/);
assert.match(src,/document\.write\(html\)/);
assert.doesNotMatch(src,/localStorage\.clear|sessionStorage\.clear|caches\.delete|unregister\(/);
const logger=fs.readFileSync(path.join(root,'diagnostic-boot.js'),'utf8');
assert.doesNotMatch(logger,/localStorage\.clear|localStorage\.removeItem\(|sendBeacon|fetch\(/);
const server=http.createServer((req,res)=>{
 let n;try{n=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch(_){res.writeHead(400);res.end();return}
 const file=path.resolve(root,'.'+(n==='/'?'/index.html':n));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.stat(file,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404);res.end();return}
 res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
 fs.createReadStream(file).pipe(res)});
});
async function run(browserType,name,port){
 const browser=await browserType.launch({headless:true,args:name==='chromium'?['--disable-dev-shm-usage']:[]});
 const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,hasTouch:true,isMobile:name==='chromium',locale:'fr-FR',serviceWorkers:'allow'});
 const page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(String(e)));
 page.on('request',r=>requests.push(new URL(r.url()).pathname));
 try{
   await page.goto('http://127.0.0.1:'+port+'/diagnostic.html',{waitUntil:'domcontentloaded'});
   await page.locator('#start').waitFor();
   assert.equal(requests.includes('/index.html'),false,'status page must not boot game');
   await page.evaluate(()=>localStorage.setItem('gensrpg_diag_test_savemarker','preserve-me'));
   await page.locator('#start').click();
   await page.waitForFunction(()=>!!window.__gensMobileDiagV1,{timeout:25000});
   await page.waitForFunction(()=>!!document.getElementById('gensRootHome'),{timeout:25000});
   const button=page.locator('button.gensRootModeCard.survival');
   await button.tap({timeout:12000});
   await page.waitForTimeout(400);
   const stage=await page.evaluate(()=>JSON.parse(localStorage.getItem('gensrpg_mobile_diag_script_stage_v2')||'null'));
   assert.ok(stage&&stage.script>0,'parser stage index must be persisted synchronously');
   assert.match(stage.source,/inline|\/|data:/,'stage records source identifier');
   let log=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
   console.log('HERO_TRACE_DEBUG '+JSON.stringify({browser:name,eventCount:log.events.length,types:log.events.slice(0,15).map(e=>e.type),lastTypes:log.events.slice(-15).map(e=>e.type)}));
   assert.ok(log.events.some(e=>e.type==='start'),'logger must launch before gameplay');
   assert.ok(log.events.some(e=>e.type==='pointer'),'real pointer must be recorded');
   assert.ok(log.events.some(e=>e.type==='click'),'real click must be recorded');
   for(const type of ['hero-call-before','hero-call-after','hero-apply-enter','hero-hydrate-before','hero-hydrate-after']) assert.ok(log.events.some(e=>e.type===type),'Expected startup trace '+type);
   assert.equal(await page.evaluate(()=>localStorage.getItem('gensrpg_diag_test_savemarker')),'preserve-me','game storage must survive diagnostic');
   // Simulate normal in-app navigation reload; diagnostic log must survive.
   await page.reload({waitUntil:'domcontentloaded'});
   await page.waitForFunction(()=>!!window.__gensMobileDiagV1,{timeout:25000});
   await page.waitForTimeout(600);
   let afterReload=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
   assert.ok(afterReload.events.some(e=>e.type==='pointer'),'previous tap must survive a game reload');
   assert.ok(afterReload.events.some(e=>e.type==='boot-again'),'reload should append not replace diagnostic session');
   await page.goto('http://127.0.0.1:'+port+'/diagnostic.html',{waitUntil:'domcontentloaded'});
   await page.locator('#report').waitFor();
   assert.match(await page.locator('#report').innerText(),/pointer/);
   assert.match(await page.locator('#report').innerText(),/Dernier script/);
   assert.match(await page.locator('#status').innerText(),/Dernière session/);
   const reportState=await page.evaluate(()=>({current:JSON.parse(localStorage.getItem('gensrpg_mobile_diag_v1')),stage:JSON.parse(localStorage.getItem('gensrpg_mobile_diag_script_stage_v2'))}));
   assert.equal(reportState.stage.session,reportState.current.id);
   await page.locator('#download').click();
   assert.equal(await page.evaluate(()=>localStorage.getItem('gensrpg_diag_test_savemarker')),'preserve-me','export should not affect saves');
   await page.locator('#start').click();
   await page.waitForFunction(()=>window.__gensMobileDiagV1&&window.__gensMobileDiagV1.version===2,{timeout:25000});
   await page.goto('http://127.0.0.1:'+port+'/diagnostic.html',{waitUntil:'domcontentloaded'});
   const archive=await page.evaluate(()=>JSON.parse(localStorage.getItem('gensrpg_mobile_diag_history_v2')||'[]'));
   assert.ok(archive.length>=1,'new manual run must archive previous session');
   assert.ok(archive[0].log.events.some(e=>e.type==='pointer'),'previous touch events must remain in archive');
   assert.ok(archive[0].stage&&archive[0].stage.script>0,'previous parser-stage checkpoint must remain in archive');
   assert.equal(await page.evaluate(()=>localStorage.getItem('gensrpg_diag_test_savemarker')),'preserve-me','manual relaunch must preserve game data');
   log=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)),KEY);
   console.log('GENSRPG_DIAGNOSTIC_OK '+JSON.stringify({browser:name,eventTypes:[...new Set(log.events.map(x=>x.type))],count:log.events.length,status:log.ended?'pagehide':'unfinished',appLoaded:requests.includes('/index.html'),errors:errors.slice(0,5)}));
 }finally{await context.close();await browser.close()}
}
(async()=>{await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{for(const [t,n] of [[chromium,'chromium'],[firefox,'firefox']])await run(t,n,server.address().port)}
 finally{server.closeAllConnections?.();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
