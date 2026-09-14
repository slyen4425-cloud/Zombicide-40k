const assert=require("node:assert/strict");
const fs=require("node:fs");
const http=require("node:http");
const path=require("node:path");
const {chromium}=require("playwright");
const {PNG}=require("pngjs");

const root=path.join(__dirname,"..");
const mime={".html":"text/html; charset=utf-8",".js":"text/javascript; charset=utf-8",".css":"text/css; charset=utf-8",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".webp":"image/webp",".json":"application/json"};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,"http://127.0.0.1").pathname),rel=pathname==="/"?"/tests/fixtures/tactical-browser-v1149.html":pathname,file=path.resolve(root,"."+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end("forbidden");return}
  fs.readFile(file,(error,data)=>{if(error){res.writeHead(404);res.end("not found");return}res.writeHead(200,{"content-type":mime[path.extname(file).toLowerCase()]||"application/octet-stream","cache-control":"no-store"});res.end(data)});
});
function nearWhiteRatio(buffer){const png=PNG.sync.read(buffer);let white=0,total=png.width*png.height;for(let i=0;i<png.data.length;i+=4)if(png.data[i]>=248&&png.data[i+1]>=248&&png.data[i+2]>=248&&png.data[i+3]>=250)white++;return total?white/total:1}

(async()=>{
  await new Promise(resolve=>server.listen(0,"127.0.0.1",resolve));const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:["--disable-dev-shm-usage"]});
  const context=await browser.newContext({viewport:{width:412,height:915},deviceScaleFactor:2.625,isMobile:true,hasTouch:true,reducedMotion:"no-preference",locale:"fr-FR"});
  const page=await context.newPage();page.setDefaultTimeout(7000);const errors=[];
  page.on("pageerror",error=>errors.push(String(error)));page.on("console",msg=>{if(msg.type()==="error")errors.push(msg.text())});
  try{
    await page.goto(`http://127.0.0.1:${port}/tests/fixtures/tactical-browser-v1149.html`,{waitUntil:"load"});await page.waitForFunction(()=>window.__browserProfileReady===true);
    assert.equal(await page.evaluate(()=>window.GensRpgTacticalCombatV2Adapter.APP_VERSION),"16.78.114.10");
    assert.equal(await page.evaluate(()=>window.GensRpgTacticalCombatV2Ui.APP_VERSION),"16.78.114.10");
    assert.equal((await page.evaluate(()=>window.GensRpgTacticalVisualDice16781142.status())).observer,false);

    const openings=[];
    for(let i=0;i<6;i++){
      const sample=await page.evaluate(async()=>{const started=performance.now(),battle=window.startProfiledEncounter();await new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve)));const heroes=battle.actors.filter(a=>a.side==="hero");return {elapsed:performance.now()-started,heroIds:heroes.map(a=>a.id),hit:heroes[0].attacks[0].hit,origin:heroes[0].attacks[0].meta.hitBreakdown,overlays:document.querySelectorAll(".gtv2Overlay").length,walls:document.querySelectorAll(".gtv2Cell.blocked>.gtv2WallTile").length}});
      openings.push(sample.elapsed);assert.deepEqual(sample.heroIds,["dungeon_aldren"],"Lyra room 0 must never enter combat");assert.equal(sample.hit,70,"sword must be 55% + Force bonus, not legacy 5%");assert.equal(sample.origin.baseChance,55);assert.equal(sample.origin.statBonus,15);assert.equal(sample.overlays,1);assert.equal(sample.walls,2);await page.evaluate(()=>window.closeProfiledEncounter());await page.waitForFunction(()=>!document.querySelector(".gtv2Overlay"));
    }
    assert.ok(Math.max(...openings)<1500,`mobile engagement too slow: ${Math.max(...openings).toFixed(1)} ms`);

    await page.evaluate(()=>window.startProfiledEncounter());
    const wall=page.locator(".gtv2Cell.blocked").first(),ratios=[],wallAudit=[];
    for(const scale of [.73,.86,1,1.17,1.33,.91,1]){
      const audit=await page.evaluate(async scale=>{const cell=document.querySelector(".gtv2Cell.blocked"),img=cell.querySelector(":scope>.gtv2WallTile");window.__stableWallImg=window.__stableWallImg||img;cell.parentElement.style.transform=`scale(${scale})`;cell.parentElement.style.transformOrigin="top left";await new Promise(resolve=>requestAnimationFrame(resolve));const cs=getComputedStyle(img),owner=getComputedStyle(cell),cr=cell.getBoundingClientRect(),ir=img.getBoundingClientRect();return {same:img===window.__stableWallImg,complete:img.complete,naturalWidth:img.naturalWidth,src:img.currentSrc||img.src,visibility:cs.visibility,opacity:cs.opacity,transform:cs.transform,ownerBg:owner.backgroundImage,appearance:owner.appearance,covers:ir.width>=cr.width&&ir.height>=cr.height}},scale);
      wallAudit.push(audit);ratios.push(nearWhiteRatio(await wall.screenshot({animations:"disabled"})));
    }
    for(const [i,audit] of wallAudit.entries()){assert.equal(audit.same,true,`zoom ${i} replaced the wall`);assert.equal(audit.complete,true);assert.ok(audit.naturalWidth>0);assert.match(audit.src,/dng_wall_block\.jpg/);assert.equal(audit.visibility,"visible");assert.equal(audit.opacity,"1");assert.equal(audit.transform,"none","per-cell GPU layer must be removed");assert.equal(audit.ownerBg,"none","V114.12 uses the single child IMG as wall texture owner");assert.equal(audit.covers,true)}
    assert.ok(Math.max(...ratios)<0.35,`wall became near-white during zoom: ${ratios.map(x=>(x*100).toFixed(1)+"%").join(", ")}`);

    await page.locator('[data-x="3"][data-y="2"]').click();await page.locator('[data-target="enemy:e"]').click();await page.locator(".gtv2Hint .gtv21149Calc summary").click();
    const swordHint=await page.locator(".gtv2Hint").innerText();
    assert.match(swordHint,/60 % de toucher — réussite sur D100 ≥ 41/);
    assert.match(swordHint,/base arme 55 % \+ Force 6 → \+15 % = 70 %/);
    assert.match(swordHint,/70 précision effective − 5 Défense − 5 Esquive = 60 %/);
    assert.match(swordHint,/une seule fois chacun/);

    await page.locator('.gtv2Actions button[data-attack="item:dng_longsword"]').click();await page.waitForSelector(".gtv2DiceBackdrop");await page.waitForFunction(()=>!document.querySelector("[data-dice-continue]")?.disabled);
    const diceText=await page.locator(".gtv2DiceCard").innerText();assert.match(diceText,/base arme 55 % \+ Force 6 → \+15 % = 70 %/);assert.equal(await page.locator(".gtv2DiceBackdrop").count(),1);assert.equal(await page.locator(".gtv21147DiceRow").count(),1);
    await page.locator("[data-dice-continue]").click();
    await page.waitForFunction(()=>document.querySelector(".gtv2DiceBackdrop")||window.GensRpgTacticalCombatV2.currentActor(window.GensRpgTacticalCombatV2Ui.getBattle())?.side==="hero");
    if(await page.locator(".gtv2DiceBackdrop").count()){await page.waitForFunction(()=>!document.querySelector("[data-dice-continue]")?.disabled);await page.locator("[data-dice-continue]").click()}
    await page.waitForFunction(()=>!document.querySelector(".gtv2DiceBackdrop"));await page.evaluate(()=>window.closeProfiledEncounter());

    await page.evaluate(()=>window.enterLyra());const lyra=await page.evaluate(()=>{const battle=window.startProfiledEncounter(),heroes=battle.actors.filter(a=>a.side==="hero");return {heroIds:heroes.map(a=>a.id),current:window.GensRpgTacticalCombatV2.currentActor(battle).id,bow:heroes.find(a=>a.id==="dungeon_lyra").attacks[0]}});
    assert.deepEqual(lyra.heroIds,["dungeon_aldren","dungeon_lyra"],"Lyra joins only after explicit dungeon entry");assert.equal(lyra.current,"dungeon_lyra");assert.equal(lyra.bow.hit,80,"bow must be 60% + Agility bonus");assert.equal(lyra.bow.meta.hitBreakdown.attributeValue,8);assert.equal(lyra.bow.meta.hitBreakdown.statBonus,20);
    await page.locator('[data-target="enemy:e"]').click();await page.locator(".gtv2Hint .gtv21149Calc summary").click();const bowHint=await page.locator(".gtv2Hint").innerText();
    assert.match(bowHint,/70 % de toucher — réussite sur D100 ≥ 31/);assert.match(bowHint,/base arme 60 % \+ Agilité 8 → \+20 % = 80 %/);assert.match(bowHint,/80 précision effective − 5 Défense − 5 Esquive = 70 %/);
    await page.evaluate(()=>window.closeProfiledEncounter());

    assert.deepEqual(errors,[],"Chromium console/page errors");
    console.log(JSON.stringify({scenario:"V114.12 real Chromium mobile",viewport:"412x915 @2.625x touch",engagements:6,maxOpenMs:Number(Math.max(...openings).toFixed(1)),participants:"Lyra excluded in room 0, included after entry",weapons:"sword 70%, bow 80%, origins visible",walls:`7 zooms, max near-white ${(Math.max(...ratios)*100).toFixed(1)}%`,dice:"one overlay and one animation row"}));
  }finally{await context.close();await browser.close();await new Promise(resolve=>server.close(resolve))}
})().catch(error=>{console.error(error);process.exitCode=1});
