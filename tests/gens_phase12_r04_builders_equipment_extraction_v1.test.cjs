"use strict";
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),crypto=require("node:crypto"),vm=require("node:vm"),cp=require("node:child_process");
const root=path.join(__dirname,".."),read=p=>fs.readFileSync(path.join(root,p)),i=require("./helpers/gens_phase12_r05_r04_source_view_v1.cjs")(read("index.html"),root),rel="assets/gensrpg/builders/equipment-library-editor-v1.js",js=read(rel),html=i.toString("utf8"),script=js.toString("utf8");
const sha=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
assert.equal(i.length,2835125);assert.equal(sha(i),"554bf6100aeb0f40bfc098dc90863af7d2d5e439");
assert.equal(js.length,27860);assert.equal(sha(js),"27cadba87c766b5293ac3a7fe3ddffb8510adc40");
const tag='<script src="'+rel+'"></script>';
assert.equal(html.split(tag).length-1,1,"one classic synchronous Builder owner");
assert.ok(html.indexOf(tag)<html.indexOf("const Z40K_GENERIC_SHEET_BG"),"declared before legacy entry");
assert.doesNotMatch(tag,/\b(async|defer|module)\b/);
assert.equal((script.match(/^function \w+\(/gm)||[]).length,26,"26 Builder function declarations unchanged");
for(const name of ["loadCustomEquipment","saveCustomEquipment","refreshCustomEquipmentIntoItems","renderEquipmentLibrary","openEquipmentEditor","saveEquipmentEditor","deleteCustomEquipment"]){
 assert.match(script,new RegExp("function "+name+"\\("));
 assert.doesNotMatch(html,new RegExp("function "+name+"\\("),"legacy duplicate of "+name);
}
assert.match(html,/refreshCustomEquipmentIntoItems\(\);\nconst GENS_GAME_CONFIG_KEY/,"same original boot-time initializer location");
assert.match(script,/const CUSTOM_EQUIPMENT_KEY="gensrpg_custom_equipment_v1";/);
const ctx=vm.createContext({});
vm.runInContext(script,ctx);assert.equal(vm.runInContext("typeof renderEquipmentLibrary",ctx),"function");
const r03=require("./helpers/gens_phase12_r04_r03_source_view_v1.cjs")(i,root);assert.equal(sha(r03),"8faf7af7fced0a1e0724985e85718a0e4a9e673b");
assert.match(read("service-worker.js").toString("utf8"),/\.\/assets\/gensrpg\/builders\/equipment-library-editor-v1\.js/);
console.log(JSON.stringify({scenario:"Phase12 R04 multi-mode equipment Builder relocation",functions:26,byteExactR03Rollback:true,originalBootInit:true}));
