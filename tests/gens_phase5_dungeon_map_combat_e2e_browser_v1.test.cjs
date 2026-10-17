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
    typeof window.GensTacticalV1?.activate==='function'
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
      x.last.map.cells[5]='wall';
      x.positions=x.positions&&typeof x.positions==='object'?x.positions:{};
      x.heroRooms=x.heroRooms&&typeof x.heroRooms==='object'?x.heroRooms:{};
      x.remaining=x.remaining&&typeof x.remaining==='object'?x.remaining:{};
      x.enemyCells={phase5_e2e_enemy:12};
      x.positions[hero]=11;
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

    // The real Dungeon 0.79 cover painter is scheduled on a frame after a board
    // reconstruction. Wait for its own DOM contract, not a guessed delay or
    // artificial call to applyDungeonMapPolish079().
    await page.waitForFunction(()=>{
      const cells=document.querySelectorAll('#dc047RoomBoard .dc047Grid > .dc047Cell');
      const wall=cells[5],theme=String(document.querySelector('#dc047RoomBoard .dc047Grid')?.dataset.floorTheme||'stone');
      // The native 0.80 renderer initially paints the base floor (stone).
      // For a stone wall the 0.79 cover owner must finish with cave/water,
      // not merely set a class while a stale stone image is still visible.
      const permitted={stone:['cave','water'],cave:['cave','water'],forest:['forest','water'],water:['cave','water'],ice:['ice','water'],lava:['cave','lava']};
      const visual=String(wall?getComputedStyle(wall).backgroundImage:'');
      return cells.length===25&&wall?.classList.contains('dc079TerrainCover')&&
        wall?.dataset.coverTheme===theme&&(permitted[theme]||permitted.stone).some(t=>visual.includes('/dng_floor_'+t+'_'));
    },null,{timeout:10000});

    const nativeAtEngagement=await page.evaluate(()=>[...document.querySelectorAll('#dc047RoomBoard .dc047Grid > .dc047Cell')].map(el=>getComputedStyle(el).backgroundImage));

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
      dungeonCore:getComputedStyle(document.getElementById('gensDungeonCore01')).display,
      sceneSnapshot:(()=>{const source=[...document.querySelectorAll('#dc047RoomBoard .dc047Grid > .dc047Cell')],arena=[...document.querySelectorAll('.gtv2Overlay .gtv2Cell')];return {native:source.map(el=>getComputedStyle(el).backgroundImage),tactical:arena.map(el=>getComputedStyle(el).backgroundImage),room:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'{}').room,wallTiles:source[5]?.querySelectorAll(':scope > .gtv2WallTile').length||0,wall5:source[5]?.className||''}})()
    }));

    assert.equal(opened.overlayVisible,true,'real Dungeon map action must open the visible Tactical V2 overlay');
    assert.ok(opened.cells>0,'Tactical V2 must render battlefield cells');
    assert.ok(opened.battle.actors.some(a=>a.side==='hero'),'Tactical battle must contain a real hero participant');
    assert.ok(opened.battle.actors.some(a=>a.side==='enemy'&&a.instanceId==='phase5_e2e_enemy'),'Tactical battle must contain the selected map enemy');
    const hero=opened.battle.actors.find(a=>a.side==='hero');
    const monster=opened.battle.actors.find(a=>a.instanceId==='phase5_e2e_enemy');
    assert.equal(opened.battle.width,5,'same Dungeon room width');
    assert.equal(opened.battle.height,5,'same Dungeon room height');
    assert.ok(hero&&monster,'actors must preserve the original Dungeon identities');
    assert.equal(opened.sceneSnapshot.room,1,'original Dungeon room identity');
    assert.equal(opened.sceneSnapshot.native.length,25,'real Dungeon source cells exist');
    assert.equal(opened.sceneSnapshot.tactical.length,25,'same tactical grid');
    if(!/dng_floor_.*\.png/.test(opened.sceneSnapshot.native[5])){
      const sourceTrace=await page.evaluate(()=>{
        const cell=document.querySelectorAll('#dc047RoomBoard .dc047Grid > .dc047Cell')[5],
          rules=[],match=(r)=>{try{return cell.matches(r.selectorText)}catch(e){return false}};
        for(const sheet of [...document.styleSheets]){let rows=[];try{rows=[...sheet.cssRules]}catch(e){continue}
          for(const r of rows)if(r.selectorText&&match(r)&&(r.style?.backgroundImage||r.style?.background||r.style?.getPropertyValue?.('background-image'))){
            rules.push({selector:r.selectorText,background:r.style.backgroundImage||r.style.background,important:r.style.getPropertyPriority('background-image'),href:sheet.href||'',owner:sheet.ownerNode?.id||''});
          }
        }
        return {class:cell.className,inline:cell.getAttribute('style'),computed:getComputedStyle(cell).backgroundImage,body:document.body?.className||'',has079:typeof window.applyDungeonMapPolish079,has877:typeof window.DungeonSourceRenderStability167877?.install,renderers:[window.DungeonCore01?.render?.__dsr167877,window.DungeonCore01?.render?.__gtv271WallRender],rules:rules.slice(-18)};
      });
      console.log('[Dungeon-native-wall-trace] '+JSON.stringify(sourceTrace));
    }
    assert.match(opened.sceneSnapshot.native[5],/dng_floor_.*\.png/,'native wall cover keeps existing 0.79 theme, not old wall PNG');
    assert.equal(opened.sceneSnapshot.wallTiles,0,'Tactical must not inject a competing wall overlay into Dungeon');
    if(JSON.stringify(opened.sceneSnapshot.tactical)!==JSON.stringify(opened.sceneSnapshot.native)){
      const debugScene=await page.evaluate(()=>{
        const scene=[...document.querySelectorAll('#dc047RoomBoard .dc047Grid > .dc047Cell')],arena=[...document.querySelectorAll('.gtv2Overlay .gtv2Cell')],battle=window.GensRpgTacticalCombatV2Ui.getBattle();
        return {room:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'{}').room,
          metadata:battle.grid.sourceMap?.tileBackgrounds||[],cells:scene.map((el,i)=>({
            index:i,className:el.className,inline:el.style.backgroundImage,inlinePriority:el.style.getPropertyPriority('background-image'),
            computed:getComputedStyle(el).backgroundImage,tacticalComputed:getComputedStyle(arena[i]).backgroundImage,
            tacticalInline:arena[i]?.getAttribute('style')||'',sourceMeta:battle.grid.sourceMap?.tileBackgrounds?.[i]||''
          })).filter(x=>x.computed!==x.tacticalComputed)};
      });
      console.log('[dungeon-scene-art-diff] '+JSON.stringify({nativeAtEngagement,debugScene}));
    }
    assert.deepEqual(opened.sceneSnapshot.tactical,opened.sceneSnapshot.native,'Tactical must borrow the exact visible background art of every original Dungeon cell');
    const coord=await page.evaluate(()=>{const b=window.GensRpgTacticalCombatV2Ui.getBattle();return b.actors.map(a=>({id:a.id,side:a.side,x:a.x,y:a.y,art:a.meta?.art||'',instanceId:a.meta?.instanceId||''}))});
    assert.deepEqual(coord.find(a=>a.side==='hero')&&[coord.find(a=>a.side==='hero').x,coord.find(a=>a.side==='hero').y],[1,2],'hero retains actual Dungeon cell 11');
    assert.deepEqual(coord.find(a=>a.side==='enemy')&&[coord.find(a=>a.side==='enemy').x,coord.find(a=>a.side==='enemy').y],[2,2],'monster retains actual Dungeon cell 12');
    assert.ok(coord.find(a=>a.side==='enemy').art,'monster must borrow its existing Dungeon sprite');
    assert.equal(opened.activeProfile,DUNGEON_ID,'combat launch must keep Dungeon profile authority');
    assert.notEqual(opened.dungeonCore,'none','Dungeon world remains the owning background while Tactical is active');
    // In the same REAL session, exercise V108's on-screen weapon selector
    // against the actual persisted hero inventory. Fixture edits only DATA.
    const inventorySeed=await page.evaluate(()=>{
      const hero=window.GensRpgTacticalCombatV2Ui.getBattle().actors.find(a=>a.side==='hero');
      const heroId=String(hero.meta?.heroId||hero.id);
      const st=loadState(heroId);if(!st||!Array.isArray(st.inventory))throw Error('Hero inventory unavailable');
      const oldHand=st.rightHand;
      st.inventory.push({itemId:'dng_bow',ammo:2});
      const bowIndex=st.inventory.length-1;
      st.inventory.push({itemId:'dng_heal_potion',qty:2});
      st.wounds=Math.max(4,Number(st.wounds)||0);
      localStorage.setItem(key(heroId),JSON.stringify(st));
      window.GensRpgTacticalCombatV2Ui.render();
      return {heroId,oldHand,bowIndex,wounds:st.wounds};
    });
    const panel=page.locator('.gtv2Overlay [data-v108-panel]');
    await panel.waitFor({state:'visible'});
    await panel.locator('[data-v108-weapon]').selectOption(String(inventorySeed.bowIndex));
    await panel.locator('[data-v108-equip]').click();
    const equipped=await page.evaluate(id=>{
      const st=loadState(id);return {rightHand:st.rightHand,items:st.inventory.map(e=>e.itemId)};
    },inventorySeed.heroId);
    console.log('[dungeon-real-tactical-inventory-equip] '+JSON.stringify({inventorySeed,equipped}));
    assert.equal(equipped.rightHand,inventorySeed.bowIndex,'weapon choice must persist through existing hero state authority');
    await panel.locator('[data-v108-item]').selectOption('dng_heal_potion');
    await panel.locator('[data-v108-qty]').selectOption('1');
    const attackCountBeforeItem=await page.evaluate(()=>window.GensRpgTacticalCombatV2Ui.getBattle().log.filter(e=>e.type==='attack').length);
    await panel.locator('[data-v108-use]').click();
    const afterItem=await page.evaluate(id=>{
      const st=loadState(id);return {wounds:st.wounds,potions:st.inventory.filter(e=>e.itemId==='dng_heal_potion').reduce((n,e)=>n+Math.max(1,Number(e.qty)||1),0),
        battleActive:window.GensRpgTacticalCombatV2Ui.getBattle()?.status==='active',
        attacks:window.GensRpgTacticalCombatV2Ui.getBattle()?.log.filter(e=>e.type==='attack').length,
        panel:!!document.querySelector('.gtv2Overlay [data-v108-panel]')};
    },inventorySeed.heroId);
    console.log('[dungeon-real-tactical-consumable] '+JSON.stringify({inventorySeed,afterItem}));
    assert.ok(afterItem.wounds<inventorySeed.wounds,'a real healing item must actually heal');
    assert.equal(afterItem.potions,1,'use of one potion must consume precisely one charge');
    assert.equal(afterItem.attacks,attackCountBeforeItem,'using an item must not auto-trigger attacks');
    assert.equal(afterItem.battleActive,true,'Tactical encounter must remain active after non-attack item');
    assert.equal(afterItem.panel,true,'item use must keep the visible hero action panel');

    // Return through the real UI owner, rebuild the Dungeon board, and
    // assert that the existing terrain owner restores exactly the same art.
    await page.evaluate(()=>{window.GensRpgTacticalCombatV2Ui.close(false);DungeonCore01.render()});
    // The real Dungeon 0.79 cover painter is scheduled on a frame after a board
    // reconstruction. Wait for its own DOM contract, not a guessed delay or
    // artificial call to applyDungeonMapPolish079().
    await page.waitForFunction(()=>{
      const cells=document.querySelectorAll('#dc047RoomBoard .dc047Grid > .dc047Cell');
      const wall=cells[5],theme=String(document.querySelector('#dc047RoomBoard .dc047Grid')?.dataset.floorTheme||'stone');
      // The native 0.80 renderer initially paints the base floor (stone).
      // For a stone wall the 0.79 cover owner must finish with cave/water,
      // not merely set a class while a stale stone image is still visible.
      const permitted={stone:['cave','water'],cave:['cave','water'],forest:['forest','water'],water:['cave','water'],ice:['ice','water'],lava:['cave','lava']};
      const visual=String(wall?getComputedStyle(wall).backgroundImage:'');
      return cells.length===25&&wall?.classList.contains('dc079TerrainCover')&&
        wall?.dataset.coverTheme===theme&&(permitted[theme]||permitted.stone).some(t=>visual.includes('/dng_floor_'+t+'_'));
    },null,{timeout:10000});

    const returned=await page.evaluate(()=>({
      room:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'{}').room,
      backgrounds:[...document.querySelectorAll('#dc047RoomBoard .dc047Grid > .dc047Cell')].map(el=>getComputedStyle(el).backgroundImage),
      wallTiles:document.querySelectorAll('#dc047RoomBoard .dc047Grid > .dc047Cell > .gtv2WallTile').length,
      overlay:document.querySelectorAll('.gtv2Overlay').length
    }));
    assert.equal(returned.room,opened.sceneSnapshot.room,'combat exit must preserve current room');
    if(JSON.stringify(returned.backgrounds)!==JSON.stringify(opened.sceneSnapshot.native)){
      const mismatches=await page.evaluate(expected=>[...document.querySelectorAll('#dc047RoomBoard .dc047Grid > .dc047Cell')]
        .map((el,i)=>({index:i,before:expected[i],after:getComputedStyle(el).backgroundImage,cls:el.className,
          inline:el.style.backgroundImage,coverTheme:el.dataset.coverTheme,terrain:el.dataset.terrain||''}))
        .filter(x=>x.before!==x.after),opened.sceneSnapshot.native);
      console.log('[dungeon-return-terrain-mismatch] '+JSON.stringify({mismatches,sourceBefore:opened.sceneSnapshot.native,sourceAfter:returned.backgrounds}));
    }
    assert.deepEqual(returned.backgrounds,opened.sceneSnapshot.native,'re-render after combat must preserve every Dungeon tile');
    assert.equal(returned.wallTiles,0,'no competing Tactical wall overlay may remain after combat');
    assert.equal(returned.overlay,0,'Tactical modal closed without leaving overlay');
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
