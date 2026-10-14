"use strict";
/* Phase 12 / D3 — exact MJ72 physical extraction, original parser order, reversible D2/D1 snapshots. */
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
const actualD4=indexBeforeD5;
const core200Tag=Buffer.from('<script id="dungeonCore200Rebuild" src="assets/gensrpg/dungeon/core200-rebuild-v1.js"></script>');
const core200Open=Buffer.from('<script id="dungeonCore200Rebuild">');
const core200Body=read("assets/gensrpg/dungeon/core200-rebuild-v1.js");
const core200At=actualD4.indexOf(core200Tag);
assert.ok(core200At>0 && actualD4.indexOf(core200Tag,core200At+core200Tag.length)<0,"D4 owner appears exactly once");
const indexBeforeD4=Buffer.concat([
  actualD4.subarray(0,core200At),core200Open,core200Body,Buffer.from("</script>"),
  actualD4.subarray(core200At+core200Tag.length)
]);
assert.equal(indexBeforeD4.length,7836124);
assert.equal(sha(indexBeforeD4),"972f0e0be12fac14427853fbcd7abe5233eb5a8c");
const index=indexBeforeD4;
const js=read("assets/gensrpg/dungeon/mj72-scene-v1.js");
const tag=Buffer.from('<script id="dungeonMj72_2Script" src="assets/gensrpg/dungeon/mj72-scene-v1.js"></script>');
const open=Buffer.from('<script id="dungeonMj72_2Script">');
assert.equal(index.length,7836124);
assert.equal(sha(index),"972f0e0be12fac14427853fbcd7abe5233eb5a8c");
assert.equal(js.length,27511);
assert.equal(sha(js),"8304087b15bbbf5f71c22b7f8c916e0a78b1b905");
const pos=index.indexOf(tag);
assert.ok(pos>0);
assert.equal(index.indexOf(tag,pos+tag.length),-1,"exactly one owner script tag");
assert.equal(index.indexOf(open),-1,"old inline duplicate is forbidden");
new vm.Script(js.toString("utf8"),{filename:"mj72-scene-v1.js"});
const reconstructed=Buffer.concat([index.subarray(0,pos),open,js,Buffer.from("</script>"),index.subarray(pos+tag.length)]);
assert.equal(reconstructed.length,7863589);
assert.equal(sha(reconstructed),"e5f8895495f969597a6c209fcc29afd66b7a0636");
assert.ok(js.toString().startsWith("\nconst GENS_DUNGEON_SCENE_KEY="),"MJ72 lexical globals preserved");
assert.match(js.toString(),/function loadDungeonSceneElements\(\)/);
assert.match(js.toString(),/function saveDungeonSceneElements\(a\)/);
const html=index.toString("utf8");
assert.ok(html.indexOf('src="assets/gensrpg/dungeon/mj72-scene-v1.js"')<
  html.indexOf('src="assets/gensrpg/dungeon/core01-session-ui-v1.js"'),
  "MJ72 must keep its original parser order");
for(const name of [
  "tools/gensrpg_phase12_dungeon_mj72_extract_apply.py",
  "tools/gensrpg_phase12_dungeon_core051_extract_apply.py",
  "tools/gensrpg_phase12_dungeon_core01_extract_apply.py"
]){
  execFileSync("python3",[name,"--verify"],{cwd:ROOT,encoding:"utf8"});
}
console.log(JSON.stringify({scenario:"Phase12 D3 Dungeon MJ72 physical extraction",owner:"dungeon",relocatedBytes:js.length,indexBytesRemoved:27465,rollbackD2Exact:true,rollbackD1Exact:true,classicScript:true}));
