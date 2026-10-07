'use strict';

const assert=require('node:assert/strict');
const {chromium}=require('playwright');

const repo=process.env.GITHUB_REPOSITORY||'slyen4425-cloud/Zombicide-40k';
const sha=process.env.GITHUB_SHA;
assert.match(String(sha||''),/^[0-9a-f]{40}$/,'GITHUB_SHA must identify the exact immutable preview commit');

const target='https://html-preview.github.io/?url=https://github.com/'+repo+'/blob/'+sha+'/preview.html';

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({
    viewport:{width:412,height:915},
    deviceScaleFactor:2.625,
    isMobile:true,
    hasTouch:true,
    locale:'fr-FR',
    serviceWorkers:'block'
  });
  const page=await context.newPage();
  page.setDefaultTimeout(45000);
  page.setDefaultNavigationTimeout(60000);

  const pageErrors=[];
  const consoleErrors=[];
  const failed=[];
  page.on('pageerror',e=>pageErrors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error')consoleErrors.push(m.text())});
  page.on('requestfailed',r=>failed.push({url:r.url(),error:r.failure()?.errorText||''}));
  page.on('dialog',d=>d.accept().catch(()=>{}));

  try{
    const response=await page.goto(target,{waitUntil:'domcontentloaded'});
    assert.ok(response&&response.ok(),'external preview host must return a successful document');

    await page.waitForFunction(()=>(
      /GenSrpG/i.test(document.title||'') &&
      (!!document.getElementById('gensRootHome')||!!document.getElementById('menu')) &&
      typeof window.GensCaptureV1==='object' &&
      typeof window.GensCaptureSessionStartV1==='object' &&
      typeof window.startConfiguredGame==='function'
    ));

    const state=await page.evaluate(()=>({
      title:document.title,
      ready:document.documentElement?.dataset?.gensrpgPreviewReady||'',
      root:!!document.getElementById('gensRootHome'),
      menu:!!document.getElementById('menu'),
      captureEntry:typeof window.GensCaptureV1,
      captureSessionOwner:typeof window.GensCaptureSessionStartV1,
      startConfiguredGame:typeof window.startConfiguredGame,
      bodyText:(document.body?.innerText||'').slice(0,300),
      href:location.href
    }));

    assert.match(state.title,/GenSrpG/i,'external preview must execute HTML instead of showing source text');
    assert.equal(state.captureEntry,'object','external preview must load GensCaptureV1');
    assert.equal(state.captureSessionOwner,'object','external preview must load the Capture session-start owner');
    assert.equal(state.startConfiguredGame,'function','final Shell launch authority must be active');
    assert.ok(state.root||state.menu,'external preview must render the real GenSrpG shell/menu');
    assert.ok(!state.bodyText.startsWith('<!doctype html>'),'external preview must not expose preview.html as plain text');
    assert.deepEqual(pageErrors,[],'external preview must not raise page errors');
    assert.deepEqual(consoleErrors,[],'external preview must not raise console errors');

    console.log(JSON.stringify({
      scenario:'exact external GenSrpG preview',
      target,
      sha,
      state,
      requestFailures:failed.slice(0,12)
    },null,2));
  }finally{
    await context.close().catch(()=>{});
    await browser.close().catch(()=>{});
  }
})().catch(e=>{console.error(e);process.exitCode=1});
