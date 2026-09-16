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
      if(api.WALL_ASSET!=='assets/dungeon/creatures/dng_wall_block.jpg')throw new Error(`Unexpected canonical wall asset: ${api.WALL_ASSET}`);
      window.__runtime.room=1;window.__runtime.heroRooms.dungeon_aldren=1;window.__runtime.positions.dungeon_aldren=1;window.__runtime.last.map={width:2,height:1,cells:['wall','floor']};
      const board=document.getElementById('dc047RoomBoard');board.innerHTML='<div id="zoomGrid" class="dc047Grid" style="width:240px;grid-template-columns:repeat(2,1fr);transform-origin:0 0"><div id="zoomWall" class="dc047Cell"></div><div class="dc047Cell"></div></div>';
      api.paintLiveWalls();
      const grid=document.getElementById('zoomGrid'),wall=document.getElementById('zoomWall'),img=wall.querySelector(':scope > .gtv2WallTile');
      if(!img)throw new Error('Canonical wall tile missing');
      if(typeof img.decode==='function')await img.decode();
      const scales=[0.67,0.8,0.9,1,1.1,1.25,1.5,1.75];const rows=[];
      for(const scale of scales){
        grid.style.transform=`scale(${scale})`;
        await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));
        const cs=getComputedStyle(wall),ics=getComputedStyle(img),wr=wall.getBoundingClientRect(),ir=img.getBoundingClientRect();
        rows.push({scale,owner:wall.classList.contains('gtv2WallOwner'),tiles:wall.querySelectorAll(':scope > .gtv2WallTile').length,complete:!!img.complete,naturalWidth:Number(img.naturalWidth||0),naturalHeight:Number(img.naturalHeight||0),background:cs.backgroundImage,imgSrc:img.getAttribute('src')||'',imgDisplay:ics.display,imgVisibility:ics.visibility,imgOpacity:ics.opacity,wallWidth:wr.width,imgWidth:ir.width});
      }
      return {asset:api.WALL_ASSET,rows};
    });
    assert.equal(result.asset,'assets/dungeon/creatures/dng_wall_block.jpg');
    for(const row of result.rows){
      assert.equal(row.owner,true,`scale ${row.scale}: canonical wall owner missing`);
      assert.equal(row.tiles,1,`scale ${row.scale}: wall tile count changed during zoom`);
      assert.equal(row.complete,true,`scale ${row.scale}: wall image not complete`);
      assert.equal(row.naturalWidth,256,`scale ${row.scale}: wall JPEG width changed or failed to decode`);
      assert.equal(row.naturalHeight,256,`scale ${row.scale}: wall JPEG height changed or failed to decode`);
      assert.equal(row.imgSrc,'assets/dungeon/creatures/dng_wall_block.jpg',`scale ${row.scale}: wrong wall tile source`);
      assert.match(row.background,/dng_wall_block\.jpg/,`scale ${row.scale}: canonical wall background lost`);
      assert.equal(row.imgDisplay,'block',`scale ${row.scale}: wall image display changed`);
      assert.equal(row.imgVisibility,'visible',`scale ${row.scale}: wall image visibility changed`);
      assert.equal(row.imgOpacity,'1',`scale ${row.scale}: wall image opacity changed`);
      assert.ok(row.wallWidth>0&&row.imgWidth>0,`scale ${row.scale}: wall collapsed`);
    }
    assert.deepEqual(errors,[],'Firefox wall zoom browser errors');
    console.log(JSON.stringify({scenario:'V114.11 repaired canonical JPEG survives Firefox fractional zoom',viewport:'412x915 @2.625',asset:result.asset,scales:result.rows.map(r=>({scale:r.scale,width:r.wallWidth,naturalWidth:r.naturalWidth}))}));
  }finally{await context.close();await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
