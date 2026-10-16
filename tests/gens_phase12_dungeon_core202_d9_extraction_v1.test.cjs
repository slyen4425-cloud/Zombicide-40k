"use strict";
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const vm=require("node:vm"),crypto=require("node:crypto"),{execFileSync}=require("node:child_process");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p));
const hash=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
const index=require("./helpers/gens_phase12_r01_d9_source_view_v1.cjs")(read("index.html"),root),js=read("assets/gensrpg/dungeon/core202-content-density-v1.js");
assert.equal(index.length,7703979);assert.equal(hash(index),"fce949665fea47a2aa2a535ede7289b06936f986");
assert.equal(js.length,11821);assert.equal(hash(js),"364673f3dd35bfa8be7f378152f775656c9243e2");
const tag=Buffer.from('<script id="dungeonCore202ContentDensity" src="assets/gensrpg/dungeon/core202-content-density-v1.js"></script>'),open=Buffer.from('<script id="dungeonCore202ContentDensity">');
const at=index.indexOf(tag);
assert.ok(at>0&&index.indexOf(tag,at+tag.length)<0,"one synchronous Core202 parser owner");
assert.ok(!index.includes(open),"no duplicate inline Core202");
assert.ok(!/\b(?:async|defer)\b/.test(tag.toString()),"script must remain synchronous");
new vm.Script(js.toString("utf8"),{filename:"core202-content-density-v1.js"});
assert.ok(js.toString("utf8").startsWith("\n(function(){"));
assert.ok(js.toString("utf8").trimEnd().endsWith("})();"));
const restored=require("./helpers/gens_phase12_d9_restore_v1.cjs")(index,root);
assert.equal(restored.length,7715741);assert.equal(hash(restored),"f56dc5bbb368b176509ab16477bd4b24dd000497");
const html=index.toString("utf8");
assert.ok(html.indexOf('src="assets/gensrpg/dungeon/core201-stability-v1.js"')<html.indexOf('src="assets/gensrpg/dungeon/core202-content-density-v1.js"'),"Core201 before Core202");
assert.ok(html.indexOf('src="assets/gensrpg/dungeon/core202-content-density-v1.js"')<html.indexOf('id="dungeonCore203Diagnostics"'),"Core202 before Core203");
assert.match(js.toString("utf8"),/function authored202\(x\)/,"authored-world protection retained");
for(const tool of [
 "tools/gensrpg_phase12_dungeon_core201_d8_extract_apply.py",
 "tools/gensrpg_phase12_dungeon_core214_extract_apply.py",
 "tools/gensrpg_phase12_dungeon_core213_extract_apply.py",
 "tools/gensrpg_phase12_dungeon_core211_extract_apply.py",
 "tools/gensrpg_phase12_dungeon_core200_extract_apply.py",
 "tools/gensrpg_phase12_dungeon_mj72_extract_apply.py",
 "tools/gensrpg_phase12_dungeon_core051_extract_apply.py",
 "tools/gensrpg_phase12_dungeon_core01_extract_apply.py"
])execFileSync("python3",[tool,"--verify"],{cwd:root,encoding:"utf8"});
console.log(JSON.stringify({scenario:"Phase12 D9 Dungeon Core202 byte-identical",movedBytes:11821,netIndexRemoved:11762,rollback:true,parserOrder:true}));
