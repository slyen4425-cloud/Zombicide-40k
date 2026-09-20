const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

const root=path.join(__dirname,'..');
const src=fs.readFileSync(path.join(root,'assets','gensrpg','core','indexed-asset-storage-v1.js'),'utf8');

assert.doesNotThrow(()=>new Function(src),'IndexedDB asset storage source must stay syntactically valid');
assert.doesNotMatch(src,/gensrpg_idb_assets_migrated_v1|GENSRPG_IDB_MIGRATION_FLAG/,'migration flag is not a primitive storage concern');
assert.doesNotMatch(src,/\b(?:document|localStorage|sessionStorage|Storage\.prototype|MutationObserver|setTimeout|setInterval|addEventListener)\b/,'Core IndexedDB asset storage must not own UI, localStorage migration, patches, observers, timers or listeners');

const fakeIndexedDb={open(){throw new Error('not exercised by pure contract test')}};
const ctx={console,Date,Math,indexedDB:fakeIndexedDb};
ctx.window=ctx;ctx.globalThis=ctx;
vm.createContext(ctx);
vm.runInContext(src,ctx,{filename:'indexed-asset-storage-v1.js'});
const api=ctx.GensIndexedAssetStorageV1;

assert.ok(api,'GensIndexedAssetStorageV1 API missing');
assert.equal(api.VERSION,'1.0.0');
assert.equal(api.DB_NAME,'GenSrpG_Assets');
assert.equal(api.DB_VERSION,1);
assert.equal(api.STORE,'assets');
assert.equal(api.PREFIX,'idbasset:');
assert.ok(api.cache instanceof Map||Object.prototype.toString.call(api.cache)==='[object Map]');
for(const fn of ['openDb','put','get','loadAllCache','assetRef','externalizeSync','hydrate','externalizeAwait','exportAll','importAll'])assert.equal(typeof api[fn],'function',fn+' API missing');

const plain={name:'sans image',nested:[1,'x']};
assert.equal(JSON.stringify(api.externalizeSync(plain)),JSON.stringify(plain),'plain data must remain structurally identical');
assert.equal(JSON.stringify(api.hydrate(plain)),JSON.stringify(plain),'plain data hydration must remain structurally identical');
assert.equal(api.hydrate('idbasset:missing'),'idbasset:missing','unknown IndexedDB refs must remain unresolved refs');
api.cache.set('idbasset:known','data:image/png;base64,KNOWN');
assert.equal(api.hydrate('idbasset:known'),'data:image/png;base64,KNOWN','known refs must hydrate from the shared cache');

console.log(JSON.stringify({
  scenario:'Phase 4 pure IndexedDB asset storage contract',
  productionLoaded:false,
  db:api.DB_NAME,
  version:api.DB_VERSION,
  store:api.STORE,
  prefix:api.PREFIX,
  migrationOwned:false
},null,2));
