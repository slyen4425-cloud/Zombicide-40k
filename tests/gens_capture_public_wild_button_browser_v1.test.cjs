'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium,firefox}=require('playwright');
const root=path.resolve(__dirname,'..');
const site=path.resolve(process.env.CAPTURE_LAB_DELIVERY_SITE||'_site');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
 '.mjs':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8',
 '.webp':'image/webp','.css':'text/css'};
const html=`<!doctype html><html lang="fr"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Vrai bouton historique du Hub Capture</title>
<div id="captureGameHub">
 <h1>Monster Capture</h1>
 <button id="original-wild-button" onclick="captureStartWildBattle('crea_voltik')">⚔️ COMBATTRE</button>
</div>
<script>
var current='trainer-test',state=null;
function activeGameProfileId(){return 'capture_public_original_owner_browser_test'}
function normalizeGameParticipants(){return [current]}
function key(id){return 'gens_capture_public_owner_hero_'+id}
function loadState(id){return JSON.parse(localStorage.getItem(key(id))||'{}')}
function loadSharedEntities(){return [{id:'crea-loup',name:'Loup volcanique',hp:150},{id:'crea_voltik',name:'Voltige',hp:120}]}
</script>
<script src="/assets/gensrpg/core/asset-resolver-v1.js"></script>
<script src="/assets/gensrpg/capture/world-exploration-v1.js"></script>
<script src="/assets/gensrpg/capture/team-roster-v1.js"></script>
<script src="/assets/gensrpg/capture/legacy-monolith-functions-v1.js"></script>
<script>window.renderCaptureWorldHub=function(){};window.renderCaptureExploreResult=function(){};</script>
</html>`;
for(const [browserName,engine] of [['Chromium',chromium],['Firefox',firefox]]){
 test(browserName+': unchanged World onclick reaches the SINGLE public official Combat engine; saves once, migration requires consent',{timeout:90000},async()=>{
  const server=http.createServer(async(req,res)=>{
   try{
    const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    if(pathname==='/browser-case'){res.writeHead(200,{'Content-Type':mime['.html']}).end(html);return;}
    const rel=pathname.slice(1);
    if(!rel||rel.split('/').includes('..')){res.writeHead(403).end();return;}
    for(const base of [site,root]){
     const file=path.resolve(base,rel);
     if(!file.startsWith(base+path.sep))continue;
     try{
      const bytes=await fs.readFile(file);
      res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream',
       'Cache-Control':'no-store'}).end(bytes);
      return;
     }catch{}
    }
    res.writeHead(404).end();
   }catch(error){res.writeHead(500).end(String(error));}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  let browser,context,page;
  const origin='http://127.0.0.1:'+server.address().port;
  try{
   browser=await engine.launch({headless:true});
   context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true});
   await context.addInitScript(()=>{
    localStorage.setItem('gensrpg_game_profiles_v1','{"existingGame":"must-survive"}');
   });
   page=await context.newPage();page.setDefaultTimeout(25000);
   const pageErrors=[];page.on('pageerror',error=>pageErrors.push(error.message));
   await page.goto(origin+'/browser-case');
   await page.evaluate(async()=>{
    const res=await fetch('/assets/gensrpg/capture/runtime-data/author-inputs.json');
    if(!res.ok)throw new Error('Missing official static delivery');
    const inputs=await res.json(),author=inputs.creatureTransfers.find(c=>c.draft.id==='crea-loup');
    const abilities=author.loadout.slots.map(s=>s.skillId).filter(Boolean);
    const hero={creatureTeam:[{uid:'ci_public_owner_loup',entityId:'crea-loup',hp:150,maxHp:150,
      level:1,xp:12,knownAbilityIds:abilities,activeAbilityIds:abilities,statAlloc:{},
      note:'Existing user value'}],
      creatureReserve:[],inventory:[{id:'user-potion',qty:2}],gold:77,scene:'ma-forêt'};
    saveHeroCreatureState('trainer-test',hero);
    saveCaptureWorldState({locationId:'cap_forest',locationName:'Ma forêt',day:12,
      turnIndex:1,playMode:'turns',
      last:{type:'wild',creatureId:'crea_voltik',text:'Rencontre officielle'}});
    window.capturePublicBefore={hero:JSON.stringify(loadState('trainer-test')),
     world:JSON.stringify(captureWorldState()),
     external:localStorage.getItem('gensrpg_game_profiles_v1')};
   });
   assert.equal(await page.getByRole('button',{name:'⚔️ COMBATTRE'}).count(),1);
   await page.locator('#original-wild-button').tap();
   await page.locator('[data-capture-official-battle="true"]').waitFor();
   assert.equal(await page.locator('[data-capture-official-battle] .cap-lab-fighter').count(),2);
   assert.equal(await page.locator('[data-capture-official-battle] img[data-author-asset-id]').count(),2);
   assert.ok(await page.locator('[data-capture-official-battle] button').count()>=3);
   await page.getByRole('button',{name:'Fuir',exact:true}).tap();
   await page.locator('[data-capture-official-status="true"]').getByText('Fuite : retour au monde enregistré.').waitFor();
   const after=await page.evaluate(()=>({
    hero:loadState('trainer-test'),world:captureWorldState(),
    other:localStorage.getItem('gensrpg_game_profiles_v1'),
    provider:GensCaptureLabOwnershipPortV1.status(),
    oldEngine:window.gensCurrentCaptureBattle??null
   }));
   assert.equal(after.hero.creatureTeam[0].note,'Existing user value');
   assert.equal(after.hero.gold,77);
   assert.equal(after.hero.inventory[0].qty,2);
   assert.equal(after.world.last.type,'resolved');
   assert.equal(after.world.day,12);
   assert.equal(after.world.locationName,'Ma forêt');
   assert.equal(after.provider.installed,false);
   assert.equal(after.oldEngine,null,'the legacy engine must not run in parallel');
   assert.equal(after.other,'{"existingGame":"must-survive"}');

   // A historical 17 HP creature must never be normalized silently:
   // first explicitly refuse the user consent, then explicitly accept it.
   const former=await page.evaluate(()=>{
    const hero=loadState('trainer-test');
    hero.creatureTeam[0].hp=17;hero.creatureTeam[0].maxHp=17;
    saveHeroCreatureState('trainer-test',hero);
    saveCaptureWorldState({...captureWorldState(),last:{
      type:'wild',creatureId:'crea_voltik',text:'Rencontre après sauvegarde ancienne'}});
    return {hero:JSON.stringify(loadState('trainer-test')),
     world:JSON.stringify(captureWorldState())};
   });
   let requested=0;
   const refuse=async dialog=>{requested++;await dialog.dismiss();};
   page.on('dialog',refuse);
   await page.locator('#original-wild-button').tap();
   await page.locator('[data-capture-official-status="true"]').getByText(/Migration annulée/).waitFor();
   page.off('dialog',refuse);
   assert.equal(requested,1);
   const refused=await page.evaluate(()=>({hero:JSON.stringify(loadState('trainer-test')),
     world:JSON.stringify(captureWorldState())}));
   assert.deepEqual(refused,former,'refused migration cannot write hero or World');
   let accepted=0;
   const accept=async dialog=>{accepted++;await dialog.accept();};
   page.on('dialog',accept);
   await page.locator('#original-wild-button').tap();
   await page.locator('[data-capture-official-battle="true"]').waitFor();
   page.off('dialog',accept);
   assert.equal(accepted,1);
   const migrated=await page.evaluate(()=>loadState('trainer-test'));
   assert.equal(migrated.creatureTeam[0].maxHp,150);
   assert.equal(migrated.creatureTeam[0].hp,150);
   assert.equal(migrated.captureLabProfileMigrationV1.schema,'gensrpg-capture-lab-profile-migration-v1');
   assert.equal(migrated.captureLabProfileMigrationV1.originalMember.maxHp,17);
   await page.getByRole('button',{name:'Fuir',exact:true}).tap();
   await page.locator('[data-capture-official-status="true"]').getByText('Fuite : retour au monde enregistré.').waitFor();
   assert.equal(await page.evaluate(()=>captureWorldState().last.type),'resolved');
   assert.deepEqual(pageErrors,[]);
  }catch(error){
   if(page)console.log('Public Capture test browser body:',(await page.locator('body').innerText().catch(()=>'' )).slice(0,2000));
   throw error;
  }finally{
   await context?.close();await browser?.close();
   server.closeAllConnections();await new Promise(resolve=>server.close(resolve));
  }
 });
}
