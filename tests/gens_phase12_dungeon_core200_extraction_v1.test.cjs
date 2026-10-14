"use strict";
/* Phase 12 D4: physical Core200 IIFE, single classic synchronous owner and historical rollbacks. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const vm=require("node:vm");
const {execFileSync}=require("node:child_process");
const ROOT=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(ROOT,p));
const sha=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
const d5Index=read("index.html");
const core211Tag=Buffer.from('<script id="dungeonCore211Consolidation" src="assets/gensrpg/dungeon/core211-consolidation-v1.js"></script>');
const core211Open=Buffer.from('<script id="dungeonCore211Consolidation">');
const core211Body=read("assets/gensrpg/dungeon/core211-consolidation-v1.js");
const core211At=d5Index.indexOf(core211Tag);
assert.ok(core211At>0 && d5Index.indexOf(core211Tag,core211At+core211Tag.length)<0,"D5 owner single classic load");
const indexBeforeD5=Buffer.concat([
 d5Index.subarray(0,core211At),core211Open,core211Body,Buffer.from("</script>"),
 d5Index.subarray(core211At+core211Tag.length)
]);
assert.equal(indexBeforeD5.length,7780333);
assert.equal(sha(indexBeforeD5),"ca15dd7b483963d7bd0767b7b5baca915d17ec43");
const page=indexBeforeD5,code=read("assets/gensrpg/dungeon/core200-rebuild-v1.js");
const old=Buffer.from('<script id="dungeonCore200Rebuild">');
const tag=Buffer.from('<script id="dungeonCore200Rebuild" src="assets/gensrpg/dungeon/core200-rebuild-v1.js"></script>');
assert.equal(page.length,7780333);
assert.equal(sha(page),"ca15dd7b483963d7bd0767b7b5baca915d17ec43");
assert.equal(code.length,55842);
assert.equal(sha(code),"5649ae0af69064dde72e6ea28b8dbefd105cb527");
const at=page.indexOf(tag);
assert.ok(at>0 && page.indexOf(tag,at+tag.length)<0,"exactly one D4 external script");
assert.equal(page.indexOf(old),-1,"old duplicate inline code removed");
assert.ok(code.toString("utf8").startsWith("\n(function(){"));
new vm.Script(code.toString("utf8"),{filename:"core200-rebuild-v1.js"});
assert.match(code.toString("utf8"),/window\.DungeonCore01\s*=/);
assert.match(code.toString("utf8"),/window\.dc200StartCombat\s*=/);
const original=Buffer.concat([page.subarray(0,at),old,code,Buffer.from("</script>"),page.subarray(at+tag.length)]);
assert.equal(original.length,7836124);
assert.equal(sha(original),"972f0e0be12fac14427853fbcd7abe5233eb5a8c");
const txt=page.toString("utf8");
assert.ok(txt.indexOf('src="assets/gensrpg/dungeon/core051-exploration-polish-v1.js"') <
          txt.indexOf('src="assets/gensrpg/dungeon/core200-rebuild-v1.js"'));
assert.ok(txt.indexOf('src="assets/gensrpg/dungeon/core200-rebuild-v1.js"') <
          txt.indexOf('src="assets/dungeon/dungeon-core-316.js"'),"same original parser order");
for(const tool of [
  "tools/gensrpg_phase12_dungeon_core200_extract_apply.py",
  "tools/gensrpg_phase12_dungeon_mj72_extract_apply.py",
  "tools/gensrpg_phase12_dungeon_core051_extract_apply.py",
  "tools/gensrpg_phase12_dungeon_core01_extract_apply.py"
])execFileSync("python3",[tool,"--verify"],{cwd:ROOT,encoding:"utf8"});
console.log(JSON.stringify({scenario:"Phase12 D4 Dungeon Core200 physical extraction",bytesMoved:code.length,netBytesRemoved:55791,owner:"dungeon",classicParser:true,exactRollback:true}));
