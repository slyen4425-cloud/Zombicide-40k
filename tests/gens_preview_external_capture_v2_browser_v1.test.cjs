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
      'https://raw.githack.com/slyen4425-cloud/laboratoire_dynamique_exploration-/ba0701224b764f4c60d4294c9729a49ade5869ad/');
    for(const [key,family,rel,selector] of [
      ['creature','combat','examples/dom-demo/capture-editor-v2.html?tab=creature','[data-capture-editor-human]'],
      ['skills','combat','examples/dom-demo/capture-editor-v2.html?tab=skills','[data-editor-panel="skills"]'],
      ['combat','combat','examples/dom-demo/capture-editor-v2.html?tab=combat','[data-editor-panel="combat"]'],
      ['music','combat','examples/dom-demo/capture-editor-v2.html?tab=music','[data-editor-panel="music"]'],
      ['bestiary','combat','examples/dom-demo/bestiary.html','[data-bestiary]'],
      ['explore','exploration','sculpt-lab.html','#sculpt-canvas'],
      ['builder','exploration','sculpt-lab.html','#sculpt-canvas'],
      ['world','exploration','world-assembler.html','#world-area-count']
    ]){
      if(key!=='creature'){
        await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').click();
      }
      await page.locator('#gensCaptureV2Root [data-capture-v2-view="'+key+'"]').click();
      const frame=page.locator('#gensCaptureV2Root iframe');
      await frame.waitFor({state:'visible'});
      assert.equal(await frame.getAttribute('allow'),'fullscreen');
      assert.equal(await frame.getAttribute('allowfullscreen'),'');
      assert.equal(await frame.getAttribute('src'),roots[family]+rel,
        'native '+key+' must be pinned to its single official Lab main SHA');
      await page.frameLocator('#gensCaptureV2Root iframe').locator(selector).waitFor({timeout:60000});
    }
    // A static canvas tag is not a rendered map. This test must refuse the
    // historic 2D black-screen preview with scripts that never initialized.
    await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').click();
    await page.locator('#gensCaptureV2Root [data-capture-v2-view="builder"]').click();
    const sculpt=page.frameLocator('#gensCaptureV2Root iframe').locator('#sculpt-canvas');
    await sculpt.waitFor({state:'visible',timeout:30000});
    const paint=await sculpt.evaluate(async canvas=>{
      const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
      let last=null;
      for(let attempt=0;attempt<35;attempt++){
        try{
          const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;
          if(ctx&&w>=80&&h>=80){
            const colors=new Set();let colored=0;
            for(let yi=1;yi<=11;yi++)for(let xi=1;xi<=11;xi++){
              const x=Math.min(w-1,Math.floor(w*xi/12)),y=Math.min(h-1,Math.floor(h*yi/12));
              const d=ctx.getImageData(x,y,1,1).data;
              colors.add(d[0]+','+d[1]+','+d[2]);
              if(d[0]+d[1]+d[2]>80)colored++;
            }
            last={width:w,height:h,uniqueColors:colors.size,coloredSamples:colored,
              moduleReady:typeof window.__sculptExplorationSoundProbe==='function'};
            if(last.moduleReady&&colors.size>=4&&colored>=8)return last;
          }
        }catch(e){last={error:String(e)}}
        await sleep(500);
      }
      return last;
    });
    assert.ok(paint?.moduleReady&&paint.uniqueColors>=4&&paint.coloredSamples>=8,
      'REAL sculpt scene must draw nonblack pixels: '+JSON.stringify(paint));
    // Phone portrait/landscape: native UI must occupy the full available viewport.
    assert.equal(await page.locator('#gensCaptureV2Root > nav').isVisible(),false);
    assert.equal(await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').isVisible(),true);
    const landscape=await page.locator('#gensCaptureV2Root iframe').boundingBox();
    assert.ok(landscape.width>=925 && landscape.height>=422,
      'Lab must fill landscape viewport');
    await page.setViewportSize({width:412,height:915});
    const portrait=await page.locator('#gensCaptureV2Root iframe').boundingBox();
    assert.ok(portrait.width>=407 && portrait.height>=903,
      'Lab must fill portrait viewport without eight hub controls');
    await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').click();
    assert.equal(await page.locator('#gensCaptureV2Root iframe').count(),0);
    assert.equal(await page.locator('#gensCaptureV2Root > nav').isVisible(),true);
    await page.getByRole('button',{name:'Quitter le mode'}).click();
    assert.equal(await page.locator('#gensCaptureV2Root').count(),0);
    console.log(JSON.stringify({scenario:'external pinned SHA Capture V2 Shell preview',
      sha,transport:'html-preview.github.io',nativeVendorStaged:false,nativePreviewPinnedMain:true,
      fullNativeBrowserGate:'gens_capture_v2_root_browser.test.cjs'}));
  }finally{
    await context.close();await browser.close();
  }
})().catch(error=>{console.error(error);process.exitCode=1});
