"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),crypto=require("node:crypto");
const hash=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
module.exports=function restoreD8(index,root){
  assert.equal(index.length,7703979,"D9 physical index length");
  assert.equal(hash(index),"fce949665fea47a2aa2a535ede7289b06936f986","D9 index git blob");
  const tag=Buffer.from('<script id="dungeonCore202ContentDensity" src="assets/gensrpg/dungeon/core202-content-density-v1.js"></script>');
  const pos=index.indexOf(tag);
  assert.ok(pos>0&&index.indexOf(tag,pos+tag.length)<0,"one D9 owner");
  const js=fs.readFileSync(path.join(root,"assets/gensrpg/dungeon/core202-content-density-v1.js"));
  assert.equal(js.length,11821);
  assert.equal(hash(js),"364673f3dd35bfa8be7f378152f775656c9243e2","D9 Core202 blob");
  const restored=Buffer.concat([index.subarray(0,pos),Buffer.from('<script id="dungeonCore202ContentDensity">'),js,Buffer.from("</script>"),index.subarray(pos+tag.length)]);
  assert.equal(restored.length,7715741);
  assert.equal(hash(restored),"f56dc5bbb368b176509ab16477bd4b24dd000497","D8 snapshot restored byte-for-byte");
  return restored;
};
