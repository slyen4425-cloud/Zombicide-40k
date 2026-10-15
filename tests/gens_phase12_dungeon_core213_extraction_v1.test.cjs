"use strict";
/* Phase12 D6: physical identical Core213 classic IIFE and prior D5-D1 proofs. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const vm=require("node:vm");
const {execFileSync}=require("node:child_process");
const ROOT=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(ROOT,p));
const sha=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
const d7Index=read("index.html");
const core214Tag=Buffer.from('<script id="dungeonCore214SingleAuthority" src="assets/gensrpg/dungeon/core214-single-authority-v1.js"></script>');
const core214Open=Buffer.from('<script id="dungeonCore214SingleAuthority">');
const core214Body=read("assets/gensrpg/dungeon/core214-single-authority-v1.js");
assert.equal(d7Index.length,7729678,"D7 length");
assert.equal(sha(d7Index),"6e1cb9b82126409b633306b0e77a7e45badb0f79","D7 exact blob");
assert.equal(core214Body.length,15795,"D7 body length");
assert.equal(sha(core214Body),"72481ac3ee62bc67f6c0646eb724baf4a87a2f88","D7 exact body");
const core214At=d7Index.indexOf(core214Tag);
assert.ok(core214At>0 && d7Index.indexOf(core214Tag,core214At+core214Tag.length)<0,"D7 exactly one owner");
const indexBeforeD7=Buffer.concat([
  d7Index.subarray(0,core214At),core214Open,core214Body,Buffer.from("</script>"),
  d7Index.subarray(core214At+core214Tag.length)
]);
assert.equal(indexBeforeD7.length,7745413);
assert.equal(sha(indexBeforeD7),"b5271e44dc4c14834a7725a869fb3c12386f2437","D6 historic index");
const index=indexBeforeD7,js=read("assets/gensrpg/dungeon/core213-stability-v1.js");
const open=Buffer.from('<script id="dungeonCore213Stability">');
const tag=Buffer.from('<script id="dungeonCore213Stability" src="assets/gensrpg/dungeon/core213-stability-v1.js"></script>');
assert.equal(index.length,7745413);
assert.equal(sha(index),"b5271e44dc4c14834a7725a869fb3c12386f2437");
assert.equal(js.length,17519);
assert.equal(sha(js),"af4bf724315180becd80833af251504130751ad3");
const at=index.indexOf(tag);
assert.ok(at>0 && index.indexOf(tag,at+tag.length)<0);
assert.equal(index.indexOf(open),-1);
new vm.Script(js.toString("utf8"),{filename:"core213-stability-v1.js"});
assert.ok(js.toString("utf8").startsWith("\n(function(){"));
assert.ok(js.toString("utf8").trimEnd().endsWith("})();"));
const last=Buffer.concat([index.subarray(0,at),open,js,Buffer.from("</script>"),index.subarray(at+tag.length)]);
assert.equal(last.length,7762879);
assert.equal(sha(last),"2ad1961efb9733037b7753ffd4a308baa1b00b64");
const html=index.toString("utf8");
assert.ok(html.indexOf('src="assets/gensrpg/dungeon/core211-consolidation-v1.js"')<
  html.indexOf('src="assets/gensrpg/dungeon/core213-stability-v1.js"'));
assert.ok(html.indexOf('src="assets/gensrpg/dungeon/core213-stability-v1.js"')<
  html.indexOf('src="assets/dungeon/dungeon-core-316.js"'));
for(const tool of [
  "tools/gensrpg_phase12_dungeon_core213_extract_apply.py",
  "tools/gensrpg_phase12_dungeon_core211_extract_apply.py",
  "tools/gensrpg_phase12_dungeon_core200_extract_apply.py",
  "tools/gensrpg_phase12_dungeon_mj72_extract_apply.py",
  "tools/gensrpg_phase12_dungeon_core051_extract_apply.py",
  "tools/gensrpg_phase12_dungeon_core01_extract_apply.py"
])execFileSync("python3",[tool,"--verify"],{cwd:ROOT,encoding:"utf8"});
console.log(JSON.stringify({scenario:"Phase12 D6 Dungeon Core213 physical",externalizedBytes:17519,netIndexRemoved:17466,lossless:true,originalParserPosition:true}));
