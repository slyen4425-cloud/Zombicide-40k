const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const SURVIVAL_ID='game_profile_zombicide_base';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp','.gif':'image/gif','.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const rel=pathname==='/'?'/preview.html':pathname;
  const file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end('not found');return}
    res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
    res.end(data);
  });
});

async function prepare(page,port){
  await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
  await page.waitForFunction(()=>typeof openGensFamily==='function'&&typeof openGensBuiltInGame==='function'&&typeof startConfiguredGame==='function',null,{timeout:30000});
}

async function openSurvival(page){
  const rootCard=page.locator('button.gensRootModeCard.survival');
  await rootCard.waitFor({state:'visible'});await rootCard.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
  const exact=page.locator('#gensFamilyGames button.gensFamilyGameCard[onclick*="'+SURVIVAL_ID+'"]');
  const card=await exact.count()?exact.first():page.locator('#gensFamilyGames button.gensFamilyGameCard:not(.disabled)').first();
  await card.waitFor({state:'visible'});await card.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensGameHome')).display!=='none');
}

async function startSurvival(page){
  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameHeroStep')).display!=='none');
  await page.locator('#pregameHeroStep .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');
  const first=page.locator('#participantList input[type="checkbox"]').first();
  await first.waitFor({state:'visible'});if(!(await first.isChecked()))await first.check();
  await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();
  await page.waitForFunction(()=>localStorage.getItem('z40k_session_active_v1')==='1',null,{timeout:15000});
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('menu')).display!=='none',null,{timeout:15000});
}

(async()=>{
  let stage='boot';
  const watchdog=setTimeout(()=>{console.error('[phase6-exit-browser] WATCHDOG '+stage);process.exit(1)},150000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR',serviceWorkers:'block'});
  await context.addInitScript(()=>{try{localStorage.clear();sessionStorage.clear()}catch(e){}window.supabase={createClient:()=>({})}});
  const page=await context.newPage();page.setDefaultTimeout(25000);
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror:'+String(e)));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED|NS_BINDING_ABORTED/.test(m.text()))errors.push('console:'+m.text())});
  page.on('dialog',async d=>{try{await d.dismiss()}catch(e){}});
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());

  try{
    stage='prepare';await prepare(page,port);
    stage='open-survival';await openSurvival(page);
    stage='start-survival';await startSurvival(page);

    const inactive=await page.evaluate(()=>{
      const visible=el=>{if(!el)return false;const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&Number(s.opacity||1)!==0&&r.width>0&&r.height>0};
      let uiBattle=null,bridgeBattle=null,bridgeStatus=null;
      try{uiBattle=window.GensRpgTacticalCombatV2Ui?.getBattle?.()||null}catch(e){}
      try{bridgeBattle=window.GensRpgTacticalCombatV2Bridge?.currentBattle?.(window)||null}catch(e){}
      try{bridgeStatus=window.GensRpgTacticalCombatV2Bridge?.status?.(window)||null}catch(e){}
      const tacticalOverlay=document.querySelector('.gtv2Overlay');
      const tacticalDocks=[...document.querySelectorAll('.gtv2111Dock,[data-v111-dock],[data-gens-tactical-dock]')];
      const dungeonOverlay=document.getElementById('dc01Overlay');
      const dungeonCombat=document.getElementById('dungeonCombatModal');
      return {
        family:typeof gensSelectedFamily==='undefined'?'':String(gensSelectedFamily||''),
        dungeonMode:typeof isDungeonMode==='function'?!!isDungeonMode():null,
        dungeonOverlayVisible:visible(dungeonOverlay),
        dungeonCombatVisible:visible(dungeonCombat),
        tacticalOverlayVisible:visible(tacticalOverlay),
        tacticalDockVisible:tacticalDocks.some(visible),
        tacticalUiBattle:!!uiBattle,
        tacticalBridgeBattle:!!bridgeBattle,
        tacticalBridgeStatus:bridgeStatus
      };
    });
    assert.equal(inactive.family,'survival','Phase 6 exit characterization must run in Survival');
    assert.equal(inactive.dungeonMode,false,'Dungeon mode must stay inactive in Survival');
    assert.equal(inactive.dungeonOverlayVisible,false,'Dungeon overlay must remain inactive in Survival');
    assert.equal(inactive.dungeonCombatVisible,false,'Dungeon combat host must remain inactive in Survival');
    assert.equal(inactive.tacticalOverlayVisible,false,'Tactical overlay must remain inactive in Survival');
    assert.equal(inactive.tacticalDockVisible,false,'Tactical dock must remain inactive in Survival');
    assert.equal(inactive.tacticalUiBattle,false,'Survival must not create a Tactical UI battle');
    assert.equal(inactive.tacticalBridgeBattle,false,'Survival must not create a Tactical bridge battle');

    stage='instrument-residual-dungeon-owners';
    const installed=await page.evaluate(()=>{
      const names=['openZombieRule','enemyCardHtml','renderActiveEnemies','activeEnemyDefinition'];
      window.__phase6ExitCalls={};
      window.__phase6ExitSources={};
      const result={};
      for(const name of names){
        const original=window[name];
        window.__phase6ExitCalls[name]=0;
        result[name]=typeof original;
        if(typeof original!=='function')continue;
        window.__phase6ExitSources[name]=String(original).slice(0,1600);
        window[name]=function(...args){
          window.__phase6ExitCalls[name]=(window.__phase6ExitCalls[name]||0)+1;
          return original.apply(this,args);
        };
      }
      return result;
    });

    stage='open-survival-enemy-manager';
    await page.locator("#menu button[onclick=\"openZombieManager('menu')\"]").click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('zombieManager')).display!=='none');
    await page.waitForFunction(()=>document.querySelectorAll('#zombieReserve img.zombieThumb').length>0);
    await page.waitForTimeout(100);

    const trigger=page.locator('#zombieManager [onclick*="openZombieRule"]').filter({visible:true}).first();
    const triggerCount=await page.locator('#zombieManager [onclick*="openZombieRule"]').count();
    if(triggerCount>0){
      const visibleTrigger=page.locator('#zombieManager [onclick*="openZombieRule"]').first();
      try{await visibleTrigger.click({timeout:3000})}catch(e){await page.evaluate(()=>{const el=document.querySelector('#zombieManager [onclick*="openZombieRule"]');el?.click?.()})}
      await page.waitForTimeout(100);
    }

    const residual=await page.evaluate(()=>({
      calls:{...(window.__phase6ExitCalls||{})},
      sources:{...(window.__phase6ExitSources||{})},
      triggerCount:document.querySelectorAll('#zombieManager [onclick*="openZombieRule"]').length,
      visibleRuleTriggers:[...document.querySelectorAll('#zombieManager [onclick*="openZombieRule"]')].filter(el=>{
        const s=getComputedStyle(el),r=el.getBoundingClientRect();return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0
      }).length,
      enemyThumbs:document.querySelectorAll('#zombieReserve img.zombieThumb').length
    }));

    assert.ok(residual.enemyThumbs>0,'Survival enemy manager must render its reserve during exit characterization');
    assert.deepEqual(errors,[],'Phase 6 exit characterization must not raise browser/runtime errors');

    console.log(JSON.stringify({
      scenario:'Phase 6 exit Survival runtime characterization',
      inactive,
      instrumentedTypes:installed,
      residualDungeonOwnerUse:residual
    },null,2));
  }finally{
    clearTimeout(watchdog);
    server.closeAllConnections?.();server.closeIdleConnections?.();server.close();
    await context.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
