"use strict";
/* Historical-only byte reconstruction R02 -> R01, never loaded by runtime. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const hash=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
const R01="caf31c121d926b7b76b9bb05688fab8f2839814e",R02="062c4cd37634f504cc75ce3329d6e69e19b5f547";
const JS="f7adfca9b04b23c489aae71ae9284c9b849f1d0b",REL="assets/gensrpg/core/legacy-visual-data-v1.js";
const TAG='<script src="'+REL+'"></script>';
const FIELDS=["sheetBackground","equipmentCardBackground","enemySkins.creature","enemySkins.boss","enemySkins.invocation"];
module.exports=function r01SourceView(index,root=path.resolve(__dirname,"../..")){
 if(hash(index)===R01){assert.equal(index.length,6969593);return index;}
 if(["8faf7af7fced0a1e0724985e85718a0e4a9e673b","554bf6100aeb0f40bfc098dc90863af7d2d5e439","485de2e6a08ffd89e4f1fb9410e40c938774d62f"].includes(hash(index)))index=require("./gens_phase12_r03_r02_source_view_v1.cjs")(index,root);
 assert.equal(index.length,2869485,"R02 current code index length");
 assert.equal(hash(index),R02,"R02 code index locked source");
 const js=fs.readFileSync(path.join(root,REL));
 assert.equal(js.length,4100559);assert.equal(hash(js),JS);
 const urls=[...js.toString("utf8").matchAll(/'(data:image\/(?:png|webp);base64,[A-Za-z0-9+/=]+)'/g)].map(x=>"'"+x[1]+"'");
 assert.equal(urls.length,5);
 let s=index.toString("utf8");
 assert.equal(s.split(TAG).length,2,"only one data-only external script");
 s=s.replace(TAG,"");
 for(let i=0;i<FIELDS.length;i++){
  const token="GensRpgLegacyVisualDataR02."+FIELDS[i];
  assert.equal(s.split(token).length,2,"single visual value "+FIELDS[i]);
  s=s.replace(token,urls[i]);
 }
 const out=Buffer.from(s,"utf8");
 assert.equal(out.length,6969593);assert.equal(hash(out),R01,"strict R02 -> R01 byte reconstruction");
 return out;
};
