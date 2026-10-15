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
const d5Index=indexBeforeD6;
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
