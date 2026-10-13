"use strict";
/* Read-only D4 -> D3 historical HTML view for pre-Phase12 combat contracts.
 * NEVER use in runtime. The actual page loads the identical Core200 code
 * synchronously as its only owner. All source/output hashes are pinned.
 */
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const assert=require("node:assert/strict");
const sha=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
function restore(root){
  const actual=fs.readFileSync(path.join(root,"index.html"));
  const code=fs.readFileSync(path.join(root,"assets/gensrpg/dungeon/core200-rebuild-v1.js"));
  assert.equal(actual.length,7780333,"D4 expected physical index length");
  assert.equal(sha(actual),"ca15dd7b483963d7bd0767b7b5baca915d17ec43","D4 active index fingerprint");
  assert.equal(code.length,55842,"D4 external legacy code length");
  assert.equal(sha(code),"5649ae0af69064dde72e6ea28b8dbefd105cb527","D4 byte-identical legacy body");
  const tag=Buffer.from('<script id="dungeonCore200Rebuild" src="assets/gensrpg/dungeon/core200-rebuild-v1.js"></script>');
  const at=actual.indexOf(tag);
  assert.ok(at>0 && actual.indexOf(tag,at+tag.length)<0,"one parser-time Core200 owner");
  const reconstructed=Buffer.concat([
    actual.subarray(0,at),Buffer.from('<script id="dungeonCore200Rebuild">'),
    code,Buffer.from('</script>'),actual.subarray(at+tag.length)
  ]);
  assert.equal(reconstructed.length,7836124,"original D3 physical index length");
  assert.equal(sha(reconstructed),"972f0e0be12fac14427853fbcd7abe5233eb5a8c","exact original D3 source");
  return reconstructed.toString("utf8");
}
module.exports={restore};
