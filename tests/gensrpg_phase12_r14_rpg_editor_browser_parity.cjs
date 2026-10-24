'use strict';
const assert=require('node:assert/strict');
const cp=require('node:child_process');
const pw=require(process.env.R14_PLAYWRIGHT_DIR+'/node_modules/playwright');
const R13=cp.execFileSync(process.execPath,['tools/gensrpg_phase12_r14_builders_rpg_universe_editor.cjs','--restore-r13'],{maxBuffer:12*1024*1024}).toString('utf8');
const URL=process.env.R14_TEST_URL||'http://127.0.0.1:8878/index.html';
async function exercise(browser,version){
  const context=await browser.newContext({viewport:{width:1280,height:780},locale:'fr-FR'});
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message.slice(0,200)));
  page.on('dialog',dialog=>dialog.accept());
  if(version==='R13')await page.route('**/index.html',async route=>{
    await route.fulfill({status:200,contentType:'text/html; charset=utf-8',body:R13});
  });
  const checkpoint={version};
  try{
    await page.goto(URL,{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>typeof window.openRpgUniverseEditor==='function'&&typeof window.saveRpgUniverseIdentity==='function',{timeout:40000});
    await page.evaluate(()=>window.openRpgUniverseEditor());
    await page.locator('#rpgUniverseEditorModal').waitFor({state:'visible',timeout:20000});
    await page.locator('#rpgName').fill('R14 CI world parity');
    await page.evaluate(()=>window.saveRpgUniverseIdentity());
    checkpoint.savedName=await page.locator('#rpgName').inputValue();
    assert.equal(checkpoint.savedName,'R14 CI world parity','world identity save');
    await page.evaluate(()=>window.showRpgUniverseTab('progression'));
    await page.locator('#rpgXpPerLevel').fill('17');
    await page.evaluate(()=>window.saveRpgUniverseProgression());
    checkpoint.savedXp=await page.locator('#rpgXpPerLevel').inputValue();
    assert.equal(checkpoint.savedXp,'17','custom XP per level save');
    await page.reload({waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>typeof window.openRpgUniverseEditor==='function',{timeout:40000});
    await page.evaluate(()=>window.openRpgUniverseEditor());
    await page.locator('#rpgUniverseEditorModal').waitFor({state:'visible',timeout:20000});
    checkpoint.reloadName=await page.locator('#rpgName').inputValue();
    await page.evaluate(()=>window.showRpgUniverseTab('progression'));
    checkpoint.reloadXp=await page.locator('#rpgXpPerLevel').inputValue();
    assert.equal(checkpoint.reloadName,'R14 CI world parity','saved identity persists after reload');
    assert.equal(checkpoint.reloadXp,'17','custom XP persists after reload');
    checkpoint.tabs=await page.locator('.rpgUniverseTab').count();
    checkpoint.modalOpen=await page.locator('#rpgUniverseEditorModal').isVisible();
    checkpoint.errors=[...new Set(errors)].sort();
    return checkpoint;
  }finally{await context.close();}
}
(async()=>{
  const summary={};
  for(const browserName of ['chromium','firefox']){
    const browser=await pw[browserName].launch({headless:true,args:browserName==='chromium'?['--disable-dev-shm-usage']:[]});
    try{
      const oldResult=await exercise(browser,'R13');
      const newResult=await exercise(browser,'R14');
      const {version:_v1,...oldSafe}=oldResult,{version:_v2,...newSafe}=newResult;
      assert.deepEqual(newSafe,oldSafe,browserName+' R14 must match exact R13 editor workflow');
      summary[browserName]={name:newSafe.reloadName,xpPerLevel:newSafe.reloadXp,tabs:newSafe.tabs,newRuntimeErrors:0};
      console.log(browserName+' R13/R14 RPG editor open/save/reload parity GREEN');
    }finally{await browser.close();}
  }
  console.log(JSON.stringify(summary,null,2));
})().catch(err=>{console.error('R14 browser parity RED: '+(err.stack||err));process.exitCode=1});
