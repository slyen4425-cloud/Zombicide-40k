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
const index=read("index.html");
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
