const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.join(__dirname,'..');
const index=fs.readFileSync(path.join(root,'index.html'),'utf8');
const servicePath=path.join(root,'assets','gensrpg','core','indexed-asset-storage-v1.js');

assert.equal(fs.existsSync(servicePath),true,'Core IndexedDB asset storage service must exist');
const service=fs.readFileSync(servicePath,'utf8');

for(const token of [
  'GenSrpG_Assets','idbasset:','indexedDB.open','openDb','put','get',
  'loadAllCache','assetRef','externalizeSync','hydrate','externalizeAwait','exportAll','importAll'
]) assert.ok(service.includes(token),token+' must be owned by the Core IndexedDB service');

assert.doesNotMatch(service,/gensrpg_idb_assets_migrated_v1|GENSRPG_IDB_MIGRATION_FLAG/,'migration flag must remain outside the primitive Core service');
assert.doesNotMatch(service,/\b(?:document|localStorage|sessionStorage|Storage\.prototype|MutationObserver|setTimeout|setInterval)\b/,'Core IndexedDB asset storage must not own UI, localStorage migration, global patches or timers');

const scripts=[...index.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map((m,i)=>({
  order:i+1,
  id:(m[1].match(/\bid=["']([^"']+)["']/i)||[])[1]||'',
  body:m[2],
  start:m.index
}));
const anon5=scripts.find(x=>!x.id&&x.body.includes('async function gensrpgMigrateLocalImagesToIndexedDb('));
assert.ok(anon5,'legacy anonymous asset migration/bootstrap owner missing');

assert.match(anon5.body,/const GENSRPG_IDB_MIGRATION_FLAG="gensrpg_idb_assets_migrated_v1"/,'legacy migration flag must remain in anonymous owner 5');
assert.match(anon5.body,/async function gensrpgMigrateLocalImagesToIndexedDb\(/,'legacy migration must remain in anonymous owner 5');
assert.match(anon5.body,/async function gensrpgBootstrapIndexedStorage\(/,'legacy bootstrap/UI refresh must remain in anonymous owner 5');
assert.match(anon5.body,/localStorage\.getItem\(GENSRPG_IDB_MIGRATION_FLAG\)/);
assert.match(anon5.body,/localStorage\.setItem\(GENSRPG_IDB_MIGRATION_FLAG,"1"\)/);

assert.doesNotMatch(anon5.body,/indexedDB\.open\(/,'anonymous owner 5 must no longer open the asset DB directly');
for(const fn of [
  'gensrpgOpenAssetDb','gensrpgAssetPut','gensrpgAssetGet','gensrpgLoadAllAssetCache',
  'gensrpgAssetRef','gensrpgExternalizeAssetsSync','gensrpgHydrateAssets',
  'gensrpgExternalizeAssetsAwait','gensrpgExportIndexedAssets','gensrpgImportIndexedAssets'
]){
  assert.doesNotMatch(anon5.body,new RegExp('(?:async\\s+)?function\\s+'+fn+'\\s*\\('),fn+' implementation must move to Core');
}

for(const alias of [
  ['GENSRPG_ASSET_DB_NAME','DB_NAME'],
  ['GENSRPG_ASSET_DB_VERSION','DB_VERSION'],
  ['GENSRPG_ASSET_STORE','STORE'],
  ['GENSRPG_ASSET_PREFIX','PREFIX'],
  ['gensrpgAssetCache','cache'],
  ['gensrpgOpenAssetDb','openDb'],
  ['gensrpgAssetPut','put'],
  ['gensrpgAssetGet','get'],
  ['gensrpgLoadAllAssetCache','loadAllCache'],
  ['gensrpgAssetRef','assetRef'],
  ['gensrpgExternalizeAssetsSync','externalizeSync'],
  ['gensrpgHydrateAssets','hydrate'],
  ['gensrpgExternalizeAssetsAwait','externalizeAwait'],
  ['gensrpgExportIndexedAssets','exportAll'],
  ['gensrpgImportIndexedAssets','importAll']
]){
  const legacy=alias[0],member=alias[1];
  assert.match(anon5.body,new RegExp('const\\s+'+legacy+'\\s*=\\s*window\\.GensIndexedAssetStorageV1\\.'+member+'\\s*;?'),legacy+' must be a direct alias to the unique Core owner');
}

const tag='<script src="assets/gensrpg/core/indexed-asset-storage-v1.js"></script>';
const tagPos=index.indexOf(tag);
assert.ok(tagPos>=0,'Core IndexedDB service tag missing from source composition');
assert.ok(tagPos<anon5.start,'Core IndexedDB service must load before anonymous owner 5');

console.log(JSON.stringify({
  scenario:'Phase 4 IndexedDB asset storage owner',
  service:'assets/gensrpg/core/indexed-asset-storage-v1.js',
  legacyMigrationOwner:'anonymous-inline-5',
  formatMigrationMoved:false
},null,2));
