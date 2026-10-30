'use strict';
// Regression gate for the ACTUAL GenSrpg root application, never a demo,
// synthetic mini-HTML or a second Capture combat owner. The test starts from
// the real index.html and only seeds test-only saved data via the canonical
// Capture roster/World owners after creating a normal Shell session.
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');
const {chromium,firefox}=require('playwright');
const root=path.resolve(__dirname,'..');
const staged=path.resolve(process.env.CAPTURE_LAB_DELIVERY_SITE||'_site');
const profileId='gp_mt7ker7t_m2iw9';
const types={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8',
 '.mjs':'text/javascript;charset=utf-8','.json':'application/json;charset=utf-8',
 '.css':'text/css;charset=utf-8','.png':'image/png','.webp':'image/webp',
 '.svg':'image/svg+xml','.mp3':'audio/mpeg','.wav':'audio/wav',
 '.woff2':'font/woff2','.webmanifest':'application/manifest+json'};
function createServer(){
 return http.createServer(async(req,res)=>{
  try{
   const u=new URL(req.url,'http://localhost');
   const rel=u.pathname==='/'?'index.html':decodeURIComponent(u.pathname).slice(1);
   if(!rel||rel.split('/').includes('..')){res.writeHead(403).end();return;}
   let bytes,filename;
   for(const dir of [staged,root]){
    const file=path.resolve(dir,rel);
    if(!file.startsWith(dir+path.sep))continue;
    try{bytes=await fs.readFile(file);filename=file;break;}catch{}
   }
   if(!bytes){res.writeHead(404).end('Not found: '+rel);return;}
   res.writeHead(200,{'Content-Type':types[path.extname(filename)]||'application/octet-stream',
    'Cache-Control':'no-store'}).end(bytes);
  }catch(error){res.writeHead(500).end(String(error));}
 });
}
async function waitShell(page){
 await page.waitForFunction(()=>typeof window.openGensFamily==='function'&&
  typeof window.openGensBuiltInGame==='function'&&
  typeof window.startConfiguredGame==='function'&&
  typeof window.captureStartWildBattle==='function'&&
  !!document.querySelector('button.gensRootModeCard.capture'),null,{timeout:90000});
}
async function selectCapture(page){
 const card=page.locator('button.gensRootModeCard.capture');
 await card.waitFor({state:'visible',timeout:45000});
 await card.tap();
 await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
 let item=page.locator('#gensFamilyGames [data-rpg-profile="'+profileId+'"] .gensUniverseMainBtn');
 await item.waitFor({state:'visible'});
 const state=await page.evaluate(id=>({
  active:activeGameProfileId(),
  from:gensProfileContentFamily155(activeGameProfileId()),
  to:gensProfileContentFamily155(id)
 }),profileId);
 if(state.active&&state.active!==profileId&&state.from!==state.to){
  await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded'}),item.tap()]);
  await waitShell(page);
  await card.waitFor({state:'visible'});
  await card.tap();
  item=page.locator('#gensFamilyGames [data-rpg-profile="'+profileId+'"] .gensUniverseMainBtn');
 }
 await item.tap();
 await page.waitForFunction(id=>activeGameProfileId()===id&&
  getComputedStyle(document.getElementById('gensGameHome')).display!=='none',profileId);
}
async function startRealCapture(page){
 await selectCapture(page);
 await page.locator('#gensGameHomeActions .newGameBtn').tap();
 await page.waitForFunction(()=>document.body.classList.contains('gensCapturePregame'));
 await page.locator('#pregameHeroStep .sessionSetupBtn[onclick="openSessionHeroSetup()"]').tap();
 const trainer=page.locator('#participantList input[type="checkbox"]').first();
 await trainer.waitFor({state:'visible'});
 if(!(await trainer.isChecked()))await trainer.check();
 const starter=page.locator('#participantList .captureStarterChoice').first();
 await starter.waitFor({state:'visible'});
 if(!(await page.locator('#participantList .captureStarterChoice.selected').count()))await starter.tap();
 await page.waitForFunction(()=>typeof gensCaptureParticipantsReady==='function'&&gensCaptureParticipantsReady());
 await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').tap();
 await page.waitForFunction(()=>{
  const b=document.querySelector('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]');
  return !!b&&!b.disabled;
 });
 await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').tap();
 await page.waitForFunction(()=>localStorage.getItem('z40k_session_active_v1')==='1'&&
  gensMode151()==='capture'&&
  getComputedStyle(document.getElementById('captureGameHub')).display!=='none',null,{timeout:30000});
}
async function seedOnlyThroughOwners(page){
 return page.evaluate(()=>{
  const heroId=captureActiveHeroId();
  const ent=loadSharedEntities().find(x=>x.id==='crea_voltik'&&x.category==='creature');
  if(!heroId||!ent)throw Error('Built-in Capture Voltige starter is missing');
  const saved=loadState(heroId);
  const uid='ci_root_real_shell_voltige';
  const skills=ent.abilityIds.slice(0,4);
  saveHeroCreatureState(heroId,{
   ...saved,creatureTeam:[{uid,entityId:ent.id,level:6,xp:12,hp:17,maxHp:17,
    activeAbilityIds:[...skills],knownAbilityIds:[...skills],
    statAlloc:{power:0,defense:0,agility:0,speed:0,spirit:0,hp:0},
    talents:[],note:'persist-real-root-test'}],
   creatureReserve:[],gold:41,
   inventory:[{id:'ci-owned-item',qty:2}]
  });
  const ws=captureWorldState();
  saveCaptureWorldState({...ws,day:3,locationId:'cap_forest',
   locationName:'Forêt réelle',last:{type:'wild',creatureId:'crea_voltik',
    text:'Rencontre sauvage depuis la partie GenSrpg'}});
  renderCaptureWorldHub();
  return {heroId,uid,worldKey:captureWorldKey(),
   originalOwner:window.captureStartWildBattle.toString()};
 });
}
for(const [name,engine] of [['Chromium',chromium],['Firefox',firefox]]){
 test(name+': actual index → four-mode root → Capture saved game → World COMBATTRE → native Lab → return and resume',
  {timeout:210000},async()=>{
  const server=createServer();
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/index.html';
  let browser,context,page;
  const failures=[],consents=[];
  try{
   browser=await engine.launch({headless:true});
   context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true,
    locale:'fr-FR',serviceWorkers:'block'});
   await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
   page=await context.newPage();
   page.setDefaultTimeout(30000);
   page.on('pageerror',e=>failures.push(String(e)));
   page.on('dialog',async d=>{
    if(d.type()==='confirm')consents.push(d.message());
    await d.accept();
   });
   await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
   await page.goto(url,{waitUntil:'domcontentloaded',timeout:90000});
   await waitShell(page);
   assert.equal(await page.locator('button.gensRootModeCard').count(),4,
    'real application must expose all four modes, not a standalone 2v2');
   await startRealCapture(page);
   const setup=await seedOnlyThroughOwners(page);
   assert.match(setup.originalOwner,/capture-official-wild-entry-v1\.mjs/,
    'the actual index must use the canonical Lab owner');
   const worldButton=page.locator('#captureCurrentEncounterCard button[onclick^="captureStartWildBattle"]');
   await worldButton.waitFor({state:'visible'});
   await worldButton.tap();
   const arena=page.locator('#capture-official-entry-arena [data-combat-demo] [data-combat-arena]');
   await arena.waitFor({state:'visible',timeout:60000});
   assert.equal(await page.locator('#capture-official-entry-arena [data-demo-slot]:not([hidden])').count(),2);
   assert.ok(consents.length>0,'legacy HP17 must require explicit migration consent');
   await page.waitForFunction(()=>{
    const host=document.getElementById('capture-official-entry-arena');
    const images=[...host.shadowRoot.querySelectorAll('[data-demo-slot]:not([hidden]) [data-demo-image]')];
    return images.length===2&&images.every(i=>i.complete&&i.naturalWidth>0);
   },null,{timeout:25000});
   await page.locator('#capture-official-flee').tap();
   await page.locator('#gens-capture-official-battle-v1').waitFor({state:'detached'});
   const after=await page.evaluate(id=>{
    const hero=loadState(id);
    return {hero,world:captureWorldState(),session:localStorage.getItem('z40k_session_active_v1'),
     hub:getComputedStyle(document.getElementById('captureGameHub')).display,
     port:GensCaptureLabOwnershipPortV1.status()};
   },setup.heroId);
   assert.equal(after.world.last.type,'resolved');
   assert.equal(after.world.day,3);
   assert.equal(after.world.locationName,'Forêt réelle');
   assert.equal(after.hero.creatureTeam[0].uid,setup.uid);
   assert.equal(after.hero.creatureTeam[0].note,'persist-real-root-test');
   assert.equal(after.hero.gold,41);
   assert.deepEqual(after.hero.inventory,[{id:'ci-owned-item',qty:2}]);
   assert.equal(after.port.installed,false);
   assert.equal(after.session,'1');
   assert.notEqual(after.hub,'none');
   // Same saved profile and World must remain after a real app page recreation.
   await page.reload({waitUntil:'domcontentloaded',timeout:90000});
   await waitShell(page);
   const persisted=await page.evaluate(({heroId,worldKey})=>({
    hero:loadState(heroId),world:JSON.parse(localStorage.getItem(worldKey)||'null'),
    session:localStorage.getItem('z40k_session_active_v1')
   }),{heroId:setup.heroId,worldKey:setup.worldKey});
   assert.equal(persisted.hero.creatureTeam[0].uid,setup.uid);
   assert.equal(persisted.world.last.type,'resolved');
   assert.equal(persisted.session,'1');
   assert.deepEqual(failures,[]);
  }finally{
   await context?.close();await browser?.close();
   server.closeAllConnections();
   await new Promise(resolve=>server.close(resolve));
  }
 });
}
