"use strict";
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const {audit,eligibleSource}=require("../tools/gensrpg_phase11_external_asset_refs_a1.cjs");
const root=path.resolve(__dirname,"..");
const a=audit();
assert.equal(a.phase,11);
assert.equal(a.lot,"A1");
assert.equal(a.migrationAllowed,false);
assert.equal(a.exactIndexStatus,"not inspected; charter section 26 ZIP required");
assert.equal(a.imageCount,32);
assert.equal(a.items.length,32);
assert.equal(a.sourceCount,a.sourcePaths.length);
assert.ok(a.sourceCount>=90,"External source coverage unexpectedly reduced");
assert.equal(new Set(a.sourcePaths).size,a.sourcePaths.length);
assert.ok(a.sourcePaths.includes("service-worker.js"));
assert.ok(a.sourcePaths.includes("manifest.webmanifest"));
assert.equal(eligibleSource("index.html"),false);
assert.equal(eligibleSource("tests/fixture.html"),false);
assert.equal(eligibleSource("docs/example.json"),false);
assert.equal(eligibleSource("node_modules/package/index.js"),false);
assert.equal(a.sourcePaths.some(x=>x==="index.html"||x.startsWith("node_modules/")||x.startsWith("tests/")||x.startsWith("docs/")),false);
assert.equal(a.items.every(x=>x.owner==="unknown"),true,"Do not infer owners from names alone");
const names=new Set();
let count=0;
for(const image of a.items){
  assert.match(image.asset,/^assets\/img_\d{2}_[a-z0-9]+\.(?:png|jpe?g|webp|gif|svg)$/i);
  assert.ok(fs.statSync(path.join(root,image.asset)).size===image.bytes,"Image bytes must still match inventory");
  assert.match(image.gitBlob,/^[0-9a-f]{40}$/);
  assert.ok(!names.has(image.asset));names.add(image.asset);
  const basename=path.posix.basename(image.asset);
  for(const x of image.literalExternalReferences){
    assert.ok(a.sourcePaths.includes(x.file),"Reference must be from an approved source");
    assert.ok(Number.isSafeInteger(x.line)&&x.line>0);
    const line=fs.readFileSync(path.join(root,x.file),"utf8").split(/\r?\n/)[x.line-1];
    assert.ok(line.includes(basename),"Recorded literal not found in source: "+x.file);
    assert.ok(["repository-relative","basename"].includes(x.form));
    count++;
  }
}
assert.equal(count,a.literalReferenceCount);
assert.equal(a.items.filter(x=>x.literalExternalReferences.length>0).length,a.imagesWithLiteralReferences);
assert.ok(a.importantExclusions.includes("index.html"));
assert.match(a.conclusionPolicy,/does not mean unused/);
console.log(JSON.stringify({scenario:"Phase 11 A1 external source asset-use evidence, no index access",
  sourceCount:a.sourceCount,unclassifiedImages:a.imageCount,
  imagesWithLiteralReferences:a.imagesWithLiteralReferences,
  literalReferenceCount:a.literalReferenceCount,
  gameplayOrAssetModified:false,requiresRule26Index:true}));
