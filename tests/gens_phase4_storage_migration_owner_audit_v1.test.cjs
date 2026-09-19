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
assert.equal(blob,'ff11682d74be7921a591a9b76080eaf337c071be','storage audit must target the resolver-complete runtime blob');

const scripts=[...index.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)].map((m,i)=>{
  const id=(m[1].match(/\bid=["']([^"']+)["']/i)||[])[1]||'';
  return {order:i+1,id,body:m[2]};
});
assert.equal(scripts.length,142,'inline script count drifted');
assert.equal(scripts.filter(x=>x.id).length,130,'identified inline script count drifted');
assert.equal(scripts.filter(x=>!x.id).length,12,'anonymous inline script count drifted');

const storageAccessCount=body=>(body.match(/\blocalStorage(?:\?\.)?\.(?:getItem|setItem|removeItem)(?:\?\.)?\s*\(/g)||[]).length;
const anonymous=scripts.filter(x=>!x.id).map(x=>({...x,storageAccesses:storageAccessCount(x.body)})).filter(x=>x.storageAccesses>0);
assert.deepEqual(anonymous.map(x=>[x.order,x.storageAccesses]),[[5,139],[6,38],[7,24]],'anonymous storage owners drifted');
assert.equal(anonymous.reduce((n,x)=>n+x.storageAccesses,0),201,'anonymous localStorage access debt drifted');

const anon5=anonymous.find(x=>x.order===5).body;
for(const token of [
  'GENSRPG_IDB_MIGRATION_FLAG','GENSRPG_ASSET_DB_NAME','GENSRPG_ASSET_DB_VERSION',
  'GENSRPG_ASSET_STORE','GENSRPG_ASSET_PREFIX','gensrpgOpenAssetDb',
  'gensrpgAssetPut','gensrpgAssetGet','gensrpgLoadAllAssetCache',
  'gensrpgMigrateLocalImagesToIndexedDb','gensrpgExportIndexedAssets',
  'gensrpgImportIndexedAssets','gensrpgBootstrapIndexedStorage'
]) assert.match(anon5,new RegExp('\\b'+token+'\\b'),token+' must remain in the current anonymous IndexedDB owner before extraction');
assert.match(anon5,/indexedDB\.open\(GENSRPG_ASSET_DB_NAME,GENSRPG_ASSET_DB_VERSION\)/);
assert.match(anon5,/localStorage\.getItem\(GENSRPG_IDB_MIGRATION_FLAG\)/);
assert.match(anon5,/localStorage\.setItem\(GENSRPG_IDB_MIGRATION_FLAG,"1"\)/);

const anon6=anonymous.find(x=>x.order===6).body;
assert.match(anon6,/gensrpgImportIndexedAssets\(payload\.indexedAssets\)/,'backup import must consume IndexedDB asset import');
assert.match(anon6,/localStorage\.removeItem\(GENSRPG_IDB_MIGRATION_FLAG\)/,'backup import currently resets the asset migration flag');
assert.match(anon6,/Storage\.prototype\.setItem\s*=\s*function/,'pre-existing global Storage.setItem quota patch must be explicitly classified before storage extraction');

const anon7=anonymous.find(x=>x.order===7).body;
assert.match(anon7,/Z40K_APP_VERSION/,'anonymous script 7 remains a mixed app/PWA owner');
assert.ok(storageAccessCount(anon7)>0,'mixed app/PWA owner must remain visible to the storage audit');

function block(id){
  const x=scripts.find(s=>s.id===id);
  assert.ok(x,'missing inline block '+id);
  return x.body;
}
assert.match(block('dungeonCore051ExplorationPolish'),/Migration des anciennes aventures/,'challenge migration must remain classified as Dungeon content migration');
assert.match(block('dungeonCore083MovementBalance'),/function migrate083\(/,'movement balance migration must remain classified as Dungeon gameplay/profile migration');

const manifest=JSON.parse(fs.readFileSync(path.join(root,'docs','GENSRPG_PHASE2_STORAGE_OWNERS.json'),'utf8'));
assert.equal(manifest.totals.totalAccesses,221,'Phase 2 identified-block/external storage baseline drifted');

console.log(JSON.stringify({
  scenario:'Phase 4 storage/migration owner audit',
  sourceIndexBlob:blob,
  phase2TrackedAccesses:manifest.totals.totalAccesses,
  anonymousStorageAccesses:201,
  anonymousStorageOwners:anonymous.map(x=>({order:x.order,accesses:x.storageAccesses})),
  sharedMigrationOwner:'anonymous-inline-5 / IndexedDB asset storage',
  mixedImportExportOwner:'anonymous-inline-6',
  mixedPwaOwner:'anonymous-inline-7',
  moduleMigrations:['dungeonCore051ExplorationPolish','dungeonCore083MovementBalance'],
  recommendedFirstSubLot:'Core IndexedDB asset storage primitives; migration remains separate'
},null,2));
