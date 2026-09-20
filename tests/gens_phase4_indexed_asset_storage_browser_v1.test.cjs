const assert=require('node:assert/strict');
const fs=require('node:fs');
const http=require('node:http');
const path=require('node:path');
const {chromium}=require('playwright');

const root=path.join(__dirname,'..');
const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.jpeg':'image/jpeg','.webp':'image/webp'};
const server=http.createServer((req,res)=>{
  const pathname=decodeURIComponent(new URL(req.url,'http://127.0.0.1').pathname);
  const rel=pathname==='/'?'/preview.html':pathname,file=path.resolve(root,'.'+rel);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);res.end('forbidden');return}
  fs.readFile(file,(err,data)=>{if(err){res.writeHead(404);res.end('not found');return}res.writeHead(200,{'content-type':mime[path.extname(file).toLowerCase()]||'application/octet-stream','cache-control':'no-store'});res.end(data)});
});

(async()=>{
  const watchdog=setTimeout(()=>{console.error('[idb-assets] WATCHDOG');process.exit(1)},120000);
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const port=server.address().port;
  const browser=await chromium.launch({headless:true,args:['--disable-dev-shm-usage']});
  const context=await browser.newContext({viewport:{width:412,height:915},isMobile:true,hasTouch:true,serviceWorkers:'block'});
  await context.addInitScript(()=>{window.supabase={createClient:()=>({})}});
  const page=await context.newPage();
  page.setDefaultTimeout(30000);
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  const errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED|NS_BINDING_ABORTED/.test(m.text()))errors.push(m.text())});
  try{
    await page.goto('http://127.0.0.1:'+port+'/preview.html',{waitUntil:'domcontentloaded',timeout:60000});
    await page.waitForFunction(()=>document.documentElement?.dataset?.gensrpgPreviewReady==='1',null,{timeout:60000});

    const state=await page.evaluate(async()=>{
      const ref=GENSRPG_ASSET_PREFIX+'phase4_idb_test_'+Date.now().toString(36);
      const payload='data:image/png;base64,UEhBU0U0X0lEQl9BU1NFVA==';

      const deleteRef=async key=>{
        const db=await gensrpgOpenAssetDb();
        await new Promise((resolve,reject)=>{
          const tx=db.transaction(GENSRPG_ASSET_STORE,'readwrite');
          tx.objectStore(GENSRPG_ASSET_STORE).delete(key);
          tx.oncomplete=()=>resolve();
          tx.onerror=()=>reject(tx.error||new Error('Suppression IndexedDB impossible'));
        });
        db.close();
        gensrpgAssetCache.delete(key);
      };

      await deleteRef(ref);
      await gensrpgAssetPut(ref,payload);
      gensrpgAssetCache.delete(ref);
      const readAfterPut=await gensrpgAssetGet(ref);
      const exported=await gensrpgExportIndexedAssets();

      await deleteRef(ref);
      const readAfterDelete=await gensrpgAssetGet(ref);
      gensrpgAssetCache.delete(ref);

      await gensrpgImportIndexedAssets({[ref]:payload});
      gensrpgAssetCache.delete(ref);
      const readAfterImport=await gensrpgAssetGet(ref);
      await deleteRef(ref);

      return {
        dbName:GENSRPG_ASSET_DB_NAME,
        dbVersion:GENSRPG_ASSET_DB_VERSION,
        store:GENSRPG_ASSET_STORE,
        prefix:GENSRPG_ASSET_PREFIX,
        migrationFlag:GENSRPG_IDB_MIGRATION_FLAG,
        migrationOwner:typeof gensrpgMigrateLocalImagesToIndexedDb,
        bootstrapOwner:typeof gensrpgBootstrapIndexedStorage,
        readAfterPut,
        exportContains:exported?.[ref]||'',
        readAfterDelete,
        readAfterImport
      };
    });

    console.log('[idb-assets]',JSON.stringify(state,null,2));
    console.log('[idb-assets-errors]',JSON.stringify(errors,null,2));
    assert.equal(state.dbName,'GenSrpG_Assets');
    assert.equal(state.dbVersion,1);
    assert.equal(state.store,'assets');
    assert.equal(state.prefix,'idbasset:');
    assert.equal(state.migrationFlag,'gensrpg_idb_assets_migrated_v1');
    assert.equal(state.migrationOwner,'function','migration must remain active during primitive extraction');
    assert.equal(state.bootstrapOwner,'function','legacy bootstrap must remain active during primitive extraction');
    assert.equal(state.readAfterPut,'data:image/png;base64,UEhBU0U0X0lEQl9BU1NFVA==');
    assert.equal(state.exportContains,state.readAfterPut,'raw export must preserve the exact stored asset string');
    assert.equal(state.readAfterDelete,'','deleted asset must read as empty string when cache is cleared');
    assert.equal(state.readAfterImport,state.readAfterPut,'raw import must restore the exact stored asset string');
    assert.equal(errors.length,0,'browser console/page errors');
  }finally{
    clearTimeout(watchdog);
    await context.close();await browser.close();await new Promise(r=>server.close(r));
  }
})().catch(e=>{console.error(e);process.exitCode=1});
