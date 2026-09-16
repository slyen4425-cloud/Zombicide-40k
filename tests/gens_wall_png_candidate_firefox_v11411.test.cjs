const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {firefox}=require('playwright');
const root=path.join(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname),file=path.resolve(root,'.'+pathname);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('not found');return}res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});res.end(data)})});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const port=server.address().port,browser=await firefox.launch({headless:true});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,hasTouch:true,locale:'fr-FR'}),page=await context.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  try{
    await page.setContent('<!doctype html><html><body><div id="grid" style="width:240px;transform-origin:0 0"><div id="wall" style="width:120px;height:120px;overflow:hidden"><img id="img" src="/assets/dungeon/creatures/dungeon_wall.png" style="display:block;width:100%;height:100%;object-fit:cover"></div></div></body></html>');
    await page.waitForFunction(()=>{const i=document.getElementById('img');return i&&i.complete&&i.naturalWidth>0});
    const rows=await page.evaluate(async()=>{const g=document.getElementById('grid'),i=document.getElementById('img');const scales=[0.67,0.8,0.9,1,1.1,1.25,1.5,1.75],out=[];for(const scale of scales){g.style.transform=`scale(${scale})`;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const r=i.getBoundingClientRect();out.push({scale,complete:i.complete,naturalWidth:i.naturalWidth,naturalHeight:i.naturalHeight,width:r.width,height:r.height})}return out});
    for(const row of rows){assert.equal(row.complete,true,`scale ${row.scale}: PNG not complete`);assert.ok(row.naturalWidth>0&&row.naturalHeight>0,`scale ${row.scale}: PNG decode failed`);assert.ok(row.width>0&&row.height>0,`scale ${row.scale}: PNG collapsed`)}
    assert.deepEqual(errors,[],'healthy wall PNG must not raise Firefox decode errors');
    console.log(JSON.stringify({scenario:'existing dungeon_wall.png survives Firefox fractional zoom',rows}));
  }finally{await context.close();await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
