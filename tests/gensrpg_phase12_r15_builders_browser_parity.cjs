'use strict';
/* Compare exactly the same real editor workflows between certified R14 and R15.
 * All browser data is isolated to per-test contexts and local HTTP server. */
const assert=require('node:assert/strict'),cp=require('node:child_process');
const pw=require(process.env.R15_PLAYWRIGHT_DIR+'/node_modules/playwright');
const R14=cp.execFileSync(process.execPath,['tools/gensrpg_phase12_r15_builders_character_entity_editors.cjs','--restore-r14'],{maxBuffer:12*1024*1024}).toString('utf8');
const URL=process.env.R15_TEST_URL||'http://127.0.0.1:8879/index.html';
const LABEL='R15 Browser Character and Creature parity';
async function exercise(browser,version){
 const ctx=await browser.newContext({viewport:{width:1280,height:780},locale:'fr-FR'});
 const page=await ctx.newPage();
 const messages=[],errors=[];
 page.on('dialog',async d=>{messages.push(d.message().slice(0,140));await d.accept()});
 page.on('pageerror',e=>errors.push(e.message.slice(0,240)));
 if(version==='R14')await page.route('**/index.html',route=>route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:R14}));
 const data={version};
 try{
  await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>typeof window.saveSharedEntity==='function'&&typeof window.saveCustomHero==='function'&&typeof window.openHeroCreator==='function',{timeout:40000});
  data.functions=await page.evaluate(()=>['hcStartingItemOptions','openHeroCreator','saveCustomHero','openSharedEntityEditor','saveSharedEntity','renderControllableCreatureLibrary','z40kPrepareAvatar'].map(n=>typeof window[n]));
  assert.ok(data.functions.every(x=>x==='function'),'global editor API present');
  await page.evaluate(()=>window.openSharedEntityEditor({},'creature'));
  await page.locator('#sharedEntityEditorModal').waitFor({state:'visible',timeout:15000});
  await page.locator('#sharedEntityName').fill(LABEL);
  await page.locator('#sharedEntityHp').fill('31');
  await page.evaluate(()=>window.saveSharedEntity());
  data.creature=await page.evaluate(name=>{
    const record=window.loadSharedEntities().find(x=>x.name===name);
    return record&&{name:record.name,hp:record.hp,category:record.category,contentFamily:record.contentFamily};
  },LABEL);
  assert.equal(data.creature?.hp,31,'saved creature HP');
  await page.evaluate(()=>window.openHeroCreator(null));
  await page.locator('#heroCreatorModal').waitFor({state:'visible',timeout:15000});
  await page.locator('#hcName').fill(LABEL);
  await page.locator('#hcHp').fill('7');
  await page.evaluate(()=>window.saveCustomHero());
  data.hero=await page.evaluate(name=>{
    const record=window.loadCustomHeroesMulti().find(x=>x.name===name);
    return record&&{name:record.name,hp:record.hp,contentFamily:record.contentFamily};
  },LABEL);
  assert.equal(data.hero?.hp,7,'saved hero health');
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.waitForFunction(()=>typeof window.loadSharedEntities==='function'&&typeof window.loadCustomHeroesMulti==='function',{timeout:40000});
  data.afterReload=await page.evaluate(name=>({
    hero:window.loadCustomHeroesMulti().find(x=>x.name===name)?.name||null,
    creature:window.loadSharedEntities().find(x=>x.name===name)?.name||null
  }),LABEL);
  assert.equal(data.afterReload.hero,LABEL,'hero persisted after reload');
  assert.equal(data.afterReload.creature,LABEL,'creature persisted after reload');
  data.errors=[...new Set(errors)].sort();
  data.dialogs=messages.map(x=>x.includes('Héros enregistré')?'hero saved':x).sort();
  return data;
 }finally{await ctx.close()}
}
(async()=>{
 const summary={};
 for(const kind of ['chromium','firefox']){
  const browser=await pw[kind].launch({headless:true,args:kind==='chromium'?['--disable-dev-shm-usage']:[]});
  try{
   const old=await exercise(browser,'R14'),cur=await exercise(browser,'R15');
   const {version:a,...was}=old,{version:b,...now}=cur;
   assert.deepEqual(now,was,kind+' historical R14/R15 hero+creature save/reload parity');
   summary[kind]={hero:now.hero,creature:now.creature,persisted:now.afterReload};
   console.log(kind+' R14/R15 character/creature Builders parity GREEN');
  }finally{await browser.close()}
 }
 console.log(JSON.stringify(summary,null,2));
})().catch(e=>{console.error('R15 browser parity RED '+(e.stack||e));process.exitCode=1});
