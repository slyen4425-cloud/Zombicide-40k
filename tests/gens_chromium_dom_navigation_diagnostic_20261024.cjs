/* Read-only browser diagnostic of initial DOM weight and menu navigation, never changes runtime. */
'use strict';
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,firefox}=require('playwright');
const root=path.join(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
const server=http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch(_){res.writeHead(400);res.end();return}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.stat(file,(err,stat)=>{if(err||!stat.isFile()){res.writeHead(404);res.end();return}res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});fs.createReadStream(file).pipe(res)});
});
const pause=n=>new Promise(r=>setTimeout(r,n));
const snap=async(page,label)=>page.evaluate(label=>{
 const all=document.querySelectorAll('*');
 const top=[...document.body.children].map(el=>({tag:el.tagName,id:el.id||'',className:String(el.className||'').slice(0,80),nodes:el.querySelectorAll('*').length,visible:!!(el.getClientRects().length)})).sort((a,b)=>b.nodes-a.nodes).slice(0,15);
 const cssAnim=[...all].filter(x=>{if(!x.getClientRects().length)return false;const s=getComputedStyle(x);return s.animationName!=='none'&&s.animationPlayState==='running'}).length;
 const hidden=[...all].filter(el=>el instanceof HTMLElement&&!el.getClientRects().length).length;
 return {label,now:Date.now(),elements:all.length,hiddenElements:hidden,images:document.images.length,canvases:document.querySelectorAll('canvas').length,activeCssAnimations:cssAnim,domTop:top,heap:performance.memory?.usedJSHeapSize||null,bodyClasses:String(document.body.className)};
},label);

async function run(browserType,name,port){
 let browser,context;
 const out={browser:name,scenes:[],events:[],errors:[]};
 try{
 browser=await browserType.launch({headless:true,args:name==='chromium'?['--disable-dev-shm-usage']:[]});
 context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:name==='chromium',hasTouch:true,locale:'fr-FR',serviceWorkers:'allow'});
 const page=await context.newPage();
 page.on('crash',()=>out.events.push('PAGE_CRASH'));
 page.on('pageerror',e=>{if(out.errors.length<10)out.errors.push(String(e))});
 page.on('dialog',async d=>{try{await d.dismiss()}catch(_){}});
 await page.goto('http://127.0.0.1:'+port+'/index.html',{waitUntil:'domcontentloaded',timeout:25000});
 await pause(1800);
 out.scenes.push(await snap(page,'initial'));
 for(const family of ['survival','adventure','capture','pvp']){
  for(let i=0;i<3;i++){
   try{
    await page.evaluate(family=>{if(typeof window.openGensFamily!=='function')throw Error('openGensFamily absent');window.openGensFamily(family)},family);
    await pause(300);
    out.scenes.push(await snap(page,family+'-'+i));
    await page.evaluate(()=>{if(typeof window.showGensRootHome==='function')window.showGensRootHome()});
    await pause(150);
    out.scenes.push(await snap(page,'root-after-'+family+'-'+i));
   }catch(e){out.events.push('NAV '+family+'-'+i+' '+String(e).slice(0,140));break}
  }
 }
 await pause(1400);
 out.scenes.push(await snap(page,'final-idle'));
 out.summary={initialElements:out.scenes[0]?.elements||0,lastElements:out.scenes.at(-1)?.elements||0,deltaElements:(out.scenes.at(-1)?.elements||0)-(out.scenes[0]?.elements||0),maxElements:Math.max(...out.scenes.map(x=>x.elements)),maxCssAnimations:Math.max(...out.scenes.map(x=>x.activeCssAnimations))};
 }catch(e){out.events.push('ERROR '+String(e).slice(0,220))}
 finally{try{await context?.close()}catch(_){}try{await browser?.close()}catch(_){}}
 return out;
}
(async()=>{
 await new Promise(r=>server.listen(0,'127.0.0.1',r));
 const port=server.address().port;
 try{
 const results=[await run(chromium,'chromium',port),await run(firefox,'firefox',port)];
 fs.mkdirSync(path.join(root,'artifacts'),{recursive:true});
 fs.writeFileSync(path.join(root,'artifacts','chromium-dom-navigation.json'),JSON.stringify({note:'Linux headless mobile simulation, not an Android physical test',results},null,2));
 for(const x of results)console.log('DOM_NAV_SCENARIO '+JSON.stringify({browser:x.browser,summary:x.summary,events:x.events,errors:x.errors,topInitial:x.scenes[0]?.domTop}));
 }finally{server.closeAllConnections?.();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
