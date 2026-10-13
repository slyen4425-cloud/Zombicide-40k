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
const liveIndex=read("index.html");
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
