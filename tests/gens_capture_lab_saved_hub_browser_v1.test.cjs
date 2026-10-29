'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium,firefox}=require('playwright');
const root=path.resolve(process.env.CAPTURE_LAB_PREVIEW_ROOT||'_site/capture-lab-preview');
const mimes={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp'};
for(const [name,engine] of [['Chromium',chromium],['Firefox',firefox]]){
 test(name+': actual Capture world/roster owners persist once through official Hub port, reject old HP and preserve unrelated localStorage',{timeout:50000},async t=>{
  const server=http.createServer(async(req,res)=>{
   try{
    const url=new URL(req.url,'http://localhost');
    const file=path.resolve(root,'.'+decodeURIComponent(url.pathname));
    if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
    const data=await fs.readFile(file);
    res.writeHead(200,{'Content-Type':mimes[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);
   }catch{res.writeHead(404).end();}
  });
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const origin='http://127.0.0.1:'+server.address().port;
  let browser,page;
  try{
   browser=await engine.launch({headless:true});
   const context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true});
   await context.addInitScript(()=>localStorage.setItem('gensrpg_game_profiles_v1','{"unrelated":"untouched"}'));
   page=await context.newPage();page.setDefaultTimeout(16000);
   const pageErrors=[],outbound=[];page.on('pageerror',err=>pageErrors.push(err.message));
   page.on('request',req=>{if(!req.url().startsWith(origin+'/'))outbound.push(req.url());});
   await page.goto(origin+'/capture-lab-saved-hub-preview.html');
   await page.locator('#hub-status[data-ready="true"]').waitFor();
   await page.locator('#hub-compatibility[data-status="ready"]').waitFor();
   assert.ok(await page.getByRole('heading',{name:'Rencontre sauvegardée Capture'}).isVisible());
   assert.ok(await page.getByText('Ma forêt du créateur').isVisible());
   const before=await page.evaluate(()=>({
    profile:JSON.parse(localStorage.getItem('gensrpg_capture_lab_saved_preview_hero_trainer-preview')),
    world:captureWorldState(),
    writes:globalThis.capturePreviewHeroWrites,
    profileKey:localStorage.getItem('gensrpg_game_profiles_v1')
   }));
   assert.equal(before.world.last.type,'wild');
   assert.equal(before.world.last.creatureId,'crea_voltik');
   assert.equal(before.world.day,9);
   assert.equal(before.world.turnIndex,2);
   assert.equal(before.profile.creatureTeam[0].entityId,'crea-loup');
   assert.equal(before.profile.creatureTeam[0].maxHp,150);
   await page.getByRole('button',{name:'COMBATTRE · Labo officiel'}).tap();
   await page.locator('#live-battle:not([hidden])').waitFor();
   assert.equal(await page.locator('.hub-fighter').count(),2);
   for(const heading of ['Loup volcanique','Voltige'])assert.ok(await page.getByRole('heading',{name:heading}).isVisible());
   const art=page.locator('img[data-author-asset-id]');
   assert.equal(await art.count(),2,'back and front official authored sprites');
   await page.waitForFunction(()=>[...document.querySelectorAll('img[data-author-asset-id]')].every(x=>x.complete&&x.naturalWidth>0),null,{timeout:14000});
   if(process.env.CAPTURE_LAB_SCREENSHOT_SAVED_HUB&&name==='Chromium')await page.screenshot({path:process.env.CAPTURE_LAB_SCREENSHOT_SAVED_HUB,fullPage:true});
   for(const skill of ['Griffe','Boule de feu'])assert.equal(await page.getByRole('button',{name:skill,exact:true}).count(),1);
   await page.getByRole('button',{name:'Boule de feu',exact:true}).tap();
   await page.waitForFunction(()=>{const n=document.querySelector('[data-player-energy]');return n&&/Énergie ([0-9]+) \/ 10/.test(n.textContent)&&Number(n.textContent.match(/Énergie ([0-9]+)/)[1])<10;},null,{timeout:8000});
   await page.getByRole('button',{name:'Fuir',exact:true}).tap();
   await page.locator('#hub-status[data-outcome="flee"]').waitFor();
   assert.equal(await page.locator('#live-battle[hidden]').count(),1);
   const after=await page.evaluate(()=>({
    profile:JSON.parse(localStorage.getItem('gensrpg_capture_lab_saved_preview_hero_trainer-preview')),
    world:captureWorldState(),
    writes:globalThis.capturePreviewHeroWrites,
    port:GensCaptureLabOwnershipPortV1.status(),
    profileKey:localStorage.getItem('gensrpg_game_profiles_v1')
   }));
   assert.equal(after.writes,before.writes+1,'exactly one save through actual team roster owner');
   assert.equal(after.world.last.type,'resolved','actual world owner consumed the wild encounter');
   assert.equal(after.world.day,before.world.day);
   assert.equal(after.world.locationName,before.world.locationName);
   assert.equal(after.profile.creatureTeam[0].uid,before.profile.creatureTeam[0].uid);
   assert.equal(after.profile.gold,before.profile.gold);
   assert.deepEqual(after.profile.inventory,before.profile.inventory);
   assert.equal(after.port.installed,false,'official Combat port is cleaned up');
   assert.equal(after.profileKey,before.profileKey,'unrelated existing saves remain unchanged');

   await page.getByRole('button',{name:'Nouvelle rencontre'}).tap();
   const old=await page.evaluate(()=>{
    const hero=loadState('trainer-preview');
    hero.creatureTeam[0].hp=17;hero.creatureTeam[0].maxHp=17;
    localStorage.setItem('gensrpg_capture_lab_saved_preview_hero_trainer-preview',JSON.stringify(hero));
    return {heroRaw:localStorage.getItem('gensrpg_capture_lab_saved_preview_hero_trainer-preview'),
     worldRaw:localStorage.getItem(captureWorldKey()),
     writes:globalThis.capturePreviewHeroWrites};
   });
   await page.getByRole('button',{name:'COMBATTRE · Labo officiel'}).tap();
   await page.locator('#hub-status[data-incompatible="true"]').waitFor();
   await page.locator('#hub-compatibility[data-status="review-required"]').waitFor();
   assert.match(await page.locator('#hub-compatibility').innerText(),/migration|PV max|aucune donnée modifiée/i);
   const refused=await page.evaluate(()=>({
    heroRaw:localStorage.getItem('gensrpg_capture_lab_saved_preview_hero_trainer-preview'),
    worldRaw:localStorage.getItem(captureWorldKey()),
    writes:globalThis.capturePreviewHeroWrites,
    port:GensCaptureLabOwnershipPortV1.status()
   }));
   assert.equal(refused.heroRaw,old.heroRaw,'cannot silently migrate 17 HP to 150 HP');
   assert.equal(refused.worldRaw,old.worldRaw,'incompatible profile must not stamp the real wild encounter');
   assert.equal(refused.writes,old.writes);
   assert.equal(refused.port.installed,false);

   // The preview now exposes a genuine user-consent path for the historical
   // HP 17 profile: inspect first (zero writes), then confirm once through
   // the original roster owner, retry the official Combat and block a stale
   // rollback after the World owner consumed the finished encounter.
   await page.getByRole('button',{name:'Préparer la migration du profil'}).tap();
   await page.locator('#hub-migration-detail[data-status="migration-required"]').waitFor();
   const details=await page.locator('#hub-migration-detail').innerText();
   assert.match(details,/17\/17/);
   assert.match(details,/150\/150/);
   const inspection=await page.evaluate(()=>({
    heroRaw:localStorage.getItem('gensrpg_capture_lab_saved_preview_hero_trainer-preview'),
    worldRaw:localStorage.getItem(captureWorldKey()),
    writes:globalThis.capturePreviewHeroWrites
   }));
   assert.deepEqual(inspection,{heroRaw:old.heroRaw,worldRaw:old.worldRaw,writes:old.writes},
    'read-only official author inspection must not mutate the persisted owner');
   await page.getByRole('button',{name:'Confirmer la migration'}).tap();
   await page.locator('#hub-migration-detail[data-status="migrated"]').waitFor();
   const migrated=await page.evaluate(()=>({
    hero:loadState('trainer-preview'),
    worldRaw:localStorage.getItem(captureWorldKey()),
    writes:globalThis.capturePreviewHeroWrites
   }));
   assert.equal(migrated.hero.creatureTeam[0].hp,150);
   assert.equal(migrated.hero.creatureTeam[0].maxHp,150);
   assert.equal(migrated.hero.captureLabProfileMigrationV1.version,1);
   assert.equal(migrated.hero.captureLabProfileMigrationV1.originalMember.hp,17);
   assert.equal(migrated.writes,old.writes+1,'exactly one canonical save for explicit consent');
   assert.equal(migrated.worldRaw,old.worldRaw);
   await page.getByRole('button',{name:'COMBATTRE · Labo officiel'}).tap();
   await page.locator('#live-battle:not([hidden])').waitFor();
   await page.getByRole('button',{name:'Fuir',exact:true}).tap();
   await page.locator('#hub-status[data-outcome="flee"]').waitFor();
   const afterMigrationBattle=await page.evaluate(()=>({
    hero:loadState('trainer-preview'),
    world:captureWorldState(),
    writes:globalThis.capturePreviewHeroWrites
   }));
   assert.equal(afterMigrationBattle.writes,old.writes+2,
    'the subsequent actual Core result saves the hero only once');
   assert.equal(afterMigrationBattle.world.last.type,'resolved');
   await page.getByRole('button',{name:'Revenir au profil initial'}).tap();
   await page.locator('#hub-migration-detail[data-status="revert-blocked"]').waitFor();
   const blocked=await page.evaluate(()=>({
    hero:loadState('trainer-preview'),
    world:captureWorldState(),
    writes:globalThis.capturePreviewHeroWrites
   }));
   assert.deepEqual(blocked,afterMigrationBattle,
    'the original 17HP member must not be restored after official Combat');
   assert.deepEqual(pageErrors,[]);
   assert.ok(outbound.every(url=>/^https:\/\/raw\.githubusercontent\.com\/slyen4425-cloud\/GenSrpg_labo_combat_dynamique\/[0-9a-f]{40}\/assets\/library\//.test(url)),
    'external media must be official immutable SHA only');
   await context.close();
  }catch(err){if(page)t.diagnostic((await page.locator('body').innerText().catch(()=>'' )).slice(0,5000));throw err;}
  finally{await browser?.close();server.closeAllConnections();await new Promise(resolve=>server.close(resolve));}
 });
}
