"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const blob=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
const R01="caf31c121d926b7b76b9bb05688fab8f2839814e",R02="f6d3eb2a1cc87046d88e678c3bf67f6877baa887",LEGACY="181ec13091f7dfeb5dde173af99dbe1aeecb07c2";
const REL="assets/gensrpg/legacy/phase12-historical-multidomain-bridge-v1.js",TAG=Buffer.from('<script src="'+REL+'"></script>');
module.exports=function r01View(index,root){
 if(blob(index)===R01){assert.equal(index.length,6969593);return index;}
 assert.equal(index.length,1605224);assert.equal(blob(index),R02,"physical R02 index pinned");
 const js=fs.readFileSync(path.join(root,REL));
 assert.equal(js.length,5364441);assert.equal(blob(js),LEGACY,"R02 body pinned");
 const at=index.indexOf(TAG);assert.ok(at>0&&index.indexOf(TAG,at+TAG.length)<0,"R02 single script");
 const restored=Buffer.concat([index.subarray(0,at),Buffer.from("<script>"),js,Buffer.from("</script>"),index.subarray(at+TAG.length)]);
 assert.equal(restored.length,6969593);assert.equal(blob(restored),R01,"R02 restores R01 byte-exact");
 return restored;
};
