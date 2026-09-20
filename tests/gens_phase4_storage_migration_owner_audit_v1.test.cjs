const assert=require('node:assert/strict');
const fs=require('node:fs');
const crypto=require('node:crypto');
const path=require('node:path');

const root=path.join(__dirname,'..');
const bytes=fs.readFileSync(path.join(root,'index.html'));
const index=bytes.toString('utf8');
const blob=crypto.createHash('sha1').update(Buffer.concat([
  Buffer.from('blob '+bytes.length+'\0'),bytes
])).digest('hex');
assert.equal(blob,'37387cf0582adaccab0206a2b746784976304600','storage audit must target the resolver-complete runtime blob');

const scripts=[...index.matchAll(/<script\\b([^>]*)>([\\s\\S]*?)<\\/script>/gi)].map((m,i)=>{
  const id=(m[1].match(/\\bid=["']([^"']+)["']/i)||[])[1]||'';
  return {order:i+1,id,body:m[2],start:m.index};
});
assert.equal(scripts.length,143,'script count must include the explicit Core IndexedDB service tag');
assert.equal(scripts.filter(x=>x.id).length,130,'identified inline script count drifted');
assert.equal(scripts.filter(x=>!x.id).length,13,'anonymous/external-without-id script count drifted');

const storageAccessCount=body=>(body.match(/\\blocalStorage(?:\\?\\.)?\\.(?:getItem|setItem|removeItem)(?:\\?\\.)?\\s*\\(/g)||[]).length;
const anonymous=scripts.filter(x=>!x.id).map(x=>({...x,storageAccesses:storageAccessCount(x.body)})).filter(x=>x.storageAccesses>0);
assert.equal(anonymous.reduce((n,x)=>n+x.storageAccesses,0),201,'anonymous localStorage access debt must stay unchanged');

const assetLegacy=anonymous.find(x=>x.body.includes('async function gensrpgMigrateLocalImagesToIndexedDb('));
const backupLegacy=anonymous.find(x=>x.body.includes('Storage.prototype.setItem')&&x.body.includes('gensrpgImportIndexedAssets(payload.indexedAssets)'));
const pwaLegacy=anonymous.find(x=>x.body.includes('Z40K_APP_VERSION'));
assert.ok(assetLegacy&&backupLegacy&&pwaLegacy,'historical anonymous storage owners must remain identifiable by responsibility');
assert.equal(assetLegacy.storageAccesses,139);
assert.equal(backupLegacy.storageAccesses,38);
assert.equal(pwaLegacy.storageAccesses,24);

const servicePath=path.join(root,'assets','gensrpg','core','indexed-asset-storage-v1.js');
assert.equal(fs.existsSync(servicePath),true,'Core IndexedDB asset storage service missing');
const service=fs.readFileSync(servicePath,'utf8');
for(const token of ['GenSrpG_Assets','idbasset:','openDb','put','get','loadAllCache','externalizeSync','hydrate','externalizeAwait','exportAll','importAll'])assert.ok(service.includes(token),'Core IndexedDB service missing '+token);
assert.match(service,/indexedDB\\.open\\(DB_NAME,DB_VERSION\\)/,'Core service must own the IndexedDB open primitive');
assert.doesNotMatch(service,/GENSRPG_IDB_MIGRATION_FLAG|gensrpg_idb_assets_migrated_v1/,'migration flag must remain legacy-owned');

for(const token of ['GENSRPG_IDB_MIGRATION_FLAG','gensrpgMigrateLocalImagesToIndexedDb','gensrpgBootstrapIndexedStorage'])assert.match(assetLegacy.body,new RegExp('\\b'+token+'\\b'),token+' must remain in the legacy migration/bootstrap owner');
assert.doesNotMatch(assetLegacy.body,/indexedDB\\.open\\(/,'legacy migration/bootstrap owner must no longer open IndexedDB directly');
assert.match(assetLegacy.body,/const gensrpgAssetPut=window\\.GensIndexedAssetStorageV1\\.put/);
assert.match(assetLegacy.body,/const gensrpgExportIndexedAssets=window\\.GensIndexedAssetStorageV1\\.exportAll/);
assert.match(assetLegacy.body,/localStorage\\.getItem\\(GENSRPG_IDB_MIGRATION_FLAG\\)/);
assert.match(assetLegacy.body,/localStorage\\.setItem\\(GENSRPG_IDB_MIGRATION_FLAG,"1"\\)/);

assert.match(backupLegacy.body,/gensrpgImportIndexedAssets\\(payload\\.indexedAssets\\)/,'backup import must still consume the Core-backed legacy alias');
assert.match(backupLegacy.body,/localStorage\\.removeItem\\(GENSRPG_IDB_MIGRATION_FLAG\\)/,'backup import must still reset the legacy migration flag');
assert.match(backupLegacy.body,/Storage\\.prototype\\.setItem\\s*=\\s*function/,'quota patch remains explicitly outside this sub-lot');

function block(id){
  const x=scripts.find(s=>s.id===id);
  assert.ok(x,'missing inline block '+id);
  return x.body;
}
assert.match(block('dungeonCore051ExplorationPolish'),/Migration des anciennes aventures/,'challenge migration must remain Dungeon content migration');
assert.match(block('dungeonCore083MovementBalance'),/function migrate083\\(/,'movement balance migration must remain Dungeon gameplay/profile migration');

const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_STORAGE_OWNERS.json'),'utf8'));
assert.equal(manifest.totals.totalAccesses,221,'Phase 2 identified-block/external storage baseline drifted');

console.log(JSON.stringify({
  scenario:'Phase 4 storage/migration owner audit',
  sourceIndexBlob:blob,
  phase2TrackedAccesses:manifest.totals.totalAccesses,
  anonymousStorageAccesses:201,
  anonymousStorageOwners:[
    {role:'asset-migration-bootstrap',order:assetLegacy.order,accesses:assetLegacy.storageAccesses},
    {role:'backup-import-export-quota',order:backupLegacy.order,accesses:backupLegacy.storageAccesses},
    {role:'app-pwa',order:pwaLegacy.order,accesses:pwaLegacy.storageAccesses}
  ],
  sharedPrimitiveOwner:'assets/gensrpg/core/indexed-asset-storage-v1.js',
  migrationOwner:'legacy anonymous asset migration/bootstrap block',
  moduleMigrations:['dungeonCore051ExplorationPolish','dungeonCore083MovementBalance'],
  primitiveExtractionComplete:true
},null,2));
