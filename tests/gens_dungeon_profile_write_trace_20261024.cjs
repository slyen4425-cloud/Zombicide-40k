'use strict';
// Diagnostic only. No production mutation and no saved user data imported.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.webmanifest':'application/manifest+json','.mp3':'audio/mpeg'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const file=path.resolve(root,'.'+(pathname==='/'?'/preview.html':pathname));
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('Forbidden');return}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end('Not found');return}
    res.writeHead(200,{'content-type':mime[path.extname(file)]||'application/octet-stream','cache-control':'no-store'});res.end(data);
  });
});
const ID='game_profile_dungeon_demo';
const KEY='gensrpg_game_profiles_v1';
const TRACE_INSTALL=()=>{
  window.__dupeWrites=[];
  const set=Storage.prototype.setItem,remove=Storage.prototype.removeItem;
  Storage.prototype.setItem=function(key,val){
    if(this===localStorage&&key==='gensrpg_game_profiles_v1'){
      let ids=[],error='';
      try{let items=JSON.parse(String(val));ids=Array.isArray(items)?items.map(x=>String(x?.id||'')):[];}catch(e){error=String(e)}
      if(window.__dupeWrites.length<50)window.__dupeWrites.push({action:'set',count:ids.filter(x=>x==='game_profile_dungeon_demo').length,total:ids.length,error,stack:String(new Error().stack||'').slice(0,1300)});
    }
    return set.call(this,key,val);
  };
  Storage.prototype.removeItem=function(key){
    if(this===localStorage&&key==='gensrpg_game_profiles_v1'&&window.__dupeWrites.length<50)window.__dupeWrites.push({action:'remove',stack:String(new Error().stack||'').slice(0,1300)});
    return remove.call(this,key);
  };
};
async function boot(page,port){
  await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1'&&typeof openGensFamily==='function'&&typeof loadGameProfilesRaw==='function',null,{timeout:60000});
}
async function inspect(page,step,openMenu){
  if(openMenu) {
    const card=page.locator('button.gensRootModeCard.adventure');
    await card.waitFor({state:'visible',timeout:30000});
    await card.click();
    await page.locator('#gensFamilyHome').waitFor({state:'visible'});
  }
  return page.evaluate(({step,openMenu})=>{
    const raw=localStorage.getItem('gensrpg_game_profiles_v1');
    let profiles=[];try{profiles=JSON.parse(raw||'[]')}catch(e){}
    const cards=openMenu?[...document.querySelectorAll('#gensFamilyGames [data-rpg-profile="game_profile_dungeon_demo"]')].length:null;
    return {step,rawSize:raw?.length||0,storedDungeon:profiles.filter(p=>p.id==='game_profile_dungeon_demo').length,profilesTotal:profiles.length,visibleDungeon:cards,writes:window.__dupeWrites||[]};
  },{step,openMenu});
}
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
 try{
  const context=await browser.newContext({viewport:{width:412,height:915},hasTouch:true,isMobile:true,serviceWorkers:'block'});
  await context.addInitScript(TRACE_INSTALL);
  const page=await context.newPage(),port=server.address().port;
  const errors=[];page.on('pageerror',e=>errors.push(String(e).slice(0,250)));
  await boot(page,port);
  const first=await inspect(page,'fresh profile, first startup',true);
  // Work only with the current browser fixture; do not copy any personal user data.
  const seed=await page.evaluate(()=>{
    const items=loadGameProfilesRaw();
    const d=items.find(p=>p.id==='game_profile_dungeon_demo');
    if(!d)throw Error('Missing reference Dungeon');
    const duplicates=[...items,...Array.from({length:4},()=>JSON.parse(JSON.stringify(d)))];
    localStorage.setItem('gensrpg_game_profiles_v1',JSON.stringify(duplicates));
    return {firstCount:items.filter(p=>p.id==='game_profile_dungeon_demo').length,seedCount:duplicates.filter(p=>p.id==='game_profile_dungeon_demo').length};
  });
  await boot(page,port);
  const second=await inspect(page,'five equal IDs before startup',true);
  await boot(page,port);
  const third=await inspect(page,'five equal IDs after reload',true);
  console.log('DUNGEON_PROFILE_ROOT_CAUSE_TRACE '+JSON.stringify({seed,first,second,third,errors}));
  assert.equal(second.storedDungeon,5,'investigative fixture should preserve seeded duplicates');
  assert.equal(third.storedDungeon,5,'measure current repeated start behavior');
  await context.close();
 } finally{await browser.close();server.closeAllConnections?.();await new Promise(r=>server.close(r))}
})().catch(e=>{console.error(e);process.exitCode=1});
