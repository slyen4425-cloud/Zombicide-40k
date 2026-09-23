const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const DUNGEON_ID='game_profile_dungeon_demo';
const mime={
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json',
  '.webmanifest':'application/manifest+json','.png':'image/png',
  '.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp',
  '.mp3':'audio/mpeg','.wav':'audio/wav','.ogg':'audio/ogg'
};

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

async function waitPreview(page){
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
  await page.waitForFunction(()=>
    typeof window.openGensFamily==='function' &&
    typeof window.openGensBuiltInGame==='function' &&
    typeof window.startConfiguredGame==='function' &&
    typeof window.gensProfileContentFamily155==='function' &&
    typeof window.DungeonCore01?.render==='function' &&
    typeof window.GensRpgTacticalCombatV2Bridge?.requestCombat==='function' &&
    typeof window.GensRpgTacticalCombatV2Ui?.getBattle==='function'
  ,null,{timeout:60000});
}

async function openDungeonHome(page){
  const adventure=page.locator('button.gensRootModeCard.adventure');
  await adventure.waitFor({state:'visible'});
  await adventure.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');

  let card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');
  await card.waitFor({state:'visible'});
  const sw=await page.evaluate(id=>({
    active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
    from:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(activeGameProfileId()):'',
    to:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(id):''
  }),DUNGEON_ID);

  if(sw.active&&sw.active!==DUNGEON_ID&&sw.from!==sw.to){
    await Promise.all([
      page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000}),
      card.click()
    ]);
    await waitPreview(page);
    const adventure2=page.locator('button.gensRootModeCard.adventure');
    await adventure2.waitFor({state:'visible'});
    await adventure2.click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
    card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');
    await card.waitFor({state:'visible'});
  }
  await card.click();
  await page.waitForFunction(id=>
    typeof activeGameProfileId==='function'&&activeGameProfileId()===id&&
    getComputedStyle(document.getElementById('gensGameHome')).display!=='none'
  ,DUNGEON_ID,{timeout:30000});
}

