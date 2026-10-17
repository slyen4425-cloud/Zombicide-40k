"use strict";
/* Strict R04->R03 historical source reconstruction, never loaded by runtime. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const gitblob=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\0")).update(b).digest("hex");
const R04="554bf6100aeb0f40bfc098dc90863af7d2d5e439",R03="8faf7af7fced0a1e0724985e85718a0e4a9e673b";
const JS="27cadba87c766b5293ac3a7fe3ddffb8510adc40",REL="assets/gensrpg/builders/equipment-library-editor-v1.js";
const TAG='<script src="'+REL+'"></script>\n',LAST='const GENS_GAME_CONFIG_KEY="gensrpg_game_config_v1";';
const CALL='refreshCustomEquipmentIntoItems();\n',FROM='\n\nfunction showEquipmentLibrary',TO='\n'+CALL+'\nfunction showEquipmentLibrary';
module.exports=function r03SourceView(index,root=path.resolve(__dirname,"../..")){
 index=require('./gens_phase12_generated_wall_material_source_view_v1.cjs')(index);
 if(gitblob(index)===R03){assert.equal(index.length,2862906);return index;}
 if(gitblob(index)==="485de2e6a08ffd89e4f1fb9410e40c938774d62f")index=require("./gens_phase12_r05_r04_source_view_v1.cjs")(index,root);
 assert.equal(index.length,2835125);assert.equal(gitblob(index),R04,"R04 pinned physical source");
 const js=fs.readFileSync(path.join(root,REL));assert.equal(js.length,27860);assert.equal(gitblob(js),JS,"R04 pinned Builder owner");
 let s=index.toString("utf8");
 assert.equal(s.split(TAG).length,2);assert.equal(js.toString("utf8").split(FROM).length,2);
 s=s.replace(TAG,"");
 const callSeam=CALL+LAST;assert.equal(s.split(callSeam).length,2,"original one-time init preserved");
 const chunk=js.toString("utf8").replace(FROM,TO);
 s=s.replace(callSeam,chunk+LAST);
 const ret=Buffer.from(s,"utf8");
 assert.equal(ret.length,2862906);assert.equal(gitblob(ret),R03,"R04 byte-exact R03 rollback");
 return ret;
};
