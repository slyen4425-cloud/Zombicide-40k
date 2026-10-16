"use strict";
/* D9 immutable source preflight for R01 PWA; do not replace a live manifest until tested. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto"),vm=require("node:vm");
const root=path.resolve(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p));
const sha=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
const candidate=read("index.html"),pwaTag='<script src="assets/gensrpg/shell/pwa-manifest-dynamic-v1.js"></script>';
let idx=candidate;
if(candidate.includes(Buffer.from(pwaTag))){
  assert.equal(candidate.length,6969593);assert.equal(sha(candidate),"caf31c121d926b7b76b9bb05688fab8f2839814e");
  const moved=read("assets/gensrpg/shell/pwa-manifest-dynamic-v1.js");
  assert.equal(moved.length,734440);assert.equal(sha(moved),"778e3acf2f77b3c7680bf70a0c6a846b84826235");
  assert.equal(candidate.toString("utf8").split(pwaTag).length,2,"unique physical PWA owner");
  idx=Buffer.from(candidate.toString("utf8").replace(pwaTag,"<script>"+moved.toString("utf8")+"</script>"));
}
const html=idx.toString("utf8");
assert.equal(idx.length,7703979);assert.equal(sha(idx),"fce949665fea47a2aa2a535ede7289b06936f986");
const found=[...html.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)]
  .filter(x=>Buffer.byteLength(x[2])===734440 && sha(Buffer.from(x[2]))==="778e3acf2f77b3c7680bf70a0c6a846b84826235");
assert.equal(found.length,1,"single original dynamic PWA script");
const [full,attrs,body]=found[0];
assert.equal(attrs,"","anonymous synchronous classic PWA script");
assert.equal(Buffer.byteLength(body),734440);
assert.ok(html.indexOf('id="gensManifestLink"')<found[0].index,"manifest link already exists");
assert.match(html,/<link\s+id="gensManifestLink"\s+rel="manifest"\s+href="manifest\.webmanifest\?v=1738"/);
let captured=null;const link={href:"manifest.webmanifest?v=1738"};
class FakeBlob{constructor(parts,options){this.parts=parts;this.type=options.type;captured=this;}}
const context={Blob:FakeBlob,URL:{createObjectURL(b){assert.equal(b,captured);return "blob:r01-pwa";}},
document:{getElementById(id){assert.equal(id,"gensManifestLink");return link;}},
console:{warn(e){throw Error("Unexpected PWA error "+e);}}};
new vm.Script(body,{filename:"manifest-original.js"}).runInNewContext(context);
assert.equal(link.href,"blob:r01-pwa");
assert.equal(captured.type,"application/manifest+json");
const dyn=JSON.parse(captured.parts.join(""));
assert.equal(dyn.name,"GenSrpG");assert.equal(dyn.start_url,"./");assert.equal(dyn.scope,"./");
assert.equal(dyn.display,"standalone");assert.equal(dyn.background_color,"#090807");
assert.deepEqual(Array.from(dyn.icons,x=>x.sizes),["192x192","512x512"]);
assert.deepEqual(Array.from(dyn.icons,x=>sha(Buffer.from(x.src.split(",")[1],"base64"))),[
  "a8e5c257eb91e77d805708393d2af24ab4a06a72",
  "34ff30639e8cbc0f2c366c6d82049772d38934fd"]);
const staticManifest=JSON.parse(read("manifest.webmanifest"));
assert.notEqual(dyn.background_color,staticManifest.background_color,"static and dynamic are not interchangeable");
assert.notEqual(dyn.description,staticManifest.description);
assert.ok(staticManifest.icons.every(x=>x.src.startsWith("./icons/")));
const none={...context,document:{getElementById(){return null;}},URL:{createObjectURL(){throw Error("No link: should not allocate object URL");}}};
new vm.Script(body).runInNewContext(none);
console.log(JSON.stringify({scenario:"R01 PWA preflight on D9 baseline",bytes:734440,sha:sha(Buffer.from(body)),dynamicHref:true,iconParity:true,staticDifferent:true}));