async function startDungeon(page){
  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');

  await page.locator('#pregameSetup .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');

  const first=page.locator('#participantList input[type="checkbox"]').first();
  await first.waitFor({state:'visible'});
  if(!(await first.isChecked()))await first.check();

  await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');

  await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();
  await page.waitForFunction(()=>{
    let rt=null;try{rt=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')}catch(e){}
    const core=document.getElementById('gensDungeonCore01');
    return localStorage.getItem('z40k_session_active_v1')==='1' &&
      Array.isArray(rt?.participants)&&rt.participants.length>0 &&
      core&&getComputedStyle(core).display!=='none';
  },null,{timeout:15000});
}

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[phase5-dungeon-map-combat-e2e] WATCHDOG');process.exit(1)},150000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({
    viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,
    locale:'fr-FR',serviceWorkers:'block'
  });
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  const page=await context.newPage();
  page.setDefaultTimeout(25000);
  page.setDefaultNavigationTimeout(30000);
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror:'+String(e)));
  page.on('console',m=>{
    if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED|NS_BINDING_ABORTED/.test(m.text()))errors.push('console:'+m.text());
  });
  page.on('dialog',async d=>{try{await d.accept()}catch(e){}});
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());

  try{
    await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
    await waitPreview(page);
    await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await waitPreview(page);

    await openDungeonHome(page);
    await startDungeon(page);

    const setup=await page.evaluate(()=>{
      const RT='gensrpg_dungeon_runtime_v2';
      const x=JSON.parse(localStorage.getItem(RT)||'null');
      if(!x||!Array.isArray(x.participants)||!x.participants.length)throw new Error('Dungeon runtime absent');
      const hero=String(x.participants[0]);
      x.index=0;
      x.room=1;
      x.round=Math.max(1,Number(x.round)||1);
      x.branch=null;
      x.last={kind:'enemy',room:1,at:Date.now(),title:'Salle test combat Phase 5',
        map:{size:5,cells:Array(25).fill('floor')},narrative:'',exitLocked:false,keyEnemyId:''};
      x.last.map.cells[24]='exit';
      x.positions=x.positions&&typeof x.positions==='object'?x.positions:{};
      x.heroRooms=x.heroRooms&&typeof x.heroRooms==='object'?x.heroRooms:{};
      x.remaining=x.remaining&&typeof x.remaining==='object'?x.remaining:{};
      x.enemyCells={phase5_e2e_enemy:12};
      x.positions[hero]=12;
      x.heroRooms[hero]=1;
      x.remaining[hero]=3;
      localStorage.setItem(RT,JSON.stringify(x));

      const def=typeof activeEnemyDefinition==='function'
        ? (activeEnemyDefinition('dng_skeleton')||activeEnemyDefinition('dng_ghoul'))
        : null;
      const enemyId=String(def?.id||'dng_skeleton');
      const hp=Math.max(1,Number(def?.hp||def?.maxHp)||6);
      saveActiveEnemies([{
        id:'phase5_e2e_enemy',enemyId,hp,maxHp:hp,
        dungeonRoom:1,dungeonCell200:12,defeated:false
      }]);
      DungeonCore01.render();
      return {hero,enemyId};
    });

    const action=page.locator('#dc01Explore');
    await action.waitFor({state:'visible'});
    await page.waitForFunction(()=>/ATTAQUER|ENGAGER LE COMBAT/i.test(document.getElementById('dc01Explore')?.textContent||''),null,{timeout:10000});

    const before=await page.evaluate(()=>({
      text:document.getElementById('dc01Explore')?.textContent||'',
      battle:window.GensRpgTacticalCombatV2Ui?.getBattle?.()||null,
      overlay:!!document.querySelector('.gtv2Overlay[data-gens-tactical-v2="1"]')
    }));
    assert.equal(before.battle,null,'Tactical battle must not exist before the real Dungeon action');
    assert.equal(before.overlay,false,'Tactical overlay must not exist before combat');

    await action.click();

    await page.waitForFunction(()=>{
      const overlay=document.querySelector('.gtv2Overlay[data-gens-tactical-v2="1"]');
      const battle=window.GensRpgTacticalCombatV2Ui?.getBattle?.();
      return !!overlay && !!battle && Array.isArray(battle.actors) && battle.actors.length>=2;
    },null,{timeout:15000});

    const opened=await page.evaluate(()=>({
      overlayVisible:(()=>{
        const e=document.querySelector('.gtv2Overlay[data-gens-tactical-v2="1"]');
        if(!e)return false;const s=getComputedStyle(e),r=e.getBoundingClientRect();
        return s.display!=='none'&&s.visibility!=='hidden'&&r.width>0&&r.height>0;
      })(),
      cells:document.querySelectorAll('.gtv2Overlay .gtv2Cell').length,
      battle:(()=>{
        const b=window.GensRpgTacticalCombatV2Ui?.getBattle?.();
        return {
          actors:(b?.actors||[]).map(a=>({id:a.id,side:a.side,heroId:a.meta?.heroId||'',instanceId:a.meta?.instanceId||''})),
          width:b?.grid?.width||0,height:b?.grid?.height||0
        };
      })(),
      activeProfile:typeof activeGameProfileId==='function'?activeGameProfileId():'',
      dungeonCore:getComputedStyle(document.getElementById('gensDungeonCore01')).display
    }));

    assert.equal(opened.overlayVisible,true,'real Dungeon map action must open the visible Tactical V2 overlay');
    assert.ok(opened.cells>0,'Tactical V2 must render battlefield cells');
    assert.ok(opened.battle.actors.some(a=>a.side==='hero'),'Tactical battle must contain a real hero participant');
    assert.ok(opened.battle.actors.some(a=>a.side==='enemy'&&a.instanceId==='phase5_e2e_enemy'),'Tactical battle must contain the selected map enemy');
    assert.equal(opened.activeProfile,DUNGEON_ID,'combat launch must keep Dungeon profile authority');
    assert.notEqual(opened.dungeonCore,'none','Dungeon world remains the owning background while Tactical is active');
    assert.deepEqual(errors,[],'Dungeon map -> Tactical path must not raise browser/runtime errors');

    console.log(JSON.stringify({
      scenario:'Phase 5 Dungeon real map action -> Tactical V2',
      setup,action:before.text,cells:opened.cells,actors:opened.battle.actors
    }));
  }finally{
    clearTimeout(watchdog);
    server.closeAllConnections?.();server.closeIdleConnections?.();server.close();
    await context.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
