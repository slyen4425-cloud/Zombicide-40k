const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {firefox}=require('playwright');
const {PNG}=require('pngjs');
const root=path.join(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname),rel=pathname==='/'?'/tests/fixtures/native-dungeon-ui-v11411.html':pathname,file=path.resolve(root,'.'+rel);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('not found');return}res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});res.end(data)})});
function pixels(buffer){const png=PNG.sync.read(buffer);let n=0,white=0,sum=0;for(let i=0;i<png.data.length;i+=4){const a=png.data[i+3];if(a<16)continue;const r=png.data[i],g=png.data[i+1],b=png.data[i+2];n++;if(r>235&&g>235&&b>235)white++;sum+=(r+g+b)/3}return {width:png.width,height:png.height,whiteRatio:n?white/n:1,mean:n?sum/n:255}}
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const port=server.address().port,browser=await firefox.launch({headless:true});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,hasTouch:true,locale:'fr-FR'}),page=await context.newPage();
  page.setDefaultTimeout(15000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  try{
    await page.goto(`http://127.0.0.1:${port}/tests/fixtures/native-dungeon-ui-v11411.html`,{waitUntil:'load'});await page.waitForFunction(()=>window.__nativeUiReady===true);
    await page.evaluate(async()=>{
      const api=window.GensRpgTacticalCombatV2Ui;if(!api)throw new Error('Tactical UI missing');
      window.__runtime.room=1;window.__runtime.heroRooms.dungeon_aldren=1;window.__runtime.positions.dungeon_aldren=1;window.__runtime.last.map={width:2,height:1,cells:['wall','floor']};
      const board=document.getElementById('dc047RoomBoard');board.style.background='#111';board.innerHTML='<div id="zoomGrid" class="dc047Grid" style="width:240px;grid-template-columns:repeat(2,120px);transform-origin:0 0"><div id="zoomWall" class="dc047Cell" style="width:120px;height:120px"></div><div class="dc047Cell" style="width:120px;height:120px"></div></div>';
      api.paintLiveWalls();const img=document.querySelector('#zoomWall > .gtv2WallTile');if(!img)throw new Error('wall tile missing');if(typeof img.decode==='function')await img.decode();else await new Promise((resolve,reject)=>{if(img.complete&&img.naturalWidth>0)return resolve();img.onload=resolve;img.onerror=reject});
    });
    const wall=page.locator('#zoomWall');const rows=[];const scales=[0.67,0.8,0.9,1,1.1,1.25,1.5,1.75];
    for(let round=0;round<3;round++)for(const scale of scales){
      await page.evaluate(({scale,round})=>{const grid=document.getElementById('zoomGrid');document.documentElement.style.zoom=round===1?String(scale):'1';grid.style.transform=round===1?'none':`scale(${scale})`;},{scale,round});
      await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
      const shot=await wall.screenshot({animations:'disabled'}),p=pixels(shot);rows.push({round,scale,...p});
    }
    for(const row of rows){assert.ok(row.width>2&&row.height>2,`round ${row.round} scale ${row.scale}: empty wall screenshot`);assert.ok(row.whiteRatio<0.55,`round ${row.round} scale ${row.scale}: wall became predominantly white (${row.whiteRatio.toFixed(3)})`);assert.ok(row.mean<225,`round ${row.round} scale ${row.scale}: wall became visually washed out (${row.mean.toFixed(1)})`)}
    assert.deepEqual(errors,[],'Firefox wall pixel sentinel errors');
    console.log(JSON.stringify({scenario:'canonical wall remains visibly textured through Firefox fractional zoom',asset:await page.evaluate(()=>window.GensRpgTacticalCombatV2Ui.WALL_ASSET),rows}));
  }finally{await context.close();await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
