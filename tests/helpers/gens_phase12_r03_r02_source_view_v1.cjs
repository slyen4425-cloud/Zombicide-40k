"use strict";
/* Historical-only R03->R02 reconstruction; not loaded by runtime. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const hash=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
const R03="8faf7af7fced0a1e0724985e85718a0e4a9e673b",R02="062c4cd37634f504cc75ce3329d6e69e19b5f547";
const JS="e45f3b4e419a10b030c47bc921bded1ec0dc723b",REL="assets/gensrpg/shell/legacy-hub-family-ui-v1.js";
const TAG='<script src="'+REL+'"></script>\n',END='function gensCleanDungeonDemoHeroesFromOtherUniverses()';
module.exports=function r02SourceView(index,root=path.resolve(__dirname,"../..")){
  if(hash(index)===R02){assert.equal(index.length,2869485);return index;}
  if(hash(index)==="554bf6100aeb0f40bfc098dc90863af7d2d5e439")index=require("./gens_phase12_r04_r03_source_view_v1.cjs")(index,root);
  assert.equal(index.length,2862906);assert.equal(hash(index),R03,"R03 current source");
  const js=fs.readFileSync(path.join(root,REL));assert.equal(js.length,6651);assert.equal(hash(js),JS);
  let s=index.toString("utf8");
  assert.equal(s.split(TAG).length,2,"one synchronous Shell Hub owner");
  s=s.replace(TAG,"");
  assert.equal(s.split(END).length,2,"one monolith continuation");
  s=s.replace(END,js.toString("utf8")+END);
  const out=Buffer.from(s,"utf8");
  assert.equal(out.length,2869485);assert.equal(hash(out),R02,"R03 restores byte-identical R02");
  return out;
};
