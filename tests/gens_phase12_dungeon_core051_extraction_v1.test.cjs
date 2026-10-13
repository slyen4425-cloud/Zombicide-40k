"use strict";
/* Phase12 D2: exact current owner and reversible reconstruction of the previous D1 index. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const vm=require("node:vm");
const {execFileSync}=require("node:child_process");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p));
const sha=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
const currentIndex=read("index.html");
const mj72Tag=Buffer.from('<script id="dungeonMj72_2Script" src="assets/gensrpg/dungeon/mj72-scene-v1.js"></script>');
const mj72Open=Buffer.from('<script id="dungeonMj72_2Script">');
const mj72Body=read("assets/gensrpg/dungeon/mj72-scene-v1.js");
const mj72At=currentIndex.indexOf(mj72Tag);
assert.ok(mj72At>0,"D3 MJ72 script must load at parser time");
const index=Buffer.concat([
  currentIndex.subarray(0,mj72At),mj72Open,mj72Body,Buffer.from("</script>"),
  currentIndex.subarray(mj72At+mj72Tag.length)
]);
const js=read("assets/gensrpg/dungeon/core051-exploration-polish-v1.js");
const open=Buffer.from('<script id="dungeonCore051ExplorationPolish">');
const tag=Buffer.from('<script id="dungeonCore051ExplorationPolish" src="assets/gensrpg/dungeon/core051-exploration-polish-v1.js"></script>');
assert.equal(index.length,7863589);
assert.equal(sha(index),"e5f8895495f969597a6c209fcc29afd66b7a0636");
assert.equal(js.length,47962);
assert.equal(sha(js),"d7ec321ffa05b8749de5d7bf9e8264e55b24f919");
assert.ok(index.indexOf(tag)>0);
assert.equal(index.indexOf(tag),index.lastIndexOf(tag),"one external owner");
assert.equal(index.indexOf(open),-1,"no former active inline implementation");
const at=index.indexOf(tag);
const d1=Buffer.concat([index.subarray(0,at),open,js,Buffer.from("</script>"),index.subarray(at+tag.length)]);
assert.equal(d1.length,7911489);
assert.equal(sha(d1),"2921ebadacf6f660e815d9ff7712e44cd765fbdd");
assert.ok(js.toString().startsWith("\n(function(){"));
new vm.Script(js.toString(),"core051-exploration-polish-v1.js");
assert.match(js.toString(),/window\.dc051LoadChallengeEditor\s*=/);
assert.match(js.toString(),/window\.dc051RenderChallengeEditor\s*=/);
const d2pos=index.toString().indexOf('src="assets/gensrpg/dungeon/core051-exploration-polish-v1.js"');
const prev=index.toString().indexOf('<script id="dungeonCore050CombatAndEntrance"');
const next=index.toString().indexOf('<script id="dungeonCore052SpecialExploration"');
assert.ok(d2pos>0 && next>d2pos,"Core051 loads before Core052 at the original parser location");
// Exact predecessor can be absent or renamed historically; only authoritative
// next-module order and pre/post byte parity are normative.
execFileSync("python3",["tools/gensrpg_phase12_dungeon_core051_extract_apply.py","--verify"],{cwd:root,encoding:"utf8"});
execFileSync("python3",["tools/gensrpg_phase12_dungeon_core01_extract_apply.py","--verify"],{cwd:root,encoding:"utf8"});
console.log(JSON.stringify({scenario:"Phase12 D2 Dungeon Core051 physical extraction",bytesRelocated:js.length,indexBytesRemoved:47900,rollbackD1Exact:true,rollbackD2Exact:true,owner:"dungeon"}));
