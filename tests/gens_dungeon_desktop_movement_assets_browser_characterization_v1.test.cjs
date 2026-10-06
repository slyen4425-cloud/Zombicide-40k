'use strict';

// Read-only runtime characterization: real Shell/editor/start/board events, no position injection.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..');
const DUNGEON_ID='game_profile_dungeon_demo';
const artifacts=path.join(root,'artifacts','dungeon-desktop-movement-assets');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/preview.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end('not found');return}
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});
    res.end(data);
  });
});
let stage='boot';
const evidence=[];
function mark(value){stage=value;console.log('[dungeon-pc] '+value)}
async function ready(page){
  await page.waitForFunction(()=>document.documentElement.dataset.gensrpgPreviewReady==='1',null,{timeout:60000});
  await page.waitForFunction(()=>typeof window.openGensFamily==='function'&&typeof window.DungeonWorldSessionBridge167832?.selectWorld==='function'&&typeof window.DungeonCore01?.render==='function',null,{timeout:60000});
}
async function home(page){
  await page.locator('button.gensRootModeCard.adventure').click();
  let card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');
  await card.waitFor({state:'visible'});
  const reload=await page.evaluate(id=>activeGameProfileId()!==id&&gensProfileContentFamily155(activeGameProfileId())!==gensProfileContentFamily155(id),DUNGEON_ID);
  if(reload){
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),card.click()]);
    await ready(page);
    await page.locator('button.gensRootModeCard.adventure').click();
    card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');
    await card.waitFor({state:'visible'});
  }
  await card.click();
  await page.locator('#gensGameHomeActions .newGameBtn').waitFor({state:'visible'});
}
async function configureMovement(page){
  // Exercise the actual creator settings and persistence, not a patched runtime flag.
  await page.locator('#gensGameHome button[onclick="backToGensFamily()"]').click();
  await page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseCardActions button').first().click();
  const modal=page.locator('#rpgUniverseEditorModal');
  await modal.waitFor({state:'visible'});
  await modal.locator('button[onclick="showRpgUniverseTab(\'style\')"]').click();
  await modal.locator('[data-gmodule="movement"]').check();
  await modal.locator('button[onclick="saveRpgGameplayModules()"]').click();
  await page.waitForFunction(()=>getActiveGameProfile()?.rpgUniverse?.gameplay?.modules?.movement===true);
  await modal.locator('[data-rpgtab-btn="movement"]').click();
  await modal.locator('#rpgMovementMode').selectOption('tactical');
  await modal.locator('#rpgMovementRefreshMode').selectOption('turn');
  await modal.locator('button[onclick="saveRpgMovementSettings()"]').click();
  await page.waitForFunction(()=>getActiveGameProfile()?.rpgUniverse?.movement?.mode==='tactical');
  await modal.locator('button[onclick="closeRpgUniverseEditor()"]').click();
  await page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn').click();
  const stored=await page.evaluate(()=>({module:getActiveGameProfile()?.rpgUniverse?.gameplay?.modules?.movement,mode:getActiveGameProfile()?.rpgUniverse?.movement?.mode,enabled:getActiveGameProfile()?.rpgUniverse?.movement?.enabled}));
  assert.deepEqual(stored,{module:true,mode:'tactical',enabled:true});
  return stored;
}
async function dismissNotices(page){
  const closed=[];
  for(let i=0;i<8;i++){
    // Wait on the existing notice owner's scheduled work, then use its visible button.
    await page.waitForFunction(()=>typeof z40kEffectTimer==='undefined'||z40kEffectTimer===null,null,{timeout:5000});
    const effect=page.locator('#effectModal.open button.effectClose');
    if(await effect.isVisible()){
      closed.push({kind:'effect',title:await page.locator('#effectTitle').textContent()});
      await effect.click();continue;
    }
    const ok=page.locator('#dc200Modal.open #dc200ModalOk');
    if(await ok.isVisible()){
      closed.push({kind:'dungeon',title:await page.locator('#dc200ModalTitle').textContent()});
      await ok.click();continue;
    }
    return closed;
  }
  throw new Error('Dungeon notice chain did not settle through its real UI');
}
async function start(page){
  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.locator('#sessionDungeonSetupBtn').click();
  await page.locator('#sessionDungeonLibrary .gameProfileCard').first().waitFor({state:'visible'});
  await page.locator('#sessionDungeonSetup button.startGameBtn[onclick="closeSessionDungeonSetup()"]').click();
  assert.equal(await page.locator('#sessionDungeonSetup').isVisible(),false,'library must close before game start');
  await page.locator('#pregameSetup .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
  const choices=page.locator('#participantList input[type="checkbox"]');
  await choices.first().waitFor({state:'visible'});
  const count=await choices.count();
  for(let i=0;i<count;i++)await choices.nth(i).setChecked(i===0);
  await page.locator('#sessionHeroSetup button.startGameBtn[onclick="closeSessionHeroSetup()"]').click();
  await page.locator('#pregameSetup button[onclick="startConfiguredGame()"]').click();
  await page.waitForFunction(()=>DungeonCore01.active===true&&!!localStorage.getItem('gensrpg_dungeon_runtime_v2'));
  await page.locator('#dc01Explore').click();
  await page.locator('#dc047RoomBoard .dc047Grid > .dc047Cell').first().waitFor({state:'visible'});
  return dismissNotices(page);
}
async function state(page){
  return page.evaluate(()=>{
    const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
    const hero=String(x?.participants?.[x.index||0]||'');
    return {hero,room:x?.room,round:x?.round,position:x?.positions?.[hero],remaining:x?.remaining?.[hero],positional:dc305PositionalGameplay(),module:getActiveGameProfile()?.rpgUniverse?.gameplay?.modules?.movement,mode:getActiveGameProfile()?.rpgUniverse?.movement?.mode,role:getDeviceGameRole(),assigned:document.getElementById('dc01DeviceHero')?.value,hint:document.getElementById('dc01ActionHint')?.textContent,reachable:document.querySelectorAll('#dc047RoomBoard .dc200Reach').length,authored:DungeonAuthoredRuntime167839.active()};
  });
}
async function visual(page,label){
  const result=await page.evaluate(async()=>{
    const board=document.getElementById('dc047RoomBoard');
    const visible=e=>{const r=e.getBoundingClientRect(),s=getComputedStyle(e);return r.width>0&&r.height>0&&s.display!=='none'&&s.visibility!=='hidden'};
    const imgs=[...document.querySelectorAll('#gensDungeonCore01 img')].filter(e=>visible(e)&&e.getAttribute('src'));
    const imageRows=await Promise.all(imgs.map(async e=>{
      let decoded=true;try{await e.decode()}catch(_){decoded=false}
      const src=e.currentSrc||e.src;
      return {source:src.startsWith('data:')?'embedded:'+src.length:new URL(src).pathname,decoded,width:e.naturalWidth,height:e.naturalHeight};
    }));
    const urls=new Set();
    for(const e of [board,...board.querySelectorAll('*')]){
      const bg=getComputedStyle(e).backgroundImage;
      for(const match of bg.matchAll(/url\(["']?(.*?)["']?\)/g))if(match[1])urls.add(match[1]);
    }
    const backgrounds=await Promise.all([...urls].map(async src=>{
      const img=new Image();img.src=src;
      let decoded=true;try{await img.decode()}catch(_){decoded=false}
      return {source:src.startsWith('data:')?'embedded:'+src.length:new URL(src,location.href).pathname,decoded,width:img.naturalWidth,height:img.naturalHeight};
    }));
    const overlays=[...document.querySelectorAll('#sessionDungeonSetup,#rpgUniverseEditorModal,#dc200Modal,#effectModal,.gtv2Overlay')].map(e=>({id:e.id||e.className,visible:visible(e),pointerEvents:getComputedStyle(e).pointerEvents}));
    return {viewport:{width:innerWidth,height:innerHeight},images:imageRows,backgrounds,overlays,bodyOverflow:getComputedStyle(document.body).overflow};
  });
  // Broken visible images are actual load/decode defects, not a subjective style comparison.
  for(const row of [...result.images,...result.backgrounds])assert.equal(row.decoded,true,label+': failed visible asset '+row.source);
  assert.ok(result.images.length>0,label+': real Dungeon hero images must be present');
  for(const overlay of result.overlays)assert.equal(overlay.visible,false,label+': overlay remains over exploration: '+overlay.id);
  await page.screenshot({path:path.join(artifacts,label+'.png'),fullPage:true});
  return result;
}
async function move(page,touch){
  const before=await state(page);
  assert.equal(before.positional,true,'editor-enabled tactical movement must reach the active runtime');
  assert.ok(before.remaining>0,'active hero must have movement');
  assert.ok(before.reachable>0,'reachable cells must be rendered');
  const target=await page.evaluate(()=>{
    const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2'));
    const cells=[...document.querySelectorAll('#dc047RoomBoard .dc200Reach')];
    const choice=cells.find(c=>String(x.last.map.cells[Number(c.dataset.dcMapIndex)])==='floor')||cells[0];
    return Number(choice.dataset.dcMapIndex);
  });
  const cell=page.locator('#dc047RoomBoard .dc047Cell[data-dc-map-index="'+target+'"]');
  await cell.scrollIntoViewIfNeeded();
  const hit=await cell.evaluate(e=>{
    const r=e.getBoundingClientRect(),top=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);
    return {accepted:!!top&&(top===e||e.contains(top)),top:top?.tagName,classes:top?.className};
  });
  assert.equal(hit.accepted,true,'the real cell center must receive pointer input');
  if(touch)await cell.tap();else await cell.click();
  await page.waitForFunction(({hero,target})=>JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2'))?.positions?.[hero]===target,{hero:before.hero,target},{timeout:5000});
  const after=await state(page);
  assert.equal(after.position,target,'real pointer event must persist the selected position');
  assert.ok(after.remaining<before.remaining,'real move must consume its engine-calculated cost');
  return {before,target,hit,after};
}
async function authoredFixture(page){
  // Actual Builder APIs create content; no assignment to runtime position/movement/identity.
  return page.evaluate(()=>{
    const R=DungeonRoomCreator100,B=DungeonWorldBuilder167821;
    const room=R.createRoom({id:'pc_movement_room',name:'Diagnostic déplacement PC',width:4,height:4,theme:'stone'});
    room.cells=room.cells.map(c=>({...c,terrain:'floor',object:null}));
    room.cells[0].terrain='wall';room.cells[1].terrain='wall';
    room.cells[12].object='entry';room.cells[3].object='exit';R.upsertRoom(room);
    const world=B.createDungeon({name:'Diagnostic déplacement PC'});
    const added=B.addRoomInstance(world.id,room.id,'Salle diagnostic');
    B.setStart(world.id,added.node.id);
    const validation=B.validation(B.findDungeon(world.id));
    const selected=DungeonWorldSessionBridge167832.selectWorld(world.id,false);
    return {worldId:world.id,roomId:room.id,nodeId:added.node.id,validation,selected};
  });
}
async function generatedFixture(page){
  // Isolate pointer input from random ambushes/events via real adventure content APIs.
  // Profile movement flags, hero positions, budgets and listeners remain untouched.
  return page.evaluate(()=>{
    const adventure=dungeonAdventureFromConfig('Diagnostic déplacement généré');
    adventure.config={...adventure.config,
      roomWeights:{enemy:0,ambush:0,trap:0,chest:0,merchant:0,rest:1,mystery:0},
      events:false,eventChance:0,specialBranchChance:0,challengeDoorChance:0,
      secondaryObjectiveChance:0};
    saveDungeonAdventures([...loadDungeonAdventures(),adventure]);
    const selected=DungeonWorldSessionBridge167832.selectAdventure(adventure.id,false);
    return {adventureId:adventure.id,selected};
  });
}
(async()=>{
  const watchdog=setTimeout(()=>{console.error('[dungeon-pc] WATCHDOG '+stage);process.exit(1)},300000);
  fs.mkdirSync(artifacts,{recursive:true});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  try{
    for(const device of [
      {name:'desktop',viewport:{width:1366,height:768},deviceScaleFactor:1,isMobile:false,hasTouch:false},
      {name:'mobile',viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true}
    ]){
      for(const kind of ['generated','authored']){
        const context=await browser.newContext({...device,locale:'fr-FR',serviceWorkers:'block'});
        await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
        const page=await context.newPage();page.setDefaultTimeout(25000);
        const errors=[],failedRequests=[];
        page.on('pageerror',e=>errors.push(String(e)));
        page.on('requestfailed',r=>{if(r.url().startsWith('http://127.0.0.1'))failedRequests.push({url:new URL(r.url()).pathname,error:r.failure()?.errorText})});
        page.on('dialog',d=>d.accept().catch(()=>{}));
        await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
        const row={device:device.name,kind};evidence.push(row);
        try{
          mark(device.name+'-'+kind+'-boot');
          await page.goto('http://127.0.0.1:'+server.address().port+'/preview.html',{waitUntil:'domcontentloaded'});
          await ready(page);await home(page);
          if(kind==='generated'){
            row.fixture=await generatedFixture(page);
            assert.equal(row.fixture.selected,true);
            mark(device.name+'-default-profile');
            row.defaultNotices=await start(page);row.default=await state(page);
            assert.equal(row.default.module,false,'fresh reference Dungeon defaults must remain user-configurable');
            assert.equal(row.default.positional,false,'disabled movement must not be overridden by a desktop-specific fallback');
            assert.equal(row.default.reachable,0,'disabled movement must not expose reachable cells');
            const candidate=page.locator('#dc047RoomBoard .dc047Cell').nth(1);
            if(device.hasTouch)await candidate.tap();else await candidate.click();
            row.disabledAfter=await state(page);
            assert.equal(row.disabledAfter.position,row.default.position,'disabled movement must refuse position changes');
            row.defaultVisual=await visual(page,device.name+'-default-generated');
            await page.locator('#gensDungeonCore01 button[onclick="DungeonCore01.quit()"]').click();
            await home(page);
          }
          mark(device.name+'-'+kind+'-editor-enable');
          row.settings=await configureMovement(page);
          if(kind==='authored'){
            row.fixture=await authoredFixture(page);
            assert.equal(row.fixture.validation.valid,true);
            assert.equal(row.fixture.selected,true);
          }
          mark(device.name+'-'+kind+'-enabled-start');
          row.enabledNotices=await start(page);row.enabledStart=await state(page);
          assert.equal(row.enabledStart.authored,kind==='authored');
          if(kind==='authored')assert.equal(row.enabledStart.position,12,'real authored entry must use the Builder entry cell');
          row.visual=await visual(page,device.name+'-enabled-'+kind);
          mark(device.name+'-'+kind+'-move');
          row.firstMove=await move(page,device.hasTouch);
          mark(device.name+'-'+kind+'-end-turn');
          await page.locator('#dc01EndTurn').click();
          row.endTurnNotices=await dismissNotices(page);
          row.nextTurn=await state(page);
          assert.ok(row.nextTurn.round>row.firstMove.after.round,'single-hero end turn must start a new round');
          assert.ok(row.nextTurn.remaining>row.firstMove.after.remaining,'next turn must restore the configured movement');
          row.secondMove=await move(page,device.hasTouch);
          assert.deepEqual(errors,[],'runtime errors on '+device.name+' '+kind);
          row.failedRequests=failedRequests;
          row.errors=errors;
          mark(device.name+'-'+kind+'-success');
        }catch(error){
          row.failure=String(error);row.errors=errors;row.failedRequests=failedRequests;
          row.state=await state(page).catch(()=>null);
          await page.screenshot({path:path.join(artifacts,device.name+'-'+kind+'-failure.png'),fullPage:true}).catch(()=>{});
          throw error;
        }finally{
          fs.writeFileSync(path.join(artifacts,'evidence.json'),JSON.stringify({stage,evidence},null,2));
          await context.close();
        }
      }
    }
    console.log(JSON.stringify({scenario:'Dungeon real desktop clicks/mobile taps and visible assets',evidence},null,2));
  }finally{
    clearTimeout(watchdog);server.closeAllConnections?.();server.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
