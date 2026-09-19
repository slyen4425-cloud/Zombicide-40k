const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const DUNGEON_ID='game_profile_dungeon_demo';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const rel=pathname==='/'?'/preview.html':pathname,file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('not found');return}res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});res.end(data)});
});

async function ready(page,port){
  await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
  await page.waitForFunction(()=>
    typeof openGensFamily==='function' &&
    typeof window.DungeonRoomCreator100?.upsertRoom==='function' &&
    typeof window.DungeonWorldBuilder167821?.createDungeon==='function' &&
    typeof window.DungeonRoomTemplateContent167828?.openEditor==='function' &&
    typeof window.DungeonRoomVisualConfig167826?.openEditor==='function' &&
    typeof window.DungeonRoomContentUI167831?.install==='function' &&
    typeof window.DungeonRoomGridCapture167830?.bindGrid==='function'
  ,null,{timeout:60000});
}
async function openEditor(page){
  const adventure=page.locator('button.gensRootModeCard.adventure');await adventure.waitFor({state:'visible'});await adventure.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
  let card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');await card.waitFor({state:'visible'});
  const sw=await page.evaluate(id=>({active:activeGameProfileId?.()||'',from:gensProfileContentFamily155?.(activeGameProfileId?.())||'',to:gensProfileContentFamily155?.(id)||''}),DUNGEON_ID);
  if(sw.active&&sw.active!==DUNGEON_ID&&sw.from!==sw.to){
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000}),card.click()]);
    await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
    const a2=page.locator('button.gensRootModeCard.adventure');await a2.waitFor({state:'visible'});await a2.click();
    card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');await card.waitFor({state:'visible'});await card.click();
  }else await card.click();
  await page.waitForFunction(id=>activeGameProfileId?.()===id&&getComputedStyle(document.getElementById('gensGameHome')).display!=='none',DUNGEON_ID,{timeout:30000});
  await page.locator('#gensGameHomeActions .homeEditorsBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('editorHub')).display!=='none');
  await page.locator('#dungeonAdvancedEditorBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('dungeonAdvancedEditor')).display!=='none');
}
async function openChest(page,cell){
  const el=page.locator('#drc100Grid [data-drc-index="'+cell+'"]');await el.waitFor({state:'visible'});await el.click();
}
async function touchOpenChest(page,cell){
  const el=page.locator('#drc100Grid [data-drc-index="'+cell+'"]');await el.waitFor({state:'visible'});
  const box=await el.boundingBox();assert.ok(box&&box.width>0&&box.height>0,'configured cell must have a real touch target');
  await page.touchscreen.tap(box.x+box.width/2,box.y+box.height/2);
  await page.waitForTimeout(120);
}
async function modalStack(page,modalId,cardSelector){
  return page.evaluate(({modalId,cardSelector})=>{
    const modal=document.getElementById(modalId),card=document.querySelector(cardSelector);
    if(!modal||!card)return null;
    const r=card.getBoundingClientRect(),x=Math.max(1,Math.min(innerWidth-2,r.left+r.width/2)),y=Math.max(1,Math.min(innerHeight-2,r.top+Math.min(40,r.height/2)));
    const stack=document.elementsFromPoint(x,y).slice(0,12).map(el=>({tag:el.tagName,id:el.id||'',cls:String(el.className||''),z:getComputedStyle(el).zIndex,pos:getComputedStyle(el).position,pointer:getComputedStyle(el).pointerEvents}));
    return {modalZ:getComputedStyle(modal).zIndex,modalDisplay:getComputedStyle(modal).display,roomZ:getComputedStyle(document.getElementById('drc100Modal')).zIndex,stack,topInside:stack.length?document.getElementById(modalId).contains(document.elementFromPoint(x,y)):false};
  },{modalId,cardSelector});
}
async function openDungeonHomeFromRoot(page){
  const adventure=page.locator('button.gensRootModeCard.adventure');await adventure.waitFor({state:'visible'});await adventure.click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
  let card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');await card.waitFor({state:'visible'});
  const sw=await page.evaluate(id=>({active:activeGameProfileId?.()||'',from:gensProfileContentFamily155?.(activeGameProfileId?.())||'',to:gensProfileContentFamily155?.(id)||''}),DUNGEON_ID);
  if(sw.active&&sw.active!==DUNGEON_ID&&sw.from!==sw.to){
    await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:30000}),card.click()]);
    await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});
    const a2=page.locator('button.gensRootModeCard.adventure');await a2.waitFor({state:'visible'});await a2.click();
    card=page.locator('#gensFamilyGames [data-rpg-profile="'+DUNGEON_ID+'"] .gensUniverseMainBtn');await card.waitFor({state:'visible'});await card.click();
  }else await card.click();
  await page.waitForFunction(id=>activeGameProfileId?.()===id&&getComputedStyle(document.getElementById('gensGameHome')).display!=='none',DUNGEON_ID,{timeout:30000});
}
async function chooseParticipantAndStart(page){
  await page.locator('#gensGameHomeActions .newGameBtn').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameSetup .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');
  const first=page.locator('#participantList input[type="checkbox"]').first();await first.waitFor({state:'visible'});if(!(await first.isChecked()))await first.check();
  await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
  await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
  await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();
  await page.waitForFunction(()=>!!localStorage.getItem('gensrpg_dungeon_runtime_v2'),null,{timeout:15000});
}

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[object-config-editor] WATCHDOG');process.exit(1)},140000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR',serviceWorkers:'block'});
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  const page=await context.newPage();page.setDefaultTimeout(25000);page.setDefaultNavigationTimeout(30000);
  const errors=[];
  page.on('pageerror',e=>errors.push('pageerror:'+String(e)));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED|NS_BINDING_ABORTED/.test(m.text()))errors.push('console:'+m.text())});
  page.on('dialog',async d=>{try{await d.accept()}catch(e){}});
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());

  try{
    await ready(page,port);await page.evaluate(()=>{localStorage.clear();sessionStorage.clear()});await page.reload({waitUntil:'domcontentloaded',timeout:60000});await ready(page,port);await openEditor(page);
    const fixture=await page.evaluate(()=>{
      const R=DungeonRoomCreator100,B=DungeonWorldBuilder167821;
      const room=R.createRoom({id:'reg_config_room',name:'Régression config objet',width:5,height:3,theme:'stone'});
      room.cells=room.cells.map(c=>({...c,terrain:'floor',object:null}));room.cells[12].object='entry';room.cells[2].object='exit';room.cells[7].object='chest';R.upsertRoom(room);
      const world=B.createDungeon({name:'Régression config objet'}),added=B.addRoomInstance(world.id,room.id,'Salle config');
      // Historical V16.78.44 state: the room template was copied into the zone as fixed/templateLinked.
      // Simulate the persisted legacy payload exactly, before V16.78.45 switched zones to inheritance.
      const key=window.DungeonZoneContent167824.CONTENT_KEY,all=JSON.parse(localStorage.getItem(key)||'{}');
      all[world.id]=all[world.id]||{};
      all[world.id][added.node.id]={mode:'fixed',templateLinked:true,templateRoomId:room.id,enemies:[],chests:[{id:'legacy-common',cell:7,rarity:'common',gold:0,items:[],label:''}],traps:[],puzzles:[],npcs:[],items:[],updatedAt:new Date().toISOString()};
      localStorage.setItem(key,JSON.stringify(all));
      return {roomId:room.id,worldId:world.id,nodeId:added.node.id};
    });

    const launch=page.locator('#drc100Launcher button[onclick="DungeonRoomCreator100.open()"]');await launch.waitFor({state:'visible'});await launch.click();
    await page.waitForFunction(()=>document.getElementById('drc100Modal')?.classList.contains('open'));
    await page.evaluate(id=>DungeonRoomCreator100.editRoom(id),fixture.roomId);
    await page.waitForFunction(()=>!!document.querySelector('#drc100Grid [data-drc-index="7"]'));

    // Cycle 1: direct template configuration must use the modern object selector.
    await page.locator('#drt167828Toggle').click();
    const beforeTemplate=await page.locator('#drc100Grid [data-drc-index="7"]').evaluate(el=>({configured:el.classList.contains('drt167828Configured'),bg:getComputedStyle(el).backgroundColor}));
    assert.equal(beforeTemplate.configured,false,'a placed object with only automatic defaults must not look configured');
    await openChest(page,7);
    const first=await page.evaluate(()=>({
      modal:document.getElementById('drt167828Modal')?.classList.contains('open')||false,
      modern:!!document.getElementById('dui167831Itemtemplate'),
      legacyTextareaVisible:(()=>{const e=document.getElementById('drtItems');return !!e&&getComputedStyle(e).display!=='none'})(),
      templateOpen:String(DungeonRoomTemplateContent167828.openEditor||'').slice(0,1200),
      templatePatched:!!DungeonRoomTemplateContent167828.__dui167831Patched
    }));
    assert.equal(first.modal,true);assert.equal(first.modern,true,'first direct configuration must use modern item dropdown');assert.equal(first.legacyTextareaVisible,false,'legacy item-ID textarea must be hidden on first direct configuration');
    const templateLayer=await modalStack(page,'drt167828Modal','#drt167828Modal .drtCard');
    console.log('[object-config-editor] template-layer',JSON.stringify(templateLayer,null,2));
    assert.equal(templateLayer?.topInside,true,'template config modal must be the top interactive layer when opened');
    const chosenItem=await page.evaluate(()=>DungeonRoomContentUI167831.lootItems()[0]||null);
    assert.ok(chosenItem?.id,'Dungeon item catalog must provide one concrete item for the chest regression');
    await page.selectOption('#drtRarity','epic');await page.fill('#drtGold','37');
    await page.selectOption('#dui167831Itemtemplate',chosenItem.id);await page.fill('#dui167831Qtytemplate','2');
    await page.locator('#drt167828Modal button[onclick*="DungeonRoomContentUI167831.addItem"]').click();
    await page.locator('#drt167828Modal button[onclick="DungeonRoomTemplateContent167828.saveActive()"]').click();
    await page.waitForFunction(()=>!document.getElementById('drt167828Modal')?.classList.contains('open'));
    const configuredTemplate=await page.locator('#drc100Grid [data-drc-index="7"]').evaluate(el=>({configured:el.classList.contains('drt167828Configured'),bg:getComputedStyle(el).backgroundColor}));
    assert.equal(configuredTemplate.configured,true,'saved object must receive configured state');
    assert.notEqual(configuredTemplate.bg,beforeTemplate.bg,'saved object must use a visibly different configured color');
    const savedTemplate=await page.evaluate(id=>DungeonRoomTemplateContent167828.templateContent(id),fixture.roomId);
    const savedChest=savedTemplate.chests.find(x=>Number(x.cell)===7);
    assert.equal(savedChest?.configured,true,'explicit editor save must persist configured=true');
    assert.equal(savedChest?.rarity,'epic');assert.equal(savedChest?.gold,37);
    assert.deepEqual(savedChest?.items,[{itemId:chosenItem.id,qty:2}],'exact chest item selection must persist in the room template');
    const inheritedState=await page.evaluate(({worldId,nodeId,roomId})=>{
      const g=DungeonWorldBuilder167821.findDungeon(worldId),n=g.nodes.find(x=>x.id===nodeId),r=DungeonRoomCreator100.findRoom(roomId);
      const raw=JSON.parse(localStorage.getItem(DungeonZoneContent167824.CONTENT_KEY)||'{}')?.[worldId]?.[nodeId]||null;
      return {direct:DungeonZoneContent167824.getZoneContent(worldId,nodeId),raw,effective:DungeonAuthoredRuntime167839.effectiveContent(g,n,r)};
    },fixture);
    console.log('[object-config-editor] legacy-linked-after-template-save',JSON.stringify(inheritedState,null,2));
    assert.equal(inheritedState.direct?.mode,'inherit','historical templateLinked automatic copy must migrate back to inheritance when the room template is saved');
    assert.notEqual(inheritedState.raw?.templateLinked,true,'historical automatic template link marker must be consumed by the migration');
    const inherited=inheritedState.effective;
    assert.equal(inherited?.chests?.[0]?.rarity,'epic','authored resolver must inherit configured template rarity');
    assert.equal(inherited?.chests?.[0]?.gold,37,'authored resolver must inherit configured template gold');
    assert.deepEqual(inherited?.chests?.[0]?.items,[{itemId:chosenItem.id,qty:2}],'authored resolver must inherit configured template items');
    await page.evaluate(()=>DungeonRoomCreator100.close());
    await page.waitForFunction(()=>!document.getElementById('drc100Modal')?.classList.contains('open'));

    // Cycle 2: reopen the same editor and same room.
    await launch.click();await page.waitForFunction(()=>document.getElementById('drc100Modal')?.classList.contains('open'));
    await page.evaluate(id=>DungeonRoomCreator100.editRoom(id),fixture.roomId);
    await page.waitForFunction(()=>!!document.querySelector('#drc100Grid [data-drc-index="7"]'));
    await page.locator('#drt167828Toggle').click();
    const reopenedConfigured=await page.locator('#drc100Grid [data-drc-index="7"]').evaluate(el=>({configured:el.classList.contains('drt167828Configured'),bg:getComputedStyle(el).backgroundColor}));
    assert.equal(reopenedConfigured.configured,true,'configured color must survive closing and reopening the Room Creator');
    assert.equal(reopenedConfigured.bg,configuredTemplate.bg,'configured color must be derived from persisted content');

    // Characterize the real pointerdown -> pointerup path: the modal currently opens on pointerdown.
    const touchPoint=await page.locator('#drc100Grid [data-drc-index="7"]').evaluate(el=>{const r=el.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}});
    await page.mouse.move(touchPoint.x,touchPoint.y);await page.mouse.down();
    await page.waitForFunction(()=>document.getElementById('drt167828Modal')?.classList.contains('open'));
    const underFinger=await page.evaluate(({x,y})=>{
      const el=document.elementFromPoint(x,y),stack=document.elementsFromPoint(x,y).slice(0,8);
      return {
        top:{tag:el?.tagName||'',id:el?.id||'',text:(el?.textContent||'').trim().slice(0,100),onclick:el?.getAttribute?.('onclick')||''},
        stack:stack.map(e=>({tag:e.tagName,id:e.id||'',text:(e.textContent||'').trim().slice(0,80),onclick:e.getAttribute?.('onclick')||''}))
      };
    },touchPoint);
    await page.mouse.up();await page.waitForTimeout(80);
    const afterReleaseOpen=await page.evaluate(()=>document.getElementById('drt167828Modal')?.classList.contains('open')||false);
    console.log('[object-config-editor] pointer-modal-risk',JSON.stringify({touchPoint,underFinger,afterReleaseOpen},null,2));
    if(afterReleaseOpen)await page.evaluate(()=>DungeonRoomTemplateContent167828.closeEditor());
    else assert.fail('modal opened on pointerdown but closed again on the same pointer release');

    await openChest(page,7);
    const second=await page.evaluate(()=>({
      modern:!!document.getElementById('dui167831Itemtemplate'),
      legacyTextareaVisible:(()=>{const e=document.getElementById('drtItems');return !!e&&getComputedStyle(e).display!=='none'})(),
      templatePatched:!!DungeonRoomTemplateContent167828.__dui167831Patched
    }));
    assert.equal(second.modern,true,'reopened direct configuration must keep modern item dropdown');
    assert.equal(second.legacyTextareaVisible,false,'reopened direct configuration must not fall back to item-ID textarea');
    await page.evaluate(()=>DungeonRoomTemplateContent167828.closeEditor());
    await page.locator('#drt167828Toggle').click(); // leave direct mode

    // The per-zone path is another real Config objet entry point and must use the same modern UI.
    await page.locator('#drt167828Advanced').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('drv167826Panel')).display!=='none');
    await page.locator('#drv167826Toggle').click();
    await openChest(page,7);
    const zone=await page.evaluate(()=>({
      modal:document.getElementById('drv167826Modal')?.classList.contains('open')||false,
      modern:!!document.getElementById('dui167831Itemzone'),
      legacyTextareaVisible:(()=>{const e=document.getElementById('drv167826Items');return !!e&&getComputedStyle(e).display!=='none'})(),
      visualOpen:String(DungeonRoomVisualConfig167826.openEditor||'').slice(0,1200),
      visualPatched:!!DungeonRoomVisualConfig167826.__dui167831Patched,
      activateCell:String(DungeonRoomVisualConfig167826.activateCell||'').slice(0,900)
    }));
    console.log('[object-config-editor] state',JSON.stringify({first,second,zone},null,2));
    assert.equal(zone.modal,true,'zone configuration modal must open');
    assert.equal(zone.modern,true,'zone Config objet must use modern item dropdown');
    assert.equal(zone.legacyTextareaVisible,false,'zone Config objet must never expose legacy item-ID textarea');
    const zoneLayer=await modalStack(page,'drv167826Modal','#drv167826Modal .drv167826Card');
    console.log('[object-config-editor] zone-layer',JSON.stringify(zoneLayer,null,2));
    assert.equal(zoneLayer?.topInside,true,'zone config modal must be the top interactive layer when opened');
    await page.selectOption('#drv167826Rarity','legendary');await page.fill('#drv167826Gold','23');
    await page.selectOption('#dui167831Itemzone',chosenItem.id);await page.fill('#dui167831Qtyzone','2');
    // Real user path: selecting an item then pressing Save must not silently persist an empty chest.
    await page.locator('#drv167826Modal button[onclick="DungeonRoomVisualConfig167826.saveActive()"]').click();
    await page.waitForFunction(()=>!document.getElementById('drv167826Modal')?.classList.contains('open'));
    const configuredZone=await page.locator('#drc100Grid [data-drc-index="7"]').evaluate(el=>({configured:el.classList.contains('drv167826Configured'),bg:getComputedStyle(el).backgroundColor}));
    assert.equal(configuredZone.configured,true,'zone-specific save must mark the object configured');
    assert.notEqual(configuredZone.bg,beforeTemplate.bg,'zone configured object must use the configured color');
    const directZone=await page.evaluate(({worldId,nodeId})=>DungeonZoneContent167824.getZoneContent(worldId,nodeId),fixture);
    const directChest=directZone.chests.find(x=>Number(x.cell)===7);
    assert.equal(directChest?.configured,true);assert.equal(directChest?.rarity,'legendary');assert.equal(directChest?.gold,23);
    assert.deepEqual(directChest?.items,[{itemId:chosenItem.id,qty:2}],'zone-specific chest configuration must persist exact item data');

    // Reload from persisted editor data, then start the authored world through the real Dungeon shell.
    await page.evaluate(({worldId})=>DungeonWorldSessionBridge167832.selectWorld(worldId,false),fixture);
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});await ready(page,port);await openDungeonHomeFromRoot(page);
    await chooseParticipantAndStart(page);
    await page.waitForFunction(()=>typeof window.DungeonAuthoredRuntime167839?.active==='function'&&window.DungeonAuthoredRuntime167839.active(),null,{timeout:15000});
    await page.locator('#dc01Explore').waitFor({state:'visible'});await page.locator('#dc01Explore').click();
    await page.waitForFunction(nodeId=>{const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');return x?.last?.worldNodeId===nodeId&&Number(x?.room)>0},fixture.nodeId,{timeout:15000});
    await page.waitForTimeout(250);
    const runtimeChest=await page.evaluate(({nodeId})=>{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null'),room=Number(x?.room)||0;
      const content=x?.last?.worldZoneContent167824||null,scenes=(loadDungeonSceneElements?.()||[]).filter(e=>e?.kind==='chest'&&Number(e?.room||0)===room);
      const chest=content?.chests?.find(c=>Number(c.cell)===7)||null;
      return {node:x?.last?.worldNodeId||'',chest,scene:scenes.find(e=>e?.exactChest167824)||null,hero:x?.participants?.[Number(x?.index)||0]||''};
    },fixture);
    console.log('[object-config-editor] runtime-chest',JSON.stringify(runtimeChest,null,2));
    assert.equal(runtimeChest.node,fixture.nodeId);
    assert.equal(runtimeChest.chest?.rarity,'legendary','real authored runtime must receive the saved zone rarity');
    assert.equal(runtimeChest.chest?.gold,23,'real authored runtime must receive the saved zone gold');
    assert.deepEqual(runtimeChest.chest?.items,[{itemId:chosenItem.id,qty:2}],'real authored runtime must receive the saved zone items');
    assert.equal(runtimeChest.scene?.rarity,'legendary','real chest scene must reflect configured rarity');
    assert.ok(runtimeChest.scene?.exactChestId167824,'real chest scene must be linked to exact configured content');

    // Use the same historical FOUILLER button the player sees, not the direct exact-content API.
    const beforeOpen=await page.evaluate(({itemId})=>{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null'),hero=x?.participants?.[Number(x?.index)||0]||'';
      x.positions=x.positions||{};x.positions[hero]=7;localStorage.setItem('gensrpg_dungeon_runtime_v2',JSON.stringify(x));
      window.DungeonCore01?.render?.();
      const key='z40k_'+hero+'_v1',st=JSON.parse(localStorage.getItem(key)||'{}');
      return {
        hero,key,gold:Number(st.gold)||0,
        itemCount:(st.inventory||[]).filter(i=>String(i?.itemId||'')===String(itemId)).length,
        searchFlag:!!window.DungeonCore01?.searchChest?.__dzcExactChest167824,
        searchText:String(window.DungeonCore01?.searchChest||'').slice(0,2000),
        buttons:[...document.querySelectorAll('button')].filter(b=>getComputedStyle(b).display!=='none'&&getComputedStyle(b).visibility!=='hidden').map(b=>({text:(b.textContent||'').trim(),onclick:b.getAttribute('onclick')||''})).filter(b=>/FOUILLER|Ouvrir coffre/i.test(b.text))
      };
    },{itemId:chosenItem.id});
    console.log('[object-config-editor] before-real-chest-open',JSON.stringify(beforeOpen,null,2));

    // Characterize the legacy generic search action that remains visible beside the exact authored chest action.
    const genericSearch=page.locator('button[onclick="searchItem()"]').filter({hasText:/FOUILLER/i}).first();
    if(await genericSearch.count() && await genericSearch.isVisible()){
      const beforeGeneric=await page.evaluate(({itemId,key})=>{const st=JSON.parse(localStorage.getItem(key)||'{}'),x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');return {gold:Number(st.gold)||0,itemCount:(st.inventory||[]).filter(i=>String(i?.itemId||'')===String(itemId)).length,opened:x?.worldContentState167824?.[x?.last?.worldDungeonId]?.[x?.last?.worldNodeId]?.openedChests||{}}},{itemId:chosenItem.id,key:beforeOpen.key});
      await genericSearch.click();await page.waitForTimeout(120);
      const afterGeneric=await page.evaluate(({itemId,key})=>{
        const st=JSON.parse(localStorage.getItem(key)||'{}'),x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
        const visible=[...document.querySelectorAll('body *')].filter(e=>{const s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'}).map(e=>(e.textContent||'').trim()).filter(t=>/Coffre vide|coffre|fouill/i.test(t)).slice(-20);
        return {gold:Number(st.gold)||0,itemCount:(st.inventory||[]).filter(i=>String(i?.itemId||'')===String(itemId)).length,opened:x?.worldContentState167824?.[x?.last?.worldDungeonId]?.[x?.last?.worldNodeId]?.openedChests||{},visible};
      },{itemId:chosenItem.id,key:beforeOpen.key});
      console.log('[object-config-editor] generic-search-on-exact-chest',JSON.stringify({beforeGeneric,afterGeneric},null,2));
      assert.deepEqual(afterGeneric.opened,beforeGeneric.opened,'generic FOUILLER must not consume the exact authored chest');
    }

    const exactButton=page.locator('#dzc167824Actions button').filter({hasText:/Ouvrir coffre/i}).first();
    assert.equal(await exactButton.count(),1,'the exact authored chest must expose its visible exact open action');
    await exactButton.click();
    await page.waitForTimeout(150);
    const afterOpen=await page.evaluate(({itemId,hero,key})=>{
      const st=JSON.parse(localStorage.getItem(key)||'{}'),x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      return {
        gold:Number(st.gold)||0,
        itemCount:(st.inventory||[]).filter(i=>String(i?.itemId||'')===String(itemId)).length,
        opened:x?.worldContentState167824?.[x?.last?.worldDungeonId]?.[x?.last?.worldNodeId]?.openedChests||{},
        visibleText:[...document.querySelectorAll('body *')].filter(e=>getComputedStyle(e).display!=='none'&&getComputedStyle(e).visibility!=='hidden').map(e=>(e.textContent||'').trim()).filter(t=>/Coffre ouvert|Coffre vide/.test(t)).slice(-10)
      };
    },{itemId:chosenItem.id,hero:beforeOpen.hero,key:beforeOpen.key});
    console.log('[object-config-editor] after-real-chest-open',JSON.stringify(afterOpen,null,2));
    assert.equal(beforeOpen.searchFlag,true,'historical chest search hook must remain owned by exact-zone content');
    assert.equal(afterOpen.gold,beforeOpen.gold+23,'visible exact chest action must grant the configured exact gold');
    assert.equal(afterOpen.itemCount,beforeOpen.itemCount+2,'visible exact chest action must grant the configured exact item quantity');
    assert.ok(Object.values(afterOpen.opened).some(Boolean),'visible exact chest action must mark exact chest opened');
    assert.deepEqual(errors,[]);
  }finally{
    clearTimeout(watchdog);server.closeAllConnections?.();server.closeIdleConnections?.();server.close();await context.close();await browser.close();
  }
})().catch(e=>{console.error(e);process.exitCode=1});
