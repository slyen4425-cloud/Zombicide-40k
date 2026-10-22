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
const d8Index=require("./helpers/gens_phase12_d9_restore_v1.cjs")(read("index.html"),require("node:path").resolve(__dirname,".."));
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
const actualD4=indexBeforeD5;
const core200Tag=Buffer.from('<script id="dungeonCore200Rebuild" src="assets/gensrpg/dungeon/core200-rebuild-v1.js"></script>');
const core200Open=Buffer.from('<script id="dungeonCore200Rebuild">');
const core200Body=read("tests/fixtures/gensrpg_phase12_d4_core200_original_2026-10-22.txt");
const core200At=actualD4.indexOf(core200Tag);
assert.ok(core200At>0 && actualD4.indexOf(core200Tag,core200At+core200Tag.length)<0,"D4 owner appears exactly once");
const indexBeforeD4=Buffer.concat([
  actualD4.subarray(0,core200At),core200Open,core200Body,Buffer.from("</script>"),
  actualD4.subarray(core200At+core200Tag.length)
]);
assert.equal(indexBeforeD4.length,7836124);
assert.equal(sha(indexBeforeD4),"972f0e0be12fac14427853fbcd7abe5233eb5a8c");
const currentIndex=indexBeforeD4;
const mj72Tag=Buffer.from('<script id="dungeonMj72_2Script" src="assets/gensrpg/dungeon/mj72-scene-v1.js"></script>');
const mj72Open=Buffer.from('<script id="dungeonMj72_2Script">');
const mj72Body=read("assets/gensrpg/dungeon/mj72-scene-v1.js");
const mj72At=currentIndex.indexOf(mj72Tag);
assert.ok(mj72At>0,"D3 MJ72 script must load at parser time");
const index=Buffer.concat([
  currentIndex.subarray(0,mj72At),mj72Open,mj72Body,Buffer.from("</script>"),
  currentIndex.subarray(mj72At+mj72Tag.length)
]);
const js=read("tests/fixtures/gensrpg_phase12_d2_core051_original_2026-10-21.txt");
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
