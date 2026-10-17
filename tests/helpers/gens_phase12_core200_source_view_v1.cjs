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
  let actual=fs.readFileSync(path.join(root,"index.html"));
  if(["caf31c121d926b7b76b9bb05688fab8f2839814e","062c4cd37634f504cc75ce3329d6e69e19b5f547","8faf7af7fced0a1e0724985e85718a0e4a9e673b","554bf6100aeb0f40bfc098dc90863af7d2d5e439","485de2e6a08ffd89e4f1fb9410e40c938774d62f"].includes(sha(actual)))actual=require("./gens_phase12_r01_d9_source_view_v1.cjs")(actual,root);
  // D9: restore only the proven byte-identical Core202 source before the
  // existing D8->D4 historical combat inventory; do not relax any fingerprint.
  if(sha(actual)==="fce949665fea47a2aa2a535ede7289b06936f986"){
    actual=require("./gens_phase12_d9_restore_v1.cjs")(actual,root);
  }
  // D8: reconstruct the strict D7 index before the unchanged D7-D4 history.
  if(sha(actual)==="f56dc5bbb368b176509ab16477bd4b24dd000497"){
    assert.equal(actual.length,7715741,"D8 exact index length");
    const tag=Buffer.from('<script id="dungeonCore201Stability" src="assets/gensrpg/dungeon/core201-stability-v1.js"></script>');
    const at=actual.indexOf(tag);
    assert.ok(at>0 && actual.indexOf(tag,at+tag.length)<0,"D8 exactly one owner");
    const moved=fs.readFileSync(path.join(root,"assets/gensrpg/dungeon/core201-stability-v1.js"));
    assert.equal(moved.length,13990,"D8 exact body length");
    assert.equal(sha(moved),"7edf731fd1aa209ec96490fb8e2cb7af04afd627","D8 unchanged Core201");
    actual=Buffer.concat([actual.subarray(0,at),Buffer.from('<script id="dungeonCore201Stability">'),moved,Buffer.from("</script>"),actual.subarray(at+tag.length)]);
    assert.equal(actual.length,7729678,"D7 restored byte length");
    assert.equal(sha(actual),"6e1cb9b82126409b633306b0e77a7e45badb0f79","D7 restored exact Git blob");
  }
  // D7: restore only the unchanged Core214 IIFE in this historical view.
  if(sha(actual)==="6e1cb9b82126409b633306b0e77a7e45badb0f79"){
    assert.equal(actual.length,7729678,"D7 exact index");
    const tag=Buffer.from('<script id="dungeonCore214SingleAuthority" src="assets/gensrpg/dungeon/core214-single-authority-v1.js"></script>');
    const at=actual.indexOf(tag);
    assert.ok(at>0 && actual.indexOf(tag,at+tag.length)<0,"D7 only one owner");
    const moved=fs.readFileSync(path.join(root,"assets/gensrpg/dungeon/core214-single-authority-v1.js"));
    assert.equal(moved.length,15795);
    assert.equal(sha(moved),"72481ac3ee62bc67f6c0646eb724baf4a87a2f88");
    actual=Buffer.concat([actual.subarray(0,at),Buffer.from('<script id="dungeonCore214SingleAuthority">'),moved,Buffer.from("</script>"),actual.subarray(at+tag.length)]);
    assert.equal(actual.length,7745413);
    assert.equal(sha(actual),"b5271e44dc4c14834a7725a869fb3c12386f2437","D6 historical view");
  }
  // D6 preserves the exact historical Core213 bytes. Undo the new owner
  // only in this read-only helper before checking the immutable D5/D4 view.
  if(sha(actual)==="b5271e44dc4c14834a7725a869fb3c12386f2437"){
    assert.equal(actual.length,7745413,"D6 index length");
    const tag=Buffer.from('<script id="dungeonCore213Stability" src="assets/gensrpg/dungeon/core213-stability-v1.js"></script>');
    const at=actual.indexOf(tag);
    assert.ok(at>0 && actual.indexOf(tag,at+tag.length)<0,"D6 owner only once");
    const moved=fs.readFileSync(path.join(root,"assets/gensrpg/dungeon/core213-stability-v1.js"));
    assert.equal(moved.length,17519);
    assert.equal(sha(moved),"af4bf724315180becd80833af251504130751ad3");
    actual=Buffer.concat([actual.subarray(0,at),Buffer.from('<script id="dungeonCore213Stability">'),moved,Buffer.from("</script>"),actual.subarray(at+tag.length)]);
    assert.equal(actual.length,7762879);
    assert.equal(sha(actual),"2ad1961efb9733037b7753ffd4a308baa1b00b64","D5 exact historical view");
  }
  // D5 is an independent byte-identical extraction. Undo it only inside
  // this read-only historical D4 combat-contract view.
  if(sha(actual)==="2ad1961efb9733037b7753ffd4a308baa1b00b64"){
    assert.equal(actual.length,7762879,"D5 index length");
    const d5Tag=Buffer.from('<script id="dungeonCore211Consolidation" src="assets/gensrpg/dungeon/core211-consolidation-v1.js"></script>');
    const at=actual.indexOf(d5Tag);
    assert.ok(at>0 && actual.indexOf(d5Tag,at+d5Tag.length)<0,"D5 owner exactly once");
    const moved=fs.readFileSync(path.join(root,"assets/gensrpg/dungeon/core211-consolidation-v1.js"));
    assert.equal(moved.length,17511,"D5 external code size");
    assert.equal(sha(moved),"bba60d921df20a114b489e17f9222e0c4f310871","D5 moved code unchanged");
    actual=Buffer.concat([actual.subarray(0,at),Buffer.from('<script id="dungeonCore211Consolidation">'),moved,Buffer.from("</script>"),actual.subarray(at+d5Tag.length)]);
  }
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
