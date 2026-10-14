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
const page=read("index.html"),js=read("assets/gensrpg/dungeon/core211-consolidation-v1.js");
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
