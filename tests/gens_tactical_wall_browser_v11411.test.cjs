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
      const board=document.getElementById('dc047RoomBoard');board.innerHTML='<div class="dc047Grid"><div id="liveWall" class="dc047Cell"></div><div id="liveFloor" class="dc047Cell"></div></div>';
      const builder=document.createElement('div');builder.id='drc100Grid';builder.innerHTML='<div id="builderWall" class="drc100Cell wall"></div>';document.body.appendChild(builder);
      const tactical=document.createElement('div');tactical.id='tacticalWall';tactical.className='gtv2Cell blocked';document.body.appendChild(tactical);
      for(let i=0;i<5;i++)api.paintLiveWalls();
      const ids=['liveWall','builderWall','tacticalWall'];
      const rows=ids.map(id=>{const el=document.getElementById(id),tiles=[...el.querySelectorAll(':scope > .gtv2WallTile')],img=tiles[0]||null,cs=getComputedStyle(el);return {id,count:tiles.length,owner:el.classList.contains('gtv2WallOwner'),src:img?.getAttribute('src')||'',complete:!!img?.complete,naturalWidth:Number(img?.naturalWidth||0),background:cs.backgroundImage}});
      const patched=api.patchDungeonMapHtml();
      const html=window.dungeonMapHtml(window.__runtime.last.map);
      const tpl=document.createElement('template');tpl.innerHTML=html;const patchedWalls=[...tpl.content.querySelectorAll('.gtv2WallOwner > .gtv2WallTile')].length;
      return {asset:api.WALL_ASSET,rows,patched,patchedWalls};
    });
    assert.equal(result.asset,'assets/dungeon/creatures/dng_wall_block.jpg');
    for(const row of result.rows){assert.equal(row.count,1,`${row.id}: canonical wall painter must keep exactly one direct wall tile`);assert.equal(row.owner,true,`${row.id}: canonical owner class missing`);assert.equal(row.src,'assets/dungeon/creatures/dng_wall_block.jpg',`${row.id}: wrong wall asset`);assert.equal(row.complete,true,`${row.id}: wall image did not finish loading`);assert.ok(row.naturalWidth>0,`${row.id}: wall asset failed to decode`);assert.match(row.background,/dng_wall_block\.jpg/,`${row.id}: canonical wall background missing`)}
    assert.equal(result.patched,true);assert.equal(result.patchedWalls,1,'Dungeon HTML patch must inject one canonical wall tile for one wall cell');assert.deepEqual(errors,[],'wall sentinel browser console/page errors');
    console.log(JSON.stringify({scenario:'V114.11 canonical Tactical walls',viewport:'412x915 @2.625 touch',asset:result.asset,walls:result.rows.map(r=>({id:r.id,tiles:r.count,naturalWidth:r.naturalWidth})),patchedWalls:result.patchedWalls}));
  }finally{await context.close();await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
