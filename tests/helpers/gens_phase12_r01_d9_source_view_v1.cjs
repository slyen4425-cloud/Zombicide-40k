"use strict";
/* Source view for historical D9 sentinels after Phase12 R01 PWA relocation: never executed in production. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const hash=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
const D9="fce949665fea47a2aa2a535ede7289b06936f986",R01="caf31c121d926b7b76b9bb05688fab8f2839814e",JS="778e3acf2f77b3c7680bf70a0c6a846b84826235";
const TAG=Buffer.from('<script src="assets/gensrpg/shell/pwa-manifest-dynamic-v1.js"></script>');
module.exports=function d9SourceView(index,root){
 index=require("./gens_phase12_r02_r01_source_view_v1.cjs")(index,root);
 if(hash(index)===D9){assert.equal(index.length,7703979);return index;}
 assert.equal(index.length,6969593,"R01 exact physical index length");
 assert.equal(hash(index),R01,"R01 physical index exact blob");
 const js=fs.readFileSync(path.join(root,"assets/gensrpg/shell/pwa-manifest-dynamic-v1.js"));
 assert.equal(js.length,734440);assert.equal(hash(js),JS,"R01 relocated PWA source exact blob");
 const at=index.indexOf(TAG);assert.ok(at>0&&index.indexOf(TAG,at+TAG.length)<0,"one R01 parser owner");
 const d9=Buffer.concat([index.subarray(0,at),Buffer.from("<script>"),js,Buffer.from("</script>"),index.subarray(at+TAG.length)]);
 assert.equal(d9.length,7703979);assert.equal(hash(d9),D9,"R01 restores historical D9 exactly");
 return d9;
};
