const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const indexSource=fs.readFileSync(path.join(root,'index.html'),'utf8');

const shellOwner=indexSource.indexOf('async function startConfiguredGame(){');
assert.ok(shellOwner>0,'real index.html must expose startConfiguredGame()');
const shellScriptEnd=indexSource.indexOf('</script>',shellOwner);
assert.ok(shellScriptEnd>shellOwner,'real index.html must close the Shell owner script');

const onlineMarker="let z40kRoomId = localStorage.getItem('z40k_online_room_id') || null;";
const onlineOwner=indexSource.indexOf(onlineMarker,shellScriptEnd);
assert.ok(onlineOwner>shellScriptEnd,'real index.html must expose online Shell support');
const onlineScriptStart=indexSource.lastIndexOf('<script',onlineOwner);
const onlineScriptEnd=indexSource.indexOf('</script>',onlineOwner);
assert.ok(onlineScriptStart>shellScriptEnd&&onlineScriptEnd>onlineOwner);

const customHeroOwner=indexSource.indexOf('function loadCustomHeroesMulti(){',onlineScriptEnd);
assert.ok(customHeroOwner>onlineScriptEnd,'real index.html must expose custom-content Shell support');
const customHeroScriptStart=indexSource.lastIndexOf('<script',customHeroOwner);
const customHeroScriptEnd=indexSource.indexOf('</script>',customHeroOwner);
assert.ok(customHeroScriptStart>onlineScriptEnd&&customHeroScriptEnd>customHeroOwner);

const core310Owner=indexSource.indexOf('const previousResume310=window.resumeGame;',customHeroScriptEnd);
assert.ok(core310Owner>customHeroScriptEnd,'real index.html must expose final Core 3.10 resume owner');
const core310ScriptStart=indexSource.lastIndexOf('<script',core310Owner);
const core310ScriptEnd=indexSource.indexOf('</script>',core310Owner);
assert.ok(core310ScriptStart>customHeroScriptEnd&&core310ScriptEnd>core310Owner);
const lastQuitOverride=indexSource.lastIndexOf('DungeonCore01.quit=function(){');
const lastResumeOverride=indexSource.lastIndexOf('window.resumeGame=function(){');
assert.ok(lastQuitOverride>=core310ScriptStart&&lastQuitOverride<core310ScriptEnd,'final Dungeon quit owner must remain Core 3.10');
assert.ok(lastResumeOverride>=core310ScriptStart&&lastResumeOverride<core310ScriptEnd,'final Dungeon resume owner must remain Core 3.10');

const shellPrefix=indexSource.slice(0,shellScriptEnd+'</script>'.length);
const onlineScript=indexSource.slice(onlineScriptStart,onlineScriptEnd+'</script>'.length);
const customScript=indexSource.slice(customHeroScriptStart,customHeroScriptEnd+'</script>'.length);
const postCustomTail=indexSource.slice(customHeroScriptEnd+'</script>'.length);
const realSaveQuitPage=shellPrefix+'\n'+onlineScript+'\n'+customScript+'\n'+postCustomTail;

const runtimeBootstrap=fs.readFileSync(path.join(root,'assets','gensrpg','core','runtime-bootstrap-v1.js'),'utf8');
assert.match(runtimeBootstrap,/gens-survival-mode-isolation-1678104\.js/,'production composition must keep the family/session guard');

const mime={
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg',
  '.jpeg':'image/jpeg','.webp':'image/webp','.mp3':'audio/mpeg'
};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(pathname==='/__gens_save_quit_resume_real.html'){
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
    res.end(realSaveQuitPage);return;
  }
  const rel=pathname==='/'?'/index.html':pathname;
  const file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end('not found');return}
    res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
    res.end(data);
  });
});

