"use strict";
/* Phase 12: a real physical owner extraction with byte-exact rollback proof. */
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const crypto=require("node:crypto");
const {execFileSync}=require("node:child_process");
const root=path.resolve(__dirname,"..");
const read=p=>fs.readFileSync(path.join(root,p));
const sha=buf=>crypto.createHash("sha1").update(Buffer.from("blob "+buf.length+"\0")).update(buf).digest("hex");
const originalBlob="bf996ec4e748a4927ac6dd57cceaeaf2afcd9441";
const targetBlob="2921ebadacf6f660e815d9ff7712e44cd765fbdd";
const runtimeBlob="df36eba9b8a62f806bc50f86f09f53c90608ce07";
const d6Index=read("index.html");
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
const core200Body=read("assets/gensrpg/dungeon/core200-rebuild-v1.js");
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
assert.ok(mj72At>0,"D3 owner must stay at parser-time");
const liveIndex=Buffer.concat([
  currentIndex.subarray(0,mj72At),mj72Open,mj72Body,Buffer.from("</script>"),
  currentIndex.subarray(mj72At+mj72Tag.length)
]);
const core051External=Buffer.from('<script id="dungeonCore051ExplorationPolish" src="assets/gensrpg/dungeon/core051-exploration-polish-v1.js"></script>');
const core051Open=Buffer.from('<script id="dungeonCore051ExplorationPolish">');
const core051Body=read("assets/gensrpg/dungeon/core051-exploration-polish-v1.js");
const core051Position=liveIndex.indexOf(core051External);
assert.ok(core051Position>0,"D2 external Core051 script must stay at its original parser position");
const index=Buffer.concat([
  liveIndex.subarray(0,core051Position),core051Open,core051Body,Buffer.from("</script>"),
  liveIndex.subarray(core051Position+core051External.length)
]);
const runtime=read("assets/gensrpg/dungeon/core01-session-ui-v1.js");
const oldOpen=Buffer.from('<script id="gensDungeonCore01Js">');
const newTag=Buffer.from('<script id="gensDungeonCore01Js" src="assets/gensrpg/dungeon/core01-session-ui-v1.js"></script>');
const closeTag=Buffer.from("</script>");
assert.equal(index.length,7911489);
assert.equal(runtime.length,22768);
assert.equal(sha(index),targetBlob);
assert.equal(sha(runtime),runtimeBlob);
assert.equal(index.indexOf(newTag)>0,true,"owner still loaded at parser-time");
assert.equal(index.indexOf(newTag),index.lastIndexOf(newTag),"exactly one external owner tag");
assert.equal(index.indexOf(oldOpen),-1,"former inline owner must be absent");
const at=index.indexOf(newTag);
const restored=Buffer.concat([index.subarray(0,at),oldOpen,runtime,closeTag,index.subarray(at+newTag.length)]);
assert.equal(restored.length,7934204);
assert.equal(sha(restored),originalBlob,"extraction must be strictly lossless");
const code=runtime.toString("utf8");
assert.match(code,/window\.DungeonCore01\s*=/);
assert.match(code,/window\.startConfiguredGame\s*=/,"the historical wrapper is not moved to Shell or rewritten");
assert.ok(code.startsWith("\n(function(){"));
assert.ok(code.trimEnd().endsWith("})();"));
const indexUtf8=index.toString("utf8");
assert.ok(indexUtf8.indexOf('src="assets/gensrpg/dungeon/core01-session-ui-v1.js"')<
  indexUtf8.indexOf('src="assets/gensrpg/core/progression-v1.js?v=1"'),
  "legacy Dungeon block remains at original parser position");
assert.equal((indexUtf8.match(/id="gensDungeonCore01Js"/g)||[]).length,1);
execFileSync("python3",["tools/gensrpg_phase12_dungeon_core01_extract_apply.py","--verify"],{cwd:root,encoding:"utf8"});
console.log(JSON.stringify({scenario:"Phase12 Dungeon Core01 physical extraction",owner:"dungeon",bytesRelocated:runtime.length,
  lossless:true,originalBlob,targetBlob,moduleIsolationPreserved:true,graphicsUntouched:true}));
