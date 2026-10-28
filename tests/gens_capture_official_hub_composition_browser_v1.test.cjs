'use strict';
// Browser gate for the *new* official public-Hub composer. Uses the actual
// unchanged Capture World/roster scripts and official Lab ESM via same-origin
// HTTP; no mock combat engine, no real user's save, no deployed entry.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const http=require('node:http');
const {chromium,firefox}=require('playwright');
const root=path.resolve(__dirname,'..');
const site=path.resolve(process.env.CAPTURE_LAB_DELIVERY_SITE||'_site');
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8',
 '.css':'text/css; charset=utf-8','.webp':'image/webp'};
const html=[
 '<!doctype html><html lang="fr"><meta charset="utf-8">',
 '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">',
 '<style>body{background:#122719;color:#fff;font-family:system-ui}button{min-width:140px;min-height:52px}</style>',
 '<h1>Test du propriétaire Capture avec Combat officiel</h1>',
 '<p id="status" role="status" data-outcome="none">Chargement…</p>',
 '<button type="button" id="start">COMBATTRE</button>',
 '<section id="arena" hidden></section>',
 '<script>',
 'var current="trainer-preview",state=null;',
 'function activeGameProfileId(){return "capture_lab_real_hub_browser_test"}',
 'function normalizeGameParticipants(){return [current]}',
 'function key(id){return "gensrpg_capture_lab_browser_hero_"+id}',
 'function loadState(id){return JSON.parse(localStorage.getItem(key(id))||"{}")}',
 'function loadSharedEntities(){return [{id:"crea-loup",name:"Loup volcanique",hp:150},{id:"crea_voltik",name:"Voltige",hp:120}]}',
 '</script>',
 '<script src="/assets/gensrpg/core/asset-resolver-v1.js"></script>',
 '<script src="/assets/gensrpg/capture/battle-bridge-contract-v1.js"></script>',
 '<script src="/assets/gensrpg/capture/lab-ownership-port-v1.js"></script>',
 '<script src="/assets/gensrpg/capture/world-exploration-v1.js"></script>',
 '<script src="/assets/gensrpg/capture/team-roster-v1.js"></script>',
 '<script>window.renderCaptureWorldHub=function(){};window.renderCaptureExploreResult=function(){};</script>',
 '</html>'
].join('\n');
for(const [name,engine] of [['Chromium',chromium],['Firefox',firefox]]){
 test(name+': true same-origin official Lab composition, landscape touch, one save, incompatible old profile safely refused',{timeout:60000},async t=>{
  const server=http.createServer(async(req,res)=>{
   try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname==='/browser-case'){res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'}).end(html);return;}
    const relative=pathname.slice(1);
    if(relative.split('/').includes('..')||!relative){res.writeHead(403).end();return;}
    let body,filepath;
    for(const folder of [site,root]){
     const candidate=path.resolve(folder,relative);
     if(!candidate.startsWith(folder+path.sep))continue;
     try{body=await fs.readFile(candidate);filepath=candidate;break;}catch{}
    }
    if(!body){res.writeHead(404).end();return;}
    res.writeHead(200,{'Content-Type':types[path.extname(filepath)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(body);
   }catch(error){res.writeHead(500).end(String(error));}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  let browser,context,page;
  try{
   browser=await engine.launch({headless:true});
   context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true});
   await context.addInitScript(()=>{
    localStorage.setItem('gensrpg_game_profiles_v1','{"separateExistingProfile":"preserve"}');
   });
   page=await context.newPage();
   page.setDefaultTimeout(20000);
   const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
   await page.goto(origin+'/browser-case');
   await page.evaluate(async()=>{
    const {createCaptureOfficialHubCompositionV1}=await import('/assets/gensrpg/capture/capture-official-hub-composition-v1.mjs');
    const {createCaptureOfficialBattleViewV1}=await import('/assets/gensrpg/capture/capture-official-battle-view-v1.mjs');
    const inputs=await (await fetch('/assets/gensrpg/capture/runtime-data/author-inputs.json')).json();
    const heroId=captureActiveHeroId(),player=inputs.creatureTransfers.find(x=>x.draft.id==='crea-loup');
    const loadout=player.loadout.slots.map(x=>x.skillId).filter(Boolean);
    saveHeroCreatureState(heroId,{
     creatureTeam:[{uid:'ci_player_browser',entityId:'crea-loup',level:2,xp:12,
      hp:150,maxHp:150,activeAbilityIds:loadout,knownAbilityIds:loadout,
      userNote:'save untouched'}],
     creatureReserve:[],gold:71,inventory:[{id:'potion-owned',qty:2}],
     creatorScene:'ma-forêt'
    });
    const ws=captureWorldState();
    saveCaptureWorldState({...ws,locationId:'cap_forest',locationName:'Ma forêt',
     day:7,turnIndex:2,playMode:'turns',
     last:{type:'wild',creatureId:'crea_voltik',text:'Rencontre auteur sauvage'}});
    window.capturedEvents=[];window.captureWrites=0;
    window.captureStartError=null;window.captureCommand=null;
    const owners={
     activeHeroId:()=>captureActiveHeroId(),
     loadHeroState:id=>loadState(id),
     saveHeroState:(id,st)=>{saveHeroCreatureState(id,st);window.captureWrites++;},
     readWorldState:()=>captureWorldState(),
     saveWorldState:next=>saveCaptureWorldState(next),
     consumeWildEncounter:reason=>captureConsumeWildEncounter(reason),
     worldStorageKey:()=>captureWorldKey(),
     nextEncounterId:()=> 'browser-official-encounter-001'
    };
    const arena=document.getElementById('arena');
    const status=document.getElementById('status');
    const officialView=createCaptureOfficialBattleViewV1({host:arena,assetResolver:GensAssetResolverV1});
    const command=await createCaptureOfficialHubCompositionV1({
     siteBaseUrl:new URL('/',document.baseURI),
     owners,combatPort:GensCaptureLabOwnershipPortV1,
     validateBattleResult:GensCaptureBattleBridgeContractV1.result,
     mountBattle:(handle,ctx,refs)=>{
      if(!refs.publishedSpecies.includes('crea_voltik'))throw Error('real author missing');
      return officialView(handle,ctx,refs);
     },
     onReturn:e=>{window.capturedEvents.push(e);status.dataset.outcome=e.outcome||'cancelled';},
     onError:e=>{window.captureStartError=e.error?.message||String(e.error);status.dataset.outcome='error';}
    });
    window.captureCommand=command;
    document.getElementById('start').onclick=()=>{
     try{command.startWildBattle(captureWorldState().last.creatureId);}
     catch(error){window.captureStartError=error.message;status.dataset.outcome='error';}
    };
    status.textContent='Prêt';status.dataset.outcome='ready';
   });
   const first=await page.evaluate(()=>({
    hero:JSON.stringify(loadState('trainer-preview')),world:JSON.stringify(captureWorldState()),
    other:localStorage.getItem('gensrpg_game_profiles_v1'),
    port:GensCaptureLabOwnershipPortV1.status()
   }));
   assert.equal(first.port.installed,false);
   await page.getByRole('button',{name:'COMBATTRE'}).tap();
   await page.locator('#arena:not([hidden]) #capture-official-flee').waitFor();
   assert.equal(await page.locator('#arena .hub-fighter').count(),2,'one official player and one official opponent');
   assert.equal(await page.locator('#arena img[data-author-asset-id]').count(),2,'authoritative front/back media');
   await page.waitForFunction(()=>[...document.querySelectorAll('#arena img[data-author-asset-id]')]
     .every(img=>img.complete&&img.naturalWidth>0),null,{timeout:14000});
   if(process.env.CAPTURE_OFFICIAL_HUB_SCREENSHOT&&name==='Chromium'){
    await page.screenshot({path:process.env.CAPTURE_OFFICIAL_HUB_SCREENSHOT,fullPage:true});
   }
   assert.ok(await page.getByRole('button',{name:'Griffe',exact:true}).isVisible());
   assert.ok(await page.getByRole('button',{name:'Boule de feu',exact:true}).isVisible());
   assert.match(await page.locator('#arena').innerText(),/Énergie/,'real Core energy visible');
   await page.locator('#capture-official-flee').tap();
   await page.locator('#status[data-outcome="flee"]').waitFor();
   const after=await page.evaluate(()=>({
    hero:loadState('trainer-preview'),world:captureWorldState(),
    writes:window.captureWrites,events:window.capturedEvents.length,
    port:GensCaptureLabOwnershipPortV1.status(),
    other:localStorage.getItem('gensrpg_game_profiles_v1'),
    arenaHidden:document.getElementById('arena').hidden
   }));
   assert.equal(after.writes,1);
   assert.equal(after.events,1);
   assert.equal(after.port.installed,false);
   assert.equal(after.arenaHidden,true);
   assert.equal(after.world.last.type,'resolved');
   assert.equal(after.world.locationName,'Ma forêt');
   assert.equal(after.world.day,7);
   assert.equal(after.hero.creatureTeam[0].uid,'ci_player_browser');
   assert.equal(after.hero.creatureTeam[0].userNote,'save untouched');
   assert.equal(after.hero.gold,71);
   assert.deepEqual(after.hero.inventory,[{id:'potion-owned',qty:2}]);
   assert.equal(after.other,first.other);
   const baseline=await page.evaluate(()=>{
    const hero=loadState('trainer-preview');
    hero.creatureTeam[0].hp=17;hero.creatureTeam[0].maxHp=17;
    saveHeroCreatureState('trainer-preview',hero);
    const ws=captureWorldState();
    saveCaptureWorldState({...ws,last:{type:'wild',creatureId:'crea_voltik',text:'Ancien 17 PV'}});
    return {hero:JSON.stringify(loadState('trainer-preview')),
     world:JSON.stringify(captureWorldState()),writes:window.captureWrites};
   });
   await page.getByRole('button',{name:'COMBATTRE'}).tap();
   await page.locator('#status[data-outcome="error"]').waitFor();
   const rejected=await page.evaluate(()=>({
    hero:JSON.stringify(loadState('trainer-preview')),
    world:JSON.stringify(captureWorldState()),writes:window.captureWrites,
    port:GensCaptureLabOwnershipPortV1.status(),error:window.captureStartError
   }));
   assert.match(rejected.error,/HP|incompatible/i);
   assert.equal(rejected.hero,baseline.hero,'no silent PV conversion');
   assert.equal(rejected.world,baseline.world,'no World stamp after incompatible player');
   assert.equal(rejected.writes,baseline.writes);
   assert.equal(rejected.port.installed,false);
   assert.deepEqual(pageErrors,[]);
  }catch(error){
   if(page)t.diagnostic((await page.locator('body').innerText().catch(()=>'' )).slice(0,1500));
   throw error;
  }finally{
   await context?.close();await browser?.close();
   server.closeAllConnections();await new Promise(done=>server.close(done));
  }
 });
}