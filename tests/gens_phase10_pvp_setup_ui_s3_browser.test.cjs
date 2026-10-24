"use strict";
const assert=require("node:assert/strict");
const path=require("node:path");
const {chromium}=require("playwright");

(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    for(const viewport of [{width:390,height:844},{width:1280,height:800}]){
      const context=await browser.newContext({viewport,isMobile:viewport.width<500,hasTouch:viewport.width<500});
      const page=await context.newPage();
      try{
        await page.setContent('<!doctype html><html lang="fr"><body><div id="foreign">Survie conserve son contenu</div><div id="pvp"></div></body></html>');
        await page.evaluate(()=>{
          window.__pvpActive="capture";
          window.__starts=0;
          window.__registerCount=0;
          window.GensShellModuleLaunchV1={
            register(id,fn){if(id!=="pvp")throw new Error("foreign owner");window.__registerCount++;window.__pvpLaunch=fn;return true},
            activeModule(){return window.__pvpActive}
          };
        });
        for(const file of ["session-v1.js","module-launch-v1.js","setup-ui-v1.js"]){
          await page.addScriptTag({path:path.join(__dirname,"..","assets/gensrpg/pvp",file)});
        }
        let initial=await page.evaluate(()=>{
          const owner=window.GensPvpSessionV1,provider=window.GensPvpModuleLaunchV1,ui=window.GensPvpSetupUiV1;
          provider.install({shell:window.GensShellModuleLaunchV1,session:owner});
          try{ui.mount({container:document.getElementById("pvp"),
            activeModule:()=>window.GensShellModuleLaunchV1.activeModule(),provider});return false}catch(e){return /active PvP/.test(e.message)}
        });
        assert.equal(initial,true,"inactive PvP cannot own a UI mount");
        await page.evaluate(()=>{
          window.__pvpActive="pvp";
          window.GensPvpSetupUiV1.mount({container:document.getElementById("pvp"),
            activeModule:()=>window.GensShellModuleLaunchV1.activeModule(),
            provider:window.GensPvpModuleLaunchV1});
        });
        assert.equal(await page.locator(".gens-pvp-side").count(),2);
        await page.getByPlaceholder("ex. duel-personnalise").fill("creator-game");
        await page.getByPlaceholder("ex. equipe-a").nth(0).fill("c1");
        await page.getByPlaceholder("ex. equipe-a").nth(1).fill("c2");
        await page.getByPlaceholder("ex. perso-1,perso-2").nth(0).fill("avatar-one, avatar-two");
        await page.getByPlaceholder("ex. perso-1,perso-2").nth(1).fill("avatar-three");
        await page.locator(".gens-pvp-setup textarea").fill(JSON.stringify({
          creatorOnlyRule:{"mode":"custom",customValue:42},creatorChoice:"from-profile"
        }));
        await page.getByRole("button",{name:"Préparer cette session"}).click();
        await page.getByRole("status").filter({hasText:"Session préparée"}).waitFor();
        const result=await page.evaluate(()=>{
          const snap=window.GensPvpSessionV1.snapshot();
          return {
            id:snap.id,sides:snap.sides.map(x=>({id:x.id,participants:[...x.participants]})),
            custom:snap.rules.creatorOnlyRule.customValue,
            immutable:Object.isFrozen(snap.rules.creatorOnlyRule),
            phase:window.GensPvpSessionV1.status().phase,
            registered:window.__registerCount,
            legacy:document.getElementById("foreign").textContent
          };
        });
        assert.deepEqual(result,{
          id:"creator-game",sides:[
            {id:"c1",participants:["avatar-one","avatar-two"]},
            {id:"c2",participants:["avatar-three"]}
          ],custom:42,immutable:true,phase:"prepared",registered:1,
          legacy:"Survie conserve son contenu"
        });
        await page.evaluate(()=>{
          window.GensPvpModuleLaunchV1.stop();
          window.__pvpActive="dungeon";
        });
        await page.getByRole("button",{name:"Préparer cette session"}).click();
        await page.getByRole("status").filter({hasText:"réservée au mode PvP"}).waitFor();
        await page.evaluate(()=>window.GensPvpSetupUiV1.dispose());
        assert.equal(await page.locator(".gens-pvp-setup").count(),0);
        assert.equal(await page.locator("#foreign").textContent(),"Survie conserve son contenu");
      }finally{await context.close()}
    }
    console.log(JSON.stringify({scenario:"Phase 10 S3 owner-only real Chromium PvP setup screen",
      mobileAndDesktop:true,creatorRules:true,creatorParticipants:true,foreignDomIntact:true,
      gameplayImplemented:false}));
  }finally{await browser.close()}
})().catch(error=>{console.error(error);process.exitCode=1});
