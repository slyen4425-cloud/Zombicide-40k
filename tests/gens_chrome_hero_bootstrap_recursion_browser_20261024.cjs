'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),http=require('node:http');
const {chromium,firefox}=require('playwright');
const root=path.join(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.webmanifest':'application/manifest+json','.png':'image/png','.jpg':'image/jpeg','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{
 let pathname;try{pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname)}catch(_){res.writeHead(400);return res.end()}
 const file=path.resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
 if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
 fs.stat(file,(err,st)=>{if(err||!st.isFile()){res.writeHead(404);return res.end()}
 res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});fs.createReadStream(file).pipe(res)})
});
const hero=(id,gameMode,extras={})=>({id,name:'HEROS TEST '+id,gameMode,avatar:'',avatarCrop:{x:0,y:0,scale:1,rot:0},hp:3,armor:2,skills:[],startingEquipment:[],progressionSlots:[],...extras});
const scenarios=[
 {name:'uninitialized-profiles-legacy-dungeon-hero',active:'game_profile_dungeon_demo',heroes:[hero('custom_legacy_dungeon','dungeon')]},
 {name:'uninitialized-profiles-legacy-survival-hero',active:'game_profile_zombicide_base',heroes:[hero('custom_legacy_survival','zombicide')]},
 {name:'uninitialized-profiles-multiple-legacy-heroes',active:'game_profile_dungeon_demo',heroes:[hero('custom_legacy_dungeon','dungeon'),hero('custom_legacy_survival','zombicide')]},
 {name:'uninitialized-profiles-missing-mode-migration',active:'game_profile_zombicide_base',heroes:[hero('custom_legacy_unknown',undefined)]},
];
async function execute(browser,name,scenario,port){
 const context=await browser.newContext({viewport:{width:412,height:915},hasTouch:true,isMobile:name==='chromium',serviceWorkers:'allow',locale:'fr-FR'});
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(String(e).slice(0,200)));
 try{
  await page.goto('http://127.0.0.1:'+port+'/diagnostic.html',{waitUntil:'domcontentloaded',timeout:20000});
  const seed=JSON.stringify(scenario.heroes);
  await page.evaluate(({seed,active})=>{
   localStorage.setItem('z40k_custom_heroes_multi_v1',seed);
   localStorage.setItem('gensrpg_game_profiles_v1','[]');
   localStorage.setItem('gensrpg_game_profile_active_v1',active);
   localStorage.setItem('gensrpg_hero_bootstrap_keep_marker_v1','keep-me');
  },{seed,active:scenario.active});
  await page.locator('#start').click({timeout:5000});
  await page.waitForFunction(()=>{
   const log=window.__gensMobileDiagV1?.read();
   return log?.events?.some(e=>e.type==='hero-call-after') && document.readyState!=='loading';
  },null,{timeout:20000});
  const state=await page.evaluate(()=>{
   const events=window.__gensMobileDiagV1.read().events;
   return {stage:JSON.parse(localStorage.getItem('gensrpg_mobile_diag_script_stage_v2')||'null'),ready:document.readyState,
    events:events.filter(e=>e.type.startsWith('hero-')).map(e=>({type:e.type,count:e.count})),
    profiles:JSON.parse(localStorage.getItem('gensrpg_game_profiles_v1')||'[]').map(x=>x.id),
    heroes:JSON.parse(localStorage.getItem('z40k_custom_heroes_multi_v1')||'[]').map(x=>({id:x.id,gameMode:x.gameMode,contentFamily:x.contentFamily,universeId:x.universeId})),
    marker:localStorage.getItem('gensrpg_hero_bootstrap_keep_marker_v1'),
    family:typeof gensCurrentContentFamily==='function'?gensCurrentContentFamily():null};
  });
  assert.equal(state.marker,'keep-me','unrelated saved data must remain untouched');
  assert.ok(state.stage?.script>=29,'script 29 must return');
  assert.ok(state.profiles.includes('game_profile_dungeon_demo'),'reference Dungeon profile must exist');
  assert.ok(state.profiles.includes('game_profile_zombicide_base'),'reference Survival profile must exist');
  assert.equal(state.heroes.length,scenario.heroes.length,'preserve all custom heroes');
  assert.ok(state.events.some(e=>e.type==='hero-call-after'),'bootstrap completes');
  assert.ok(!state.events.some(e=>e.type==='hero-apply-enter'&&e.count>=10),'no reentrant hero bootstrap');
  assert.ok(!state.events.some(e=>e.type==='hero-hydrate-before'&&e.count>=50),'no repeated hydrate storm');
  assert.ok(['rpg','survival'].includes(state.family),'family remains a meaningful mode');
  console.log('GENSRPG_HERO_BOOTSTRAP_OK '+JSON.stringify({browser:name,scenario:scenario.name,stage:state.stage.script,family:state.family,events:state.events.length,heroes:state.heroes}));
 }finally{await context.close()}
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 try{
  for(const [type,name] of [[chromium,'chromium'],[firefox,'firefox']]){
   const browser=await type.launch({headless:true,args:name==='chromium'?['--disable-dev-shm-usage']:[]});
   try{for(const scenario of scenarios)await execute(browser,name,scenario,server.address().port)}finally{await browser.close()}
  }
 }finally{server.closeAllConnections?.();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
