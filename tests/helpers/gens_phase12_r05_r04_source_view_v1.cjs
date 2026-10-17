"use strict";
/* Historical-only exact R05 -> R04 source reconstruction. No runtime use. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const hash=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
const R05="485de2e6a08ffd89e4f1fb9410e40c938774d62f",R04="554bf6100aeb0f40bfc098dc90863af7d2d5e439";
const REL="assets/gensrpg/core/legacy-cloud-sync-backup-v1.js",TAG='<script src="'+REL+'"></script>';
module.exports=function r04SourceView(index,root=path.resolve(__dirname,"../..")){
 index=require('./gens_phase12_generated_wall_material_source_view_v1.cjs')(index);
 if(hash(index)===R04){assert.equal(index.length,2835125);return index;}
 assert.equal(index.length,2781436);assert.equal(hash(index),R05,"R05 pinned active source");
 const js=fs.readFileSync(path.join(root,REL));
 assert.equal(js.length,53746);assert.equal(hash(js),"8d7f8179676b096a53816cd1ca2530c120e3cf18");
 let s=index.toString("utf8");assert.equal(s.split(TAG).length,2);
 s=s.replace(TAG,"<script>"+js.toString("utf8")+"</script>");
 const out=Buffer.from(s,"utf8");
 assert.equal(out.length,2835125);assert.equal(hash(out),R04,"strict R05->R04 restore");
 return out;
};
