'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),http=require('node:http'),path=require('node:path');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..'),artifacts=path.join(root,'artifacts','gensrpg-survival-editor');
const CAPTURE_ID='gp_mt7ker7t_m2iw9',BASE_ID='game_profile_zombicide_base',CUSTOM_ID='editor-survival-custom';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
 '.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
 const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
 const file=path.resolve(root,'.'+(pathname==='/'?'/preview.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
 fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end('not found');return}
  res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(data)});
});
const evidence=[];let stage='boot';
function mark(value){stage=value;console.log('[survival-editor] '+value)}
async function ready(page){
 await page.waitForFunction(()=>document.documentElement.dataset.gensrpgPreviewReady==='1'&&
  typeof window.currentSmodProfile==='function'&&typeof window.GensCaptureV1?.isProfile==='function'&&
  typeof window.gensShellActiveModuleV1==='function',null,{timeout:60000});
}
async function family(page,name){
 await page.locator('button.gensRootModeCard.'+name).click();
 await page.locator('#gensFamilyHome').waitFor({state:'visible'});
}
async function modesFromGame(page){
 await page.locator('#gensGameHome button[onclick="backToGensFamily()"]').click();
 await page.locator('#gensFamilyHome button[onclick="showGensRootHome()"]').click();
}
async function select(page,name,id){
 await family(page,name);
 const selector=name==='adventure'?'#gensFamilyGames [data-rpg-profile="'+id+'"] .gensUniverseMainBtn':
  '#gensFamilyGames button[onclick="openGensBuiltInGame(\''+id+'\',\'survival\')"]';
 let card=page.locator(selector);await card.waitFor({state:'visible'});
 const reload=await page.evaluate(id=>activeGameProfileId()!==id&&
  gensProfileContentFamily155(activeGameProfileId())!==gensProfileContentFamily155(id),id);
 if(reload){
  await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:60000}),card.click()]);
  await ready(page);await family(page,name);card=page.locator(selector);
 }
 await card.click();
 await page.waitForFunction(id=>activeGameProfileId()===id&&
  getComputedStyle(document.getElementById('gensGameHome')).display!=='none',id);
}
async function storedProfiles(page){return page.evaluate(()=>JSON.parse(localStorage.getItem('gensrpg_game_profiles_v1')))}
const profile=id=>page=>page.evaluate(id=>loadGameProfiles().find(p=>p.id===id),id);

