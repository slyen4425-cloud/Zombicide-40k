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
  '.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'
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

async function prepare(page,port){
  await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
  await page.waitForFunction(()=>
    typeof window.openGensFamily==='function' &&
    typeof window.DungeonRoomCreator100?.upsertRoom==='function' &&
    typeof window.DungeonWorldBuilder167821?.createDungeon==='function' &&
    typeof window.DungeonZoneContent167824?.saveZoneContent==='function' &&
    typeof window.DungeonWorldSessionBridge167832?.selectWorld==='function' &&
    typeof window.DungeonAuthoredBootstrap167849?.install==='function' &&
    typeof window.DungeonExactTrapRuntime167845?.sync==='function' &&
    typeof window.DungeonZoneLinks167846?.travelCache==='function' &&
    typeof window.DungeonSourceRenderStability167877?.paintTokensNow==='function'
  ,null,{timeout:60000});
}

async function openDungeonHome(page){
  const adventure=page.locator('button.gensRootModeCard.adventure');
  await adventure.waitFor({state:'visible'});await adventure.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
  let card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');
  await card.waitFor({state:'visible'});
  const sw=await page.evaluate(id=>({
    active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
    from:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(activeGameProfileId()):'',
    to:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(id):''
  }),DUNGEON_ID);
  if(sw.active&&sw.active!==DUNGEON_ID&&sw.from!==sw.to){
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000}),card.click()]);
    await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
    await page.waitForFunction(()=>typeof window.openGensFamily==='function',null,{timeout:60000});
    const again=page.locator('button.gensRootModeCard.adventure');await again.waitFor({state:'visible'});await again.click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
    card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');
    await card.waitFor({state:'visible'});await card.click();
  }else await card.click();
  await page.waitForFunction(id=>typeof activeGameProfileId==='function'&&activeGameProfileId()===id&&getComputedStyle(document.getElementById('gensGameHome')).display!=='none',DUNGEON_ID,{timeout:30000});
}

