"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict"),path=require("node:path"),crypto=require("node:crypto"),cp=require("node:child_process"),vm=require("node:vm");
const root=path.join(__dirname,".."),i=require("./helpers/gens_phase12_r04_r03_source_view_v1.cjs")(fs.readFileSync(path.join(root,"index.html")),root),p="assets/gensrpg/shell/legacy-hub-family-ui-v1.js",currentJs=fs.readFileSync(path.join(root,p)),js=require("./helpers/gens_dungeon_card_historical_source_view_20261024.cjs")(currentJs);
const blob=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
assert.equal(i.length,2862906);assert.equal(blob(i),"8faf7af7fced0a1e0724985e85718a0e4a9e673b");
assert.equal(js.length,6651);assert.equal(blob(js),"e45f3b4e419a10b030c47bc921bded1ec0dc723b");
const html=i.toString("utf8"),tag='<script src="'+p+'"></script>';
assert.equal(html.split(tag).length-1,1);assert.ok(html.indexOf(tag)<html.indexOf('const Z40K_GENERIC_SHEET_BG'));
assert.doesNotMatch(tag,/async|defer|type="module"/);
const names=["renderGensRpgUniverseCards","renderGensSurvivalUniverseCards","renderGensFamilyGamesIfVisible","openGensFamily","gensFamilyForProfileId","renderGensGameHomeLight"];
for(const name of names){assert.match(currentJs.toString("utf8"),new RegExp("function "+name+"\\("));assert.doesNotMatch(html,new RegExp("function "+name+"\\("))}
const context=vm.createContext({});vm.runInContext(currentJs.toString("utf8"),context);for(const name of names){assert.equal(vm.runInContext("typeof "+name,context),"function")}
const r02=require("./helpers/gens_phase12_r03_r02_source_view_v1.cjs")(i,root);assert.equal(blob(r02),"062c4cd37634f504cc75ce3329d6e69e19b5f547");
assert.match(fs.readFileSync(path.join(root,"service-worker.js"),"utf8"),/\.\/assets\/gensrpg\/shell\/legacy-hub-family-ui-v1\.js/);
console.log(JSON.stringify({scenario:"R03 Shell Hub six function owner",rollback:true,functions:6,parserOrder:true}));
