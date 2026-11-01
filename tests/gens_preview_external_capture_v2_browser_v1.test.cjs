'use strict';
// Real external GitHub HTML-preview transport, using the exact PR commit.
// External transport must open the unchanged official Lab documents at exact
// main-certified SHAs without pretending to host the complete GenSrpg bundle.
// This verifies native pages, not cross-laboratory gameplay or app persistence.
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
  page.setDefaultNavigationTimeout(90000);
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
    // External preview only: render each original Lab on its immutable commit.
    // Production must still require its own same-origin vendor owner.
    const diagnostics=await page.evaluate(()=>({
      href:location.href,base:document.baseURI,
      previewFlag:window.__GENSRPG_PREVIEW__,
      transportType:typeof window.GensCaptureV2PreviewTransportV1,
      inlineScriptCount:[...document.scripts].filter(s=>!!s.textContent.trim()).length,
      injectedScriptCount:[...document.scripts].filter(s=>s.textContent.includes('GensCaptureV2PreviewTransportV1')).length,
      injectedScripts:[...document.scripts].filter(s=>s.textContent.includes('GensCaptureV2PreviewTransportV1'))
        .map(s=>s.textContent.slice(0,240)),
      headStart:document.head?.innerHTML.slice(0,700)
    }));
    console.log('CAPTURE_PREVIEW_TRANSPORT_DEBUG',JSON.stringify(diagnostics));
    assert.equal(await page.evaluate(()=>window.__GENSRPG_PREVIEW__),true,
      'external host must execute the explicit preview flag even when in-document scripts are inert');
    const roots=await page.evaluate(()=>window.GensCaptureV2PreviewTransportV1||null);
    assert.ok(roots,'external preview must publish its explicit native-Lab transport');
    assert.equal(roots.combat,
      'https://raw.githack.com/slyen4425-cloud/GenSrpg_labo_combat_dynamique/81ad362a401b7b2eb9faa811528aced9f2d6384a/');
    assert.equal(roots.exploration,
      'https://raw.githack.com/slyen4425-cloud/laboratoire_dynamique_exploration-/8dc6f23792cbad9d4ac65bc3825c60de0ffcd32c/');
    for(const [key,family,rel,selector] of [
      ['creature','combat','examples/dom-demo/capture-editor-v2.html?tab=creature','[data-capture-editor-human]'],
      ['skills','combat','examples/dom-demo/capture-editor-v2.html?tab=skills','[data-editor-panel="skills"]'],
      ['combat','combat','examples/dom-demo/capture-editor-v2.html?tab=combat','[data-editor-panel="combat"]'],
      ['music','combat','examples/dom-demo/capture-editor-v2.html?tab=music','[data-editor-panel="music"]'],
      ['bestiary','combat','examples/dom-demo/bestiary.html','[data-bestiary]'],
      ['explore','exploration','index.html','canvas#game'],
      ['builder','exploration','builder.html','#builder-preview'],
      ['world','exploration','world-assembler.html','#world-area-count']
    ]){
      await page.locator('#gensCaptureV2Root [data-capture-v2-view="'+key+'"]').click();
      const frame=page.locator('#gensCaptureV2Root iframe');
      await frame.waitFor({state:'visible'});
      assert.equal(await frame.getAttribute('src'),roots[family]+rel,
        'native '+key+' must be pinned to its single official Lab main SHA');
      await page.frameLocator('#gensCaptureV2Root iframe').locator(selector).waitFor({timeout:60000});
    }
    await page.locator('#gensCaptureV2Root button').getByText('Accueil Capture',{exact:true}).click();
    assert.equal(await page.locator('#gensCaptureV2Root iframe').count(),0);
    await page.getByRole('button',{name:'Quitter le mode'}).click();
    assert.equal(await page.locator('#gensCaptureV2Root').count(),0);
    console.log(JSON.stringify({scenario:'external pinned SHA Capture V2 Shell preview',
      sha,transport:'html-preview.github.io',nativeVendorStaged:false,nativePreviewPinnedMain:true,
      fullNativeBrowserGate:'gens_capture_v2_root_browser.test.cjs'}));
  }finally{
    await context.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
