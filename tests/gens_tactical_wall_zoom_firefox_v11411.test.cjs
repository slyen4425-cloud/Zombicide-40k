const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {firefox}=require('playwright');
const root=path.join(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname),rel=pathname==='/'?'/tests/fixtures/native-dungeon-ui-v11411.html':pathname,file=path.resolve(root,'.'+rel);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('not found');return}res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});res.end(data)})});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const port=server.address().port,browser=await firefox.launch({headless:true});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,hasTouch:true,locale:'fr-FR'}),page=await context.newPage();
  page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  try{
    await page.goto(`http://127.0.0.1:${port}/tests/fixtures/native-dungeon-ui-v11411.html`,{waitUntil:'load'});await page.waitForFunction(()=>window.__nativeUiReady===true);
    const result=await page.evaluate(async()=>{
      const api=window.GensRpgTacticalCombatV2Ui;if(!api)throw new Error('Tactical UI missing');
      window.__runtime.room=1;window.__runtime.heroRooms.dungeon_aldren=1;window.__runtime.positions.dungeon_aldren=1;window.__runtime.last.map={width:2,height:1,cells:['wall','floor']};
      const board=document.getElementById('dc047RoomBoard');board.innerHTML='<div id="zoomGrid" class="dc047Grid" style="width:240px;grid-template-columns:repeat(2,1fr);transform-origin:0 0"><div id="zoomWall" class="dc047Cell"></div><div class="dc047Cell"></div></div>';
      api.paintLiveWalls();
      const grid=document.getElementById('zoomGrid'),wall=document.getElementById('zoomWall'),img=wall.querySelector(':scope > .gtv2WallTile');
      if(img&&typeof img.decode==='function')await img.decode().catch(()=>{});
      const scales=[0.67,0.8,0.9,1,1.1,1.25,1.5,1.75];const rows=[];
      for(const scale of scales){
        grid.style.transform=`scale(${scale})`;
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        const cs=getComputedStyle(wall),ics=getComputedStyle(img),wr=wall.getBoundingClientRect(),ir=img.getBoundingClientRect();
        rows.push({scale,owner:wall.classList.contains('gtv2WallOwner'),tiles:wall.querySelectorAll(':scope > .gtv2WallTile').length,complete:!!img?.complete,naturalWidth:Number(img?.naturalWidth||0),background:cs.backgroundImage,contain:cs.contain,isolation:cs.isolation,imgDisplay:ics.display,imgVisibility:ics.visibility,imgOpacity:ics.opacity,wallWidth:wr.width,imgWidth:ir.width});
      }
      return rows;
    });
    for(const row of result){
      assert.equal(row.owner,true,`scale ${row.scale}: canonical wall owner missing`);
      assert.equal(row.tiles,1,`scale ${row.scale}: wall tile count changed during zoom`);
      assert.equal(row.complete,true,`scale ${row.scale}: wall image not complete`);
      assert.ok(row.naturalWidth>0,`scale ${row.scale}: wall image failed to decode`);
      assert.match(row.background,/dng_wall_block\.jpg/,`scale ${row.scale}: fallback background lost`);
      assert.equal(row.imgDisplay,'block',`scale ${row.scale}: wall image display changed`);
      assert.equal(row.imgVisibility,'visible',`scale ${row.scale}: wall image visibility changed`);
      assert.equal(row.imgOpacity,'1',`scale ${row.scale}: wall image opacity changed`);
      assert.ok(row.wallWidth>0&&row.imgWidth>0,`scale ${row.scale}: wall collapsed`);
      assert.doesNotMatch(row.contain,/paint/,`scale ${row.scale}: paint containment creates a fragile Firefox zoom compositing layer`);
      assert.notEqual(row.isolation,'isolate',`scale ${row.scale}: isolated wall compositing is forbidden for Firefox zoom stability`);
    }
    assert.deepEqual(errors,[],'Firefox wall zoom browser errors');
    console.log(JSON.stringify({scenario:'V114.11 canonical wall survives Firefox fractional zoom without isolated paint layers',viewport:'412x915 @2.625',scales:result.map(r=>({scale:r.scale,contain:r.contain,isolation:r.isolation,width:r.wallWidth}))}));
  }finally{await context.close();await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