async function chooseParticipantAndStart(page){
  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameSetup .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');
  const first=page.locator('#participantList input[type="checkbox"]').first();
  await first.waitFor({state:'visible'});if(!(await first.isChecked()))await first.check();
  await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();
  await page.waitForFunction(()=>!!localStorage.getItem('gensrpg_dungeon_runtime_v2'),null,{timeout:15000});
}

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[authored-cache-trap-browser] WATCHDOG');process.exit(1)},150000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({
    viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,
    locale:'fr-FR',serviceWorkers:'block'
  });
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  const page=await context.newPage();
  page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(30000);
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror:'+String(e)));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED|NS_BINDING_ABORTED/.test(m.text()))errors.push('console:'+m.text())});
  page.on('dialog',async d=>{try{await d.accept()}catch(e){}});
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());

  try{
    await prepare(page,port);
    await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await prepare(page,port);
    await openDungeonHome(page);

    const fixture=await page.evaluate(()=>{
      const R=window.DungeonRoomCreator100,B=window.DungeonWorldBuilder167821,Z=window.DungeonZoneContent167824;
      const parent=R.createRoom({id:'reg_parent_room',name:'Régression — salle parente',width:5,height:3,theme:'stone'});
      parent.cells=parent.cells.map(c=>({...c,terrain:'floor',object:null}));
      parent.cells[12].object='entry';parent.cells[2].object='exit';parent.cells[7].object='cache';parent.cells[8].object='trap';
      R.upsertRoom(parent);

      const branch=R.createRoom({id:'reg_branch_room',name:'Régression — cache',width:5,height:3,theme:'cave'});
      branch.cells=branch.cells.map(c=>({...c,terrain:'floor',object:null}));
      branch.cells[12].object='entry';branch.cells[2].object='exit';
      R.upsertRoom(branch);

      const world=B.createDungeon({name:'Régression cache/piège authored'});
      const added=B.addRoomInstance(world.id,parent.id,'Salle parente');
      let graph=B.findDungeon(world.id);
      graph.cacheBindings=[{id:'reg_cache_binding',sourceNodeId:added.node.id,sourceIndex:7,targetNodeId:'',targetRoomId:branch.id,kind:'secondary',returnMode:'source'}];
      graph=B.upsertDungeon(graph);
      Z.saveZoneContent(world.id,added.node.id,{mode:'fixed',enemies:[],chests:[],traps:[{id:'reg_exact_trap',cell:8,trapType:'reference',damage:0,refId:'dtrap_rune',label:'Rune de régression',once:true}],puzzles:[],npcs:[],items:[]});
      const selected=window.DungeonWorldSessionBridge167832.selectWorld(world.id,false);
      return {worldId:world.id,nodeId:added.node.id,parentRoomId:parent.id,branchRoomId:branch.id,selected,valid:B.validation(B.findDungeon(world.id))};
    });
    assert.equal(fixture.selected,true,'built world must be selected through the real session boundary');
    assert.equal(fixture.valid.valid,true,'fixture world must be structurally valid');

    await chooseParticipantAndStart(page);
    await page.waitForFunction(()=>typeof window.DungeonAuthoredRuntime167839?.active==='function'&&window.DungeonAuthoredRuntime167839.active(),null,{timeout:15000});

    const entry=page.locator('#dc01Explore');
    await entry.waitFor({state:'visible'});await entry.click();
    await page.waitForFunction(nodeId=>{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      return x?.last?.worldNodeId===nodeId&&Number(x?.room)>0;
    },fixture.nodeId,{timeout:15000});
    await page.waitForTimeout(300);

    let state=await page.evaluate(()=>{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      const scenes=typeof loadDungeonSceneElements==='function'?loadDungeonSceneElements():[];
      const room=Number(x?.room)||0;
      return {
        room,node:x?.last?.worldNodeId||'',customRoom:x?.last?.customRoomId||'',
        trapCell:x?.last?.map?.cells?.[8],
        exact:scenes.filter(e=>e?.kind==='trap'&&Number(e?.room||0)===room&&e?.exactTrap167845===true).map(e=>({id:e.exactTrapId167845,cell:e.cellIndex,detected:e.detected,trapId:e.trapId})),
        foreign:scenes.filter(e=>e?.kind==='trap'&&Number(e?.room||0)===room&&e?.exactTrap167845!==true).length,
        exactLoaded:!!window.DungeonExactTrapRuntime167845,
        uiRecoveryOwnsTrap:typeof window.GenSrpGUiRecovery167843?.loadExactTrapRuntime==='function',
        uiRecoveryOwnsLinks:typeof window.GenSrpGUiRecovery167843?.loadZoneLinksRuntime==='function',
        sourceOwner:window.DungeonAuthoredCacheVisual167852?.sourceRenderOwner?.()===true,
        legacyResizeObserver:!!window.__dac167852ResizeObserver,
        legacyTokenObserver:!!window.__dac167852TokenObserver
      };
    });
    assert.equal(state.exactLoaded,true,'exact authored trap owner must be loaded in the real composition');
    assert.equal(state.uiRecoveryOwnsTrap,false,'Shell UI recovery must not own exact traps anymore');
    assert.equal(state.uiRecoveryOwnsLinks,false,'Shell UI recovery must not own authored links anymore');
    assert.equal(state.trapCell,'floor','authored trap must never remain as a raw visible map marker');
    assert.deepEqual(state.exact,[{id:'reg_exact_trap',cell:8,detected:false,trapId:'rune'}],'configured authored trap must exist once and remain hidden until detection');
    assert.equal(state.foreign,0,'authored room must contain no foreign/random trap scene');
    assert.equal(state.sourceOwner,true,'SourceRenderStability must own authored terrain/tokens');

    // Simulate a stale legacy/random trap left by an older runtime, then use the real Core render path.
    await page.evaluate(()=>{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null'),room=Number(x?.room)||0;
      const scenes=loadDungeonSceneElements?.()||[];
      scenes.push({id:'reg_stale_random',kind:'trap',room,cellIndex:6,trapId:'snare',detected:true,dc202:true});
      saveDungeonSceneElements?.(scenes);
      if(x?.last?.map?.cells)x.last.map.cells[6]='trap';
      localStorage.setItem('gensrpg_dungeon_runtime_v2',JSON.stringify(x));
      window.DungeonCore01?.render?.();
    });
    await page.waitForTimeout(120);
    state=await page.evaluate(()=>{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null'),room=Number(x?.room)||0;
      const scenes=loadDungeonSceneElements?.()||[];
      return {cell6:x?.last?.map?.cells?.[6],foreign:scenes.filter(e=>e?.kind==='trap'&&Number(e?.room||0)===room&&e?.exactTrap167845!==true).length,exact:scenes.filter(e=>e?.exactTrap167845).length};
    });
    assert.equal(state.cell6,'floor','real Core render must neutralize a stale random trap marker in authored room');
    assert.equal(state.foreign,0,'real Core render must remove stale/random trap scenes from authored room');
    assert.equal(state.exact,1,'cleanup must preserve the configured exact trap');

    const parentVisualBefore=await page.evaluate(()=>{
      const cells=[...document.querySelectorAll('#dc047RoomBoard .dc047Grid > .dc047Cell')];
      return {
        count:cells.length,
        cells:cells.map(c=>({
          bg:c.style.backgroundImage||getComputedStyle(c).backgroundImage||'',
          wall:c.classList.contains('dav167870WallCell')
        }))
      };
    });
    assert.equal(parentVisualBefore.count,15,'authored parent room must render its exact 5×3 board');
    assert.ok(parentVisualBefore.cells.some(c=>/dng_floor_stone_/i.test(c.bg)),'SourceRenderStability must paint the authored stone-room source before cache travel');

    // Movement itself is covered elsewhere: put the active hero on the authored cache cell, then use the real visible cache action.
    await page.evaluate(()=>{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      const hero=x.participants?.[Number(x.index)||0];x.positions=x.positions||{};x.positions[hero]=7;
      localStorage.setItem('gensrpg_dungeon_runtime_v2',JSON.stringify(x));
      window.DungeonCore01?.render?.();
    });
    await page.waitForFunction(()=>!!document.getElementById('dwr167846Cache'));
    await page.locator('#dwr167846Cache').click();

    await page.waitForFunction(parent=>{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      return x?.last?.customRoomId==='reg_branch_room'&&x?.last?.worldNodeId!==parent;
    },fixture.nodeId,{timeout:10000});
    await page.waitForFunction(()=>!!document.getElementById('dwr167846Return'),null,{timeout:5000});

    const branchState=await page.evaluate(()=>{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null'),hero=x?.participants?.[Number(x?.index)||0];
      return {
        node:x?.last?.worldNodeId||'',roomId:x?.last?.customRoomId||'',pos:x?.positions?.[hero],
        returnText:document.getElementById('dwr167846Return')?.textContent||'',
        cacheButton:!!document.getElementById('dwr167846Cache'),
        exploreHidden:document.getElementById('dc01Explore')?.hidden===true||getComputedStyle(document.getElementById('dc01Explore')).display==='none'
      };
    });
    assert.equal(branchState.roomId,fixture.branchRoomId,'cache action must enter the bound secondary room');
    assert.match(branchState.returnText,/Retour vers Salle parente/i,'dedicated return must be painted immediately on branch entry');
    assert.equal(branchState.cacheButton,false,'branch must not expose the source cache action again');

    await page.locator('#dwr167846Return').click();
    await page.waitForFunction(nodeId=>{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      return x?.last?.worldNodeId===nodeId;
    },fixture.nodeId,{timeout:10000});

    const returned=await page.evaluate(()=>{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null'),hero=x?.participants?.[Number(x?.index)||0];
      const before=(x?.last?.map?.cells||[]).slice();
      window.DungeonCore01?.render?.();window.DungeonCore01?.render?.();window.DungeonCore01?.render?.();
      const y=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      const scenes=loadDungeonSceneElements?.()||[];
      return {
        node:y?.last?.worldNodeId||'',roomId:y?.last?.customRoomId||'',pos:y?.positions?.[hero],
        cellsBefore:before,cellsAfter:(y?.last?.map?.cells||[]).slice(),
        returnButton:!!document.getElementById('dwr167846Return'),
        cacheButton:!!document.getElementById('dwr167846Cache'),
        exact:scenes.filter(e=>e?.exactTrap167845&&Number(e?.room||0)===Number(y?.room||0)).map(e=>({id:e.exactTrapId167845,detected:e.detected,cell:e.cellIndex})),
        foreign:scenes.filter(e=>e?.kind==='trap'&&Number(e?.room||0)===Number(y?.room||0)&&e?.exactTrap167845!==true).length,
        visual:(()=>{
          const cells=[...document.querySelectorAll('#dc047RoomBoard .dc047Grid > .dc047Cell')];
          return {
            count:cells.length,
            cells:cells.map(c=>({
              bg:c.style.backgroundImage||getComputedStyle(c).backgroundImage||'',
              wall:c.classList.contains('dav167870WallCell')
            }))
          };
        })()
      };
    });
    assert.equal(returned.node,fixture.nodeId,'return must restore the exact parent node');
    assert.equal(returned.roomId,fixture.parentRoomId,'return must restore the parent room');
    assert.equal(returned.pos,7,'return must restore the exact source cache cell');
    assert.equal(returned.returnButton,false,'dedicated return must disappear after returning');
    assert.equal(returned.cacheButton,true,'cache action must be available again on the source cell');
    assert.deepEqual(returned.cellsAfter,returned.cellsBefore,'repeated authored renders must not rewrite semantic room cells');
    assert.deepEqual(returned.exact,[{id:'reg_exact_trap',detected:false,cell:8}],'exact trap must stay stable across return and repeated renders');
    assert.equal(returned.foreign,0,'no random/foreign trap may reappear after return/re-render');
    assert.deepEqual(returned.visual,parentVisualBefore,'return + repeated renders must restore the exact authored parent visual fingerprint');

    assert.deepEqual(errors,[],'authored cache/trap real browser path must raise no runtime errors');
    console.log(JSON.stringify({scenario:'Authored cache -> branch -> return + exact trap ownership',fixture,entryState:state,branchState,returned},null,2));
  }finally{
    clearTimeout(watchdog);
    server.closeAllConnections?.();server.closeIdleConnections?.();server.close();
    await context.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
