#!/usr/bin/env python3
"""R04 one-time guarded migration of *test-only* historical pinning/owner inventory.
No runtime code or old fixture baseline is edited. All changes fail closed.
"""
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
R03="8faf7af7fced0a1e0724985e85718a0e4a9e673b"
R04="554bf6100aeb0f40bfc098dc90863af7d2d5e439"
OWNER="assets/gensrpg/builders/equipment-library-editor-v1.js"
def change(path,*pairs):
 f=ROOT/path;data=f.read_text()
 for a,b in pairs:
  count=data.count(a)
  assert count==1,(str(path),repr(a[:100]),count)
  data=data.replace(a,b,1)
 f.write_text(data)
 print("R04 updated",path)
helper='''"use strict";
/* Strict R04->R03 historical source reconstruction, never loaded by runtime. */
const fs=require("node:fs"),path=require("node:path"),assert=require("node:assert/strict"),crypto=require("node:crypto");
const gitblob=b=>crypto.createHash("sha1").update(Buffer.from("blob "+b.length+"\\0")).update(b).digest("hex");
const R04="554bf6100aeb0f40bfc098dc90863af7d2d5e439",R03="8faf7af7fced0a1e0724985e85718a0e4a9e673b";
const JS="27cadba87c766b5293ac3a7fe3ddffb8510adc40",REL="assets/gensrpg/builders/equipment-library-editor-v1.js";
const TAG='<script src="'+REL+'"></script>\\n',LAST='const GENS_GAME_CONFIG_KEY="gensrpg_game_config_v1";';
const CALL='refreshCustomEquipmentIntoItems();\\n',FROM='\\n\\nfunction showEquipmentLibrary',TO='\\n'+CALL+'\\nfunction showEquipmentLibrary';
module.exports=function r03SourceView(index,root=path.resolve(__dirname,"../..")){
 if(gitblob(index)===R03){assert.equal(index.length,2862906);return index;}
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
'''
helperPath=ROOT/"tests/helpers/gens_phase12_r04_r03_source_view_v1.cjs"
assert not helperPath.exists()
helperPath.write_text(helper)
change("tests/helpers/gens_phase12_r03_r02_source_view_v1.cjs",
 ("  if(hash(index)===R02){assert.equal(index.length,2869485);return index;}",
  '  if(hash(index)===R02){assert.equal(index.length,2869485);return index;}\n  if(hash(index)==="'+R04+'")index=require("./gens_phase12_r04_r03_source_view_v1.cjs")(index,root);'))
change("tests/helpers/gens_phase12_r02_r01_source_view_v1.cjs",
 ('if(hash(index)==="'+R03+'")index=require("./gens_phase12_r03_r02_source_view_v1.cjs")(index,root);',
  'if([\"'+R03+'\",\"'+R04+'\"].includes(hash(index)))index=require("./gens_phase12_r03_r02_source_view_v1.cjs")(index,root);'))
change("tests/helpers/gens_phase12_core200_source_view_v1.cjs",
 ('"'+R03+'"].includes(sha(actual))','"'+R03+'","'+R04+'"].includes(sha(actual))'))
change("tests/helpers/gens_capture_team_roster_snapshot_v1.cjs",
 (" if(hash(index)==='"+R03+"')index=require('./gens_phase12_r03_r02_source_view_v1.cjs')(index,root);",
  " if(hash(index)==='"+R04+"')index=require('./gens_phase12_r04_r03_source_view_v1.cjs')(index,root);\n if(hash(index)==='"+R03+"')index=require('./gens_phase12_r03_r02_source_view_v1.cjs')(index,root);"))
change("tests/gens_phase12_r03_shell_hub_extraction_v1.test.cjs",
 ('const root=path.join(__dirname,".."),i=fs.readFileSync(path.join(root,"index.html")),p=',
  'const root=path.join(__dirname,".."),i=require("./helpers/gens_phase12_r04_r03_source_view_v1.cjs")(fs.readFileSync(path.join(root,"index.html")),root),p='),
 ('cp.execFileSync("python3",["tools/gensrpg_phase12_r03_shell_hub_extract_apply.py","--verify"],{cwd:root});',
  'const r02=require("./helpers/gens_phase12_r03_r02_source_view_v1.cjs")(i,root);assert.equal(blob(r02),"062c4cd37634f504cc75ce3329d6e69e19b5f547");'))
for file,pat in [
 ("tests/gens_phase2_inline_global_last_owner_v11411.test.cjs","const CURRENT_INDEX_BLOB='"),
 ("tests/gens_phase2_inline_owner_manifest_v11411.test.cjs","const CURRENT_BLOB='")
]:
 change(file,(pat+R03+"'",pat+R04+"'"))
anchor="  'assets/gensrpg/shell/legacy-hub-family-ui-v1.js',"
insert=anchor+"\n  '"+OWNER+"',"
change("tests/gens_phase2_runtime_load_graph_v11411.test.cjs",
 (anchor+"\n  'assets/gensrpg/dungeon/mj72-scene-v1.js',",insert+"\n  'assets/gensrpg/dungeon/mj72-scene-v1.js',"),
 ("assert.equal(new Set(productionDirect).size,61","assert.equal(new Set(productionDirect).size,62"),
 ("assert.equal(allJs.length,119","assert.equal(allJs.length,120"),
 ("const phase5Set=new Set(phase5ConnectedServices);",
  'const phase5Set=new Set(phase5ConnectedServices);\nconst phase12ConnectedServices=["'+OWNER+'"];\nconst phase12Set=new Set(phase12ConnectedServices);'),
 ("&&!phase10Set.has(rel));","&&!phase10Set.has(rel)&&!phase12Set.has(rel));"),
 ("assert.equal(reachable.size,105","assert.equal(reachable.size,106"),
 ("for(const rel of phase10ConnectedServices){",
  "for(const rel of phase12ConnectedServices){assert.equal(allJs.includes(rel),true,rel+' exists');assert.equal(reachable.has(rel),true,rel+' reachable');}\nfor(const rel of phase10ConnectedServices){"))
change("tests/gens_phase2_runtime_owner_manifest_v11411.test.cjs",
 ("assert.equal(reachable.size,105","assert.equal(reachable.size,106"),
 ("assert.equal(mapped.size,105","assert.equal(mapped.size,106"))
for file in [
 "tests/gens_phase2_runtime_side_effect_inventory_v11411.test.cjs",
 "tests/gens_phase2_unreachable_files_characterization_v11411.test.cjs"
]:
 change(file,("assert.equal(reachable.size,105","assert.equal(reachable.size,106"))
change("tests/gens_runtime_composition_guard_v11411.test.cjs",(anchor,insert))
change("tools/gensrpg_phase12_r01_d9_source_view.py",
 ('    if _blob(data)=="'+R03+'":',
  '    if _blob(data)=="'+R04+'":\n        from gensrpg_phase12_r04_builders_equipment_extract_apply import restore as r04_reverse\n        module=(Path(root)/"'+OWNER+'").read_bytes()\n        data=r04_reverse(data,module) # test-only R04 -> R03 exact restoration\n    if _blob(data)=="'+R03+'":'))
workflow=" .github/workflows/gensrpg-architecture-sentinels.yml"
change(workflow.strip(),
 ("      - name: Vérifier la frontière R03 Shell Hub et le rollback R03 vers R02",
  "      - name: Vérifier la frontière R04 Builders equipment et le rollback vers R03\n        run: node tests/gens_phase12_r04_builders_equipment_extraction_v1.test.cjs\n\n      - name: Vérifier la frontière R03 Shell Hub et le rollback R03 vers R02"))
print("R04 test-only historical migration complete")
