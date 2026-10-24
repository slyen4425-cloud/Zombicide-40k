const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname),rel=pathname==='/'?'/tests/fixtures/native-dungeon-ui-v11411.html':pathname,file=path.resolve(root,'.'+rel);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('not found');return}res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});res.end(data)})});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const port=server.address().port,browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR'}),page=await context.newPage();
  page.setDefaultTimeout(10000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  try{
    await page.goto(`http://127.0.0.1:${port}/tests/fixtures/native-dungeon-ui-v11411.html`,{waitUntil:'load'});await page.waitForFunction(()=>window.__nativeUiReady===true);
    const result=await page.evaluate(async()=>{
      const api=window.GensRpgTacticalCombatV2Ui;if(!api)throw new Error('Tactical UI missing');
      window.__runtime.room=1;window.__runtime.heroRooms.dungeon_aldren=1;window.__runtime.positions.dungeon_aldren=1;window.__runtime.last.map={width:2,height:1,cells:['wall','floor']};
      const board=document.getElementById('dc047RoomBoard');board.innerHTML='<div class="dc047Grid"><div id="liveWall" class="dc047Cell wall"></div><div id="liveFloor" class="dc047Cell"></div></div>';
      const builder=document.createElement('div');builder.id='drc100Grid';builder.innerHTML='<div id="builderWall" class="drc100Cell wall"></div>';document.body.appendChild(builder);
      const tactical=document.createElement('div');tactical.id='tacticalWall';tactical.className='gtv2Cell blocked';document.body.appendChild(tactical);
      for(let i=0;i<5;i++)api.paintLiveWalls();
      const wallImages=[...document.querySelectorAll('.gtv2WallTile')];
      await Promise.all(wallImages.map(img=>typeof img.decode==='function'?img.decode().catch(()=>{}):img.complete?Promise.resolve():new Promise(resolve=>{img.addEventListener('load',resolve,{once:true});img.addEventListener('error',resolve,{once:true})})));
      const ids=['liveWall','builderWall','tacticalWall'];
      const rows=ids.map(id=>{const el=document.getElementById(id),tiles=[...el.querySelectorAll(':scope > .gtv2WallTile')],img=tiles[0]||null,cs=getComputedStyle(el);return {id,count:tiles.length,owner:el.classList.contains('gtv2WallOwner'),src:img?.getAttribute('src')||'',complete:!!img?.complete,naturalWidth:Number(img?.naturalWidth||0),background:cs.backgroundImage}});
      window.dungeonMapHtml=map=>'<div class="dc047Grid">'+(map.cells||[]).map(kind=>`<div class="dc047Cell">${kind}</div>`).join('')+'</div>';
      const unmodified=window.dungeonMapHtml(window.__runtime.last.map);
      api.installGlobalPolish();
      const html=window.dungeonMapHtml(window.__runtime.last.map);
      const patched=html===unmodified;
      const tpl=document.createElement('template');tpl.innerHTML=html;const patchedWalls=[...tpl.content.querySelectorAll('.gtv2WallOwner > .gtv2WallTile')].length;

      window.DungeonCore01={render(){board.innerHTML='<div class="dc047Grid"><div id="lateWall" class="dc047Cell"></div><div class="dc047Cell"></div></div>';return true}};
      window.DungeonCore01.render();
      const late=document.getElementById('lateWall'),lateTiles=[...late.querySelectorAll(':scope > .gtv2WallTile')],lateImg=lateTiles[0]||null;
      if(lateImg&&typeof lateImg.decode==='function')await lateImg.decode().catch(()=>{});
      const lateRender={count:lateTiles.length,owner:late.classList.contains('gtv2WallOwner'),src:lateImg?.getAttribute('src')||'',naturalWidth:Number(lateImg?.naturalWidth||0)};
      return {asset:api.WALL_ASSET,rows,patched,patchedWalls,lateRender};
    });
    assert.equal(result.asset,'assets/dungeon/creatures/dng_wall_block.jpg');
    const native=result.rows.find(x=>x.id==='liveWall');
    assert.equal(native.count,0,'Tactical may not inject a wall tile into native Dungeon');
    assert.equal(native.owner,false,'native Dungeon must not receive Tactical wall ownership');
    for(const row of result.rows.filter(x=>x.id!=='liveWall')){
      assert.equal(row.count,1,`${row.id}: Tactical/Builder fallback must have exactly one image`);
      assert.equal(row.owner,true,`${row.id}: Tactical/Builder wall owner missing`);
      assert.equal(row.src,'assets/dungeon/creatures/dng_wall_block.jpg',`${row.id}: wrong fallback JPEG`);
      assert.equal(row.complete,true);assert.ok(row.naturalWidth>0);assert.match(row.background,/dng_wall_block\.jpg/);
    }
    assert.equal(result.patched,true,'normal installation cannot rewrite Dungeon map HTML');
    assert.equal(result.patchedWalls,0,'native Dungeon map must not receive tactical wall markup');
    assert.equal(result.lateRender.count,0,'a later native Dungeon render must not receive Tactical wall tiles');
    assert.equal(result.lateRender.owner,false,'native Dungeon wall remains Dungeon-owned');
    assert.deepEqual(errors,[],'wall sentinel browser console/page errors');
    console.log(JSON.stringify({scenario:'V114.11 canonical Tactical walls including late Dungeon render',viewport:'412x915 @2.625 touch',asset:result.asset,walls:result.rows.map(r=>({id:r.id,tiles:r.count,naturalWidth:r.naturalWidth})),patchedWalls:result.patchedWalls,lateRender:result.lateRender}));
  }finally{await context.close();await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
