"use strict";
/* Phase 12 D8: genuine Dungeon Core201 IIFE, byte-exact and parser-synchronous. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const vm=require("node:vm");
const {execFileSync}=require("node:child_process");
const ROOT=path.resolve(__dirname,"..");
const read=rel=>fs.readFileSync(path.join(ROOT,rel));
const blob=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
const index=require("./helpers/gens_phase12_d9_restore_v1.cjs")(read("index.html"),require("node:path").resolve(__dirname,".."));
const js=read("assets/gensrpg/dungeon/core201-stability-v1.js");
const tag=Buffer.from('<script id="dungeonCore201Stability" src="assets/gensrpg/dungeon/core201-stability-v1.js"></script>');
const open=Buffer.from('<script id="dungeonCore201Stability">');
assert.equal(index.length,7715741);
assert.equal(blob(index),"f56dc5bbb368b176509ab16477bd4b24dd000497");
assert.equal(js.length,13990);
assert.equal(blob(js),"7edf731fd1aa209ec96490fb8e2cb7af04afd627");
const at=index.indexOf(tag);
assert.ok(at>0&&index.indexOf(tag,at+tag.length)<0,"one physical Core201 owner");
assert.equal(index.indexOf(open),-1,"no active Core201 inline duplicate");
assert.equal(/(?:\basync\b|\bdefer\b)/.test(tag.toString()),false,"identical synchronous classic execution");
new vm.Script(js.toString("utf8"),{filename:"core201-stability-v1.js"});
assert.ok(js.toString("utf8").startsWith("\n(function(){"));
assert.ok(js.toString("utf8").trimEnd().endsWith("})();"));
const before=Buffer.concat([index.subarray(0,at),open,js,Buffer.from("</script>"),index.subarray(at+tag.length)]);
assert.equal(before.length,7729678);
assert.equal(blob(before),"6e1cb9b82126409b633306b0e77a7e45badb0f79","D7 restored bitwise");
const html=index.toString("utf8");
assert.ok(html.indexOf('src="assets/gensrpg/dungeon/core200-rebuild-v1.js"')<
  html.indexOf('src="assets/gensrpg/dungeon/core201-stability-v1.js"'),"Core201 must remain after Core200");
assert.ok(html.indexOf('src="assets/gensrpg/dungeon/core201-stability-v1.js"')<
  html.indexOf('src="assets/gensrpg/dungeon/core211-consolidation-v1.js"'),"Core201 remains before Core211");
for(const tool of [
 "tools/gensrpg_phase12_dungeon_core201_d8_extract_apply.py",
 "tools/gensrpg_phase12_dungeon_core214_extract_apply.py",
 "tools/gensrpg_phase12_dungeon_core213_extract_apply.py",
 "tools/gensrpg_phase12_dungeon_core211_extract_apply.py",
 "tools/gensrpg_phase12_dungeon_core200_extract_apply.py",
 "tools/gensrpg_phase12_dungeon_mj72_extract_apply.py",
 "tools/gensrpg_phase12_dungeon_core051_extract_apply.py",
 "tools/gensrpg_phase12_dungeon_core01_extract_apply.py"
])execFileSync("python3",[tool,"--verify"],{cwd:ROOT,encoding:"utf8"});
console.log(JSON.stringify({scenario:"Phase12 D8 Dungeon Core201 physical",movedBytes:13990,netIndexRemoved:13937,lossless:true,originalParserPosition:true}));
