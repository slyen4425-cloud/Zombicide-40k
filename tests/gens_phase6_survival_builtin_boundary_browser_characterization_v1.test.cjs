const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const indexSource=fs.readFileSync(path.join(root,'index.html'),'utf8');

const applyHeader=[
  'function applyBuiltinEnemyOverrides(){',
  ' const overrides=loadBuiltinEnemyOverrides();',
  ' const bases=[...BASE_ZOMBIE_TYPES,...((typeof dungeonEnemies==="function")?dungeonEnemies():[])];'
].join('\n');
assert.equal(indexSource.split(applyHeader).length-1,1,
  'characterization requires the exact reviewed mixed builtin override owner');

const ensureBody=[
  'function ensureDungeonEnemies(){',
  '  dungeonEnemies().forEach(e=>{if(!ZOMBIE_TYPES.some(x=>x.id===e.id))ZOMBIE_TYPES.push(e)});',
  '}'
].join('\n');
assert.equal(indexSource.split(ensureBody).length-1,1,
  'characterization requires the exact reviewed Dungeon ensure owner');

const saveCall='    applyBuiltinEnemyOverrides();\n\n    const cfg=loadZombieConfig();';
assert.equal(indexSource.split(saveCall).length-1,1,
  'characterization requires the reviewed builtin editor apply call');

const resetCall='  applyBuiltinEnemyOverrides();\n  renderEnemyLibrary();';
assert.equal(indexSource.split(resetCall).length-1,1,
  'characterization requires the reviewed builtin reset apply call');

const v164ApplyWrapper=[
  'if(typeof window.applyBuiltinEnemyOverrides==="function"){',
  '  const oldApplyOverrides164=window.applyBuiltinEnemyOverrides;',
  '  window.applyBuiltinEnemyOverrides=function(){',
  '    const r=oldApplyOverrides164.apply(this,arguments);',
  '    dungeonApplyGithubArts164();',
  '    return r;',
  '  };',
  '}'
].join('\n');
assert.equal(indexSource.split(v164ApplyWrapper).length-1,1,
  'characterization requires the exact reviewed V164 applyBuiltinEnemyOverrides wrapper');

let fixture=indexSource
  .replace(applyHeader,[
    'function applyBuiltinEnemyOverrides(bases=BASE_ZOMBIE_TYPES){',
    ' const overrides=loadBuiltinEnemyOverrides();'
  ].join('\n'))
  .replace(ensureBody,[
    'function ensureDungeonEnemies(){',
    '  const bases=dungeonEnemies();',
    '  bases.forEach(e=>{if(!ZOMBIE_TYPES.some(x=>x.id===e.id))ZOMBIE_TYPES.push(e)});',
    '  applyBuiltinEnemyOverrides(bases);',
    '}'
  ].join('\n'))
  .replace(saveCall,'    applyBuiltinEnemyOverrides([builtinEnemyBase(baseId)].filter(Boolean));\n\n    const cfg=loadZombieConfig();')
  .replace(resetCall,'  applyBuiltinEnemyOverrides([base]);\n  renderEnemyLibrary();')
  .replace(v164ApplyWrapper,'');

const applyStart=fixture.indexOf('function applyBuiltinEnemyOverrides(bases=BASE_ZOMBIE_TYPES){');
const applyEnd=fixture.indexOf('function resetBuiltinEnemyCustomization(',applyStart);
assert.ok(applyStart>=0&&applyEnd>applyStart,'fixture must expose the proposed builtin override boundary');
const applyFixture=fixture.slice(applyStart,applyEnd);
assert.doesNotMatch(applyFixture,/dungeonEnemies/,
  'proposed shared builtin override transform must not read the private Dungeon enemy factory');
assert.match(applyFixture,/bases\.forEach/,
  'proposed shared builtin override transform must operate only on explicit/default bases');

const ensureStart=fixture.indexOf('function ensureDungeonEnemies(){');
const ensureEnd=fixture.indexOf('function dungeonContentIds(',ensureStart);
const ensureFixture=fixture.slice(ensureStart,ensureEnd);
assert.match(ensureFixture,/const bases=dungeonEnemies\(\)/,
  'Dungeon owner must remain responsible for obtaining Dungeon builtin bases');
