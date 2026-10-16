"use strict";
const fs=require("node:fs"),assert=require("node:assert/strict"),path=require("node:path"),crypto=require("node:crypto"),cp=require("node:child_process"),vm=require("node:vm");
const root=path.join(__dirname,".."),i=fs.readFileSync(path.join(root,"index.html")),p="assets/gensrpg/shell/legacy-hub-family-ui-v1.js",js=fs.readFileSync(path.join(root,p));
const blob=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
assert.equal(i.length,2862906);assert.equal(blob(i),"8faf7af7fced0a1e0724985e85718a0e4a9e673b");
assert.equal(js.length,6651);assert.equal(blob(js),"e45f3b4e419a10b030c47bc921bded1ec0dc723b");
const html=i.toString("utf8"),tag='<script src="'+p+'"></script>';
assert.equal(html.split(tag).length-1,1);assert.ok(html.indexOf(tag)<html.indexOf('const Z40K_GENERIC_SHEET_BG'));
assert.doesNotMatch(tag,/async|defer|type="module"/);
const names=["renderGensRpgUniverseCards","renderGensSurvivalUniverseCards","renderGensFamilyGamesIfVisible","openGensFamily","gensFamilyForProfileId","renderGensGameHomeLight"];
for(const name of names){assert.match(js.toString("utf8"),new RegExp("function "+name+"\\("));assert.doesNotMatch(html,new RegExp("function "+name+"\\("))}
const context=vm.createContext({});vm.runInContext(js.toString("utf8"),context);for(const name of names){assert.equal(vm.runInContext("typeof "+name,context),"function")}
cp.execFileSync("python3",["tools/gensrpg_phase12_r03_shell_hub_extract_apply.py","--verify"],{cwd:root});
assert.match(fs.readFileSync(path.join(root,"service-worker.js"),"utf8"),/\.\/assets\/gensrpg\/shell\/legacy-hub-family-ui-v1\.js/);
console.log(JSON.stringify({scenario:"R03 Shell Hub six function owner",rollback:true,functions:6,parserOrder:true}));
