"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {audit}=require("../tools/gensrpg_phase11_external_asset_refs_a1.cjs");
const root=path.resolve(__dirname,"..");
function read(file){return fs.readFileSync(path.join(root,file),"utf8")}
const inv=JSON.parse(read("docs/phase11/asset-inventory-a0.json"));
const matrix=JSON.parse(read("docs/phase11/asset-ownership-matrix-a1.json"));
const manifest=JSON.parse(read("manifest.webmanifest"));
const deploy=read(".github/workflows/main.yml");
const scan=audit();

assert.equal(matrix.schemaVersion,1);
assert.equal(matrix.lot,"A1");
assert.equal(matrix.migrationApproved,false);
assert.equal(matrix.unnamedAssets.length,32);
assert.equal(scan.items.length,32);
assert.equal(matrix.externalAudit.scannedTrackedSources,scan.sourceCount);
assert.equal(matrix.externalAudit.imagesWithLiteralReferences,scan.imagesWithLiteralReferences);
assert.equal(matrix.externalAudit.literalHits,scan.literalReferenceCount);
assert.equal(scan.exactIndexStatus,"not inspected; charter section 26 ZIP required");
const source=new Map(inv.images.map(x=>[x.path,x]));
const imageSet=new Set();
for(const row of matrix.unnamedAssets){
  assert.ok(!imageSet.has(row.existingPath)); imageSet.add(row.existingPath);
  assert.ok(row.existingPath.startsWith("assets/img_"));
  const current=source.get(row.existingPath);
  assert.ok(current);
  assert.equal(row.bytes,current.bytes);
  assert.equal(row.gitBlob,current.gitBlob);
  assert.equal(row.externalLiteralRefs,scan.items.find(x=>x.asset===row.existingPath).literalExternalReferences.length);
  assert.equal(row.owner,"not-established");
  assert.equal(row.consumer,"not-established");
  assert.equal(row.proposedRepoDestination,null);
  assert.ok(row.requiredEvidence.some(x=>x.includes("exact-index")));
}
assert.equal(matrix.pwaIcons.length,4);
const iconRoutes=new Map(matrix.pwaIcons.map(x=>[x.source,x]));
for(const size of [192,512]){
  const sourcePath="icon-"+size+".png";
  const duplicate="Icon/"+sourcePath;
  const row=iconRoutes.get(sourcePath);
  const duplicateRow=iconRoutes.get(duplicate);
  assert.ok(row && duplicateRow);
  assert.equal(row.owner,"shell-pwa");
  assert.equal(row.publishedPath,"icons/"+sourcePath);
  assert.equal(duplicateRow.publishedPath,null);
  assert.equal(duplicateRow.owner,"unknown");
  assert.equal(row.sourceBlob,source.get(sourcePath).gitBlob);
  assert.equal(duplicateRow.sourceBlob,source.get(duplicate).gitBlob);
  assert.notEqual(row.sourceBlob,duplicateRow.sourceBlob,"Icon duplicate must not be silently consolidated");
  assert.ok(manifest.icons.some(x=>x.src==="./icons/"+sourcePath));
  assert.ok(deploy.includes("cp -f "+sourcePath+" _site/icons/"+sourcePath));
}
console.log(JSON.stringify({scenario:"Phase11 A1 path-proof matrix; no migration",
  unknownOwners:matrix.unnamedAssets.length,pwaPublishedIcons:2,
  nonidenticalIconFolderAssets:2,externalLiteralReferences:scan.literalReferenceCount,
  exactIndexPending:true,migrationApproved:false}));