assert.match(ensureFixture,/applyBuiltinEnemyOverrides\(bases\)/,
  'Dungeon owner must explicitly reuse the shared override transform with Dungeon bases');

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
  if(pathname==='/__phase6_builtin_boundary.html'){
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
  const watchdog=setTimeout(()=>{console.error('[phase6-builtin-boundary] WATCHDOG');process.exit(1)},120000);
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
      'http://127.0.0.1:'+port+'/__phase6_builtin_boundary.html',
      {waitUntil:'domcontentloaded',timeout:60000}
    );

    await page.waitForFunction(()=>(
      typeof refreshCustomEnemiesIntoZombieTypes==='function' &&
      typeof applyBuiltinEnemyOverrides==='function' &&
      typeof ensureDungeonEnemies==='function' &&
      typeof dungeonEnemies==='function' &&
      typeof dungeonApplyGithubArts164==='function' &&
      typeof activeEnemyDefinition==='function' &&
      typeof enemyCardHtml==='function' &&
      typeof enemiesForMode==='function' &&
      Array.isArray(ZOMBIE_TYPES)
    ),null,{timeout:30000});

    const result=await page.evaluate(()=>{
      const survivalId='phase6_survival_builtin_boundary_probe';
      const customDungeonId='phase6_dungeon_builtin_boundary_probe';
      const builtinDungeonId='dng_skeleton';
      const survivalBuiltinId='walker';
      const dungeonOverrideArt='data:image/png;base64,iVBORw0KGgo=';
      const originalDungeonEnemies=window.dungeonEnemies;
      const originalDungeonArtApply=window.dungeonApplyGithubArts164;
      let dungeonCalls=0;
      let dungeonArtApplyCalls=0;
      window.dungeonEnemies=function(){
        dungeonCalls++;
        return originalDungeonEnemies.apply(this,arguments);
      };
      window.dungeonApplyGithubArts164=function(){
        dungeonArtApplyCalls++;
        return originalDungeonArtApply.apply(this,arguments);
      };

      localStorage.setItem('gensrpg_custom_enemies_v1',JSON.stringify([
        {
          id:survivalId,name:'Boundary Survival Probe',defaultCount:3,
          gameMode:'zombicide',category:'Walker',skin:'walker',
          image_data:'',imageCrop:{x:0,y:0,scale:1,rot:0},
          rule:{actions:1,damage:1,attackDice:1,attackAccuracy:4,endurance:1,xp:1}
        },
        {
          id:customDungeonId,name:'Boundary Dungeon Probe',defaultCount:2,
          gameMode:'dungeon',category:'Créature',skin:'creature',
          image_data:'',imageCrop:{x:0,y:0,scale:1,rot:0},
          rule:{
            hp:9,actions:1,damage:2,attackDice:1,rpgHitChance:65,
            rpgStats:{force:3,agilite:2,intelligence:1,esprit:1,endurance:4},
            xp:4,movement:1
          }
        }
      ]));

      localStorage.setItem('gensrpg_builtin_enemy_overrides_v1',JSON.stringify({
        [survivalBuiltinId]:{
          id:survivalBuiltinId,name:'Walker Boundary Override',defaultCount:31,
          category:'Ennemi',skin:'walker',image_data:'',
          imageCrop:{x:0,y:0,scale:1,rot:0},
          rule:{actions:1,damage:2,xp:1}
        },
        [builtinDungeonId]:{
          id:builtinDungeonId,name:'Skeleton Boundary Override',defaultCount:7,
          category:'Créature',skin:'creature',image_data:dungeonOverrideArt,
          imageCrop:{x:0,y:0,scale:1,rot:0},
          rule:{
            hp:17,actions:1,damage:4,attackDice:1,rpgHitChance:61,
            rpgStats:{force:6,agilite:2,intelligence:1,esprit:1,endurance:8},
            xp:9,movement:1
          }
        }
      }));

      for(let i=ZOMBIE_TYPES.length-1;i>=0;i--){
        if(ZOMBIE_TYPES[i]?.dungeonBuiltin)ZOMBIE_TYPES.splice(i,1);
      }

      const beforeRefreshCalls=dungeonCalls;
      const beforeRefreshArtCalls=dungeonArtApplyCalls;
      refreshCustomEnemiesIntoZombieTypes();
      refreshCustomEnemiesIntoZombieTypes();
      const afterRefreshCalls=dungeonCalls;
      const afterRefreshArtCalls=dungeonArtApplyCalls;

      const survivalBuiltin=ZOMBIE_TYPES.find(z=>String(z.id)===survivalBuiltinId);
      const survivalCustom=ZOMBIE_TYPES.filter(z=>String(z.id)===survivalId);
      const customDungeon=ZOMBIE_TYPES.filter(z=>String(z.id)===customDungeonId);
      const dungeonBuiltinBeforeEnsure=ZOMBIE_TYPES.filter(z=>String(z.id)===builtinDungeonId);

      ensureDungeonEnemies();
      ensureDungeonEnemies();
      const afterEnsureCalls=dungeonCalls;

      const dungeonBuiltin=ZOMBIE_TYPES.filter(z=>String(z.id)===builtinDungeonId);
      const dungeonDef=activeEnemyDefinition(builtinDungeonId);
      const survivalIds=enemiesForMode(false).map(z=>String(z.id));
      const dungeonIds=enemiesForMode(true).map(z=>String(z.id));
      const html=enemyCardHtml({
        id:dungeonDef.id,
        name:dungeonDef.name,
        category:dungeonDef.category||'',
        skin:dungeonDef.skin||'creature',
        image_data:'',
        imageCrop:dungeonDef.imageCrop||{},
        rule:dungeonDef.rule||{}
      });

      window.dungeonEnemies=originalDungeonEnemies;
      window.dungeonApplyGithubArts164=originalDungeonArtApply;

      return {
        applySource:String(window.applyBuiltinEnemyOverrides),
        ensureSource:String(window.ensureDungeonEnemies),
        beforeRefreshCalls,
        afterRefreshCalls,
        beforeRefreshArtCalls,
        afterRefreshArtCalls,
        afterEnsureCalls,
        survivalBuiltinName:survivalBuiltin?.name,
        survivalBuiltinDamage:survivalBuiltin?.rule?.damage,
        survivalCustomCount:survivalCustom.length,
        customDungeonCount:customDungeon.length,
        dungeonBuiltinBeforeEnsure:dungeonBuiltinBeforeEnsure.length,
        dungeonBuiltinCount:dungeonBuiltin.length,
        dungeonBuiltinName:dungeonDef?.name,
        dungeonBuiltinHp:dungeonDef?.rule?.hp,
        dungeonBuiltinDamage:dungeonDef?.rule?.damage,
        dungeonBuiltinArt:dungeonDef?.art,
        survivalContains:survivalIds.includes(survivalId),
        survivalExcludesDungeon:!survivalIds.includes(customDungeonId)&&!survivalIds.includes(builtinDungeonId),
        dungeonContainsCustom:dungeonIds.includes(customDungeonId),
        dungeonContainsBuiltin:dungeonIds.includes(builtinDungeonId),
        html,
        dungeonOverrideArt
      };
    });

    assert.doesNotMatch(result.applySource,/dungeonEnemies/,
      'shared builtin override transform must execute without a private Dungeon factory dependency');
    assert.doesNotMatch(result.applySource,/dungeonApplyGithubArts164/,
      'shared builtin override transform must no longer be wrapped by the Dungeon V164 art authority');
    assert.match(result.applySource,/function applyBuiltinEnemyOverrides\(bases=BASE_ZOMBIE_TYPES\)/,
      'native shared builtin override owner must be restored as the callable owner');
    assert.match(result.ensureSource,/dungeonEnemies\(\)/,
      'Dungeon ensure owner must retain the private Dungeon factory call');
    assert.match(result.ensureSource,/applyBuiltinEnemyOverrides\(bases\)/,
      'Dungeon ensure owner must explicitly apply overrides to its own bases');

    assert.equal(result.afterRefreshCalls,result.beforeRefreshCalls,
      'two shared custom-enemy refreshes must not call dungeonEnemies');
    assert.equal(result.afterRefreshArtCalls,result.beforeRefreshArtCalls,
      'two shared custom-enemy refreshes must not call the Dungeon V164 art apply owner');
    assert.ok(result.afterEnsureCalls>=result.afterRefreshCalls+2,
      'Dungeon ensure must be the path that calls the Dungeon builtin factory');

    assert.equal(result.survivalBuiltinName,'Walker Boundary Override',
      'Survival builtin overrides must still apply through the shared default base list');
    assert.equal(result.survivalBuiltinDamage,2);
    assert.equal(result.survivalCustomCount,1,
      'repeated refresh must publish the Survival custom enemy exactly once');
    assert.equal(result.customDungeonCount,1,
      'repeated refresh must preserve the custom Dungeon enemy exactly once');

    assert.equal(result.dungeonBuiltinBeforeEnsure,0,
      'shared Survival refresh must not republish Dungeon builtins');
    assert.equal(result.dungeonBuiltinCount,1,
      'repeated Dungeon ensure must publish the Dungeon builtin exactly once');
    assert.equal(result.dungeonBuiltinName,'Skeleton Boundary Override',
      'Dungeon builtin name override must survive the boundary split');
    assert.equal(result.dungeonBuiltinHp,17,
      'Dungeon builtin RPG override must survive the boundary split');
    assert.equal(result.dungeonBuiltinDamage,4);
    assert.equal(result.dungeonBuiltinArt,result.dungeonOverrideArt,
      'Dungeon art override must survive the boundary split');

    assert.equal(result.survivalContains,true);
    assert.equal(result.survivalExcludesDungeon,true);
    assert.equal(result.dungeonContainsCustom,true);
    assert.equal(result.dungeonContainsBuiltin,true);
    assert.ok(result.html.includes(result.dungeonOverrideArt),
      'Dungeon card rendering must retain the explicit art override');

    console.log(JSON.stringify({
      scenario:'Phase 6 builtin override boundary without Survival -> dungeonEnemies dependency',
      survivalRefreshCallsDungeonFactory:false,
      survivalRefreshCallsDungeonArtOwner:false,
      survivalBuiltinOverridePreserved:true,
      dungeonEnsureOwnsDungeonFactory:true,
      dungeonBuiltinOverridePreserved:true,
      dungeonArtOverridePreserved:true,
      customEnemiesPreserved:true
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
