"use strict";
/* Phase 11 / A0 — frozen Git-tree asset census. No index.html reading (charter §26).
   This is NOT proof that any specific image is loaded in production. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const cp=require("node:child_process");

const root=path.join(__dirname,"..");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"docs/phase11/asset-inventory-a0.json"),"utf8"));
const extensions=/\.(?:png|jpe?g|webp|gif|svg)$/i;
const gitEntries=cp.execFileSync("git",["ls-files","--stage","-z"],{cwd:root,maxBuffer:12*1024*1024})
  .toString("utf8").split("\0").filter(Boolean).map(line=>{
    const match=line.match(/^([0-7]{6}) ([0-9a-f]{40}) ([0-3])\t(.+)$/);
    assert.ok(match,"git ls-files --stage line parse failed");
    return {mode:match[1],sha:match[2],stage:match[3],file:match[4]};
  }).filter(x=>extensions.test(x.file));

function classification(p){
  if(p.startsWith("assets/dungeon/"))return "dungeon-path-owned-usage-unverified";
  if(p.startsWith("assets/img_"))return "unclassified-root-asset";
  if(p.startsWith("Icon/")||/^icon-\d+\.png$/.test(p))return "shell-pwa-candidate";
  if(p.startsWith("node_modules/"))return "third-party-excluded";
  return "needs-review";
}
assert.equal(manifest.schemaVersion,1);
assert.equal(manifest.sourceCommit,"3acd7a6112e3da9a546749e1acb39ee81cb4c9d7");
assert.equal(manifest.migrationAllowed,false);
assert.match(manifest.productionReferenceStatus,/UNVERIFIED/);
assert.equal(manifest.images.length,173,"review inventory changes before migration");
assert.equal(gitEntries.length,manifest.images.length,"all tracked visual files must have an inventory row");
const map=new Map(manifest.images.map(row=>[row.path,row]));
assert.equal(map.size,manifest.images.length,"duplicate paths in inventory");
const counts={};
for(const entry of gitEntries){
  const row=map.get(entry.file);
  assert.ok(row,"asset missing from inventory: "+entry.file);
  assert.equal(entry.stage,"0");
  assert.equal(entry.mode,"100644","asset must be a regular tracked file: "+entry.file);
  assert.equal(row.gitBlob,entry.sha,"tracked file content changed: "+entry.file);
  assert.equal(row.bytes,fs.statSync(path.join(root,entry.file)).size,"asset byte count changed: "+entry.file);
  assert.equal(row.classification,classification(entry.file),"owner classification changed: "+entry.file);
  counts[row.classification]=(counts[row.classification]||0)+1;
}
assert.deepEqual(counts,{
  "shell-pwa-candidate":4,
  "dungeon-path-owned-usage-unverified":134,
  "unclassified-root-asset":32,
  "third-party-excluded":3
});
// Basename collisions are intentionally guarded; do not move/rename files on
// basename alone. PWA aliases and third-party playwright logos are expected.
const byBasename=new Map();
for(const row of manifest.images){
  const name=path.posix.basename(row.path).toLowerCase();
  if(!byBasename.has(name))byBasename.set(name,[]);
  byBasename.get(name).push(row.path);
}
const duplicates=[...byBasename].filter(([,paths])=>paths.length>1)
  .map(([name,paths])=>({name,paths:paths.sort()})).sort((a,b)=>a.name.localeCompare(b.name));
assert.deepEqual(duplicates,[
  {name:"icon-192.png",paths:["Icon/icon-192.png","icon-192.png"]},
  {name:"icon-512.png",paths:["Icon/icon-512.png","icon-512.png"]},
  {name:"playwright-logo.svg",paths:[
    "node_modules/playwright-core/lib/vite/recorder/playwright-logo.svg",
    "node_modules/playwright-core/lib/vite/traceViewer/playwright-logo.svg"
  ]}
]);
// No asset references are resolved by choosing another module's same-named
// file. This inventory does not perform any rename, rewrite or fallback.
console.log(JSON.stringify({
  scenario:"Phase 11 A0 Git-tree image inventory",
  total:manifest.images.length,
  counts,
  duplicates:duplicates.map(x=>x.name),
  actualProductionUsage:"not determined; Rule 26 exact index audit required",
  migrationPerformed:false
}));
