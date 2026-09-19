const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const rel=pathname==='/'?'/preview.html':pathname,file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('not found');return}res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});res.end(data)});
});

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[asset-resolver] WATCHDOG');process.exit(1)},90000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  const page=await context.newPage();page.setDefaultTimeout(25000);
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  try{
    await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
    await page.waitForFunction(()=>typeof dungeonAutoArtPath164==='function'&&typeof gensDungeonCreatureArt165==='function'&&typeof dungeonBuiltinHeroGithubArt168==='function'&&typeof dungeonItems==='function',null,{timeout:30000});

    const state=await page.evaluate(()=>{
      const before=loadBuiltinEnemyOverrides?.()||{};
      const beforeItems=loadDungeonItemOverrides?.()||{};
      const id='dng_skeleton',custom='data:image/png;base64,PHASE4_OVERRIDE';
      const itemId='dng_longsword',customItem='data:image/png;base64,PHASE4_ITEM_OVERRIDE';
      const cleanItems=()=>dungeonItems().reduce((o,x)=>(o[x.id]=x.image_data,o),{});
      const original={
        coreLoaded:!!window.GensAssetResolverV1,
        creature164:dungeonAutoArtPath164(id),
        creature165:gensDungeonCreatureArt165(id),
        heroA:dungeonBuiltinHeroGithubArt168('dungeon_aldren'),
        heroL:dungeonBuiltinHeroGithubArt168('dungeon_lyra'),
        heroB:dungeonBuiltinHeroGithubArt168('dungeon_brom'),
        items:cleanItems(),
        survivalCollision:dungeonAutoArtPath164('walker'),
        captureCollision:dungeonAutoArtPath164('braiseau')
      };
      try{
        const next={...before,[id]:{...(before[id]||{}),image_data:custom}};
        saveBuiltinEnemyOverrides(next);
        const override165=gensDungeonCreatureArt165(id);
        saveDungeonItemOverrides({...beforeItems,[itemId]:{...(beforeItems[itemId]||{}),image_data:customItem}});
        const itemOverride=(dungeonItems().find(x=>x.id===itemId)||{}).image_data||'';
        return {original,override165,custom,itemOverride,customItem};
      }finally{
        saveBuiltinEnemyOverrides(before);
        saveDungeonItemOverrides(beforeItems);
        try{dungeonApplyGithubArts164?.()}catch(e){}
      }
    });

    console.log('[asset-resolver] historical-parity',JSON.stringify(state,null,2));
    assert.equal(state.original.coreLoaded,true,'Phase 4 Core asset resolver must be loaded in the real preview composition');
    assert.equal(state.original.creature164,'assets/dungeon/creatures/dng_skeleton.png');
    assert.equal(state.original.creature165,'assets/dungeon/creatures/dng_skeleton.png');
    assert.equal(state.original.heroA,'assets/dungeon/creatures/dng_aldren.png');
    assert.equal(state.original.heroL,'assets/dungeon/creatures/dng_lyra.png');
    assert.equal(state.original.heroB,'assets/dungeon/creatures/dng_brom.png');
    assert.equal(state.original.items.dng_longsword,'assets/dungeon/creatures/dng_longsword.png');
    assert.equal(state.original.items.dng_heal_potion,'assets/dungeon/creatures/dungeon_potion_hp.png');
    assert.equal(state.original.items.dng_amulet,'assets/dungeon/creatures/dungeon_relic.png');
    assert.equal(state.original.survivalCollision,'');
    assert.equal(state.original.captureCollision,'');
    assert.equal(state.override165,state.custom,'custom enemy override must remain above canonical Dungeon asset');
    assert.equal(state.itemOverride,state.customItem,'custom item override must remain above canonical Dungeon item asset');
  }finally{
    clearTimeout(watchdog);await context.close();await browser.close();await new Promise(r=>server.close(r));
  }
})().catch(e=>{console.error(e);process.exitCode=1});
