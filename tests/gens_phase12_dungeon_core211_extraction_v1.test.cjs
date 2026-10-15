"use strict";
/* D5: immutable Dungeon Core211, classic synchronous parser order and exact D4→D1 reconstruction. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const vm=require("node:vm");
const {execFileSync}=require("node:child_process");
const ROOT=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(ROOT,p));
const sha=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
const d8Index=read("index.html");
const core201Tag=Buffer.from('<script id="dungeonCore201Stability" src="assets/gensrpg/dungeon/core201-stability-v1.js"></script>');
const core201Open=Buffer.from('<script id="dungeonCore201Stability">');
const core201Body=read("assets/gensrpg/dungeon/core201-stability-v1.js");
assert.equal(d8Index.length,7715741,"D8 index length");
assert.equal(sha(d8Index),"f56dc5bbb368b176509ab16477bd4b24dd000497","D8 exact blob");
assert.equal(core201Body.length,13990,"D8 Core201 length");
assert.equal(sha(core201Body),"7edf731fd1aa209ec96490fb8e2cb7af04afd627","D8 Core201 exact blob");
const core201At=d8Index.indexOf(core201Tag);
assert.ok(core201At>0 && d8Index.indexOf(core201Tag,core201At+core201Tag.length)<0,"D8 Core201 unique owner");
const indexBeforeD8=Buffer.concat([
 d8Index.subarray(0,core201At),core201Open,core201Body,Buffer.from("</script>"),
 d8Index.subarray(core201At+core201Tag.length)
]);
assert.equal(indexBeforeD8.length,7729678);
assert.equal(sha(indexBeforeD8),"6e1cb9b82126409b633306b0e77a7e45badb0f79","exact D7 historical index");
const d7Index=indexBeforeD8;
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
const d6Index=indexBeforeD7;
const core213Tag=Buffer.from('<script id="dungeonCore213Stability" src="assets/gensrpg/dungeon/core213-stability-v1.js"></script>');
const core213Open=Buffer.from('<script id="dungeonCore213Stability">');
const core213Body=read("assets/gensrpg/dungeon/core213-stability-v1.js");
const core213At=d6Index.indexOf(core213Tag);
assert.ok(core213At>0 && d6Index.indexOf(core213Tag,core213At+core213Tag.length)<0,"D6 owner once");
const indexBeforeD6=Buffer.concat([
  d6Index.subarray(0,core213At),core213Open,core213Body,Buffer.from("</script>"),
  d6Index.subarray(core213At+core213Tag.length)
]);
assert.equal(indexBeforeD6.length,7762879);
assert.equal(sha(indexBeforeD6),"2ad1961efb9733037b7753ffd4a308baa1b00b64");
const page=indexBeforeD6,js=read("assets/gensrpg/dungeon/core211-consolidation-v1.js");
const open=Buffer.from('<script id="dungeonCore211Consolidation">');
const tag=Buffer.from('<script id="dungeonCore211Consolidation" src="assets/gensrpg/dungeon/core211-consolidation-v1.js"></script>');
assert.equal(page.length,7762879);
assert.equal(sha(page),"2ad1961efb9733037b7753ffd4a308baa1b00b64");
assert.equal(js.length,17511);
assert.equal(sha(js),"bba60d921df20a114b489e17f9222e0c4f310871");
const at=page.indexOf(tag);
assert.ok(at>0 && page.indexOf(tag,at+tag.length)<0,"D5 exactly one external script");
assert.equal(page.indexOf(open),-1,"D5 old inline duplicate removed");
assert.ok(js.toString("utf8").startsWith("\n(function(){"));
assert.ok(js.toString("utf8").trimEnd().endsWith("})();"));
new vm.Script(js.toString("utf8"),{filename:"core211-consolidation-v1.js"});
assert.match(js.toString("utf8"),/window\.dc211CombatReload/);
const previous=Buffer.concat([page.subarray(0,at),open,js,Buffer.from("</script>"),page.subarray(at+tag.length)]);
assert.equal(previous.length,7780333);
assert.equal(sha(previous),"ca15dd7b483963d7bd0767b7b5baca915d17ec43");
const str=page.toString("utf8");
assert.ok(str.indexOf('src="assets/gensrpg/dungeon/core200-rebuild-v1.js"') <
          str.indexOf('src="assets/gensrpg/dungeon/core211-consolidation-v1.js"'));
assert.ok(str.indexOf('src="assets/gensrpg/dungeon/core211-consolidation-v1.js"') <
          str.indexOf('src="assets/dungeon/dungeon-core-316.js"'),"original classic parser order");
for(const name of [
 "tools/gensrpg_phase12_dungeon_core211_extract_apply.py",
 "tools/gensrpg_phase12_dungeon_core200_extract_apply.py",
 "tools/gensrpg_phase12_dungeon_mj72_extract_apply.py",
 "tools/gensrpg_phase12_dungeon_core051_extract_apply.py",
 "tools/gensrpg_phase12_dungeon_core01_extract_apply.py"
])execFileSync("python3",[name,"--verify"],{cwd:ROOT,encoding:"utf8"});
console.log(JSON.stringify({scenario:"Phase12 D5 Dungeon Core211 physical owner",bytesMoved:17511,indexBytesRemoved:17454,owner:"dungeon",lossless:true}));
