const assert=require("node:assert/strict");
const fs=require("node:fs");
const http=require("node:http");
const path=require("node:path");
const {chromium}=require("playwright");

const root=path.join(__dirname,"..");
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".json":"application/json"};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname);
  const rel=pathname==="/"?"/tests/fixtures/tactical-browser-v1149.html":pathname;
  const file=path.resolve(root,"."+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end("forbidden");return}
  fs.readFile(file,(error,data)=>{
    if(error){res.writeHead(404);res.end("not found");return}
    res.writeHead(200,{"content-type":mime[path.extname(file).toLowerCase()]||"application/octet-stream","cache-control":"no-store"});res.end(data);
  });
});

(async()=>{
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,reducedMotion:"no-preference",locale:"fr-FR"});
  const page=await context.newPage();page.setDefaultTimeout(6000);
  const errors=[];page.on("pageerror",error=>errors.push(String(error)));page.on("console",msg=>{if(msg.type()==="error")errors.push(msg.text())});
  try{
    await page.goto(`http://127.0.0.1:${port}/tests/fixtures/tactical-browser-v1149.html`,{waitUntil:"load"});
    await page.waitForFunction(()=>window.__browserProfileReady===true);

    const installStatus=await page.evaluate(()=>window.GensRpgTacticalVisualDice16781142.status());
    assert.equal(installStatus.observer,false,"final tactical authority must not own a body observer");
    assert.equal(installStatus.uiRenderPatched,false,"final tactical authority must not wrap UI.render");
    assert.equal(installStatus.corePatched,false,"final tactical authority must not wrap Dungeon render/show");

    const openings=[];
    for(let i=0;i<8;i++){
      const sample=await page.evaluate(async()=>{
        const started=performance.now(),battle=window.startProfiledEncounter();
        await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));
        return {elapsed:performance.now()-started,overlayCount:document.querySelectorAll(".gtv2Overlay").length,wallCount:document.querySelectorAll(".gtv2Cell.blocked>.gtv2WallTile").length,battleId:battle.id};
      });
      openings.push(sample.elapsed);
      assert.equal(sample.overlayCount,1,`engagement ${i+1} must open exactly one tactical overlay`);
      assert.equal(sample.wallCount,2,`engagement ${i+1} must render one bitmap per wall`);
      await page.evaluate(()=>window.closeProfiledEncounter());
      await page.waitForFunction(()=>document.querySelectorAll(".gtv2Overlay").length===0);
    }
    assert.ok(Math.max(...openings)<1500,`mobile engagement too slow: ${Math.max(...openings).toFixed(1)} ms`);

    await page.evaluate(()=>window.startProfiledEncounter());
    const audit=await page.evaluate(()=>{
      const battle=window.GensRpgTacticalCombatV2Ui.getBattle(),hero=battle.actors.find(a=>a.id==="h"),enemy=battle.actors.find(a=>a.id==="e"),snapshot=hero.meta.rpgStats,preview=window.GensRpgTacticalCombatV2.attackPreview(battle,enemy.id,hero.id,"claw");
      return {off:{...window.__offCombat},snapshot:{movement:snapshot.values.movement,initiative:snapshot.values.initiative,defense:snapshot.values.defense,armor:snapshot.values.armor,dodge:snapshot.derived.dodge},actor:{movement:hero.movement,initiative:hero.initiative,defense:hero.defense,armor:hero.armor,dodge:hero.dodge},previewHit:preview.hitChance};
    });
    assert.deepEqual(audit.snapshot,audit.off,"off-combat canonical values must equal the tactical snapshot");
    assert.deepEqual(audit.actor,audit.off,"the engine actor must use the tactical snapshot values");
    assert.equal(audit.previewHit,59,"actual preview must use 80 precision - 12 defense - 9 dodge once");

    const wallAudit=await page.evaluate(async()=>{
      const cell=document.querySelector(".gtv2Cell.blocked"),img=cell.querySelector(":scope>.gtv2WallTile");window.__wallCell=cell;window.__wallImg=img;const frames=[];
      for(const scale of [.78,1,1.22,.9,1.35,1]){cell.parentElement.style.transform=`scale(${scale})`;cell.parentElement.style.transformOrigin="top left";await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const cs=getComputedStyle(img),cr=cell.getBoundingClientRect(),ir=img.getBoundingClientRect();frames.push({same:img===window.__wallImg,connected:img.isConnected,complete:img.complete,naturalWidth:img.naturalWidth,visibility:cs.visibility,opacity:cs.opacity,covers:ir.width>=cr.width&&ir.height>=cr.height})}
      return frames;
    });
    for(const [i,frame] of wallAudit.entries()){assert.equal(frame.same,true,`zoom frame ${i} replaced the wall bitmap`);assert.equal(frame.connected,true);assert.equal(frame.complete,true);assert.ok(frame.naturalWidth>0);assert.equal(frame.visibility,"visible");assert.equal(frame.opacity,"1");assert.equal(frame.covers,true)}

    await page.locator('[data-target="e"]').click();
    await page.locator(".gtv2Hint .gtv21149Calc summary").click();
    const hint=await page.locator(".gtv2Hint").innerText();
    assert.match(hint,/36 % de toucher — réussite sur D100 ≥ 65/);
    assert.match(hint,/92 précision − 20 Défense − 16 Esquive − 20 Couvert = 36 %/);
    assert.match(hint,/retirés une seule fois/);

    await page.locator('.gtv2Actions button[data-attack="arc"]').click();
    await page.waitForSelector(".gtv2DiceBackdrop");
    await page.waitForFunction(()=>!document.querySelector("[data-dice-continue]")?.disabled);
    assert.equal(await page.locator(".gtv2DiceBackdrop").count(),1,"only one dice overlay may exist");
    assert.equal(await page.locator(".gtv21147DiceRow").count(),1,"only one dice animation row may exist");
    const diceText=await page.locator(".gtv2DiceCard").innerText();
    assert.match(diceText,/36 % de toucher — réussite sur D100 ≥ 65/);
    assert.match(diceText,/Détail du calcul/);
    await page.locator("[data-dice-continue]").click();
    await page.waitForFunction(()=>!document.querySelector(".gtv2DiceBackdrop"));
    await page.evaluate(()=>window.closeProfiledEncounter());

    assert.deepEqual(errors,[],"Chromium console/page errors");
    console.log(JSON.stringify({scenario:"V114.9 real Chromium mobile",viewport:"412x915 @2.625x touch",engagements:8,maxOpenMs:Number(Math.max(...openings).toFixed(1)),walls:"stable across 6 zoom frames",d100:"36% => D100 >= 65",stats:"off-combat = snapshot = engine",dice:"one overlay, one short CSS animation"}));
  }finally{
    await context.close();await browser.close();await new Promise(resolve=>server.close(resolve));
  }
})().catch(error=>{console.error(error);process.exitCode=1});
