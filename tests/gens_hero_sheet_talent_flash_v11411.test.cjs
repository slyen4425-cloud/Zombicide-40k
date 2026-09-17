const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const mime={
  '.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8',
  '.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp',
  '.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'
};

const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const rel=pathname==='/'?'/index.html':pathname;
  const file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{
    if(err){res.writeHead(404);res.end('not found');return}
    res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});
    res.end(data);
  });
});

async function waitNative(page){
  await page.waitForFunction(()=>
    typeof openChar==='function' &&
    typeof renderDungeonSkillTree==='function' &&
    typeof setDungeonSheetTab==='function' &&
    !!document.getElementById('dungeonSkillTreePanel') &&
    !!window.CHARS?.dungeon_aldren
  );
}

(async()=>{
  await new Promise(r=>server.listen(0,'127.0.0.1',r));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,locale:'fr-FR'});
  const page=await context.newPage();
  page.setDefaultTimeout(15000);
  const pageErrors=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));

  try{
    await page.goto(`http://127.0.0.1:${port}/index.html`,{waitUntil:'domcontentloaded'});
    await page.evaluate(()=>localStorage.setItem('gensrpg_game_profile_active_v1','game_profile_dungeon_demo'));
    await page.reload({waitUntil:'domcontentloaded'});
    await waitNative(page);

    const characterTab=await page.evaluate(async()=>{
      dungeonSheetTab='character';
      const panel=document.getElementById('dungeonSkillTreePanel');
      const trace=[];
      const record=reason=>trace.push({reason,inline:panel.style.display,computed:getComputedStyle(panel).display,text:(panel.textContent||'').trim().slice(0,80)});
      record('before-open');
      const observer=new MutationObserver(()=>record('mutation'));
      observer.observe(panel,{attributes:true,attributeFilter:['style','class']});
      openChar('dungeon_aldren');
      await new Promise(r=>setTimeout(r,120));
      record('settled');
      observer.disconnect();
      return {trace,tab:dungeonSheetTab,final:getComputedStyle(panel).display,treeText:(document.getElementById('dungeonSkillTree')?.textContent||'').trim()};
    });

    const transientVisible=characterTab.trace.filter(x=>x.reason!=='before-open'&&x.reason!=='settled').some(x=>x.computed!=='none');
    assert.equal(characterTab.tab,'character');
    assert.equal(characterTab.final,'none','Talent panel must stay hidden on the Character tab');
    assert.equal(transientVisible,false,'Talent panel must never flash visible while the Character tab owns the sheet');

    const skillsTab=await page.evaluate(async()=>{
      setDungeonSheetTab('skills');
      await new Promise(r=>setTimeout(r,40));
      const panel=document.getElementById('dungeonSkillTreePanel');
      return {tab:dungeonSheetTab,display:getComputedStyle(panel).display,text:(document.getElementById('dungeonSkillTree')?.textContent||'').trim()};
    });
    assert.equal(skillsTab.tab,'skills');
    assert.notEqual(skillsTab.display,'none','Talent panel must be visible on the Skills tab');
    assert.ok(skillsTab.text.length>0,'Canonical Talent renderer must still populate the skill tree');

    assert.deepEqual(pageErrors,[],'hero-sheet Talent scenario must not raise browser page errors');
    console.log(JSON.stringify({scenario:'hero sheet Talent flash',characterTrace:characterTab.trace,skillsDisplay:skillsTab.display}));
  }finally{
    await context.close();
    await browser.close();
    await new Promise(r=>server.close(r));
  }
})().catch(e=>{console.error(e);process.exitCode=1});
