"use strict";
/*
 * GenSrpG Phase 11 A1 — tracked external source references only.
 *
 * By charter section 26 this tool NEVER opens index.html. An exact SHA-matched
 * user-provided index ZIP is needed to complete that second evidence stream.
 * Literal occurrences are candidates, not proof of runtime consumption.
 */
const fs=require("node:fs");
const path=require("node:path");
const cp=require("node:child_process");

const ROOT=path.resolve(__dirname,"..");
const INVENTORY="docs/phase11/asset-inventory-a0.json";
const IMAGE_PATTERN=/^assets\/img_\d{2}_[a-z0-9]+\.(?:png|jpe?g|webp|gif|svg)$/i;
const SOURCE_PATTERN=/\.(?:js|cjs|mjs|css|json|webmanifest|html|ts|tsx|xml)$/i;
const EXTRA=new Set(["service-worker.js","manifest.webmanifest","manifest.json","preview.html"]);

function tracked(){
  return cp.execFileSync("git",["ls-files","-z"],{
    cwd:ROOT,maxBuffer:12*1024*1024
  }).toString("utf8").split("\0").filter(Boolean).sort();
}
function eligibleSource(file){
  if(file==="index.html")return false; // Charter section 26: never inspect it here.
  if(EXTRA.has(file))return true;
  return file.startsWith("assets/") && SOURCE_PATTERN.test(file);
}
function audit(){
  const inventory=JSON.parse(fs.readFileSync(path.join(ROOT,INVENTORY),"utf8"));
  const files=tracked();
  const images=inventory.images.filter(x=>IMAGE_PATTERN.test(x.path));
  if(images.length!==32)throw Error("A1 requires exactly 32 unclassified images");
  if(files.includes("index.html")===false)throw Error("Index presence check failed");
  const names=new Set(images.map(x=>path.posix.basename(x.path)));
  if(names.size!==32)throw Error("Ambiguous basename collision in unclassified images");
  for(const img of images){
    if(!files.includes(img.path))throw Error("Missing image: "+img.path);
  }
  const sources=files.filter(eligibleSource);
  if(sources.includes("index.html"))throw Error("Illegal index scan");
  const result=images.map(x=>({
    asset:x.path,
    gitBlob:x.gitBlob,
    bytes:x.bytes,
    owner:"unknown",
    literalExternalReferences:[]
  }));
  const refs=new Map(result.map(item=>[path.posix.basename(item.asset),item]));
  const visited=[];
  for(const source of sources){
    // A source may contain a literal or construct a URL at runtime. Only
    // actual literal occurrences are reported; never infer absence of use.
    const str=fs.readFileSync(path.join(ROOT,source),"utf8");
    visited.push(source);
    let lineNo=0;
    for(const line of str.split(/\r?\n/)){
      lineNo++;
      for(const [basename,target] of refs){
        let start=0;
        while((start=line.indexOf(basename,start))>=0){
          const prefix=line.slice(0,start);
          const exactPrefix=prefix.endsWith("assets/");
          target.literalExternalReferences.push({
            file:source,
            line:lineNo,
            form:exactPrefix?"repository-relative":"basename",
          });
          start+=basename.length;
        }
      }
    }
  }
  const referenced=result.filter(x=>x.literalExternalReferences.length>0);
  const totalHits=result.reduce((n,x)=>n+x.literalExternalReferences.length,0);
  return {
    phase:11,lot:"A1",
    referenceCommit:inventory.sourceCommit,
    evidence:"read-only tracked external JS/JSON/CSS/HTML/manifest/service-worker literal scan",
    importantExclusions:["index.html","docs/","tests/","tools/","node_modules/","untracked data","persistent user profiles or exports"],
    exactIndexStatus:"not inspected; charter section 26 ZIP required",
    conclusionPolicy:"No external literal match does not mean unused. Ownership remains unknown without contextual index/profile inspection.",
    migrationAllowed:false,
    sourceCount:visited.length,
    sourcePaths:visited,
    imageCount:images.length,
    imagesWithLiteralReferences:referenced.length,
    literalReferenceCount:totalHits,
    items:result
  };
}
if(require.main===module){
  const a=audit();
  const json=process.argv.includes("--full");
  if(json)process.stdout.write(JSON.stringify(a,null,2)+"\n");
  else process.stdout.write(JSON.stringify({
    lot:a.lot,sourceCount:a.sourceCount,imageCount:a.imageCount,
    imagesWithLiteralReferences:a.imagesWithLiteralReferences,
    literalReferenceCount:a.literalReferenceCount,
    hits:a.items.filter(x=>x.literalExternalReferences.length>0)
      .map(x=>({asset:x.asset,references:x.literalExternalReferences})),
    source:a.evidence,exactIndexStatus:a.exactIndexStatus,
    migrationAllowed:a.migrationAllowed
  })+"\n");
}
module.exports={audit,eligibleSource};
