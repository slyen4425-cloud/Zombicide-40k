const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const indexSource=fs.readFileSync(path.join(root,'index.html'),'utf8');

const wrapper=`/* Critical fix: refreshCustomEnemiesIntoZombieTypes was rebuilding the definitions
   after V164 had assigned their images. Apply the art AFTER every rebuild. */
if(typeof window.refreshCustomEnemiesIntoZombieTypes==="function"){
  const old=window.refreshCustomEnemiesIntoZombieTypes;
  window.refreshCustomEnemiesIntoZombieTypes=function(){
    const r=old.apply(this,arguments); apply(); return r;
  };
}
`;

const wrapperCount=indexSource.split(wrapper).length-1;
assert.ok(wrapperCount===0||wrapperCount===1,
  'runtime must contain at most the reviewed single V165 refresh wrapper');
const fixture=wrapperCount===1?indexSource.replace(wrapper,''):indexSource;
assert.doesNotMatch(
  fixture.slice(fixture.indexOf('<script id="dungeonArtRenderFix165">'),fixture.indexOf('</script>',fixture.indexOf('<script id="dungeonArtRenderFix165">'))),
  /window.refreshCustomEnemiesIntoZombieTypess*=s*function/,
  'fixture must remove only the V165 global refresh wrapper'
);

const mime={
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json',
  '.webmanifest':'application/manifest+json',
  '.png':'image/png',
  '.jpg':'image/jpeg',
  '.jpeg':'image/jpeg',
  '.webp':'image/webp',
  '.svg':'image/svg+xml',
  '.mp3':'audio/mpeg'
};

const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(pathname==='/__phase6_custom_enemy_refresh_without_v165_wrapper.html'){
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
    res.end(fixture);
    return;
  }
  const rel=pathname==='/'?'/index.html':pathname;
  const file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end('not found');return}
    res.writeHead(200,{
      'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream',
      'cache-control':'no-store'
    });
    res.end(data);
  });
});

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[phase6-custom-enemy-refresh] WATCHDOG');process.exit(1)},120000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({
    viewport:{width:412,height:915},
    deviceScaleFactor:2.625,
    isMobile:true,
    hasTouch:true,
    locale:'fr-FR',
    serviceWorkers:'block'
  });
  await context.addInitScript(()=>{
    try{localStorage.clear();sessionStorage.clear()}catch(e){}
    window.supabase={createClient:()=>({})};
  });
  const page=await context.newPage();
  page.setDefaultTimeout(20000);
  page.on('dialog',async d=>{try{await d.dismiss()}catch(e){}});
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());

  try{
    await page.goto(
      'http://127.0.0.1:'+port+'/__phase6_custom_enemy_refresh_without_v165_wrapper.html',
      {waitUntil:'domcontentloaded',timeout:60000}
    );

    await page.waitForFunction(()=>(
      typeof refreshCustomEnemiesIntoZombieTypes==='function' &&
      typeof activeEnemyDefinition==='function' &&
      typeof enemyCardHtml==='function' &&
      typeof loadCustomEnemies==='function' &&
      typeof enemiesForMode==='function' &&
      Array.isArray(ZOMBIE_TYPES)
    ),null,{timeout:30000});

    const result=await page.evaluate(()=>{
      const customId='phase6_survival_custom_probe';
      const dungeonId='dng_skeleton';
      const override='data:image/png;base64,iVBORw0KGgo=';

      localStorage.setItem('gensrpg_custom_enemies_v1',JSON.stringify([{
        id:customId,
        name:'Phase 6 Survival Probe',
        defaultCount:3,
        gameMode:'zombicide',
        category:'Walker',
        skin:'walker',
        image_data:'',
        imageCrop:{x:0,y:0,scale:1,rot:0},
        rule:{actions:1,damage:1,attackDice:1,attackAccuracy:4,endurance:1,xp:1}
      }]));
      localStorage.setItem('gensrpg_builtin_enemy_overrides_v1',JSON.stringify({
        [dungeonId]:{image_data:override}
      }));

      refreshCustomEnemiesIntoZombieTypes();
      refreshCustomEnemiesIntoZombieTypes();

      const nativeSource=String(window.refreshCustomEnemiesIntoZombieTypes);
      const custom=ZOMBIE_TYPES.filter(z=>String(z.id)===customId);
      const survivalIds=enemiesForMode(false).map(z=>String(z.id));
      const dungeon=activeEnemyDefinition(dungeonId);
      const html=enemyCardHtml({
        id:dungeon.id,
        name:dungeon.name,
        category:dungeon.category||'',
        skin:dungeon.skin||'creature',
        image_data:'',
        imageCrop:dungeon.imageCrop||{},
        rule:dungeon.rule||{}
      });

      try{openZombieRule(dungeonId)}catch(e){}
      const popupHtml=document.getElementById('zombieRuleContent')?.innerHTML||'';

      return {
        nativeSource,
        customCount:custom.length,
        customDefault:custom[0]?.defaultCount,
        customMode:custom[0]?.gameMode,
        survivalContains:survivalIds.includes(customId),
        dungeonExists:!!dungeon,
        dungeonArt:dungeon?.art||'',
        html,
        popupHtml,
        override
      };
    });

    assert.match(result.nativeSource,/applyBuiltinEnemyOverrides()/,
      'without the V165 wrapper, the native shared refresh owner must remain active');
    assert.match(result.nativeSource,/loadCustomEnemies()/,
      'native refresh must still publish custom enemies');
    assert.doesNotMatch(result.nativeSource,/ensureDungeonEnemies/,
      'shared custom-enemy refresh must remain free of the retired private Dungeon ensure dependency');
    assert.doesNotMatch(result.nativeSource,/old.apply(this,arguments)/,
      'V165 global refresh wrapper must be absent from the characterization fixture');

    assert.equal(result.customCount,1,
      'repeated native refresh must publish the Survival custom enemy exactly once');
    assert.equal(result.customDefault,3);
    assert.equal(result.customMode,'zombicide');
    assert.equal(result.survivalContains,true,
      'Survival enemy filtering must still expose the custom enemy without the V165 wrapper');

    assert.equal(result.dungeonExists,true,
      'Dungeon built-ins must still exist after native refresh');
    assert.equal(result.dungeonArt,result.override,
      'remaining Dungeon art layers must preserve an explicit Dungeon art override after refresh');
    assert.ok(result.html.includes(result.override),
      'Dungeon enemyCardHtml must still receive the direct art binding');
    assert.ok(result.popupHtml.includes(result.override),
      'Dungeon rule popup must still render the explicit art override');

    console.log(JSON.stringify({
      scenario:'Phase 6 refreshCustomEnemiesIntoZombieTypes without V165 global wrapper',
      customEnemyPublished:true,
      dungeonBuiltinPreserved:true,
      dungeonArtOverridePreserved:true
    },null,2));
  }finally{
    clearTimeout(watchdog);
    server.closeAllConnections?.();
    server.closeIdleConnections?.();
    server.close();
    await context.close();
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
