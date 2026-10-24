"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p));
const hash=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
const srcHash="fce949665fea47a2aa2a535ede7289b06936f986",dstHash="caf31c121d926b7b76b9bb05688fab8f2839814e",bodyHash="778e3acf2f77b3c7680bf70a0c6a846b84826235";
const rel="assets/gensrpg/shell/pwa-manifest-dynamic-v1.js",tag='<script src="'+rel+'"></script>';
const index=require("./helpers/gens_phase12_r02_r01_source_view_v1.cjs")(read("index.html"),root),js=read(rel),s=index.toString("utf8");
assert.equal(index.length,6969593);assert.equal(hash(index),dstHash);
assert.equal(js.length,734440);assert.equal(hash(js),bodyHash);
assert.equal(s.split(tag).length,2,"one PWA script at exact parser location");
assert.ok(!s.includes("<script>"+js.toString("utf8")+"</script>"),"no duplicate inline PWA");
assert.ok(s.indexOf('id="gensManifestLink"')<s.indexOf(tag),"PWA link declared before external script");
assert.ok(!/\b(?:async|defer|type="module")\b/.test(tag),"classic synchronous script required");
new vm.Script(js.toString("utf8"),{filename:rel});
const restored=Buffer.from(s.replace(tag,"<script>"+js.toString("utf8")+"</script>"));
assert.equal(restored.length,7703979);assert.equal(hash(restored),srcHash,"byte exact R01 -> D9");
assert.equal(read("manifest.webmanifest").toString("utf8").includes("./icons/icon-192.png"),true,"static PWA source remains");
function run(source){
 let blob;const link={href:"manifest.webmanifest?v=1738"};
 const BlobStub=class {constructor(parts,opt){this.parts=parts;this.type=opt.type;blob=this;}};
 const context={Blob:BlobStub,URL:{createObjectURL(x){assert.equal(x,blob);return "blob:gensrpg-r01";}},
 document:{getElementById(id){assert.equal(id,"gensManifestLink");return link;}},
 console:{warn(e){throw Error("PWA manifest creation failed "+e);}}};
 new vm.Script(source).runInNewContext(context);
 assert.equal(blob.type,"application/manifest+json");assert.equal(link.href,"blob:gensrpg-r01");
 const obj=JSON.parse(blob.parts.join(""));assert.equal(obj.name,"GenSrpG");
 return{json:blob.parts.join(""),href:link.href,icons:Array.from(obj.icons,x=>hash(Buffer.from(x.src.split(",")[1],"base64")))}
}
const runtime=run(js.toString("utf8"));
const originalMatch=restored.toString("utf8").match(/<script>(\s*\(function\(\)\{[\s\S]*?createObjectURL\(blob\)[\s\S]*?\}\)\(\);\s*)<\/script>/);
assert.ok(originalMatch,"historical PWA IIFE remains reconstructible");
const historical=run(originalMatch[1]);
assert.deepEqual(runtime,historical,"PWA output is unchanged");
assert.deepEqual(runtime.icons,["a8e5c257eb91e77d805708393d2af24ab4a06a72","34ff30639e8cbc0f2c366c6d82049772d38934fd"]);
console.log(JSON.stringify({scenario:"Phase12 R01 PWA exact extraction and behavior",movedBytes:js.length,indexAfter:index.length,rollback:true,manifestParity:true,parserOrder:true}));
