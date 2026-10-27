const test=require('node:test');
const assert=require('node:assert/strict');
const http=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium,firefox}=require('playwright');

const site=path.resolve(process.env.CAPTURE_LAB_PREVIEW_ROOT||'_site/capture-lab-preview');
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css'};

for(const [name,browserType] of [['Chromium',chromium],['Firefox',firefox]]){
  test(name+': real battle from landscape zone, automatic victory, flee and unchanged saves',{timeout:45000},async(t)=>{
    const server=http.createServer(async(req,res)=>{
      try{
        const url=new URL(req.url,'http://localhost');
        const file=path.resolve(site,'.'+decodeURIComponent(url.pathname==='/'?'/capture-lab-preview.html':url.pathname));
        if(!file.startsWith(site+path.sep)){res.writeHead(403).end();return;}
        const data=await fs.readFile(file);
        res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-store'}).end(data);
      }catch{res.writeHead(404).end();}
    });
    await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
    const origin='http://127.0.0.1:'+server.address().port;
    let browser,page;
    try{
      browser=await browserType.launch({headless:true,
        ...(name==='Chromium'&&process.env.CAPTURE_LAB_CHROMIUM_PATH?{executablePath:process.env.CAPTURE_LAB_CHROMIUM_PATH}:{}),
        ...(name==='Firefox'&&process.env.CAPTURE_LAB_FIREFOX_PATH?{executablePath:process.env.CAPTURE_LAB_FIREFOX_PATH}:{})});
      const context=await browser.newContext({viewport:{width:932,height:430},hasTouch:true});
      await context.addInitScript(()=>localStorage.setItem('gensrpg_game_profiles_v1','{"existing-save":"preserved"}'));
      page=await context.newPage();const errors=[],external=[];
      page.setDefaultTimeout(8000);
      page.on('pageerror',error=>errors.push(error.message));
      page.on('request',request=>{if(!request.url().startsWith(origin+'/'))external.push(request.url());});
      await page.goto(origin+'/capture-lab-preview.html');
      await page.getByRole('status').filter({hasText:'Rejoins'}).waitFor();
      const right=page.getByRole('button',{name:'Déplacement →',exact:true});
      assert.ok(await right.isEnabled());
      assert.ok(await right.evaluate(node=>node.getBoundingClientRect().height)>=48);
      await right.tap();
      await page.locator('#battle-host:not([hidden])').waitFor();
      assert.ok(await page.getByRole('button',{name:'Déplacement ↓',exact:true,includeHidden:true}).isDisabled());
      await page.getByRole('button',{name:'Impact',exact:true}).tap();
      await page.waitForFunction(()=>document.querySelector('progress[aria-label="PV de Créature sauvage"]')?.value===12);
      await page.waitForTimeout(150); // native recovery follows impact
      await page.getByRole('button',{name:'Impact',exact:true}).tap();
      await page.locator('#zone-host[data-last-outcome="victory"]:not([hidden])').waitFor();
      assert.match(await page.locator('#notice').textContent(),/Victoire/);
      await page.getByRole('button',{name:'Déplacement ↓',exact:true}).tap();
      await page.getByRole('button',{name:'Déplacement ↑',exact:true}).tap();
      await page.getByRole('button',{name:'Fuir',exact:true}).tap();
      await page.locator('#zone-host[data-last-outcome="flee"]:not([hidden])').waitFor();
      assert.equal(await right.isEnabled(),true);
      assert.equal(await page.evaluate(()=>localStorage.getItem('gensrpg_game_profiles_v1')),'{"existing-save":"preserved"}');
      assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true);
      assert.deepEqual(external,[],'modules must come from the pinned local build');
      assert.deepEqual(errors,[]);
      if(process.env.CAPTURE_LAB_SCREENSHOT&&name==='Chromium')await page.screenshot({path:process.env.CAPTURE_LAB_SCREENSHOT,fullPage:true});
      await context.close();
    }catch(error){
      if(page)t.diagnostic(await page.locator('body').innerText().catch(()=>''));
      throw error;
    }finally{
      await browser?.close();
      server.closeAllConnections();
      await new Promise(resolve=>server.close(resolve));
    }
  });
}
