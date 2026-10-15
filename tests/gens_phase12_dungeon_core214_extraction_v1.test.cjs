"use strict";
/* GenSrpG Phase 12 D7: byte-identical Dungeon Core214, no second owner. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const vm=require("node:vm");
const {execFileSync}=require("node:child_process");
const ROOT=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(ROOT,p));
const hash=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
const d8Index=read("index.html");
const core201Tag=Buffer.from('<script id="dungeonCore201Stability" src="assets/gensrpg/dungeon/core201-stability-v1.js"></script>');
const core201Open=Buffer.from('<script id="dungeonCore201Stability">');
const core201Body=read("assets/gensrpg/dungeon/core201-stability-v1.js");
assert.equal(d8Index.length,7715741,"D8 index length");
assert.equal(hash(d8Index),"f56dc5bbb368b176509ab16477bd4b24dd000497","D8 exact blob");
assert.equal(core201Body.length,13990,"D8 Core201 length");
assert.equal(hash(core201Body),"7edf731fd1aa209ec96490fb8e2cb7af04afd627","D8 Core201 exact blob");
const core201At=d8Index.indexOf(core201Tag);
assert.ok(core201At>0 && d8Index.indexOf(core201Tag,core201At+core201Tag.length)<0,"D8 Core201 unique owner");
const indexBeforeD8=Buffer.concat([
 d8Index.subarray(0,core201At),core201Open,core201Body,Buffer.from("</script>"),
 d8Index.subarray(core201At+core201Tag.length)
]);
assert.equal(indexBeforeD8.length,7729678);
assert.equal(hash(indexBeforeD8),"6e1cb9b82126409b633306b0e77a7e45badb0f79","exact D7 historical index");
const index=indexBeforeD8;
const script=read("assets/gensrpg/dungeon/core214-single-authority-v1.js");
const tag=Buffer.from('<script id="dungeonCore214SingleAuthority" src="assets/gensrpg/dungeon/core214-single-authority-v1.js"></script>');
const open=Buffer.from('<script id="dungeonCore214SingleAuthority">');
assert.equal(index.length,7729678);assert.equal(hash(index),"6e1cb9b82126409b633306b0e77a7e45badb0f79");
assert.equal(script.length,15795);assert.equal(hash(script),"72481ac3ee62bc67f6c0646eb724baf4a87a2f88");
const at=index.indexOf(tag);
assert.ok(at>0 && index.indexOf(tag,at+tag.length)<0,"one external Dungeon Core214 at original parser position");
assert.equal(index.indexOf(open),-1,"no inline duplicate owner");
assert.ok(!/\b(?:async|defer)\b/.test(tag.toString()),"synchronous classic script, unchanged ordering");
new vm.Script(script.toString("utf8"),{filename:"core214-single-authority-v1.js"});
assert.ok(script.toString("utf8").startsWith("\n(function(){"));
assert.ok(script.toString("utf8").trimEnd().endsWith("})();"));
const previous=Buffer.concat([index.subarray(0,at),open,script,Buffer.from("</script>"),index.subarray(at+tag.length)]);
assert.equal(previous.length,7745413);
assert.equal(hash(previous),"b5271e44dc4c14834a7725a869fb3c12386f2437","D7→D6 exact rollback");
const html=index.toString("utf8");
assert.ok(html.indexOf('src="assets/gensrpg/dungeon/core213-stability-v1.js"')<
  html.indexOf('src="assets/gensrpg/dungeon/core214-single-authority-v1.js"'),"same script order after Core213");
assert.ok(html.indexOf('src="assets/gensrpg/dungeon/core214-single-authority-v1.js"')<
  html.indexOf('src="assets/dungeon/dungeon-core-316.js"'),"same script order before Core316");
for(const tool of [
  "tools/gensrpg_phase12_dungeon_core214_extract_apply.py",
  "tools/gensrpg_phase12_dungeon_core213_extract_apply.py",
  "tools/gensrpg_phase12_dungeon_core211_extract_apply.py",
  "tools/gensrpg_phase12_dungeon_core200_extract_apply.py",
  "tools/gensrpg_phase12_dungeon_mj72_extract_apply.py",
  "tools/gensrpg_phase12_dungeon_core051_extract_apply.py",
  "tools/gensrpg_phase12_dungeon_core01_extract_apply.py"
])execFileSync("python3",[tool,"--verify"],{cwd:ROOT,encoding:"utf8"});
console.log(JSON.stringify({scenario:"Phase12 D7 Dungeon Core214 physical",externalizedBytes:15795,netIndexRemoved:15735,lossless:true,originalParserPosition:true}));
