const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const indexSource=fs.readFileSync(path.join(root,'index.html'),'utf8');

const exactCall='  if(typeof ensureDungeonEnemies==="function")ensureDungeonEnemies();\n';
assert.equal(indexSource.split(exactCall).length-1,1,
  'characterization requires the exact single reviewed ensureDungeonEnemies call inside refreshCustomEnemiesIntoZombieTypes');

const fixture=indexSource.replace(exactCall,'');
const nativeStart=fixture.indexOf('function refreshCustomEnemiesIntoZombieTypes(){');
const nativeEnd=fixture.indexOf('function isDungeonEnemyRecord(',nativeStart);
assert.ok(nativeStart>=0&&nativeEnd>nativeStart,'native refresh owner must have the reviewed boundary');
const nativeFixture=fixture.slice(nativeStart,nativeEnd);
assert.doesNotMatch(nativeFixture,/ensureDungeonEnemies/,
  'fixture must remove only the direct Dungeon ensure dependency from the shared refresh owner');
assert.match(nativeFixture,/applyBuiltinEnemyOverrides\(\)/,
  'fixture must preserve builtin override publication');
assert.match(nativeFixture,/loadCustomEnemies\(\)/,
  'fixture must preserve custom enemy publication');

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
  if(pathname==='/__phase6_custom_enemy_without_dungeon_ensure.html'){
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
  const watchdog=setTimeout(()=>{console.error('[phase6-custom-enemy-without-dungeon-ensure] WATCHDOG');process.exit(1)},120000);
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
      'http://127.0.0.1:'+port+'/__phase6_custom_enemy_without_dungeon_ensure.html',
      {waitUntil:'domcontentloaded',timeout:60000}
    );

    await page.waitForFunction(()=>(
      typeof refreshCustomEnemiesIntoZombieTypes==='function' &&
      typeof activeEnemyDefinition==='function' &&
      typeof enemyCardHtml==='function' &&
      typeof loadCustomEnemies==='function' &&
      typeof enemiesForMode==='function' &&
      typeof dungeonEnemies==='function' &&
      Array.isArray(ZOMBIE_TYPES)
    ),null,{timeout:30000});

    const result=await page.evaluate(()=>{
      const survivalId='phase6_survival_probe_no_ensure';
      const customDungeonId='phase6_dungeon_probe_no_ensure';
      const builtinDungeonId='dng_skeleton';
      const override='data:image/png;base64,iVBORw0KGgo=';

      localStorage.setItem('gensrpg_custom_enemies_v1',JSON.stringify([
        {
          id:survivalId,
          name:'Phase 6 Survival Probe',
          defaultCount:3,
          gameMode:'zombicide',
          category:'Walker',
          skin:'walker',
          image_data:'',
          imageCrop:{x:0,y:0,scale:1,rot:0},
          rule:{actions:1,damage:1,attackDice:1,attackAccuracy:4,endurance:1,xp:1}
        },
        {
          id:customDungeonId,
          name:'Phase 6 Dungeon Probe',
          defaultCount:2,
          gameMode:'dungeon',
          category:'Créature',
          skin:'creature',
          image_data:'',
          imageCrop:{x:0,y:0,scale:1,rot:0},
          rule:{
            hp:9,actions:1,damage:2,attackDice:1,rpgHitChance:65,
            rpgStats:{force:3,agilite:2,intelligence:1,esprit:1,endurance:4},
            xp:4,movement:1
          }
        }
      ]));
      localStorage.setItem('gensrpg_builtin_enemy_overrides_v1',JSON.stringify({
        [builtinDungeonId]:{image_data:override}
      }));

      refreshCustomEnemiesIntoZombieTypes();
      refreshCustomEnemiesIntoZombieTypes();

      const nativeSource=String(window.refreshCustomEnemiesIntoZombieTypes);
      const survival=ZOMBIE_TYPES.filter(z=>String(z.id)===survivalId);
      const customDungeon=ZOMBIE_TYPES.filter(z=>String(z.id)===customDungeonId);
      const builtin=activeEnemyDefinition(builtinDungeonId);
      const survivalIds=enemiesForMode(false).map(z=>String(z.id));
      const dungeonIds=enemiesForMode(true).map(z=>String(z.id));
      const builtinIds=dungeonEnemies().map(z=>String(z.id));

      const html=enemyCardHtml({
        id:builtin.id,
        name:builtin.name,
        category:builtin.category||'',
        skin:builtin.skin||'creature',
        image_data:'',
        imageCrop:builtin.imageCrop||{},
        rule:builtin.rule||{}
      });

      return {
        nativeSource,
        survivalCount:survival.length,
        survivalMode:survival[0]?.gameMode,
        customDungeonCount:customDungeon.length,
        customDungeonMode:customDungeon[0]?.gameMode,
        survivalContains:survivalIds.includes(survivalId),
        survivalExcludesDungeon:!survivalIds.includes(customDungeonId)&&!survivalIds.includes(builtinDungeonId),
        dungeonContainsCustom:dungeonIds.includes(customDungeonId),
        dungeonContainsBuiltin:dungeonIds.includes(builtinDungeonId),
        allBuiltinPresent:builtinIds.every(id=>ZOMBIE_TYPES.some(z=>String(z.id)===id)),
        builtinArt:builtin?.art||'',
        html,
        override
      };
    });

    assert.doesNotMatch(result.nativeSource,/ensureDungeonEnemies/,
      'shared refresh owner must execute without the private Dungeon ensure dependency in the characterization fixture');
    assert.match(result.nativeSource,/applyBuiltinEnemyOverrides\(\)/,
      'builtin override publication must remain active');
    assert.match(result.nativeSource,/loadCustomEnemies\(\)/,
      'custom publication must remain active');

    assert.equal(result.survivalCount,1,
      'repeated refresh must publish the Survival custom enemy exactly once');
    assert.equal(result.survivalMode,'zombicide');
    assert.equal(result.customDungeonCount,1,
      'repeated refresh must publish the custom Dungeon enemy exactly once');
    assert.equal(result.customDungeonMode,'dungeon');

    assert.equal(result.survivalContains,true,
      'Survival filtering must retain the Survival custom enemy');
    assert.equal(result.survivalExcludesDungeon,true,
      'Survival filtering must not leak Dungeon enemies');
    assert.equal(result.dungeonContainsCustom,true,
      'Dungeon filtering must retain the custom Dungeon enemy');
    assert.equal(result.dungeonContainsBuiltin,true,
      'Dungeon filtering must retain the builtin Dungeon enemy');
    assert.equal(result.allBuiltinPresent,true,
      'applyBuiltinEnemyOverrides must already republish every Dungeon builtin without ensureDungeonEnemies');

    assert.equal(result.builtinArt,result.override,
      'Dungeon builtin art override must remain preserved');
    assert.ok(result.html.includes(result.override),
      'Dungeon card rendering must still use the explicit art override');

    console.log(JSON.stringify({
      scenario:'Phase 6 shared custom enemy refresh without ensureDungeonEnemies dependency',
      survivalCustomPublished:true,
      dungeonCustomPublished:true,
      dungeonBuiltinsPreserved:true,
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
