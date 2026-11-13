'use strict';
// Real external GitHub HTML-preview transport, using the exact PR commit.
// External transport must open the unchanged official Lab documents at exact
// main-certified SHAs without pretending to host the complete GenSrpg bundle.
// This verifies native pages, not cross-laboratory gameplay or app persistence.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const pins=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../assets/gensrpg/capture-v2/source-pins-v1.json'),'utf8'));
for(const family of ['combat','exploration']){
  assert.equal(pins[family].ref,'main','external native Lab must have one official main owner');
  assert.match(pins[family].sha,/^[a-f0-9]{40}$/,'Lab SHA must be immutable');
}

const {chromium}=require('playwright');
const {PNG}=require('pngjs');
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
  const pageErrors=[],failedRequests=[],badResponses=[];
  page.on('pageerror',error=>pageErrors.push(String(error?.stack||error)));
  page.on('console',msg=>{if(msg.type()==='error')pageErrors.push('console '+msg.text())});
  page.on('requestfailed',req=>failedRequests.push({url:req.url(),reason:req.failure()?.errorText}));
  page.on('response',res=>{if(res.status()>=400)badResponses.push({url:res.url(),status:res.status()})});
  try{
    const response=await page.goto(target,{waitUntil:'domcontentloaded'});
    assert.ok(response?.ok(),'external GitHub preview host must serve a page');
    try{
      await page.waitForFunction(()=>(
        document.documentElement?.dataset?.gensrpgPreviewReady==='1' &&
        !!window.GensCaptureV2 &&
        typeof window.GensShellModuleLaunchV1?.activeModule==='function' &&
        document.querySelectorAll('button.gensRootModeCard').length===4
      ),null,{timeout:60000});
    }catch(error){
      // Never relax the external gate. Report real host DOM and transport.
      const observed=await page.evaluate(()=>({
        url:location.href,base:document.baseURI,title:document.title,
        readyFlag:document.documentElement?.dataset?.gensrpgPreviewReady,
        previewMode:window.__GENSRPG_PREVIEW__,
        captureV2:typeof window.GensCaptureV2,
        shellLaunch:typeof window.GensShellModuleLaunchV1?.activeModule,
        modeButtons:document.querySelectorAll('button.gensRootModeCard').length,
        inlineScripts:[...document.scripts].filter(s=>!!s.textContent.trim()).length,
        externalScripts:[...document.scripts].filter(s=>!!s.src).map(s=>s.src).slice(0,12),
        bodyText:document.body?.textContent?.trim().slice(0,650)
      })).catch(e=>({readError:String(e)}));
      throw new Error('Real external Capture preview did not bootstrap: '+
        JSON.stringify({observed,pageErrors:pageErrors.slice(-12),
          badResponses:badResponses.slice(-12),failedRequests:failedRequests.slice(-12)})+
        '; '+String(error));
    }
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
    assert.equal(await page.locator('#gensCaptureV2Root [data-capture-v2-view]').count(),10,
      'external Shell has eight native Lab destinations (including heroes), one Jouer, and one item editor');
    assert.equal(await page.locator('#gensCaptureV2Root [data-editor-group="heroes"] [data-capture-v2-view="heroes"]').count(),1,
      'one native Exploration hero editor, never a duplicated editor');
    assert.equal(await page.locator('#gensCaptureV2Root [data-editor-group="economy"] [data-capture-v2-view="items"]').count(),1,
      'external Shell item editor is the existing Capture Adventure owner');
    assert.equal(await page.locator('#gensCaptureV2Root [data-capture-v2-menu="editors"]').count(),1);
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
    for(const family of ['combat','exploration']){
      const official=pins[family];
      assert.equal(roots[family],'https://raw.githack.com/'+official.repository+'/'+official.sha+'/',
        'external native '+family+' must follow the immutable canonical source-pins-v1.json main owner');
    }
    for(const [key,family,rel,selector] of [
      ['creature','combat','examples/dom-demo/capture-editor-v2.html?tab=creature','[data-capture-editor-human]'],
      ['skills','combat','examples/dom-demo/capture-editor-v2.html?tab=skills','[data-editor-panel="skills"]'],
      ['combat','combat','examples/dom-demo/capture-editor-v2.html?tab=combat','[data-editor-panel="combat"]'],
      ['music','combat','examples/dom-demo/capture-editor-v2.html?tab=music','[data-editor-panel="music"]'],
      ['bestiary','combat','examples/dom-demo/bestiary.html','[data-bestiary]'],
      ['builder','exploration','sculpt-lab.html','#sculpt-canvas'],
      ['world','exploration','world-assembler.html','#world-area-count']
    ]){
      if(key!=='creature'){
        await page.locator('#gensCaptureV2Root .gensCaptureV2NativeBack').click();
      }
      await page.locator('#gensCaptureV2Root [data-capture-v2-menu="editors"]').click();
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
    await page.locator('#gensCaptureV2Root [data-capture-v2-menu="editors"]').click();
    await page.locator('#gensCaptureV2Root [data-capture-v2-view="builder"]').click();
    const sculpt=page.frameLocator('#gensCaptureV2Root iframe').locator('#sculpt-canvas');
    await sculpt.waitFor({state:'visible',timeout:30000});
    // The official sculpt renderer draws real cross-origin art. A legitimately
    // tainted canvas cannot be inspected with getImageData; that is a browser
    // security feature, not a failed terrain draw. Screenshot the actual
    // composited canvas pixels, never a synthetic tile or a CSS placeholder.
    const initialized=await sculpt.evaluate(async canvas=>{
      const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
      for(let attempt=0;attempt<70;attempt++){
        const ready=typeof window.__sculptLabProbe==='function';
        const result={ready,width:canvas.width,height:canvas.height,
          cssWidth:canvas.getBoundingClientRect().width,
          cssHeight:canvas.getBoundingClientRect().height};
        if(result.ready&&result.width>300&&result.height>150&&
            result.cssWidth>300&&result.cssHeight>150)return result;
        await sleep(400);
      }
      return {ready:typeof window.__sculptLabProbe==='function',
        width:canvas.width,height:canvas.height};
    });
    assert.ok(initialized?.ready&&initialized.width>300&&initialized.height>150,
      'Real 2.5D module must complete init before pixel proof: '+
      JSON.stringify({initialized,pageErrors:pageErrors.slice(-12),badResponses:badResponses.slice(-12)}));
    await page.waitForTimeout(350);
    const screenshot=PNG.sync.read(await sculpt.screenshot({timeout:45000,animations:'disabled'}));
    const colors=new Set();let lit=0;
    for(let yi=1;yi<=11;yi++)for(let xi=1;xi<=11;xi++){
      const x=Math.min(screenshot.width-1,Math.floor(screenshot.width*xi/12));
      const y=Math.min(screenshot.height-1,Math.floor(screenshot.height*yi/12));
      const k=(y*screenshot.width+x)*4;
      const red=screenshot.data[k],green=screenshot.data[k+1],blue=screenshot.data[k+2];
      colors.add(red+','+green+','+blue);
      if(red+green+blue>80)lit++;
    }
    const paint={width:screenshot.width,height:screenshot.height,
      uniqueColors:colors.size,coloredSamples:lit,initialized};
    assert.ok(screenshot.width>300&&screenshot.height>150&&
      colors.size>=4&&lit>=8,
      'REAL sculpt scene screenshot must show painted terrain pixels: '+
      JSON.stringify({paint,pageErrors:pageErrors.slice(-16),
        failedRequests:failedRequests.slice(-12),badResponses:badResponses.slice(-16)}));
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
