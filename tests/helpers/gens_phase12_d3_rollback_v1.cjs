"use strict";
// Read-only exact D3->D2 reconstruction for inherited historical sentinels.
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const hash=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
const srcSha="e5f8895495f969597a6c209fcc29afd66b7a0636";
const dstSha="18afb7fa25f86eea9993acc7f961fb7c11901168";
const jsSha="bba60d921df20a114b489e17f9222e0c4f310871";
const tag=Buffer.from('<script id="dungeonCore211Consolidation" src="assets/gensrpg/dungeon/core211-consolidation-v1.js"></script>');
const original=Buffer.from('<script id="dungeonCore211Consolidation">');
function d2IndexBytes(root=path.resolve(__dirname,"../.."),bytes=null){
  const assert=require("node:assert/strict");
  if(!bytes)bytes=fs.readFileSync(path.join(root,"index.html"));
  assert.equal(bytes.length,7846135,"D3 index bytes");
  assert.equal(hash(bytes),dstSha,"D3 active index Git blob");
  const at=bytes.indexOf(tag);
  assert.ok(at>0&&bytes.indexOf(tag,at+tag.length)<0,"D3 owner loaded only once");
  const js=fs.readFileSync(path.join(root,"assets/gensrpg/dungeon/core211-consolidation-v1.js"));
  assert.equal(js.length,17511);
  assert.equal(hash(js),jsSha);
  const old=Buffer.concat([bytes.subarray(0,at),original,js,Buffer.from("</script>"),bytes.subarray(at+tag.length)]);
  assert.equal(old.length,7863589);
  assert.equal(hash(old),srcSha,"byte-exact D2 GREEN reconstruction");
  return old;
}
module.exports={d2IndexBytes};