(async()=>{
  let stage='boot';
  const mark=name=>{stage=name;console.log('[save-quit-resume]',name)};
  const watchdog=setTimeout(()=>{console.error('[save-quit-resume] WATCHDOG stage='+stage);process.exit(1)},120000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR',serviceWorkers:'block'});
  await context.addInitScript(()=>{
    try{
      if(sessionStorage.getItem('__gensSaveQuitSentinelBoot')!=='1'){
        localStorage.clear();sessionStorage.clear();sessionStorage.setItem('__gensSaveQuitSentinelBoot','1');
      }
    }catch(e){}
    window.supabase={createClient:()=>({})};
  });
  const page=await context.newPage();
  page.setDefaultTimeout(25000);
  const browserErrors=[];
  const dialogs=[];
  page.on('pageerror',error=>browserErrors.push(String(error)));
  page.on('console',message=>{if(message.type()==='error')browserErrors.push(message.text())});
  page.on('dialog',async dialog=>{dialogs.push({type:dialog.type(),message:dialog.message()});await dialog.accept()});
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());

  const ensureGuard=async()=>{
    const ready=await page.evaluate(()=>window.GensSurvivalModeIsolation1678104?.VERSION==='1.0.0');
    if(!ready)await page.addScriptTag({url:`http://127.0.0.1:${port}/assets/gensrpg/gens-survival-mode-isolation-1678104.js`});
    await page.waitForFunction(()=>window.GensSurvivalModeIsolation1678104?.VERSION==='1.0.0');
  };
  const waitOwners=async()=>{
    await page.waitForFunction(()=>(
      typeof window.openGensFamily==='function'&&typeof window.openGensBuiltInGame==='function'&&
      typeof window.startConfiguredGame==='function'&&typeof window.resumeGame==='function'&&
      typeof window.DungeonCore01==='object'&&typeof window.dungeonDebug310==='function'
    ),null,{timeout:45000});
    await ensureGuard();
  };

  try{
    mark('open-real-shell');
    await page.goto(`http://127.0.0.1:${port}/__gens_save_quit_resume_real.html`,{waitUntil:'commit',timeout:45000});
    await waitOwners();

    mark('open-adventure-family');
    await page.locator('button.gensRootModeCard.adventure').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
    const games=page.locator('#gensFamilyGames button.gensFamilyGameCard:not(.disabled)');
    await games.first().waitFor({state:'visible'});
    await games.first().click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensGameHome')).display!=='none');
    let shell=await page.evaluate(()=>({
      id:activeGameProfileId?.()||'',style:getActiveGameProfile?.()?.gameStyle||'',family:window.GensSurvivalModeIsolation1678104?.storedFamily?.()||'',dungeon:!!isDungeonMode?.()
    }));
    assert.equal(shell.style,'dungeon','Adventure built-in must select the real Dungeon profile');
    assert.equal(shell.family,'adventure','family guard must record Adventure');
    assert.equal(shell.dungeon,true,'Adventure profile must resolve as Dungeon');

    mark('open-pregame');
    await page.locator('#gensGameHomeActions .newGameBtn').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameHeroStep')).display!=='none');
    await page.locator('#pregameHeroStep .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');
    const firstParticipant=page.locator('#participantList input[type="checkbox"]').first();
    await firstParticipant.waitFor({state:'visible'});
    if(!(await firstParticipant.isChecked()))await firstParticipant.check();
    await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameHeroStep')).display!=='none');

    mark('start-real-dungeon');
    await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();
    await page.waitForFunction(()=>localStorage.getItem('z40k_session_active_v1')==='1');
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensDungeonCore01')).display!=='none');
    await page.waitForFunction(()=>{try{const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');return Array.isArray(x?.participants)&&x.participants.length>0}catch(e){return false}},{},{timeout:25000});

    mark('explore-real-room');
    await page.locator('#dc01Explore').click();
    await page.waitForFunction(()=>{try{return Number(JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')?.room||0)>0}catch(e){return false}},null,{timeout:25000});
    const beforeQuit=await page.evaluate(()=>{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      return {room:Number(x?.room)||0,participants:[...(x?.participants||[])],last:x?.last||null,session:localStorage.getItem('z40k_session_active_v1')};
    });
    assert.ok(beforeQuit.room>0,'real Explore must create an observable Dungeon room before Save & Quit');
    assert.ok(beforeQuit.participants.length>0,'Dungeon runtime must retain real participants');

    mark('save-and-quit');
    await page.locator('#gensDungeonCore01 .dc01Top .dc01Btn').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensDungeonCore01')).display==='none');
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensRootHome')).display!=='none');
    const afterQuit=await page.evaluate(()=>({
      session:localStorage.getItem('z40k_session_active_v1'),
      runtime:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null'),
      root:getComputedStyle(document.getElementById('gensRootHome')).display
    }));
    assert.equal(afterQuit.session,'1','Save & Quit must preserve an active resumable session');
    assert.equal(Number(afterQuit.runtime?.room)||0,beforeQuit.room,'Save & Quit must persist the current Dungeon room');
    assert.deepEqual((afterQuit.runtime?.participants||[]).map(String),beforeQuit.participants.map(String),'Save & Quit must persist participants');

    mark('reload-context');
    await page.reload({waitUntil:'commit',timeout:45000});
    await waitOwners();
    await page.waitForFunction(()=>document.getElementById('resumeBtn')&&!document.getElementById('resumeBtn').disabled,null,{timeout:25000});
    const reloaded=await page.evaluate(()=>({
      session:localStorage.getItem('z40k_session_active_v1'),
      runtime:JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null'),
      core:getComputedStyle(document.getElementById('gensDungeonCore01')).display,
      root:getComputedStyle(document.getElementById('gensRootHome')).display
    }));
    assert.equal(reloaded.session,'1','reload must keep the resumable session marker');
    assert.equal(Number(reloaded.runtime?.room)||0,beforeQuit.room,'reload must keep the saved Dungeon room');
    assert.equal(reloaded.core,'none','Dungeon must not auto-open before the user clicks Reprendre');

    mark('click-real-resume');
    await page.locator('#resumeBtn').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensDungeonCore01')).display!=='none');
    const resumed=await page.evaluate(()=>{
      const x=JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null');
      return {
        room:Number(x?.room)||0,participants:[...(x?.participants||[])],session:localStorage.getItem('z40k_session_active_v1'),
        family:window.gensSelectedFamily||'',dungeonTheme:document.body.classList.contains('gensDungeonTheme'),
        debug:window.dungeonDebug310?.()||null,core:getComputedStyle(document.getElementById('gensDungeonCore01')).display
      };
    });
    assert.equal(resumed.room,beforeQuit.room,'Reprendre must restore the exact saved Dungeon room');
    assert.deepEqual(resumed.participants.map(String),beforeQuit.participants.map(String),'Reprendre must restore the same participants');
    assert.equal(resumed.session,'1','resumed Dungeon must remain an active session');
    assert.equal(resumed.family,'adventure','Core 3.10 resume must restore Adventure family authority');
    assert.equal(resumed.dungeonTheme,true,'Core 3.10 resume must restore Dungeon theme');
    assert.notEqual(resumed.core,'none','Dungeon UI must be visible after the real Resume click');
    assert.equal(resumed.debug?.saved,true,'Core 3.10 debug must see the persisted runtime');

    mark('assertions-passed');
    console.log(JSON.stringify({scenario:'Phase 1 Save & Quit + real reload/resume',room:resumed.room,participants:resumed.participants,dialogs:dialogs.map(d=>d.message)}));
  }catch(error){
    const diag=await page.evaluate(()=>({
      href:location.href,session:localStorage.getItem('z40k_session_active_v1'),family:window.GensSurvivalModeIsolation1678104?.storedFamily?.()||'',
      activeProfile:typeof getActiveGameProfile==='function'?(()=>{const p=getActiveGameProfile();return p?{id:p.id,name:p.name,style:p.gameStyle}:null})():null,
      runtime:(()=>{try{return JSON.parse(localStorage.getItem('gensrpg_dungeon_runtime_v2')||'null')}catch(e){return null}})(),
      root:document.getElementById('gensRootHome')?getComputedStyle(document.getElementById('gensRootHome')).display:'absent',
      core:document.getElementById('gensDungeonCore01')?getComputedStyle(document.getElementById('gensDungeonCore01')).display:'absent'
    })).catch(e=>({diagnosticError:String(e)}));
    console.error('[save-quit-resume] diagnostic',JSON.stringify({stage,diag,dialogs,browserErrors}));
    throw error;
  }finally{
    clearTimeout(watchdog);mark('cleanup');server.closeAllConnections?.();server.closeIdleConnections?.();server.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
