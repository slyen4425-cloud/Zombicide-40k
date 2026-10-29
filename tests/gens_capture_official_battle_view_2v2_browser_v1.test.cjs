'use strict';
// Real same-origin signed Lab 2v2, native Combat provider and the only Capture
// view in Chromium/Firefox landscape. No fake battle engine or saved owner.
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),http=require('node:http'),path=require('node:path');
const {chromium,firefox}=require('playwright');
const root=path.resolve(__dirname,'..');
const site=path.resolve(process.env.CAPTURE_LAB_DELIVERY_SITE||'_site');
const mime={'.html':'text/html;charset=utf-8','.mjs':'text/javascript;charset=utf-8',
 '.js':'text/javascript;charset=utf-8','.json':'application/json;charset=utf-8',
 '.webp':'image/webp','.css':'text/css;charset=utf-8'};
const html='<!doctype html><html lang="fr"><meta charset="utf-8">'+
 '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+
 '<style>body{background:#13291e;color:white;font-family:system-ui;margin:0}'+
 '#arena{width:100%;box-sizing:border-box}</style><section id="arena" hidden></section>'+
 '<script src="/assets/gensrpg/core/asset-resolver-v1.js"></script></html>';
async function withPage(browserType,run){
 const server=http.createServer(async(req,res)=>{
  try{
   const url=new URL(req.url,'http://localhost'),relative=decodeURIComponent(url.pathname).slice(1);
   if(url.pathname==='/2v2-view'){res.writeHead(200,{'Content-Type':'text/html'}).end(html);return;}
   if(!relative||relative.split('/').includes('..')){res.writeHead(403).end();return;}
   for(const dir of [site,root]){
    const file=path.resolve(dir,relative);
    if(!file.startsWith(dir+path.sep))continue;
    try{
     const bytes=await fs.readFile(file);
     res.writeHead(200,{'Content-Type':mime[path.extname(file)]||'application/octet-stream',
      'Cache-Control':'no-store'}).end(bytes);
     return;
    }catch{}
   }
   res.writeHead(404).end();
  }catch(e){res.writeHead(500).end(String(e));}
 });
 await new Promise(ok=>server.listen(0,'127.0.0.1',ok));
 let browser,context;
 try{
  browser=await browserType.launch({headless:true});
  context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true});
  const page=await context.newPage();page.setDefaultTimeout(25000);
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:'+server.address().port+'/2v2-view');
  await run(page,errors);
 }finally{
  await context?.close();await browser?.close();
  server.closeAllConnections();await new Promise(ok=>server.close(ok));
 }
}
for(const [name,engine] of [['Chromium',chromium],['Firefox',firefox]]){
 test(name+': native authored 2v2 view shows four approved sprites and routes touch targets to real Lab Core',{timeout:120000},async()=>{
  await withPage(engine,async(page,errors)=>{
   await page.evaluate(async()=>{
    const root='/assets/gensrpg/capture/';
    const vendor='/vendor/combat-lab/';
    const [viewModule,providerModule,loader,authModule,creature,draft,rules,exporter,adapter]=await Promise.all([
     import(root+'capture-official-battle-view-v1.mjs'),
     import(root+'combat-lab-provider-v1.mjs'),
     import(root+'combat-lab-engine-loader-v1.mjs'),
     import(root+'combat-lab-authored-source-v1.mjs'),
     import(vendor+'src/contracts/capture-creature-transfer-v1.js'),
     import(vendor+'src/contracts/capture-skill-editor-draft-v1.js'),
     import(vendor+'src/adapters/input/capture/capture-combat-rules-overlay-v1.js'),
     import(vendor+'src/adapters/input/capture/capture-editor-exporter-v3.js'),
     import(vendor+'src/adapters/input/capture/capture-export-adapter-stack-v1.js')
    ]);
    const get=async p=>(await (await fetch(root+'runtime-data/'+p,{cache:'no-store'})).json());
    const [inputs,source,catalog]=await Promise.all([
     get('author-inputs.json'),get('source.json'),get('global-visual-assets.json')
    ]);
    const authoredSource=authModule.createCaptureLabAuthoredSourceV1({
     normalizeCreatureTransfer:creature.normalizeCaptureCreatureTransferV1,
     normalizeSkillDraft:draft.normalizeCaptureSkillEditorDraftV1,
     overlayCombatRules:rules.applyCaptureCombatRulesToCreatureDraftV1,
     exportEditorDrafts:exporter.exportCaptureEditorDraftsToCombatExportV3,
     adaptCombatExport:adapter.adaptCaptureCombatExportStackV1,
     statRegistry:inputs.statRegistry,
     configuredSkillDrafts:inputs.configuredSkillDrafts,
     creatureTransfers:inputs.creatureTransfers
    });
    const playerTeam=[
     {instanceId:'capture:first',creatureId:'crea-loup'},
     {instanceId:'capture:second',creatureId:'crea_mossback'}
    ];
    const opponentTeam=[
     {instanceId:'wild:first',creatureId:'crea_voltik'},
     {instanceId:'wild:second',creatureId:'kitsune_lunaire'}
    ];
    const built=authoredSource.buildEncounter({
     ...inputs.battleSettings,encounterId:'real-native-2v2-view',
     playerTeam,opponentTeam
    });
    const actorIds=built.actorIds,src=built.nativeCombatSource;
    const sides=[actorIds.slice(0,2),actorIds.slice(2)].map((ids,index)=>({
     name:index?'Sauvages':'Joueurs',
     active:ids.map(id=>built.instanceIds[id]),
     creatures:ids.map(id=>{
      const actor=src.battleFormat.actors.find(a=>a.actorId===id);
      const config=src.fighterConfigs[actor.creatureId];
      return {instanceId:built.instanceIds[id],creatureId:actor.creatureId,
       hp:config.maxHp,maxHp:config.maxHp,abilityIds:[...src.skillIdsByActor[id]]};
     })
    }));
    const battleContext={encounterId:built.encounterId,snapshot:{sides}};
    const engine=await loader.loadCombatLabEngineV1(new URL(vendor,document.baseURI));
    const mount=viewModule.createCaptureOfficialBattleViewV1({
     host:document.getElementById('arena'),assetResolver:GensAssetResolverV1
    });
    window.captureObservedTargets=[];
    const provider=providerModule.createCombatLabProviderV1({
     engine,resolveBattle:()=>({nativeCombatSource:src,actorIds,aiEnabled:false}),
     mountBattle:(handle,context)=>mount(Object.freeze({
      skills:()=>handle.skills(),
      useSkill:(id,target)=>{
       window.captureObservedTargets.push({id,target});
       return handle.useSkill(id,target);
      },
      flee:()=>handle.flee()
     }),context,{authoredSource,catalog,source,settings:inputs.battleSettings})
    });
    const handle=provider.createBattle(battleContext);
    provider.startBattle(handle);
    window.captureViewFinish=async()=>{
     handle.flee();
     const result=await handle.completion;
     provider.disposeBattle(handle);
     return result;
    };
    window.captureViewIds=actorIds;
   });
   await page.locator('#arena:not([hidden]) .hub-fighter').first().waitFor();
   assert.equal(await page.locator('#arena .hub-fighter').count(),4);
   assert.equal(await page.locator('#arena img[data-author-asset-id]').count(),4);
   await page.waitForFunction(()=>[...document.querySelectorAll('#arena img[data-author-asset-id]')]
    .every(img=>img.complete&&img.naturalWidth>0),null,{timeout:18000});
   assert.deepEqual(await page.evaluate(()=>window.captureViewIds),
    ['player','ally','opponent','opponent-b']);
   assert.equal(await page.locator('#arena .hub-fighter[data-combat-actor-id]').count(),4);
   assert.match(await page.locator('#arena').innerText(),/Énergie/);
   assert.ok(await page.getByRole('button',{name:'Griffe',exact:true}).isVisible());
   const secondEnemy=page.locator('button[data-capture-target-instance="wild:second"]');
   await secondEnemy.tap();
   assert.equal(await secondEnemy.getAttribute('aria-pressed'),'true');
   await page.getByRole('button',{name:'Griffe',exact:true}).tap();
   const observed=await page.evaluate(()=>window.captureObservedTargets);
   assert.deepEqual(observed[0],{id:'claw',target:'wild:second'},
    'the actual Combat provider receives the exact chosen target instance');
   const width=await page.evaluate(()=>({scroll:document.documentElement.scrollWidth,viewport:innerWidth}));
   assert.ok(width.scroll<=width.viewport+3,'landscape UI must not overflow horizontally');
   const result=await page.evaluate(()=>window.captureViewFinish());
   assert.equal(result.outcome,'flee');
   assert.deepEqual(result.creatures.map(x=>x.instanceId),
    ['capture:first','capture:second','wild:first','wild:second']);
   assert.equal(await page.locator('#arena').getAttribute('hidden'),'');
   assert.equal(await page.locator('#arena .hub-fighter').count(),0);
   assert.deepEqual(errors,[]);
  });
 });
}
