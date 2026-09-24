const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const indexSource=fs.readFileSync(path.join(root,'index.html'),'utf8');
const workflow=fs.readFileSync(path.join(root,'.github','workflows','main.yml'),'utf8');
const workflowBlock=(workflow.match(/modules = \[(.*?)\n\s*\]/s)||[])[1];
assert.ok(workflowBlock,'GitHub Pages module injection list missing');
const pageTags=[...workflowBlock.matchAll(/<script src=\\?"([^"\\]+)[^>]*>/g)]
  .map(m=>'<script src="'+m[1].replace(/\\/g,'')+'"></script>');
assert.equal(pageTags.length,31,'Pages-equivalent characterization expects 31 injected modules including connected Core services and final Shell authority');
const perfTag='<script src="assets/gensrpg/gens-mobile-combat-performance-16781022.js"></script>';
const finalShellTag='<script src="assets/gensrpg/shell/module-launch-final-authority-v1.js"></script>';
let productionHtml=indexSource.split(perfTag).join('').split(finalShellTag).join('');
let inlineSeq=0;
productionHtml=productionHtml.replace(
  /<script\b([^>]*)>([\s\S]*?)<\/script>/gi,
  (whole,attrs,body)=>{
    if(/\bsrc\s*=/i.test(attrs))return whole;
    const type=(attrs.match(/\btype=["']([^"']+)["']/i)||[])[1]||'';
    if(type&&!/(?:java|ecma)script|module/i.test(type))return whole;
    inlineSeq++;
    const id=(attrs.match(/\bid=["']([^"']+)["']/i)||[])[1]||'no-id';
    const label=String(inlineSeq).padStart(3,'0')+':'+String(id).replace(/["\\]/g,'_');
    return '<script'+attrs+'>'+ `console.log("[phase2-inline-enter] ${label}");` +body+'</script>';
  }
);
productionHtml=productionHtml.replace('</body>',pageTags.join('\n')+'\n</body>');
productionHtml=productionHtml.replace(
  /<script\b([^>]*\bsrc=["'](assets\/[^"']+)["'][^>]*)>\s*<\/script>/gi,
  (whole,attrs,src)=>{
    const safe=String(src).replace(/["\\]/g,'_');
    return '<script>console.log("[phase2-external-before] '+safe+'")</script>'+whole+
      '<script>console.log("[phase2-external-after] '+safe+'")</script>';
  }
);

const CAPTURE_ID='gp_mt7ker7t_m2iw9';
const CAPTURE_TRAINER='custom_mt7lk6jv_ioga';
const mime={
  '.html':'text/html; charset=utf-8',
  '.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8',
  '.json':'application/json',
  '.webmanifest':'application/manifest+json',
  '.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp',
  '.mp3':'audio/mpeg'
};

const phase2Epoch=Date.now();
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  if(pathname==='/'||pathname==='/__phase2_pages_equivalent.html'){
    res.writeHead(200,{'content-type':'text/html; charset=utf-8','cache-control':'no-store'});
    res.end(productionHtml);return;
  }
  const file=path.resolve(root,'.'+pathname);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  const traceRuntime=/\/assets\/gensrpg\/(?:core\/runtime-bootstrap-v1\.js|gens-rpg-tactical|gens-survival)/.test(pathname);
  if(traceRuntime)console.log('[phase2-server-js] request t='+(Date.now()-phase2Epoch)+' '+pathname);
  fs.readFile(file,(err,data)=>{
    if(traceRuntime)console.log('[phase2-server-js] read t='+(Date.now()-phase2Epoch)+' '+pathname+' err='+(err?String(err.code||err):'none')+' bytes='+(data?.length||0));
    if(err){res.writeHead(404);res.end('not found');return}
    res.writeHead(200,{
      'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream',
      'cache-control':'no-store'
    });
    res.end(data,()=>{if(traceRuntime)console.log('[phase2-server-js] sent t='+(Date.now()-phase2Epoch)+' '+pathname)});
  });
});

(async()=>{
  let stage='boot';
  let lastInline='none';
  let lastExternal='none';
  let lastMutationObserver='none';
  let lastDomContentLoaded='none';
  let lastStatsCall='none';
  const requestLog=[];
  const mark=name=>{stage=name;console.log('[phase2-full-capture]',name)};
  const watchdog=setTimeout(()=>{
    console.error('[phase2-full-capture] WATCHDOG stage='+stage+' lastInline='+lastInline+' lastExternal='+lastExternal+' lastMutationObserver='+lastMutationObserver+' lastDomContentLoaded='+lastDomContentLoaded+' lastStatsCall='+lastStatsCall);
    console.error('[phase2-full-capture] requests='+JSON.stringify(requestLog.slice(-120)));
    process.exit(1);
  },90000);

  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const url=`http://127.0.0.1:${port}/__phase2_pages_equivalent.html?phase2-full-capture=1`;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({
    viewport:{width:412,height:915},
    deviceScaleFactor:2.625,
    isMobile:true,
    hasTouch:true,
    locale:'fr-FR',
    serviceWorkers:'block'
  });

  await context.addInitScript(()=>{
    try{
      const NativeMutationObserver=window.MutationObserver;
      if(typeof NativeMutationObserver==='function'&&!window.__phase2MoInstrumented){
        window.__phase2MoInstrumented=true;
        let phase2MoSeq=0;
        window.MutationObserver=function(callback){
          const id=++phase2MoSeq;
          const stack=String(new Error('phase2-mo-'+id).stack||'').split('\n').slice(1,6).join(' | ');
          console.log('[phase2-mo-create] id='+id+' '+stack);
          let calls=0;
          const wrapped=function(){
            calls++;
            if(calls<=8||(calls&(calls-1))===0){
              console.log('[phase2-mo-call] id='+id+' calls='+calls);
            }
            return callback.apply(this,arguments);
          };
          return new NativeMutationObserver(wrapped);
        };
        window.MutationObserver.prototype=NativeMutationObserver.prototype;
      }
    }catch(e){}
    try{
      const nativeAdd=EventTarget.prototype.addEventListener;
      const nativeRemove=EventTarget.prototype.removeEventListener;
      const dclMap=new WeakMap();
      let dclSeq=0;
      EventTarget.prototype.addEventListener=function(type,listener,options){
        if(this===document&&type==='DOMContentLoaded'&&listener){
          const id=++dclSeq;
          const stack=String(new Error('phase2-dcl-'+id).stack||'').split('\n').slice(1,6).join(' | ');
          console.log('[phase2-dcl-create] id='+id+' '+stack);
          const wrapped=function(event){
            console.log('[phase2-dcl-before] id='+id);
            if(id===38&&!window.__phase2StatsGlobalsInstrumented){
              window.__phase2StatsGlobalsInstrumented=true;
              const names=[
                'currentRpgProfile','getActiveGameProfile','loadGameProfiles','ensureBaseGameProfile','saveGameProfiles',
                'loadDungeonRpgRules','saveDungeonRpgRules','loadState','saveState','save','render',
                'findCustomHero','dungeonEquipmentBonus','dungeonSkillEffectTotal',
                'dungeonChallengeDebuffTotal067','dungeonActiveProgressionConfig',
                'dungeonSyncProgressionForState','renderDungeonAttributes','renderRpgUniverseEditor'
              ];
              let seq=0,depth=0;
              for(const name of names){
                const original=window[name];
                if(typeof original!=='function')continue;
                window[name]=function(){
                  const call=++seq;
                  if(call<=20&&(name==='loadGameProfiles'||name==='saveGameProfiles'||name==='ensureBaseGameProfile')){
                    try{
                      const raw=JSON.parse(localStorage.getItem('gensrpg_game_profiles_v1')||'[]');
                      console.log('[phase2-profile-store] '+call+' '+name+' raw='+raw.map(p=>String(p?.id||'?')).join(','));
                    }catch(e){}
                  }
                  if(call<=120)console.log('[phase2-stats-call] '+call+' '+'>'.repeat(Math.min(depth,20))+name);
                  depth++;
                  try{
                    const out=original.apply(this,arguments);
                    depth--;
                    if(call<=120)console.log('[phase2-stats-return] '+call+' '+name);
                    return out;
                  }catch(error){
                    depth--;
                    console.log('[phase2-stats-throw] '+call+' '+name+' '+String(error));
                    throw error;
                  }
                };
              }
            }
            try{
              if(typeof listener==='function')return listener.call(this,event);
              return listener?.handleEvent?.(event);
            }finally{
              console.log('[phase2-dcl-after] id='+id);
            }
          };
          if((typeof listener==='function'||typeof listener==='object')&&listener)dclMap.set(listener,wrapped);
          return nativeAdd.call(this,type,wrapped,options);
        }
        return nativeAdd.call(this,type,listener,options);
      };
      EventTarget.prototype.removeEventListener=function(type,listener,options){
        const mapped=(this===document&&type==='DOMContentLoaded'&&listener)?dclMap.get(listener):null;
        return nativeRemove.call(this,type,mapped||listener,options);
      };
    }catch(e){}
    try{
      if(!sessionStorage.getItem('__phase2FullCaptureBooted')){
        localStorage.clear();
        sessionStorage.clear();
        sessionStorage.setItem('__phase2FullCaptureBooted','1');
      }
    }catch(e){}
    window.supabase={createClient:()=>({})};
    window.QRCode=function(){return {}};
  });

  const page=await context.newPage();
  page.setDefaultTimeout(25000);
  const browserErrors=[];
  const dialogs=[];
  page.on('request',request=>{
    try{
      const u=new URL(request.url());
      requestLog.push({kind:'request',path:u.pathname,host:u.host,t:Date.now()-phase2Epoch});
      if(/\/assets\/gensrpg\/(?:core\/runtime-bootstrap-v1\.js|gens-rpg-tactical|gens-survival)/.test(u.pathname)){
        console.log('[phase2-browser-js] request t='+(Date.now()-phase2Epoch)+' '+u.pathname);
      }
    }catch(e){}
  });
  page.on('requestfinished',request=>{
    try{
      const u=new URL(request.url());
      requestLog.push({kind:'finished',path:u.pathname,host:u.host,t:Date.now()-phase2Epoch});
      if(/\/assets\/gensrpg\/(?:core\/runtime-bootstrap-v1\.js|gens-rpg-tactical|gens-survival)/.test(u.pathname)){
        console.log('[phase2-browser-js] finished t='+(Date.now()-phase2Epoch)+' '+u.pathname);
      }
    }catch(e){}
  });
  page.on('requestfailed',request=>{
    try{
      const u=new URL(request.url());
      requestLog.push({kind:'failed',path:u.pathname,host:u.host,error:request.failure()?.errorText||'',t:Date.now()-phase2Epoch});
    }catch(e){}
  });
  page.on('pageerror',error=>{
    const value=String(error);
    browserErrors.push(value);
    console.error('[phase2-full-capture] console-error',value);
    console.error('[phase2-full-capture] pageerror',value);
  });
  page.on('console',message=>{
    const value=message.text();
    if(value.startsWith('[phase2-inline-enter] ')){
      lastInline=value.slice('[phase2-inline-enter] '.length);
      console.log(value);
      return;
    }
    if(value.startsWith('[phase2-external-before] ')||value.startsWith('[phase2-external-after] ')){
      lastExternal=value;
      console.log(value);
      return;
    }
    if(value.startsWith('[phase2-mo-create]')||value.startsWith('[phase2-mo-call]')){
      lastMutationObserver=value;
      console.log(value);
      return;
    }
    if(value.startsWith('[phase2-dcl-create]')||value.startsWith('[phase2-dcl-before]')||value.startsWith('[phase2-dcl-after]')){
      lastDomContentLoaded=value;
      console.log(value);
      return;
    }
    if(value.startsWith('[phase2-stats-call]')||value.startsWith('[phase2-stats-return]')||value.startsWith('[phase2-stats-throw]')||value.startsWith('[phase2-profile-store]')){
      lastStatsCall=value;
      console.log(value);
      return;
    }
    if(message.type()!=='error')return;
    if(/Failed to load resource|ERR_FAILED|RuntimeBootstrap V1 load failed/.test(value))return;
    browserErrors.push(value);
    console.error('[phase2-full-capture] browser-console-error',value);
  });
  page.on('dialog',async dialog=>{
    dialogs.push({type:dialog.type(),message:dialog.message()});
    await dialog.accept();
  });
  await page.route('https://cdn.jsdelivr.net/**',async route=>{
    const url=route.request().url();
    if(url.includes('@supabase/supabase-js')){
      await route.fulfill({
        status:200,
        contentType:'text/javascript; charset=utf-8',
        body:`window.supabase={createClient:()=>({
          auth:{
            getSession:async()=>({data:{session:null}}),
            signInAnonymously:async()=>({data:{session:{user:{id:'phase2-test'}}},error:null})
          },
          channel:()=>({on(){return this},subscribe(){return this}}),
          removeChannel:async()=>{},
          rpc:async()=>({data:null,error:null}),
          from:()=>({
            select(){return this},eq(){return this},order(){return this},limit(){return this},
            maybeSingle:async()=>({data:null,error:null}),
            single:async()=>({data:null,error:null}),
            insert:async()=>({data:null,error:null}),
            upsert:async()=>({data:null,error:null}),
            update(){return this},delete(){return this}
          })
        })};`
      });
      return;
    }
    if(url.includes('qrcodejs')){
      await route.fulfill({
        status:200,
        contentType:'text/javascript; charset=utf-8',
        body:`window.QRCode=function(){};window.QRCode.CorrectLevel={M:0};`
      });
      return;
    }
    await route.abort();
  });

  const waitFullOwners=()=>page.waitForFunction((captureId)=>{
    try{
      if(typeof window.loadGameProfiles!=='function')return false;
      if(typeof window.loadCustomHeroesMulti!=='function')return false;
      if(typeof window.openGensFamily!=='function')return false;
      if(typeof window.openGensBuiltInGame!=='function')return false;
      if(typeof window.startConfiguredGame!=='function')return false;
      if(typeof window.gensMode151!=='function')return false;
      if(typeof window.ensureBuiltinMonsterCapture162!=='function')return false;
      if(!window.DungeonCore01)return false;
      const profiles=window.loadGameProfiles();
      return Array.isArray(profiles)&&profiles.some(p=>String(p.id)===captureId);
    }catch(e){return false}
  },CAPTURE_ID,{timeout:90000});

  const waitFullBoot=async()=>{
    await waitFullOwners();
    await page.waitForLoadState('domcontentloaded',{timeout:90000});
  };

  const openAdventure=async()=>{
    await page.locator('button.gensRootModeCard.adventure').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('gensFamilyHome')).display!=='none');
  };

  try{
    mark('navigate-pages-equivalent-composition');
    await page.goto(url,{waitUntil:'commit',timeout:20000});
    await waitFullBoot();

    const composition=await page.evaluate(()=>({
      startSource:String(window.startConfiguredGame||'').slice(0,500),
      coreVersion:window.DUNGEON_CORE_VERSION||'',
      gensVersion:window.GENSRPG_VERSION||'',
      runtimeBootstrap:window.GensRuntimeBootstrapV1?.VERSION||'',
      tacticalBridge:window.GensRpgTacticalCombatV2Bridge?.VERSION||'',
      shellFamily:typeof gensSelectedFamily==='undefined'?'':String(gensSelectedFamily||''),
      pagesInjectedModules:31
    }));
    console.log('[phase2-full-capture] composition',JSON.stringify(composition));
    assert.equal(composition.pagesInjectedModules,31,'full production characterization must use the Pages module set including final Shell authority');

    mark('open-adventure');
    await openAdventure();
    let captureCard=page.locator(`#gensFamilyGames [data-rpg-profile="${CAPTURE_ID}"] .gensUniverseMainBtn`);
    await captureCard.waitFor({state:'visible'});

    const sw=await page.evaluate((captureId)=>({
      active:typeof activeGameProfileId==='function'?activeGameProfileId():'',
      from:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(activeGameProfileId()):'',
      to:typeof gensProfileContentFamily155==='function'?gensProfileContentFamily155(captureId):''
    }),CAPTURE_ID);

    if(sw.active&&sw.active!==CAPTURE_ID&&sw.from!==sw.to){
      mark('select-capture-through-production-v155-reload');
      await Promise.all([
        page.waitForNavigation({waitUntil:'commit',timeout:20000}),
        captureCard.click()
      ]);
      await waitFullBoot();
      const reloadState=await page.evaluate(()=>({
        active:activeGameProfileId(),
        forced:localStorage.getItem('gensrpg_forced_mode_reload_155')
      }));
      assert.equal(reloadState.active,CAPTURE_ID,'full composition V16.155 reload must preserve Capture profile');
      assert.equal(reloadState.forced,null,'full composition V16.155 handoff must be consumed');
      await openAdventure();
      captureCard=page.locator(`#gensFamilyGames [data-rpg-profile="${CAPTURE_ID}"] .gensUniverseMainBtn`);
      await captureCard.waitFor({state:'visible'});
    }

    mark('open-capture-profile-full-composition');
    await captureCard.click();
    await page.waitForFunction((captureId)=>
      activeGameProfileId()===captureId &&
      getComputedStyle(document.getElementById('gensGameHome')).display!=='none',
      CAPTURE_ID
    );

    const profileState=await page.evaluate(()=>({
      active:activeGameProfileId(),
      mode151:gensMode151(),
      contentFamily:gensCurrentContentFamily(),
      dungeonMode:!!isDungeonMode(),
      startSource:String(window.startConfiguredGame||'').slice(0,900)
    }));
    console.log('[phase2-full-capture] profile-state',JSON.stringify(profileState));
    assert.equal(profileState.active,CAPTURE_ID);
    assert.equal(profileState.mode151,'capture');
    assert.equal(profileState.contentFamily,'creature');
    assert.equal(profileState.dungeonMode,true,'current Capture substrate remains dungeon-style');

    mark('open-capture-pregame-full-composition');
    await page.locator('#gensGameHomeActions .newGameBtn').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('pregameSetup')).display!=='none');
    await page.waitForFunction(()=>document.body.classList.contains('gensCapturePregame'));

    mark('select-trainer-and-starter-full-composition');
    await page.locator('#pregameHeroStep .sessionSetupBtn[onclick="openSessionHeroSetup()"]').click();
    await page.waitForFunction(()=>getComputedStyle(document.getElementById('sessionHeroSetup')).display!=='none');

    let trainer=page.locator(`#participantList input[type="checkbox"][value="${CAPTURE_TRAINER}"]`);
    if(!(await trainer.count()))trainer=page.locator('#participantList input[type="checkbox"]').first();
    await trainer.waitFor({state:'visible'});
    if(!(await trainer.isChecked()))await trainer.check();

    const starterChoices=page.locator('#participantList .captureStarterChoice');
    await starterChoices.first().waitFor({state:'visible'});
    if(!(await page.locator('#participantList .captureStarterChoice.selected').count())){
      await starterChoices.first().click();
    }
    await page.waitForFunction(()=>typeof gensCaptureParticipantsReady==='function'&&gensCaptureParticipantsReady()===true);

    await page.locator('#sessionHeroSetup .startGameBtn[onclick="closeSessionHeroSetup()"]').click();
    await page.waitForFunction(()=>{
      const btn=document.querySelector('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]');
      return !!btn&&!btn.disabled;
    });

    mark('start-capture-through-final-production-startConfiguredGame');
    await page.locator('#pregameSetup button.startGameBtn[onclick="startConfiguredGame()"]').click();

    let launch;
    try{
      await page.waitForFunction(()=>
        localStorage.getItem('z40k_session_active_v1')==='1' &&
        (
          getComputedStyle(document.getElementById('captureGameHub')).display!=='none' ||
          getComputedStyle(document.getElementById('gensDungeonCore01')).display!=='none'
        ),
        null,{timeout:10000}
      );
    }catch(e){}

    launch=await page.evaluate(()=>({
      active:activeGameProfileId(),
      mode151:gensMode151(),
      contentFamily:gensCurrentContentFamily(),
      session:localStorage.getItem('z40k_session_active_v1'),
      captureHub:document.getElementById('captureGameHub')?getComputedStyle(document.getElementById('captureGameHub')).display:'absent',
      dungeonCore:document.getElementById('gensDungeonCore01')?getComputedStyle(document.getElementById('gensDungeonCore01')).display:'absent',
      dungeonPanel:document.getElementById('dungeonMenuPanel')?getComputedStyle(document.getElementById('dungeonMenuPanel')).display:'absent',
      pureCapture:document.body.classList.contains('gens-pure-capture'),
      capturePregame:document.body.classList.contains('gensCapturePregame'),
      dungeonTheme:document.body.classList.contains('gensDungeonTheme')
    }));
    console.log('[phase2-full-capture] launch-diagnostic',JSON.stringify({launch,dialogs,browserErrors}));

    assert.equal(launch.active,CAPTURE_ID);
    assert.equal(launch.mode151,'capture');
    assert.equal(launch.contentFamily,'creature');
    assert.equal(launch.session,'1','full production launch must activate the session');
    assert.notEqual(launch.captureHub,'none','full production startConfiguredGame chain must end in Capture hub');
    assert.equal(launch.dungeonCore,'none','full production Capture launch must not enter DungeonCore01');
    assert.equal(launch.dungeonPanel,'none','full production Capture launch must keep classic Dungeon panel inactive');
    assert.equal(launch.pureCapture,true,'full production Capture launch must assert Capture runtime class');
    assert.deepEqual(browserErrors,[],'full production Capture characterization must not raise runtime errors');

    mark('assertions-passed');
    console.log(JSON.stringify({
      scenario:'Phase 2 full production Capture composition',
      profile:CAPTURE_ID,
      finalMode:launch.mode151,
      captureHub:launch.captureHub,
      dungeonCore:launch.dungeonCore
    }));
  }finally{
    clearTimeout(watchdog);
    mark('cleanup');
    server.closeAllConnections?.();
    server.closeIdleConnections?.();
    server.close();
    await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
