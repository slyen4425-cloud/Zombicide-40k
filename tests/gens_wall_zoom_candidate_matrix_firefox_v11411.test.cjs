const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {firefox}=require('playwright');
const {PNG}=require('pngjs');
const root=path.join(__dirname,'..');
const viewport={width:412,height:915};
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname),rel=pathname==='/'?'/tests/fixtures/native-dungeon-ui-v11411.html':pathname,file=path.resolve(root,'.'+rel);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('not found');return}res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});res.end(data)})});
function regionPixels(buffer,box){const png=PNG.sync.read(buffer),sx=png.width/viewport.width,sy=png.height/viewport.height,x0=Math.max(0,Math.floor(box.x*sx)),y0=Math.max(0,Math.floor(box.y*sy)),x1=Math.min(png.width,Math.ceil((box.x+box.width)*sx)),y1=Math.min(png.height,Math.ceil((box.y+box.height)*sy));let n=0,white=0,sum=0;for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){const i=(y*png.width+x)*4;if(png.data[i+3]<16)continue;const r=png.data[i],g=png.data[i+1],b=png.data[i+2];n++;if(r>235&&g>235&&b>235)white++;sum+=(r+g+b)/3}return {whiteRatio:n?white/n:1,mean:n?sum/n:255,width:x1-x0,height:y1-y0}}
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const port=server.address().port,browser=await firefox.launch({headless:true});
  const context=await browser.newContext({viewport,deviceScaleFactor:2.625,hasTouch:true,locale:'fr-FR'}),page=await context.newPage();page.setDefaultTimeout(15000);
  try{
    await page.goto(`http://127.0.0.1:${port}/tests/fixtures/native-dungeon-ui-v11411.html`,{waitUntil:'load'});await page.waitForFunction(()=>window.__nativeUiReady===true);
    await page.evaluate(async()=>{const api=window.GensRpgTacticalCombatV2Ui;window.__runtime.last.map={width:2,height:1,cells:['wall','floor']};const board=document.getElementById('dc047RoomBoard');board.style.background='#111';board.innerHTML='<div id="zoomGrid" class="dc047Grid" style="width:240px;grid-template-columns:repeat(2,120px);transform-origin:0 0"><div id="zoomWall" class="dc047Cell" style="width:120px;height:120px"></div><div class="dc047Cell" style="width:120px;height:120px"></div></div>';api.paintLiveWalls();const i=document.querySelector('#zoomWall>.gtv2WallTile');if(typeof i?.decode==='function')await i.decode();});
    const candidates=[
      {id:'baseline'},
      {id:'jpg-no-isolation',contain:'none',isolation:'auto'},
      {id:'jpg-background-only',contain:'none',isolation:'auto',hideImg:true,bg:'assets/dungeon/creatures/dng_wall_block.jpg'},
      {id:'png-image-no-isolation',contain:'none',isolation:'auto',img:'assets/dungeon/creatures/dungeon_wall.png'},
      {id:'png-background-only',contain:'none',isolation:'auto',hideImg:true,bg:'assets/dungeon/creatures/dungeon_wall.png'}
    ];
    const scales=[0.67,0.8,0.9,1,1.25,1.5,1.75],rows=[];
    for(const c of candidates){
      await page.evaluate(async c=>{const api=window.GensRpgTacticalCombatV2Ui,w=document.getElementById('zoomWall');w.removeAttribute('style');w.style.width='120px';w.style.height='120px';w.className='dc047Cell';w.innerHTML='';api.ensureWallTile(w);const i=w.querySelector(':scope>.gtv2WallTile');if(c.contain!=null)w.style.setProperty('contain',c.contain,'important');if(c.isolation!=null)w.style.setProperty('isolation',c.isolation,'important');if(c.bg)w.style.setProperty('background-image',`url("${c.bg}")`,'important');if(c.img){i.src=c.img;if(typeof i.decode==='function')await i.decode().catch(()=>{});}if(c.hideImg)i.style.setProperty('display','none','important');else i.style.removeProperty('display');if(c.bg){const p=new Image();p.src=c.bg;if(typeof p.decode==='function')await p.decode().catch(()=>{});}},{...c});
      for(const scale of scales){await page.evaluate(s=>{document.documentElement.style.zoom='1';document.getElementById('zoomGrid').style.transform=`scale(${s})`;},scale);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const wall=page.locator('#zoomWall'),box=await wall.boundingBox();assert.ok(box,`${c.id} scale ${scale}: missing bounding box`);const p=regionPixels(await page.screenshot({animations:'disabled'}),box);rows.push({candidate:c.id,scale,...p});}
    }
    const grouped={};for(const r of rows)(grouped[r.candidate]??=[]).push(r);const score={};for(const [id,list] of Object.entries(grouped))score[id]={maxWhite:Math.max(...list.map(x=>x.whiteRatio)),maxMean:Math.max(...list.map(x=>x.mean))};
    const healthy=Object.entries(score).filter(([,s])=>s.maxWhite<0.55&&s.maxMean<225).map(([id])=>id);
    assert.ok(healthy.length>0,`no wall representation survived Firefox fractional zoom: ${JSON.stringify(score)}`);
    console.log(JSON.stringify({scenario:'Firefox wall representation matrix from full compositor screenshot',asset:await page.evaluate(()=>window.GensRpgTacticalCombatV2Ui.WALL_ASSET),healthy,score,rows}));
  }finally{await context.close();await browser.close();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
