const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium,firefox}=require('playwright');
const root=path.join(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg'};
const engineName=String(process.env.GENS_BROWSER||'chromium').toLowerCase();
const browserType=engineName==='firefox'?firefox:chromium;
const server=http.createServer((req,res)=>{const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname),rel=pathname==='/'?'/tests/fixtures/tactical-dock-render-v11411.html':pathname,file=path.resolve(root,'.'+rel);if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('not found');return}res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});res.end(data)})});
(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const port=server.address().port,browser=await browserType.launch(engineName==='chromium'?{headless:true,args:['--disable-dev-shm-usage']}:{headless:true});
  const contextOptions={viewport:{width:412,height:915},deviceScaleFactor:2.625,hasTouch:true,locale:'fr-FR'};
  if(engineName==='chromium')contextOptions.isMobile=true;
  const context=await browser.newContext(contextOptions),page=await context.newPage();
  page.setDefaultTimeout(12000);const errors=[];page.on('pageerror',e=>errors.push(String(e)));page.on('console',m=>{if(m.type()==='error')errors.push(m.text())});
  try{
    await page.goto(`http://127.0.0.1:${port}/tests/fixtures/tactical-dock-render-v11411.html`,{waitUntil:'load'});
    await page.waitForFunction(()=>window.__dockHarnessReady===true);
    const result=await page.evaluate(async()=>{
      const ui=window.GensRpgTacticalCombatV2Ui,v111=window.GensRpgTacticalRuntimeFixes1678111;
      if(!ui||!v111)throw new Error('Tactical UI/V111 missing');
      ui.open(window.__dockBattleInput);
      await new Promise(r=>setTimeout(r,80));
      const first=document.querySelector('[data-v111-dock]');
      const snapshot=dock=>dock?{
        count:document.querySelectorAll('[data-v111-dock]').length,
        text:dock.textContent.replace(/\s+/g,' ').trim(),
        display:getComputedStyle(dock).display,
        attackDisabled:!!dock.querySelector('[data-v111-attack]')?.disabled,
        endDisabled:!!dock.querySelector('[data-v111-end]')?.disabled,
        abilityPresent:!!dock.querySelector('[data-v111-ability]')
      }:null;
      const before=snapshot(first);
      document.querySelector('.gtv2Overlay [data-roll-rule]')?.click();
      await new Promise(r=>setTimeout(r,50));
      const after=snapshot(document.querySelector('[data-v111-dock]'));
      return {before,after,observerTargets:window.__globalObserverTargets.slice(),status:v111.status?.()||null};
    });
    assert.ok(result.before,'dock must exist after the real local Tactical open/render path');
    assert.equal(result.before.count,1,'exactly one floating dock must exist');
    assert.match(result.before.text,/Attaquer/,'dock Attack button missing');
    assert.match(result.before.text,/Fin du tour/,'dock End-turn button missing');
    assert.match(result.before.text,/Capacité/,'dock Ability button missing');
    assert.notEqual(result.before.display,'none','dock must be visible on hero turn');
    assert.equal(result.before.attackDisabled,false,'dock Attack must relay to an enabled Tactical attack');
    assert.equal(result.before.endDisabled,false,'dock End turn must relay to the real Tactical end-turn action');
    assert.equal(result.before.abilityPresent,true,'dock Ability control must remain part of the dock contract');
    assert.ok(result.after,'dock must survive a true local Tactical rerender');
    assert.equal(result.after.count,1,'rerender must not duplicate the floating dock');
    assert.match(result.after.text,/Attaquer/);assert.match(result.after.text,/Fin du tour/);assert.match(result.after.text,/Capacité/);
    assert.equal(result.observerTargets.some(x=>x==='body'||x==='html'),false,'dock restoration must not install a global body/html MutationObserver');
    assert.equal(result.status?.uiRenderHooked,true,'V111 must report the canonical render lifecycle hook as installed');
    assert.deepEqual(errors,[],'Tactical dock browser console/page errors');
    console.log(JSON.stringify({scenario:'V114.11 Tactical dock on canonical local render path',browser:engineName,viewport:'412x915 @2.625 touch',before:result.before,after:result.after,observerTargets:result.observerTargets,status:result.status}));
  }finally{
    await context.close();
    await browser.close();
    server.close();
    if(typeof server.closeAllConnections==='function')server.closeAllConnections();
  }
})().catch(e=>{console.error(e);process.exitCode=1});