(async()=>{
 const watchdog=setTimeout(()=>{console.error('[survival-editor] WATCHDOG '+stage);process.exit(1)},360000);
 fs.mkdirSync(artifacts,{recursive:true});await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url='http://127.0.0.1:'+server.address().port+'/preview.html';
 const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 try{
  for(const device of [
   {name:'mobile',viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true},
   {name:'desktop',viewport:{width:1366,height:768},deviceScaleFactor:1,isMobile:false,hasTouch:false}
  ]){
   const {name,...options}=device;
   const context=await browser.newContext({...options,locale:'fr-FR',serviceWorkers:'block'});
   // Existing sentinel policy: isolate the external online client only.
   await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
   const page=await context.newPage();page.setDefaultTimeout(20000);
   const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('dialog',d=>d.accept().catch(()=>{}));
   await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
   const row={device:name};evidence.push(row);
   try{
    mark(name+'-real-preview');await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});await ready(page);
    row.fixtures=await page.evaluate(({captureId,baseId,customId})=>{
     ensureBuiltinMonsterCapture162();ensureBaseGameProfile();
     const profiles=loadGameProfiles(),capture=profiles.find(p=>p.id===captureId),base=profiles.find(p=>p.id===baseId);
     if(!capture||!base||!GensCaptureV1.isProfile(capture))throw Error('real reference profiles required');
     ensureSurvivalProfileData(base);
     const clone=(p,id)=>{const copy={...JSON.parse(JSON.stringify(p)),id,name:id,builtIn:false};delete copy.factory;return copy};
     const custom=clone(base,customId);ensureSurvivalProfileData(custom);
     const clean=clone(capture,'editor-capture-clean');delete clean.gameStyle;delete clean.survival;
     const historical=clone(capture,'editor-capture-historical');historical.gameStyle='dungeon';ensureRpgProfileData(historical);
     const modules=clone(capture,'editor-capture-modules');delete modules.gameStyle;
     modules.rpgUniverse.gameplay.profile='custom';modules.rpgUniverse.gameplay.modules.capture=true;
     modules.rpgUniverse.gameplay.modules.controllableCreatures=true;
     const contradictory=clone(capture,'editor-capture-survival-style');contradictory.gameStyle='survival';
     contradictory.survival=JSON.parse(JSON.stringify(base.survival));
     profiles.push(custom,clean,historical,modules,contradictory);saveGameProfiles(profiles);
     return {captures:[captureId,clean.id,historical.id,modules.id,contradictory.id],customId};
    },{captureId:CAPTURE_ID,baseId:BASE_ID,customId:CUSTOM_ID});

    mark(name+'-real-capture-selection');await select(page,'adventure',CAPTURE_ID);
    row.captureRead=await page.evaluate(()=>{
     const before=localStorage.getItem('gensrpg_game_profiles_v1'),activeBefore=activeGameProfileId();
     const activeEditorId=activeSurvivalModId();openSurvivalModEditor();
     return {activeEditorId,currentEditorId:currentSmodProfile()?.id,selectValue:document.getElementById('smodProfileSelect').value,
      activeBefore,activeAfter:activeGameProfileId(),profilesUnchanged:before===localStorage.getItem('gensrpg_game_profiles_v1')};
    });
    assert.equal(row.captureRead.activeEditorId,BASE_ID,'Capture must not be selected by the Survival editor in real preview');
    assert.equal(row.captureRead.currentEditorId,BASE_ID);assert.equal(row.captureRead.selectValue,BASE_ID);
    assert.equal(row.captureRead.activeAfter,CAPTURE_ID);assert.equal(row.captureRead.profilesUnchanged,true);
    const rejected=await page.evaluate(ids=>{
     const snapshot=()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])));
     const before=snapshot(),editorBefore=smodEditingId;
     for(const id of ids){setActiveSurvivalMod(id);selectSurvivalModProfile(id);}
     return {before,after:snapshot(),editorBefore,editorAfter:smodEditingId,active:activeGameProfileId()};
    },row.fixtures.captures);
    assert.equal(rejected.after,rejected.before,'foreign public selections must preserve all persistent keys');
    assert.equal(rejected.editorAfter,rejected.editorBefore);assert.equal(rejected.active,CAPTURE_ID);
    await page.screenshot({path:path.join(artifacts,name+'-capture-safe-editor.png'),fullPage:true});
    await page.locator('#survivalModEditorModal [onclick="closeSurvivalModEditor()"]').click();
    await modesFromGame(page);

    mark(name+'-edit-real-survival');await select(page,'survival',CUSTOM_ID);
    await page.locator('#gensGameHome .homeEditorsBtn').click();
    await page.locator('#editorHub').waitFor({state:'visible'});
    await page.locator('#survivalModEditorHubBtn').click();
    await page.locator('#survivalModEditorModal').waitFor({state:'visible'});
    assert.equal(await page.evaluate(()=>currentSmodProfile()?.id),CUSTOM_ID);
    row.foreignBefore=(await storedProfiles(page)).filter(p=>row.fixtures.captures.includes(p.id));
    await page.locator('#smodName').fill('Survie personnalisée '+name);
    await page.locator('#smodDesc').fill('Réglages conservés après reprise');
    await page.locator('#smodTab_identity [onclick="saveSurvivalModIdentity()"]').click();
    await page.locator('[onclick="showSurvivalModTab(\'progression\')"]').click();
    await page.locator('#smodXpCap').fill('245');await page.locator('#smodBaseActions').fill('6');
    await page.locator('#smodTab_progression [onclick="saveSurvivalModProgression()"]').click();
    await page.locator('[onclick="showSurvivalModTab(\'rules\')"]').click();
    await page.locator('#smodBaseHp').fill('7');await page.locator('#smodXpMultiplier').fill('2.4');
    await page.locator('#smodLootMultiplier').fill('3.5');await page.locator('#smodKeepGear').selectOption('false');
    await page.locator('#smodTab_rules [onclick="saveSurvivalModRules()"]').click();
    await page.locator('[onclick="showSurvivalModTab(\'waves\')"]').click();
    await page.locator('#smodWaveRules .smodWaveMult').first().fill('1.8');
    await page.locator('#smodWaveRules .smodWaveDouble').first().fill('25');
    await page.locator('#smodTab_waves [onclick="saveSurvivalModWaveRules()"]').click();
    row.saved=await profile(CUSTOM_ID)(page);
    assert.equal(row.saved.name,'Survie personnalisée '+name);assert.equal(row.saved.survival.xpCap,245);
    assert.equal(row.saved.survival.baseActions,6);assert.equal(row.saved.survival.rules.baseHp,7);
    assert.equal(row.saved.survival.rules.xpMultiplier,2.4);assert.equal(row.saved.survival.rules.lootMultiplier,3.5);
    assert.equal(row.saved.survival.rules.keepGear,false);assert.equal(row.saved.survival.levels[0].waveMultiplier,1.8);
    assert.equal(row.saved.survival.levels[0].doubleWaveChance,25);
    assert.deepEqual((await storedProfiles(page)).filter(p=>row.fixtures.captures.includes(p.id)),row.foreignBefore,
     'real Survival saves must preserve complete foreign Capture profiles');
    await page.screenshot({path:path.join(artifacts,name+'-survival-custom-settings.png'),fullPage:true});

    mark(name+'-stale-selection-through-real-profile-data');
    row.stale=await page.evaluate(({customId,captureId})=>{
     const profiles=loadGameProfiles(),target=profiles.find(p=>p.id===customId),capture=profiles.find(p=>p.id===captureId);
     const original=JSON.parse(JSON.stringify(target));
     if(smodEditingId!==customId)throw Error('native editor selection must precede profile change');
     target.rpgUniverse=JSON.parse(JSON.stringify(capture.rpgUniverse));target.gameStyle='survival';
     saveGameProfiles(profiles);
     if(!GensCaptureV1.isProfile(loadGameProfiles().find(p=>p.id===customId)))throw Error('real canonical Capture identity required');
     const snapshot=()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)])));
     const before=snapshot(),actions=['saveSurvivalModPools','addSurvivalThreatLevel','removeSurvivalThreatLevel',
      'saveSurvivalModIdentity','saveSurvivalModProgression','saveSurvivalModRules','saveSurvivalModWaveRules',
      'duplicateSurvivalModProfile','deleteSurvivalModProfile'];
     for(const action of actions)window[action](0);
     const after=snapshot();
     const final=loadGameProfiles(),i=final.findIndex(p=>p.id===customId);final[i]=original;saveGameProfiles(final);
     return {before,after,actions,foreignSelectionId:customId};
    },{customId:CUSTOM_ID,captureId:CAPTURE_ID});
    assert.equal(row.stale.after,row.stale.before,'all nine native stale-selection actions must preserve every stored key');
    row.staleProtected=true;
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});await ready(page);
    await select(page,'survival',CUSTOM_ID);
    await page.locator('#gensGameHome .homeEditorsBtn').click();await page.locator('#survivalModEditorHubBtn').click();
    row.reloaded=await profile(CUSTOM_ID)(page);
    assert.deepEqual(row.reloaded,row.saved,'real saved personalized Survival profile must survive reload byte-for-byte structurally');
    assert.equal(await page.locator('#smodName').inputValue(),row.saved.name);
    await page.locator('[onclick="showSurvivalModTab(\'progression\')"]').click();
    assert.equal(await page.locator('#smodXpCap').inputValue(),'245');assert.equal(await page.locator('#smodBaseActions').inputValue(),'6');
    await page.locator('[onclick="showSurvivalModTab(\'rules\')"]').click();
    assert.equal(await page.locator('#smodBaseHp').inputValue(),'7');
    assert.equal(await page.locator('#smodXpMultiplier').inputValue(),'2.4');
    assert.deepEqual((await storedProfiles(page)).filter(p=>row.fixtures.captures.includes(p.id)),row.foreignBefore);
    assert.deepEqual(errors,[],'real editor path must not raise runtime errors');
    mark(name+'-passed');
   }finally{
    row.errors=errors;fs.writeFileSync(path.join(artifacts,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');
    await context.close();
   }
  }
  console.log(JSON.stringify({scenario:'Phase 9 real-preview canonical Survival editor',devices:evidence.map(x=>x.device),
   personalizedSettingsPersisted:true,foreignSelectionsRejected:true,staleNativeWritersBlocked:9}));
 }finally{
  clearTimeout(watchdog);await browser.close();server.closeAllConnections?.();server.closeIdleConnections?.();
  await new Promise(resolve=>server.close(resolve));
 }
})().catch(error=>{console.error(error);process.exitCode=1});
