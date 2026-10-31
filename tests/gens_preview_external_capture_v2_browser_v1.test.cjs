'use strict';
// Real external GitHub HTML-preview transport, using the exact PR commit.
// The external transport can display the four-mode root but cannot stage
// vendor Lab folders. Full main-pinned native Lab UI is separately certified
// in the _site root-browser acceptance gate; do not claim it works here.
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const repo=process.env.GITHUB_REPOSITORY||'slyen4425-cloud/Zombicide-40k';
const sha=process.env.GITHUB_SHA;
assert.match(String(sha||''),/^[a-f0-9]{40}$/,'current external preview SHA must be immutable');
const target='https://html-preview.github.io/?url=https://github.com/'+repo+'/blob/'+sha+'/preview.html';

(async()=>{
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({
    viewport:{width:932,height:430},hasTouch:true,locale:'fr-FR',serviceWorkers:'block'
  });
  const page=await context.newPage();
  page.setDefaultTimeout(45000);
  page.setDefaultNavigationTimeout(60000);
  try{
    const response=await page.goto(target,{waitUntil:'domcontentloaded'});
    assert.ok(response?.ok(),'external GitHub preview host must serve a page');
    await page.waitForFunction(()=>(
      document.documentElement?.dataset?.gensrpgPreviewReady==='1' &&
      !!window.GensCaptureV2 &&
      typeof window.GensShellModuleLaunchV1?.activeModule==='function' &&
      document.querySelectorAll('button.gensRootModeCard').length===4
    ),null,{timeout:60000});
    const owner=await page.evaluate(()=>({
      base:document.baseURI,
      v2:typeof window.GensCaptureV2?.start,
      legacyHub:!!document.getElementById('captureGameHub'),
      modeCount:document.querySelectorAll('button.gensRootModeCard').length
    }));
    assert.ok(owner.base.includes('/'+repo+'/'+sha+'/'),
      'external preview must render the exact commit, never mutable main');
    assert.equal(owner.v2,'function');
    assert.equal(owner.legacyHub,false,'old Capture V1 hub must remain removed');
    assert.equal(owner.modeCount,4);
    await page.locator('button.gensRootModeCard.capture').click();
    await page.locator('#gensCaptureV2Root').waitFor({state:'visible'});
    assert.equal(await page.locator('#gensCaptureV2Root [data-capture-v2-view]').count(),8,
      'external Shell must expose the original native-author destinations');
    // The external GitHub-source origin has NO staged vendor Labs and cannot
    // satisfy the strict same-origin owner boundary. Do not open a broken
    // external editor and never mistake this shell-only transport for _site.
    assert.equal(await page.locator('#gensCaptureV2Root iframe').count(),0,
      'external shell must not fake a native editor that is absent from its origin');
    assert.equal(await page.evaluate(()=>window.GensCaptureV2.status().view),null);
    await page.getByRole('button',{name:'Quitter le mode'}).click();
    assert.equal(await page.locator('#gensCaptureV2Root').count(),0);
    console.log(JSON.stringify({scenario:'external pinned SHA Capture V2 Shell preview',
      sha,transport:'html-preview.github.io',nativeVendorStaged:false,
      fullNativeBrowserGate:'gens_capture_v2_root_browser.test.cjs'}));
  }finally{
    await context.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
