'use strict';

const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.join(__dirname,'..');
const artifacts=path.join(root,'artifacts','gensrpg-survival-library');
const CAPTURE_ID='gp_mt7ker7t_m2iw9';
const DUNGEON_ID='game_profile_dungeon_demo';
const BASE_ID='game_profile_zombicide_base';
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8',
  '.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png',
  '.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/preview.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return}
  fs.readFile(file,(error,data)=>{
    if(error){res.writeHead(404);res.end('not found');return}
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});
    res.end(data);
  });
});
let stage='boot';
const evidence=[];
function mark(value){stage=value;console.log('[survival-library] '+value)}
async function ready(page){
  await page.waitForFunction(()=>document.documentElement.dataset.gensrpgPreviewReady==='1'&&
    typeof window.survivalProfiles==='function'&&typeof window.gensContentFamilyForProfile==='function'&&
    typeof window.GensCaptureV1?.isProfile==='function'&&typeof window.gensShellActiveModuleV1==='function',
    null,{timeout:60000});
}
async function persisted(page){
  return page.evaluate(()=>Object.fromEntries([
    'gensrpg_game_profiles_v1','gensrpg_game_profile_active_v1','gensrpg_dungeon_runtime_v2',
    'gensrpg_dungeon_state_v1','gensrpg_capture_battle_current_v1','gensrpg_capture_next_battle_rules_v1',
    'gensrpg_game_participants_v1','z40k_session_active_v1'
  ].map(key=>[key,localStorage.getItem(key)])));
}
async function assertPersisted(page,before,reason){
  const after=await persisted(page);
  const changed=Object.keys(before).filter(key=>after[key]!==before[key]);
  if(changed.length){
    const differences=[];
    const visit=(a,b,pointer)=>{
      if(differences.length>=20||JSON.stringify(a)===JSON.stringify(b))return;
      if(a&&b&&typeof a==='object'&&typeof b==='object'){
        for(const key of new Set([...Object.keys(a),...Object.keys(b)]))visit(a[key],b[key],pointer+'/'+key);
      }else differences.push({pointer,before:a,after:b});
    };
    try{visit(JSON.parse(before.gensrpg_game_profiles_v1),JSON.parse(after.gensrpg_game_profiles_v1),'profiles')}catch(e){}
    console.error('[survival-library] persistent-difference '+JSON.stringify({changed,differences}));
  }
  assert.deepEqual(changed,[],reason);
}
async function backToModes(page){
  await page.locator('#gensFamilyHome button[onclick="showGensRootHome()"]').click();
  await page.locator('#gensRootHome').waitFor({state:'visible'});
}
async function family(page,name){
  await page.locator('button.gensRootModeCard.'+name).click();
  await page.locator('#gensFamilyHome').waitFor({state:'visible'});
}
async function survivalIds(page){
  return page.evaluate(()=>Array.from(document.querySelectorAll('#gensFamilyGames button[onclick]'),
    button=>button.getAttribute('onclick')?.match(/^openGensBuiltInGame\('([^']+)'/ )?.[1]).filter(Boolean));
}
async function adventureIds(page){
  return page.locator('#gensFamilyGames [data-rpg-profile]').evaluateAll(cards=>cards.map(c=>c.dataset.rpgProfile));
}
function checkSurvival(ids,captures,survivals){
  assert.equal(ids.includes(CAPTURE_ID),false,'built-in Capture must be absent from Survival DOM');
  for(const id of captures)assert.equal(ids.includes(id),false,'canonical Capture must be absent from Survival DOM: '+id);
  assert.equal(ids.includes(DUNGEON_ID),false,'classic Dungeon must stay outside Survival DOM');
  assert.equal(ids.includes('library-manga'),false,'Manga must stay outside Survival DOM');
  for(const id of survivals)assert.equal(ids.includes(id),true,'valid Survival profile must retain its real card: '+id);
}

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[survival-library] WATCHDOG '+stage);process.exit(1)},240000);
  fs.mkdirSync(artifacts,{recursive:true});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port+'/preview.html';
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  try{
    for(const device of [
      {name:'mobile',viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true},
      {name:'desktop',viewport:{width:1366,height:768},deviceScaleFactor:1,isMobile:false,hasTouch:false}
    ]){
      const {name,...options}=device;
      const context=await browser.newContext({...options,locale:'fr-FR',serviceWorkers:'block'});
      // Only the external online client is isolated, as in the existing real-preview sentinel.
      await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
      const page=await context.newPage();page.setDefaultTimeout(20000);
      const errors=[];
      page.on('pageerror',error=>errors.push(String(error)));
      page.on('dialog',dialog=>dialog.accept().catch(()=>{}));
      await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
      const row={device:name};evidence.push(row);
      try{
        mark(name+'-real-preview');
        await page.goto(url,{waitUntil:'domcontentloaded',timeout:60000});
        await ready(page);
        row.fixtures=await page.evaluate(({captureId,dungeonId,baseId})=>{
          // Complete the real idempotent seed/reference initialization before taking read-only snapshots.
          ensureBuiltinMonsterCapture162();
          ensureBaseGameProfile();
          const profiles=loadGameProfiles();
          const original=profiles.find(p=>p.id===captureId);
          const base=profiles.find(p=>p.id===baseId);
          const dungeon=profiles.find(p=>p.id===dungeonId);
          if(!original||!base||!dungeon)throw new Error('real built-in profiles required');
          if(!GensCaptureV1.isProfile(original))throw new Error('real built-in Capture identity required');
          ensureSurvivalProfileData(base);
          ensureRpgProfileData(dungeon);
          const clone=(source,id)=>{
            const copy={...JSON.parse(JSON.stringify(source)),id,name:id,builtIn:false};
            delete copy.factory;
            return copy;
          };
          const current=clone(original,'library-capture-new');delete current.gameStyle;
          const historical=clone(original,'library-capture-historical');historical.gameStyle='dungeon';
          const modules=clone(original,'library-capture-modules');delete modules.gameStyle;
          modules.rpgUniverse.gameplay.profile='custom';
          modules.rpgUniverse.gameplay.modules.capture=true;
          modules.rpgUniverse.gameplay.modules.controllableCreatures=true;
          const contradictory=clone(original,'library-capture-survival-style');contradictory.gameStyle='survival';
          const custom=clone(base,'library-survival-custom');custom.gameStyle='zombicide';
          const neutral=clone(base,'library-survival-neutral');delete neutral.gameStyle;
          const manga=clone(dungeon,'library-manga');manga.rpgUniverse.gameplay.profile='manga';
          manga.rpgUniverse.gameplay.modules.capture=false;
          manga.rpgUniverse.gameplay.modules.controllableCreatures=false;
          // A new Manga universe cannot inherit classic Dungeon content pools.
          manga.heroPool=[];manga.objectPool=[];manga.enemyConfig={};manga.enemyReserve={};manga.deck={};
          const added=[current,historical,modules,contradictory,custom,neutral,manga];
          profiles.push(...added);saveGameProfiles(profiles);
          return {
            captures:[captureId,current.id,historical.id,modules.id,contradictory.id],
            survivals:[baseId,custom.id,neutral.id],
            identities:added.map(p=>({id:p.id,style:p.gameStyle||'',family:gensContentFamilyForProfile(p),route:gensFamilyForProfileId(p.id)})),
            builtInStyle:original.gameStyle||''
          };
        },{captureId:CAPTURE_ID,dungeonId:DUNGEON_ID,baseId:BASE_ID});
        assert.equal(row.fixtures.builtInStyle,'','current built-in Capture must keep its retired Dungeon style absent');
        for(const item of row.fixtures.identities){
          const capture=row.fixtures.captures.includes(item.id);
          assert.equal(item.family,capture?'creature':item.id==='library-manga'?'manga':'survival');
          assert.equal(item.route,capture||item.id==='library-manga'?'adventure':'survival');
        }
        const before=await persisted(page);
        mark(name+'-open-survival');
        await family(page,'survival');
        row.survival=await survivalIds(page);
        console.log('[survival-library] actual-membership '+JSON.stringify({device:name,ids:row.survival}));
        checkSurvival(row.survival,row.fixtures.captures,row.fixtures.survivals);
        await page.screenshot({path:path.join(artifacts,name+'-survival.png'),fullPage:true});
        await assertPersisted(page,before,'opening Survival must not rewrite profiles, active selection or module saves');

        mark(name+'-open-adventure');
        await backToModes(page);await family(page,'adventure');
        row.adventure=await adventureIds(page);
        for(const id of [...row.fixtures.captures,DUNGEON_ID,'library-manga'])
          assert.equal(row.adventure.includes(id),true,'existing Adventure card must remain accessible: '+id);
        for(const id of row.fixtures.survivals)
          assert.equal(row.adventure.includes(id),false,'Survival card must remain outside Adventure: '+id);
        await page.screenshot({path:path.join(artifacts,name+'-adventure.png'),fullPage:true});
        await page.evaluate(()=>renderGensFamilyGamesIfVisible());
        assert.deepEqual(await adventureIds(page),row.adventure,'real visible-list refresh must preserve Adventure membership');
        await backToModes(page);await family(page,'survival');
        assert.deepEqual(await survivalIds(page),row.survival,'returning from Adventure must preserve Survival membership');
        await page.evaluate(()=>renderGensFamilyGamesIfVisible());
        assert.deepEqual(await survivalIds(page),row.survival,'real visible-list refresh must preserve Survival membership');
        await assertPersisted(page,before,'browsing and refreshing both libraries must preserve persistent state');
        row.persistentStateUnchanged=true;

        mark(name+'-reload-real-preview');
        await page.reload({waitUntil:'domcontentloaded',timeout:60000});await ready(page);
        await assertPersisted(page,before,'real reload must preserve complete profiles, active selection and module saves');
        await family(page,'survival');
        checkSurvival(await survivalIds(page),row.fixtures.captures,row.fixtures.survivals);
        await backToModes(page);await family(page,'adventure');

        mark(name+'-select-real-capture-card');
        let card=page.locator('#gensFamilyGames [data-rpg-profile="'+CAPTURE_ID+'"] .gensUniverseMainBtn');
        await card.waitFor({state:'visible'});
        const reload=await page.evaluate(id=>activeGameProfileId()!==id&&
          gensProfileContentFamily155(activeGameProfileId())!==gensProfileContentFamily155(id),CAPTURE_ID);
        if(reload){
          await Promise.all([page.waitForNavigation({waitUntil:'domcontentloaded',timeout:60000}),card.click()]);
          await ready(page);await family(page,'adventure');
          card=page.locator('#gensFamilyGames [data-rpg-profile="'+CAPTURE_ID+'"] .gensUniverseMainBtn');
        }
        await card.click();
        await page.waitForFunction(id=>activeGameProfileId()===id&&
          getComputedStyle(document.getElementById('gensGameHome')).display!=='none',CAPTURE_ID);
        row.selection=await page.evaluate(()=>({id:activeGameProfileId(),family:gensSelectedFamily,
          module:gensShellActiveModuleV1(),content:gensCurrentContentFamily(),dungeon:isDungeonMode(),
          dungeonRuntime:localStorage.getItem('gensrpg_dungeon_runtime_v2')}));
        assert.equal(row.selection.id,CAPTURE_ID);
        assert.equal(row.selection.family,'adventure');
        assert.equal(row.selection.module,'capture');
        assert.equal(row.selection.content,'creature');
        assert.equal(row.selection.dungeon,false);
        assert.equal(row.selection.dungeonRuntime,before.gensrpg_dungeon_runtime_v2,
          'selecting the real Capture card must not create Dungeon runtime');
        assert.deepEqual(errors,[],'real preview/list/selection paths must not raise runtime errors');
        mark(name+'-passed');
      }finally{
        row.errors=errors;
        fs.writeFileSync(path.join(artifacts,'evidence.json'),JSON.stringify(evidence,null,2)+'\n');
        await context.close();
      }
    }
    console.log(JSON.stringify({scenario:'Phase 9 real-preview Survival library classification',
      devices:evidence.map(row=>row.device),persistentStateUnchanged:true,selectionModule:'capture'}));
  }finally{
    clearTimeout(watchdog);
    await browser.close();
    server.closeAllConnections?.();server.closeIdleConnections?.();
    await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1});
